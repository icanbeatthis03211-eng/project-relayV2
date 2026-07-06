"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Toast from "@/components/ui/Toast";
import { FEEDBACK_SOURCES, PROJECT_TYPES, TAGS } from "@/lib/constants";
import { createFeedback } from "@/lib/queries";
import { getUserId } from "@/lib/user";

export default function NewFeedbackPage() {
  const router = useRouter();
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [source, setSource] = useState(FEEDBACK_SOURCES[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isShareable, setIsShareable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const canSubmit = tags.length > 0 && content.trim().length > 0 && !submitting;

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  }

  async function handleSubmit() {
    if (tags.length === 0) return;
    setSubmitting(true);
    setError(null);
    const userId = getUserId();
    const trimmed = content.trim();

    // 선택한 역량 태그마다 하나의 피드백 기록을 저장합니다.
    // (같은 원본 피드백이 여러 역량과 관련 있을 수 있기 때문에,
    //  태그별 반복 감지 로직이 정확히 동작하도록 태그당 한 행씩 남깁니다.)
    for (const t of tags) {
      const { error } = await createFeedback({
        user_id: userId,
        project_type: projectType,
        feedback_source: source,
        original_feedback: trimmed,
        tag: t,
        is_shareable: isShareable,
      });
      if (error) {
        setSubmitting(false);
        setError(error);
        return;
      }
    }

    setSubmitting(false);
    setToast(true);
    setTimeout(() => router.push("/feedbacks"), 700);
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
        <p className="text-lg font-semibold text-gray-900 mb-3">프로젝트 유형</p>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((type) => (
            <Tag
              key={type}
              label={type}
              variant={projectType === type ? "selected" : "default"}
              onClick={() => setProjectType(type)}
            />
          ))}
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
          이 피드백과 관련된 역량을 모두 골라주세요.
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <Tag
              key={t}
              label={t}
              variant={tags.includes(t) ? "selected" : "default"}
              onClick={() => toggleTag(t)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-3">원본 피드백 내용</p>
        <textarea
          className="w-full min-h-[140px] rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="받은 피드백을 그대로 입력하거나 붙여넣으세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">공유 가능한 피드백인가요?</p>
          <p className="text-xs text-gray-400 mt-1">
            나중에 익명 카드로 변환해 라이브러리에 공유할 수 있어요
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsShareable((v) => !v)}
          className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${
            isShareable ? "bg-indigo-600 justify-end" : "bg-gray-200 justify-start"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white shadow" />
        </button>
      </Card>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      <Button variant="primary" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        {submitting ? "저장 중..." : "피드백 저장하기"}
      </Button>

      <Toast message="피드백이 저장되었어요!" show={toast} onClose={() => setToast(false)} />
    </div>
  );
}
