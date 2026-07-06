"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Toast from "@/components/ui/Toast";
import { FEEDBACK_SOURCES, PROJECT_TYPES, TAGS } from "@/lib/constants";
import { createFeedback, getDistinctTagsByUser } from "@/lib/queries";
import { getUserId } from "@/lib/user";

export default function NewFeedbackPage() {
  const router = useRouter();
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [source, setSource] = useState(FEEDBACK_SOURCES[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  // 이전에 직접 추가했던 커스텀 태그를 불러와 다시 고를 수 있게 해줍니다.
  useEffect(() => {
    (async () => {
      const { data } = await getDistinctTagsByUser(getUserId());
      if (!data) return;
      const predefined = new Set<string>(TAGS);
      const history = data.filter((t) => !predefined.has(t));
      if (history.length > 0) {
        setCustomTags((prev) => Array.from(new Set([...prev, ...history])));
      }
    })();
  }, []);

  const allTagOptions = Array.from(new Set<string>([...TAGS, ...customTags]));
  const canSubmit = tags.length > 0 && content.trim().length > 0 && !submitting;

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  }

  function handleAddCustomTag() {
    const value = newTagInput.trim();
    if (!value) return;
    if (!allTagOptions.includes(value)) {
      setCustomTags((prev) => [...prev, value]);
    }
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewTagInput("");
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
        // 공유 여부는 저장 시점에 묻지 않고, "내가 저장한 피드백" 화면에서
        // 언제든 켜고 끌 수 있도록 기본값을 true로 둡니다.
        is_shareable: true,
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
          이 피드백과 관련된 역량을 모두 골라주세요. 목록에 없다면 직접
          추가할 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          {allTagOptions.map((t) => (
            <Tag
              key={t}
              label={t}
              variant={tags.includes(t) ? "selected" : "default"}
              onClick={() => toggleTag(t)}
            />
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
            placeholder="원하는 태그가 없다면 직접 입력해보세요"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!newTagInput.trim()}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all disabled:bg-gray-100 disabled:text-gray-400"
          >
            태그 추가
          </button>
        </div>
      </Card>

      <Card>
        <p className="text-lg font-semibold text-gray-900 mb-3">원본 피드백 내용</p>
        <textarea
          className="w-full min-h-[240px] rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          placeholder="받은 피드백을 그대로 입력하거나 붙여넣으세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
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
