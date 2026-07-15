"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import Skeleton from "@/components/ui/Skeleton";
import { CHECKLIST_MAP, REPEAT_THRESHOLD } from "@/lib/constants";
import {
  computeTagCounts,
  getChecklistStatus,
  getFeedbacksByUser,
  upsertChecklistItem,
} from "@/lib/queries";
import { Tag as TagType } from "@/lib/types";
import { getUserId } from "@/lib/user";
import { trackEvent } from "@/lib/analytics";

interface ChecklistItem {
  tag: string;
  question: string;
  description: string;
  checked: boolean;
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = useMemo(() => getUserId(), []);

  async function load() {
    const [fbRes, statusRes] = await Promise.all([
      getFeedbacksByUser(userId),
      getChecklistStatus(userId),
    ]);
    if (fbRes.error) {
      setError(fbRes.error);
      return;
    }
    if (statusRes.error) {
      setError(statusRes.error);
      return;
    }
    const tagCounts = computeTagCounts(fbRes.data ?? []);
    const repeatedTags = tagCounts.filter((t) => t.count >= REPEAT_THRESHOLD).map((t) => t.tag);
    const statusMap = new Map((statusRes.data ?? []).map((s) => [s.tag, s.is_checked]));

    const nextItems: ChecklistItem[] = repeatedTags.map((tag) => ({
      tag,
      question: CHECKLIST_MAP[tag as TagType]?.question ?? `${tag} 관련 항목을 점검했는가?`,
      description: CHECKLIST_MAP[tag as TagType]?.description ?? "",
      checked: statusMap.get(tag) ?? false,
    }));
    setItems(nextItems);
  }

  useEffect(() => {
    load().catch(() => setError("체크리스트를 불러오지 못했어요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackEvent("view_action_guide");
  }, []);

  async function toggle(tag: string) {
    if (!items) return;
    const current = items.find((i) => i.tag === tag);
    if (!current) return;
    const nextChecked = !current.checked;
    setItems(items.map((i) => (i.tag === tag ? { ...i, checked: nextChecked } : i)));
    const { error } = await upsertChecklistItem(userId, tag, nextChecked);
    if (error) {
      setError(error);
      setItems(items.map((i) => (i.tag === tag ? { ...i, checked: current.checked } : i)));
    }
  }

  const total = items?.length ?? 0;
  const done = items?.filter((i) => i.checked).length ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">다음 프로젝트 체크리스트</h1>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            반복 피드백 태그를 기반으로 다음 프로젝트 전에 점검할 항목이에요.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      {items === null && !error && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {items !== null && items.length === 0 && (
        <EmptyState message="아직 2회 이상 반복된 태그가 없어요. 피드백이 더 쌓이면 체크리스트가 생성돼요." />
      )}

      {items !== null && items.length > 0 && (
        <>
          <Card>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              진행률 {done} / {total}
            </p>
            <ProgressBar percent={percent} variant={allDone ? "emerald" : "indigo"} />
          </Card>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.tag}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={item.checked}
                  onChange={() => toggle(item.tag)}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      item.checked ? "line-through text-gray-400" : "text-gray-900"
                    }`}
                  >
                    {item.question}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
