"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import TagBadge from "@/components/ui/Tag";
import Toast from "@/components/ui/Toast";
import { CHECKLIST_MAP } from "@/lib/constants";
import { createSharedCard, getFeedbackById } from "@/lib/queries";
import { Feedback, Tag as TagType } from "@/lib/types";

export default function CardEditor({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generalizedFeedback, setGeneralizedFeedback] = useState("");
  const [actionItem, setActionItem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await getFeedbackById(feedbackId);
      if (error || !data) {
        setLoadError(error ?? "피드백을 찾을 수 없어요.");
        return;
      }
      setFeedback(data);
      setGeneralizedFeedback(data.original_feedback);
      setActionItem(
        CHECKLIST_MAP[data.tag as TagType]?.question ?? "다음 프로젝트에서 함께 점검해보세요."
      );
    })();
  }, [feedbackId]);

  async function handleCopy() {
    if (!feedback) return;
    const text = `[${feedback.project_type}] ${feedback.tag}\n\n${generalizedFeedback}\n\n다음에 조심할 점: ${actionItem}`;
    try {
      await navigator.clipboard.writeText(text);
      setToast("카드 내용이 복사되었어요!");
    } catch {
      setToast("복사에 실패했어요. 브라우저 권한을 확인해주세요.");
    }
  }

  async function handleAddToLibrary() {
    if (!feedback) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await createSharedCard({
      feedback_id: feedback.id,
      project_type: feedback.project_type,
      generalized_feedback: generalizedFeedback.trim(),
      tag: feedback.tag,
      action_item: actionItem.trim(),
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setAdded(true);
    setToast("공유 라이브러리에 추가되었어요!");
    setTimeout(() => router.push("/library"), 900);
  }

  if (loadError) {
    return (
      <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{loadError}</Card>
    );
  }

  if (!feedback) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">공유 카드 만들기</h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          원본 피드백을 그대로 공유하지 않아요. 이름, 팀명, 튜터명, 구체적인
          서비스명, 개인 평가처럼 느껴지는 문장, 민감한 프로젝트 정보는 반드시
          지우고 학습 포인트만 남겨주세요.
        </p>
      </div>

      <Card variant="share" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <TagBadge label={feedback.project_type} variant="default" />
          <TagBadge label={feedback.tag} variant="selected" />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">일반화된 피드백 요약</p>
          <textarea
            className="w-full min-h-[140px] rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            value={generalizedFeedback}
            onChange={(e) => setGeneralizedFeedback(e.target.value)}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            다음 프로젝트에서 조심할 점
          </p>
          <textarea
            className="w-full min-h-[80px] rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            value={actionItem}
            onChange={(e) => setActionItem(e.target.value)}
          />
        </div>
      </Card>

      {submitError && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{submitError}</Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleCopy}>
          카드 복사하기
        </Button>
        <Button
          variant="share"
          className="flex-1"
          disabled={submitting || added}
          onClick={handleAddToLibrary}
        >
          {added ? "추가 완료" : submitting ? "추가 중..." : "공유 라이브러리에 추가"}
        </Button>
      </div>

      <Toast message={toast ?? ""} show={!!toast} onClose={() => setToast(null)} />
    </div>
  );
}
