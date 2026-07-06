"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import { PROJECT_TYPES, TAGS } from "@/lib/constants";
import { computeSharedTagFrequency, getSharedCards } from "@/lib/queries";
import { SharedCard } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function LibraryPage() {
  const [cards, setCards] = useState<SharedCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await getSharedCards({
        projectType: projectType ?? undefined,
        tag: tag ?? undefined,
      });
      if (error) {
        setError(error);
        return;
      }
      setCards(data ?? []);
    })();
  }, [projectType, tag]);

  const tagFrequency = useMemo(() => (cards ? computeSharedTagFrequency(cards) : []), [cards]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">공유 피드백 라이브러리</h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          다른 수강생들이 공유한 학습 포인트를 모아둔 데이터베이스예요. 댓글이나
          좋아요는 없어요.
        </p>
      </div>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-2">프로젝트 유형</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <TagBadge
            label="전체"
            variant={projectType === null ? "selected" : "default"}
            onClick={() => setProjectType(null)}
          />
          {PROJECT_TYPES.map((pt) => (
            <TagBadge
              key={pt}
              label={pt}
              variant={projectType === pt ? "selected" : "default"}
              onClick={() => setProjectType(pt)}
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-2">역량 태그</p>
        <div className="flex flex-wrap gap-2">
          <TagBadge
            label="전체"
            variant={tag === null ? "selected" : "default"}
            onClick={() => setTag(null)}
          />
          {TAGS.map((t) => (
            <TagBadge
              key={t}
              label={t}
              variant={tag === t ? "selected" : "default"}
              onClick={() => setTag(t)}
            />
          ))}
        </div>
      </Card>

      {tagFrequency.length > 0 && (
        <Card variant="repeat">
          <p className="text-sm font-semibold text-emerald-700 mb-2">
            공유 라이브러리에서 자주 반복되는 태그
          </p>
          <div className="flex flex-wrap gap-2">
            {tagFrequency.map((tf) => (
              <TagBadge key={tf.tag} label={`${tf.tag} · ${tf.count}`} variant="repeated" />
            ))}
          </div>
        </Card>
      )}

      {cards === null && !error && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {cards !== null && cards.length === 0 && (
        <EmptyState message="아직 공유된 피드백이 부족해요. 내 피드백을 공유해서 라이브러리를 함께 채워보세요." />
      )}

      <div className="space-y-3">
        {cards?.map((card) => (
          <Card key={card.id} variant="share" hoverable>
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-wrap gap-2">
                <TagBadge label={card.project_type} variant="default" />
                <TagBadge label={card.tag} variant="selected" />
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                {formatDate(card.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-3">
              {card.generalized_feedback}
            </p>
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-700 mb-1">다음 프로젝트에서 조심할 점</p>
              <p className="text-xs text-gray-600 leading-relaxed">{card.action_item}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
