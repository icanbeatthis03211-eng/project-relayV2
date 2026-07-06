import { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  cta?: ReactNode;
}

export default function EmptyState({ message, cta }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center animate-fadeIn">
      <p className="text-gray-500 text-sm">{message}</p>
      {cta}
    </div>
  );
}
