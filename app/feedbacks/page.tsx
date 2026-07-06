"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import { Feedback } from "@/lib/types";
import {
  deleteFeedback,
  deleteSharedCard,
  getFeedbacksByUser,
  getSharedCardsByFeedbackIds,
  updateFeedback,
} from "@/lib/queries";
import { getUserId } from "@/lib/user";
import { PROJECT_TYPES, TAGS } from "@/lib/constants";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

interface EditDraft {
  tag: string;
  content: string;
  isShareable: boolean;
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [sharedMap, setSharedMap] = useState<Map<string, string>>(new Map());
  const [unsharingId, setUnsharingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await getFeedbacksByUser(getUserId());
      if (error) {
        setError(error);
        return;
      }
      const list = data ?? [];
      setFeedbacks(list);

      const shareableIds = list.filter((f) => f.is_shareable).map((f) => f.id);
      const { data: sharedCards } = await getSharedCardsByFeedbackIds(shareableIds);
      if (sharedCards) {
        const map = new Map<string, string>();
        for (const card of sharedCards) {
          if (card.feedback_id) map.set(card.feedback_id, card.id);
        }
        setSharedMap(map);
      }
    })();
  }, []);

  const availableProjectTypes = useMemo(() => {
    if (!feedbacks) return [];
    const present = new Set(feedbacks.map((fb) => fb.project_type));
    return [
      ...PROJECT_TYPES.filter((t) => present.has(t)),
      ...Array.from(present).filter(
        (t) => !PROJECT_TYPES.includes(t as (typeof PROJECT_TYPES)[number])
      ),
    ];
  }, [feedbacks]);

  const groups = useMemo(() => {
    if (!feedbacks) return [];
    const byProject = new Map<string, Feedback[]>();
    for (const fb of feedbacks) {
      if (projectFilter && fb.project_type !== projectFilter) continue;
      const list = byProject.get(fb.project_type) ?? [];
      list.push(fb);
      byProject.set(fb.project_type, list);
    }
    const orderedTypes = [
      ...PROJECT_TYPES.filter((t) => byProject.has(t)),
      ...Array.from(byProject.keys()).filter(
        (t) => !PROJECT_TYPES.includes(t as (typeof PROJECT_TYPES)[number])
      ),
    ];
    return orderedTypes.map((type) => ({
      type,
      items: byProject.get(type) ?? [],
    }));
  }, [feedbacks, projectFilter]);

  function startEdit(fb: Feedback) {
    setRowError(null);
    setEditingId(fb.id);
    setDraft({
      tag: fb.tag,
      content: fb.original_feedback,
      isShareable: fb.is_shareable,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(fb: Feedback) {
    if (!draft) return;
    const trimmed = draft.content.trim();
    if (!trimmed) return;
    setSavingId(fb.id);
    setRowError(null);
    const { data, error } = await updateFeedback(fb.id, {
      tag: draft.tag,
      original_feedback: trimmed,
      is_shareable: draft.isShareable,
    });
    setSavingId(null);
    if (error || !data) {
      setRowError(error ?? "수정에 실패했어요.");
      return;
    }
    setFeedbacks((prev) => (prev ? prev.map((f) => (f.id === fb.id ? data : f)) : prev));
    setEditingId(null);
    setDraft(null);
  }

  async function handleDelete(fb: Feedback) {
    if (!window.confirm("이 피드백을 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeletingId(fb.id);
    setRowError(null);
    const { error } = await deleteFeedback(fb.id);
    setDeletingId(null);
    if (error) {
      setRowError(error);
      return;
    }
    setFeedbacks((prev) => (prev ? prev.filter((f) => f.id !== fb.id) : prev));
  }

  async function handleUnshare(fb: Feedback) {
    const sharedCardId = sharedMap.get(fb.id);
    if (!sharedCardId) return;
    if (!window.confirm("공유를 취소할까요? 라이브러리에서 삭제돼요.")) return;
    setUnsharingId(fb.id);
    setRowError(null);
    const { error } = await deleteSharedCard(sharedCardId);
    setUnsharingId(null);
    if (error) {
      setRowError(error);
      return;
    }
    setSharedMap((prev) => {
      const next = new Map(prev);
      next.delete(fb.id);
      return next;
    });
  }

  const tagOptionsFor = (fb: Feedback) =>
    Array.from(new Set<string>([...TAGS, fb.tag]));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">내가 저장한 피드백</h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          프로젝트별로 모아볼 수 있어요. 공유 가능으로 표시한 피드백은 익명
          카드로 만들 수 있어요.
        </p>
      </div>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}
      {rowError && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{rowError}</Card>
      )}

      {availableProjectTypes.length > 0 && (
        <Card>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            프로젝트 이름으로 찾기
          </p>
          <div className="flex flex-wrap gap-2">
            <TagBadge
              label="전체"
              variant={projectFilter === null ? "selected" : "default"}
              onClick={() => setProjectFilter(null)}
            />
            {availableProjectTypes.map((pt) => (
              <TagBadge
                key={pt}
                label={pt}
                variant={projectFilter === pt ? "selected" : "default"}
                onClick={() => setProjectFilter(pt)}
              />
            ))}
          </div>
        </Card>
      )}

      {feedbacks === null && !error && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {feedbacks !== null && feedbacks.length === 0 && (
        <EmptyState
          message="아직 저장한 피드백이 없어요. 첫 피드백을 저장해보세요."
          cta={
            <Link href="/feedback/new">
              <button className="mt-4 bg-indigo-600 text-white rounded-xl px-5 py-3 font-semibold hover:bg-indigo-700 transition-all">
                피드백 저장하러 가기
              </button>
            </Link>
          }
        />
      )}

      {feedbacks !== null && feedbacks.length > 0 && groups.length === 0 && (
        <EmptyState message="선택한 프로젝트에 저장된 피드백이 없어요." />
      )}

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.type}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-gray-900">{group.type}</h2>
              <span className="text-xs text-gray-400">{group.items.length}개</span>
            </div>
            <div className="space-y-3">
              {group.items.map((fb) => {
                const isEditing = editingId === fb.id;
                return (
                  <Card key={fb.id} hoverable={!isEditing}>
                    {isEditing && draft ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">역량 태그</p>
                          <select
                            value={draft.tag}
                            onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {tagOptionsFor(fb).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          className="w-full min-h-[100px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          value={draft.content}
                          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                        />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={draft.isShareable}
                            onChange={(e) =>
                              setDraft({ ...draft, isShareable: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          공유 가능한 피드백으로 표시
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            disabled={savingId === fb.id}
                            onClick={() => saveEdit(fb)}
                          >
                            {savingId === fb.id ? "저장 중..." : "저장"}
                          </Button>
                          <Button variant="secondary" className="flex-1" onClick={cancelEdit}>
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-wrap gap-2">
                            <TagBadge label={fb.feedback_source} variant="default" />
                            <TagBadge label={fb.tag} variant="selected" />
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {formatDate(fb.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {fb.original_feedback}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(fb)}
                              className="text-xs text-gray-500 font-semibold hover:text-indigo-600"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(fb)}
                              disabled={deletingId === fb.id}
                              className="text-xs text-gray-500 font-semibold hover:text-red-600 disabled:opacity-50"
                            >
                              {deletingId === fb.id ? "삭제 중..." : "삭제"}
                            </button>
                          </div>
                          {fb.is_shareable && (
                            sharedMap.has(fb.id) ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-emerald-600">
                                  공유했어요
                                </span>
                                <button
                                  onClick={() => handleUnshare(fb)}
                                  disabled={unsharingId === fb.id}
                                  className="text-xs text-gray-500 font-semibold hover:text-red-600 disabled:opacity-50"
                                >
                                  {unsharingId === fb.id ? "취소 중..." : "공유 취소"}
                                </button>
                              </div>
                            ) : (
                              <Link href={`/cards/${fb.id}`}>
                                <Button variant="purple">공유하기</Button>
                              </Link>
                            )
                          )}
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
