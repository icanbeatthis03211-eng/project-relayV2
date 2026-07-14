"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { CHECKLIST_MAP, REPEAT_THRESHOLD } from "@/lib/constants";
import { computeTagCounts, getFeedbacksByUser } from "@/lib/queries";
import { Feedback, Tag as TagType } from "@/lib/types";
import { getUserId } from "@/lib/user";

function interpretationLine(tag: string, count: number): string {
  const desc = CHECKLIST_MAP[tag as TagType]?.description ?? "관련 피드백을 점검해보세요.";
  if (count >= REPEAT_THRESHOLD) {
    return desc;
  }
  return "아직 반복 피드백은 아니지만, 다음 프로젝트에서 함께 점검하면 좋아요.";
}

const RANK_BADGE_COLORS = ["bg-emerald-500", "bg-emerald-400", "bg-emerald-300"];

export default function PatternPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await getFeedbacksByUser(getUserId());
      if (error) {
        setError(error);
        return;
      }
      setFeedbacks(data ?? []);
    })();
  }, []);

  const tagCounts = useMemo(
    () => (feedbacks ? computeTagCounts(feedbacks) : []),
    [feedbacks]
  );

  const topTag = tagCounts[0];
  const maxCount = topTag?.count ?? 1;
  const repeatedCount = tagCounts.filter((t) => t.count >= REPEAT_THRESHOLD).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">내 반복 피드백</h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          같은 역량 태그가 2회 이상 등장하면 반복 피드백으로 표시돼요.
        </p>
      </div>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      {feedbacks === null && !error && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {feedbacks !== null && feedbacks.length === 0 && (
        <EmptyState message="아직 데이터가 부족해요. 피드백을 몇 개 저장하면 패턴을 보여드릴게요." />
      )}

      {topTag && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 text-white p-6 shadow-md">
          <p className="text-xs font-bold text-indigo-200 tracking-wide uppercase mb-3">
            가장 많이 반복된 영역
          </p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold leading-none">{topTag.count}</span>
            <span className="text-sm font-semibold text-indigo-200 mb-1.5">회 반복</span>
          </div>
          <p className="text-2xl font-bold mt-3">{topTag.tag}</p>
          <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
            {interpretationLine(topTag.tag, topTag.count)}
          </p>
        </div>
      )}

      {tagCounts.length > 0 && (
        <p className="text-xs text-gray-400">
          전체 {tagCounts.length}개 태그 중{" "}
          <span className="font-bold text-emerald-600">{repeatedCount}개</span>가 반복
          피드백이에요.
        </p>
      )}

      <div className="space-y-3">
        {tagCounts.map((tc, index) => {
          const related = (feedbacks ?? [])
            .filter((f) => (f.tags && f.tags.length > 0 ? f.tags : [f.tag]).includes(tc.tag))
            .slice(0, 2);
          const repeated = tc.count >= REPEAT_THRESHOLD;
          const percent = Math.max(10, Math.round((tc.count / maxCount) * 100));
          const badgeColor = repeated
            ? RANK_BADGE_COLORS[index] ?? "bg-emerald-200"
            : "bg-gray-200";
          const badgeText = repeated ? "text-white" : "text-gray-500";

          return (
            <div
              key={tc.tag}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${badgeColor} ${badgeText}`}
                >
                  {index + 1}
                </div>
                <p className="flex-1 min-w-0 text-base font-bold text-gray-900 truncate">
                  {tc.tag}
                </p>
                <span
                  className={`shrink-0 text-xl font-bold ${
                    repeated ? "text-emerald-600" : "text-gray-300"
                  }`}
                >
                  {tc.count}
                </span>
              </div>

              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    repeated ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                {interpretationLine(tc.tag, tc.count)}
              </p>

              {related.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                  {related.map((fb) => (
                    <p
                      key={fb.id}
                      className="text-xs text-gray-400 leading-relaxed line-clamp-1"
                    >
                      · {fb.original_feedback}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
