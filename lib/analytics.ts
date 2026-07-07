// Google Analytics 4 이벤트 트래킹 헬퍼
// 페이지뷰는 @next/third-parties/google의 <GoogleAnalytics /> 컴포넌트가 자동으로 수집하고,
// 여기서는 기획서(§9 측정 계획)에 정의한 핵심 행동 이벤트만 별도로 전송합니다.

export const GA_MEASUREMENT_ID = "G-JJQ86GQMZ4";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
