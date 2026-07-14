"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import Toast from "@/components/ui/Toast";
import { PROJECT_TYPES } from "@/lib/constants";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentFileUrl,
  getAssignmentsByUser,
  uploadAssignmentFile,
} from "@/lib/queries";
import { Assignment } from "@/lib/types";
import { getUserId } from "@/lib/user";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function formatFileSize(bytes: number | null) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const userId = useMemo(() => getUserId(), []);

  async function load() {
    const { data, error } = await getAssignmentsByUser(userId);
    if (error) {
      setError(error);
      return;
    }
    setAssignments(data ?? []);
  }

  useEffect(() => {
    load().catch(() => setError("과제 목록을 불러오지 못했어요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    if (!assignments) return [];
    const byProject = new Map<string, Assignment[]>();
    for (const a of assignments) {
      const list = byProject.get(a.project_type) ?? [];
      list.push(a);
      byProject.set(a.project_type, list);
    }
    const orderedTypes = [
      ...PROJECT_TYPES.filter((t) => byProject.has(t)),
      ...Array.from(byProject.keys()).filter(
        (t) => !PROJECT_TYPES.includes(t as (typeof PROJECT_TYPES)[number])
      ),
    ];
    return orderedTypes.map((type) => ({ type, items: byProject.get(type) ?? [] }));
  }, [assignments]);

  const canUpload = title.trim().length > 0 && !!file && !uploading;

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const { data: uploaded, error: uploadErr } = await uploadAssignmentFile(userId, file);
    if (uploadErr || !uploaded) {
      setUploading(false);
      setUploadError(uploadErr ?? "파일 업로드에 실패했어요.");
      return;
    }

    const { error: createErr } = await createAssignment({
      user_id: userId,
      project_type: projectType,
      title: title.trim(),
      file_path: uploaded.path,
      file_name: file.name,
      file_size: file.size,
    });
    setUploading(false);
    if (createErr) {
      setUploadError(createErr);
      return;
    }

    setTitle("");
    setFile(null);
    setToast(true);
    load();
  }

  async function handleDelete(a: Assignment) {
    if (!window.confirm("이 과제 파일을 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeletingId(a.id);
    const { error } = await deleteAssignment(a.id, a.file_path);
    setDeletingId(null);
    if (error) {
      setError(error);
      return;
    }
    setAssignments((prev) => (prev ? prev.filter((x) => x.id !== a.id) : prev));
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">과제 보관함</h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          프로젝트 과제 파일을 올려서 프로젝트별로 모아볼 수 있어요.
        </p>
      </div>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-3">프로젝트 유형</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PROJECT_TYPES.map((type) => (
            <TagBadge
              key={type}
              label={type}
              variant={projectType === type ? "selected" : "default"}
              onClick={() => setProjectType(type)}
            />
          ))}
        </div>

        <p className="text-lg font-semibold text-gray-900 mb-2">과제 제목</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 1주차 서비스 기획안"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <p className="text-lg font-semibold text-gray-900 mb-2">파일</p>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
        />

        {uploadError && (
          <p className="text-sm text-red-600 mt-3">{uploadError}</p>
        )}

        <Button
          variant="primary"
          className="w-full mt-4"
          disabled={!canUpload}
          onClick={handleUpload}
        >
          {uploading ? "업로드 중..." : "과제 올리기"}
        </Button>
      </Card>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      {assignments === null && !error && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {assignments !== null && assignments.length === 0 && (
        <EmptyState message="아직 올린 과제가 없어요. 위에서 첫 과제를 올려보세요." />
      )}

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.type}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-gray-900">{group.type}</h2>
              <span className="text-xs text-gray-400">{group.items.length}개</span>
            </div>
            <div className="space-y-3">
              {group.items.map((a) => (
                <Card key={a.id} hoverable>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {a.file_name} · {formatFileSize(a.file_size)} · {formatDate(a.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={getAssignmentFileUrl(a.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
                      >
                        다운로드
                      </a>
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={deletingId === a.id}
                        className="text-xs text-gray-500 font-semibold hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === a.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Toast message="과제가 저장되었어요!" show={toast} onClose={() => setToast(false)} />
    </div>
  );
}
