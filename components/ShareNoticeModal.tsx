"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "relay_seen_share_notice";

export default function ShareNoticeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setShow(true);
    } catch {
      // localStorage를 쓸 수 없는 환경이면 그냥 표시하지 않아요.
    }
  }, []);

  function handleClose() {
    setShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
        <button
          onClick={handleClose}
          aria-label="닫기"
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">
          익명 공유 전 꼭 확인해주세요
        </h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            Project Relay의 공유 피드백은 이름 없이 익명으로 공개됩니다.
            하지만 프로젝트 주제, 팀 상황, 피드백 내용에 따라 특정 개인이나
            팀이 유추될 수 있습니다.
          </p>
          <p>
            피드백을 공유하기 전에는 개인 정보, 팀을 식별할 수 있는 정보,
            민감한 표현이 포함되어 있지 않은지 확인해주세요.
          </p>
          <p>
            팀 프로젝트에 대한 피드백이라면, 팀원들과 동의를 받고
            공유해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
