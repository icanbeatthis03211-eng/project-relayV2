"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "share" | "purple" | "purpleBlock" | "disabled";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white rounded-xl px-5 py-3 font-semibold hover:bg-indigo-700 hover:scale-105 transition-all",
  secondary:
    "bg-white text-indigo-600 border border-indigo-200 rounded-xl px-5 py-3 font-semibold hover:bg-indigo-50 transition-all",
  share:
    "bg-emerald-500 text-white rounded-xl px-5 py-3 font-semibold hover:bg-emerald-600 hover:scale-105 transition-all",
  purple:
    "bg-purple-600 text-white rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-purple-700 hover:scale-105 transition-all",
  purpleBlock:
    "bg-purple-600 text-white rounded-xl px-5 py-3 font-semibold hover:bg-purple-700 hover:scale-105 transition-all",
  disabled: "bg-gray-200 text-gray-400 rounded-xl px-5 py-3 cursor-not-allowed",
};

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const resolvedVariant: Variant = disabled ? "disabled" : variant;
  return (
    <button
      className={`${VARIANT_CLASSES[resolvedVariant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
