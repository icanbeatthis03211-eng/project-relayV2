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
      // 화면에는 보이지 않지만, 태그 기반 체크 문구를 조심할 점으로 함께 저장해요.
      setActionItem(
        CHECKLIST_MAP[data.tag as TagType]?.question ?? "다음 프로젝트에서 함께 점검해보세요."
      );
    })();
  }, [feedbackId]);

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
    setToast("공유했어요!");
    setTimeout(() => router.push("/feedbacks"), 900);
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
      </Card>

      {submitError && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{submitError}</Card>
      )}

      <Button
        variant="share"
        className="w-full"
        disabled={submitting || added}
        onClick={handleAddToLibrary}
      >
        {added ? "공유 완료" : submitting ? "공유 중..." : "공유하기"}
      </Button>

      <Toast message={toast ?? ""} show={!!toast} onClose={() => setToast(null)} />
    </div>
  );
}
