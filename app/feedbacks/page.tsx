"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import { Feedback } from "@/lib/types";
import { getFeedbacksByUser } from "@/lib/queries";
import { getUserId } from "@/lib/user";
import { PROJECT_TYPES } from "@/lib/constants";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

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
              {group.items.map((fb) => (
                <Card key={fb.id} hoverable>
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
                  {fb.is_shareable && (
                    <div className="mt-3 flex justify-end">
                      <Link href={`/cards/${fb.id}`}>
                        <Button variant="purple">공유 카드 만들기</Button>
                      </Link>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
