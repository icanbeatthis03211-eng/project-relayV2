"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Toast from "@/components/ui/Toast";
import { FEEDBACK_SOURCES, PROJECT_TYPES, TAGS } from "@/lib/constants";
import {
  createAssignment,
  createFeedback,
  deleteAssignment,
  getAssignmentFileUrl,
  getAssignmentsByUser,
  getDistinctProjectTypesByUser,
  getDistinctTagsByUser,
  uploadAssignmentFile,
} from "@/lib/queries";
import { Assignment } from "@/lib/types";
import { getUserId } from "@/lib/user";
import { trackEvent } from "@/lib/analytics";

function formatFileSize(bytes: number | null) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function NewFeedbackPage() {
  const router = useRouter();
  const userId = useMemo(() => getUserId(), []);

  const [projectType, setProjectType] = useState<string>(PROJECT_TYPES[0]);
  const [customProjectTypes, setCustomProjectTypes] = useState<string[]>([]);
  const [newProjectTypeInput, setNewProjectTypeInput] = useState("");
  const [source, setSource] = useState(FEEDBACK_SOURCES[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  // 과제 파일 업로드 (저장 탭에 함께 둡니다)
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentUploading, setAssignmentUploading] = useState(false);
  const [assignmentUploadError, setAssignmentUploadError] = useState<string | null>(null);
  const [assignmentToast, setAssignmentToast] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("view_feedback_form");
  }, []);

  // 이전에 직접 추가했던 커스텀 태그를 불러와 다시 고를 수 있게 해줍니다.
  useEffect(() => {
    (async () => {
      const { data } = await getDistinctTagsByUser(userId);
      if (!data) return;
      const predefined = new Set<string>(TAGS);
      const history = data.filter((t) => !predefined.has(t));
      if (history.length > 0) {
        setCustomTags((prev) => Array.from(new Set([...prev, ...history])));
      }
    })();
  }, [userId]);

  // 이전에 직접 입력했던 프로젝트 이름을 불러와 다시 고를 수 있게 해줍니다.
  useEffect(() => {
    (async () => {
      const { data } = await getDistinctProjectTypesByUser(userId);
      if (!data) return;
      const predefined = new Set<string>(PROJECT_TYPES);
      const history = data.filter((t) => !predefined.has(t));
      if (history.length > 0) {
        setCustomProjectTypes((prev) => Array.from(new Set([...prev, ...history])));
      }
    })();
  }, [userId]);

  async function loadAssignments() {
    const { data, error } = await getAssignmentsByUser(userId);
    if (error) {
      setAssignmentsError(error);
      return;
    }
    setAssignments(data ?? []);
  }

  useEffect(() => {
    loadAssignments().catch(() => setAssignmentsError("과제 목록을 불러오지 못했어요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const allTagOptions = Array.from(new Set<string>([...TAGS, ...customTags]));
  const allProjectTypeOptions = Array.from(
    new Set<string>([...PROJECT_TYPES, ...customProjectTypes])
  );
  const canSubmit = tags.length > 0 && content.trim().length > 0 && !submitting;
  const canUploadAssignment =
    assignmentTitle.trim().length > 0 && !!assignmentFile && !assignmentUploading;

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  }

  function handleAddCustomTag() {
    const value = newTagInput.trim();
    if (!value) return;
    if (!allTagOptions.includes(value)) {
      setCustomTags((prev) => [...prev, value]);
    }
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewTagInput("");
  }

  function handleAddCustomProjectType() {
    const value = newProjectTypeInput.trim();
    if (!value) return;
    if (!allProjectTypeOptions.includes(value)) {
      setCustomProjectTypes((prev) => [...prev, value]);
    }
    setProjectType(value);
    setNewProjectTypeInput("");
  }

  async function handleSubmit() {
    if (tags.length === 0) return;
    setSubmitting(true);
    setError(null);
    const trimmed = content.trim();

    // 선택한 역량 태그를 모두 하나의 피드백 기록에 함께 저장합니다.
    // (반복 감지는 각 피드백의 태그 배열을 펼쳐서 계산하므로, 굳이 태그마다
    //  별도 행을 만들지 않아도 정확하게 동작해요.)
    const { error } = await createFeedback({
      user_id: userId,
      project_type: projectType,
      feedback_source: source,
      original_feedback: trimmed,
      tags,
      // 공유 여부는 저장 시점에 묻지 않고, "내가 저장한 피드백" 화면에서
      // 언제든 켜고 끌 수 있도록 기본값을 true로 둡니다.
      is_shareable: true,
    });
    if (error) {
      setSubmitting(false);
      setError(error);
      return;
    }

    setSubmitting(false);
    trackEvent("submit_feedback", { project_type: projectType, tag_count: tags.length });
    setToast(true);
    setTimeout(() => router.push("/feedbacks"), 700);
  }

  async function handleUploadAssignment() {
    if (!assignmentFile) return;
    setAssignmentUploading(true);
    setAssignmentUploadError(null);

    const { data: uploaded, error: uploadErr } = await uploadAssignmentFile(
      userId,
      assignmentFile
    );
    if (uploadErr || !uploaded) {
      setAssignmentUploading(false);
      setAssignmentUploadError(uploadErr ?? "파일 업로드에 실패했어요.");
      return;
    }

    const { error: createErr } = await createAssignment({
      user_id: userId,
      project_type: projectType,
      title: assignmentTitle.trim(),
      file_path: uploaded.path,
      file_name: assignmentFile.name,
      file_size: assignmentFile.size,
    });
    setAssignmentUploading(false);
    if (createErr) {
      setAssignmentUploadError(createErr);
      return;
    }

    setAssignmentTitle("");
    setAssignmentFile(null);
    setAssignmentToast(true);
    loadAssignments();
  }

  async function handleDeleteAssignment(a: Assignment) {
    if (!window.confirm("이 과제 파일을 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeletingAssignmentId(a.id);
    const { error } = await deleteAssignment(a.id, a.file_path);
    setDeletingAssignmentId(null);
    if (error) {
      setAssignmentsError(error);
      return;
    }
    setAssignments((prev) => (prev ? prev.filter((x) => x.id !== a.id) : prev));
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">피드백 저장</h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          받은 피드백을 그대로 짧게 남겨보세요. 긴 회고문을 쓸 필요는 없어요.
        </p>
      </div>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-1">프로젝트 유형</p>
        <p className="text-xs text-gray-400 mb-3">
          목록에 없다면 직접 프로젝트 이름을 입력해서 저장할 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          {allProjectTypeOptions.map((type) => (
            <Tag
              key={type}
              label={type}
              variant={projectType === type ? "selected" : "default"}
              onClick={() => setProjectType(type)}
            />
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newProjectTypeInput}
            onChange={(e) => setNewProjectTypeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomProjectType();
              }
            }}
            placeholder="예: 카페 추천 서비스 기획 (직접 입력)"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddCustomProjectType}
            disabled={!newProjectTypeInput.trim()}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all disabled:bg-gray-100 disabled:text-gray-400"
          >
            이름 추가
          </button>
        </div>
      </Card>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-3">피드백 출처</p>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_SOURCES.map((s) => (
            <Tag
              key={s}
              label={s}
              variant={source === s ? "selected" : "default"}
              onClick={() => setSource(s)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-1">
          역량 태그 (여러 개 선택 가능)
        </p>
        <p className="text-xs text-gray-400 mb-3">
          이 피드백과 관련된 역량을 모두 골라주세요. 목록에 없다면 직접
          추가할 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          {allTagOptions.map((t) => (
            <Tag
              key={t}
              label={t}
              variant={tags.includes(t) ? "selected" : "default"}
              onClick={() => toggleTag(t)}
            />
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
            placeholder="원하는 태그가 없다면 직접 입력해보세요"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!newTagInput.trim()}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all disabled:bg-gray-100 disabled:text-gray-400"
          >
            태그 추가
          </button>
        </div>
      </Card>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-3">원본 피드백 내용</p>
        <textarea
          className="w-full min-h-[240px] rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          placeholder="받은 피드백을 그대로 입력하거나 붙여넣으세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </Card>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      <Button variant="primary" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        {submitting ? "저장 중..." : "피드백 저장하기"}
      </Button>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-1">과제 파일 올리기 (선택)</p>
        <p className="text-xs text-gray-400 mb-3">
          위에서 고른 프로젝트 유형({projectType})으로 과제 파일도 함께 올려서
          보관할 수 있어요.
        </p>

        <p className="text-sm font-semibold text-gray-900 mb-2">과제 제목</p>
        <input
          type="text"
          value={assignmentTitle}
          onChange={(e) => setAssignmentTitle(e.target.value)}
          placeholder="예: 1주차 서비스 기획안"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <p className="text-sm font-semibold text-gray-900 mb-2">파일</p>
        <input
          type="file"
          onChange={(e) => setAssignmentFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
        />

        {assignmentUploadError && (
          <p className="text-sm text-red-600 mt-3">{assignmentUploadError}</p>
        )}

        <Button
          variant="secondary"
          className="w-full mt-4"
          disabled={!canUploadAssignment}
          onClick={handleUploadAssignment}
        >
          {assignmentUploading ? "업로드 중..." : "과제 올리기"}
        </Button>

        {assignmentsError && (
          <p className="text-sm text-red-600 mt-3">{assignmentsError}</p>
        )}

        {assignments && assignments.length > 0 && (
          <div className="space-y-2 mt-5">
            <p className="text-xs font-semibold text-gray-500">
              지금까지 올린 과제 ({assignments.length}개)
            </p>
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {a.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.project_type} · {a.file_name} · {formatFileSize(a.file_size)} ·{" "}
                    {formatDate(a.created_at)}
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
                    onClick={() => handleDeleteAssignment(a)}
                    disabled={deletingAssignmentId === a.id}
                    className="text-xs text-gray-500 font-semibold hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingAssignmentId === a.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Toast message="피드백이 저장되었어요!" show={toast} onClose={() => setToast(false)} />
      <Toast
        message="과제가 저장되었어요!"
        show={assignmentToast}
        onClose={() => setAssignmentToast(false)}
      />
    </div>
  );
}
