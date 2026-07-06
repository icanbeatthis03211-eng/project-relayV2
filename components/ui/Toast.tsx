"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  variant?: "success" | "error";
}

export default function Toast({ message, show, onClose, variant = "success" }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  const colorClass =
    variant === "success"
      ? "bg-gray-900 text-white"
      : "bg-red-600 text-white";

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      <div className={`${colorClass} rounded-xl px-4 py-3 text-sm font-medium shadow-xl`}>
        {message}
      </div>
    </div>
  );
}
