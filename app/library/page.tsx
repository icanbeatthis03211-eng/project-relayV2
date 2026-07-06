"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import { PROJECT_TYPES, TAGS } from "@/lib/constants";
import {
  computeSharedTagFrequency,
  deleteSharedCard,
  getFeedbacksByUser,
  getSharedCards,
} from "@/lib/queries";
import { SharedCard } from "@/lib/types";
import { getUserId } from "@/lib/user";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function LibraryPage() {
  const [cards, setCards] = useState<SharedCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [freqCards, setFreqCards] = useState<SharedCard[] | null>(null);
  const [unsharingId, setUnsharingId] = useState<string | null>(null);
  const [myFeedbackIds, setMyFeedbackIds] = useState<Set<string>>(new Set());
  const currentUserId = useMemo(() => getUserId(), []);

  // 레거시 공유 카드(예전 버전이라 user_id가 비어있는 카드)의 소유 여부를
  // 판별하기 위한 보조 데이터입니다. user_id가 있는 카드는 이걸 쓸 필요 없어요.
  useEffect(() => {
    (async () => {
      const { data } = await getFeedbacksByUser(currentUserId);
      if (data) {
        setMyFeedbackIds(new Set(data.map((fb) => fb.id)));
      }
    })();
  }, [currentUserId]);

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

  // 자주 반복되는 태그는 프로젝트 유형 필터만 반영하고,
  // 역량 태그 필터와는 무관하게 계산합니다.
  useEffect(() => {
    (async () => {
      const { data } = await getSharedCards({
        projectType: projectType ?? undefined,
      });
      setFreqCards(data ?? []);
    })();
  }, [projectType]);

  const tagFrequency = useMemo(
    () => (freqCards ? computeSharedTagFrequency(freqCards) : []),
    [freqCards]
  );

  async function handleUnshare(card: SharedCard) {
    if (!window.confirm("공유를 취소할까요? 라이브러리에서 삭제돼요.")) return;
    setUnsharingId(card.id);
    const { error } = await deleteSharedCard(card.id);
    setUnsharingId(null);
    if (error) {
      setError(error);
      return;
    }
    setCards((prev) => (prev ? prev.filter((c) => c.id !== card.id) : prev));
  }

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
            {projectType
              ? `${projectType}에서 자주 반복되는 태그`
              : "전체에서 자주 반복되는 태그"}
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
        {cards?.map((card) => {
          const isMine = card.user_id
            ? card.user_id === currentUserId
            : !!card.feedback_id && myFeedbackIds.has(card.feedback_id);
          return (
            <Card key={card.id} variant="share" hoverable>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-wrap gap-2">
                  <TagBadge label={card.project_type} variant="default" />
                  <TagBadge label={card.tag} variant="selected" />
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(card.created_at)}
                  </span>
                  {isMine && (
                    <Button
                      variant="gray"
                      disabled={unsharingId === card.id}
                      onClick={() => handleUnshare(card)}
                    >
                      {unsharingId === card.id ? "취소 중..." : "공유 취소"}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {card.generalized_feedback}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
