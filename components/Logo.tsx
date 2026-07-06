interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Project Relay 그래픽 로고.
 * Indigo → Emerald 그라데이션 배지 안에 "성장 추세선" 아이콘을 담아
 * 피드백이 반복될수록 위로 쌓이는 성장의 이미지를 표현합니다.
 */
export default function Logo({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="relay-logo-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#relay-logo-gradient)" />
      <path
        d="M8 20.5L13.2 15.3L17 19.1L23.5 12.6"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 12.2H23.5V17.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
