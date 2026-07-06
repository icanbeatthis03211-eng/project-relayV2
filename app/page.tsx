"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { getUserId } from "@/lib/user";
import {
  computeTagCounts,
  getFeedbacksByUser,
  getParticipantCount,
  subscribeToFeedbackInserts,
} from "@/lib/queries";
import { REPEAT_THRESHOLD } from "@/lib/constants";

interface Stats {
  feedbackCount: number;
  repeatedTagCount: number;
  checklistCount: number;
  shareableCount: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(
    null
  );
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    (async () => {
      const userId = getUserId();
      const { data, error } = await getFeedbacksByUser(userId);
      if (error) {
        setError(error);
        return;
      }
      const feedbacks = data ?? [];
      const tagCounts = computeTagCounts(feedbacks);
      const repeated = tagCounts.filter((t) => t.count >= REPEAT_THRESHOLD);
      setStats({
        feedbackCount: feedbacks.length,
        repeatedTagCount: repeated.length,
        checklistCount: repeated.length,
        shareableCount: feedbacks.filter((f) => f.is_shareable).length,
      });
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshParticipantCount() {
      const { data } = await getParticipantCount();
      if (!cancelled && data !== null) {
        setParticipantCount(data);
      }
    }

    refreshParticipantCount();

    // feedbacks 테이블에 새 데이터가 적재될 때마다(다른 사용자 포함)
    // 누적 참여자 수를 실시간으로 다시 집계합니다.
    const unsubscribe = subscribeToFeedbackInserts(() => {
      setIsLive(true);
      refreshParticipantCount();
      setTimeout(() => setIsLive(false), 1200);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const metricCards = [
    { label: "저장한 피드백", value: stats?.feedbackCount, unit: "개" },
    { label: "반복 피드백 태그", value: stats?.repeatedTagCount, unit: "개" },
    { label: "생성된 체크리스트", value: stats?.checklistCount, unit: "개" },
    { label: "공유 가능한 카드", value: stats?.shareableCount, unit: "개" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <section className="text-center pt-4 pb-2">
        <p className="text-sm font-semibold text-indigo-600 mb-2">Project Relay</p>
        <h1 className="text-3xl font-bold text-gray-900 leading-snug">
          받은 피드백을, 다음 프로젝트의
          <br />
          성장 체크리스트로 바꿔보세요
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed mt-3 max-w-md mx-auto">
          튜터, 팀원, 발표 피드백과 회고를 저장하면 Project Relay가 반복되는
          패턴을 찾아 다음 프로젝트 전에 무엇을 점검해야 하는지 알려줍니다.
        </p>
        <div className="mt-6">
          <Link href="/feedback/new">
            <Button variant="primary">피드백 저장하기</Button>
          </Link>
        </div>
      </section>

      {error && (
        <Card className="border-red-100 bg-red-50 text-red-600 text-sm">{error}</Card>
      )}

      <section>
        <Card variant="repeat" className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full bg-emerald-500 ${
                  isLive ? "animate-ping" : "animate-pulse"
                }`}
              />
              <p className="text-xs font-semibold text-emerald-700">
                실시간 · 누적 참여자 수
              </p>
            </div>
            <p className="text-3xl font-bold text-emerald-700 mt-1">
              {participantCount === null ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  {participantCount.toLocaleString()}
                  <span className="text-sm text-emerald-600 font-normal ml-1">
                    명
                  </span>
                </>
              )}
            </p>
          </div>
          <p className="text-xs text-emerald-700 text-right leading-relaxed max-w-[9rem]">
            피드백을 저장한 모든 수강생 수가
            <br />
            새로 기록될 때마다 자동 갱신돼요
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {metricCards.map((card) => (
          <Card key={card.label} hoverable className="text-center">
            {stats ? (
              <p className="text-2xl font-bold text-indigo-700">
                {card.value}
                <span className="text-sm text-gray-400 font-normal">{card.unit}</span>
              </p>
            ) : (
              <Skeleton className="h-8 w-16 mx-auto" />
            )}
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">서비스 흐름</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: "1", title: "피드백 저장", desc: "받은 피드백을 짧게 기록해요" },
            { step: "2", title: "반복 피드백 감지", desc: "같은 태그가 2회 이상 모이면 반복으로 표시" },
            { step: "3", title: "체크리스트 생성", desc: "반복 태그 기반으로 다음 프로젝트 점검 항목 생성" },
            { step: "4", title: "공유 카드 생성", desc: "민감정보를 지운 학습 카드로 라이브러리에 공유" },
          ].map((s) => (
            <Card key={s.step} variant="highlight" className="text-left">
              <p className="text-xs font-bold text-indigo-600 mb-1">STEP {s.step}</p>
              <p className="text-sm font-semibold text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
