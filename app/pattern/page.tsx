"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import { CHECKLIST_MAP, REPEAT_THRESHOLD } from "@/lib/constants";
import { computeTagCounts, getFeedbacksByUser } from "@/lib/queries";
import { Feedback, Tag as TagType } from "@/lib/types";
import { getUserId } from "@/lib/user";

function interpretationLine(tag: string, count: number): string {
  const desc = CHECKLIST_MAP[tag as TagType]?.description ?? "관련 피드백을 점검해보세요.";
  if (count >= REPEAT_THRESHOLD) {
    return `${tag} — ${count}회 반복: ${desc}`;
  }
  return `${tag} — ${count}회: 아직 반복 피드백은 아니지만, 다음 프로젝트에서 함께 점검하면 좋아요.`;
}

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
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {feedbacks !== null && feedbacks.length === 0 && (
        <EmptyState message="아직 데이터가 부족해요. 피드백을 몇 개 저장하면 패턴을 보여드릴게요." />
      )}

      {topTag && (
        <Card variant={topTag.count >= REPEAT_THRESHOLD ? "repeat" : "highlight"} className="text-center">
          <p className="text-xs font-semibold text-emerald-700 mb-1">가장 많이 반복된 영역</p>
          <p className="text-2xl font-bold text-gray-900">{topTag.tag}</p>
          <p className="text-sm text-gray-600 mt-2">{interpretationLine(topTag.tag, topTag.count)}</p>
        </Card>
      )}

      <div className="space-y-3">
        {tagCounts.map((tc) => {
          const related = (feedbacks ?? []).filter((f) => f.tag === tc.tag).slice(0, 3);
          const repeated = tc.count >= REPEAT_THRESHOLD;
          return (
            <Card key={tc.tag} variant={repeated ? "repeat" : "default"}>
              <div className="flex items-center justify-between mb-2">
                <TagBadge label={tc.tag} variant={repeated ? "repeated" : "default"} />
                <span className="text-sm font-semibold text-gray-500">{tc.count}회</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {interpretationLine(tc.tag, tc.count)}
              </p>
              {related.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  {related.map((fb) => (
                    <p key={fb.id} className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      · {fb.original_feedback}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
