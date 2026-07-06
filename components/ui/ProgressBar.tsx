interface ProgressBarProps {
  percent: number;
  variant?: "indigo" | "emerald";
}

export default function ProgressBar({ percent, variant = "indigo" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const fillClass = variant === "emerald" ? "bg-emerald-500" : "bg-indigo-600";
  return (
    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${fillClass} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
