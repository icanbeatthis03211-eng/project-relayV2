"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "selected" | "default" | "repeated";

interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  label: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  selected: "bg-indigo-600 text-white rounded-full px-3 py-1 text-sm font-medium",
  default:
    "bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all",
  repeated: "bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-semibold",
};

export default function Tag({
  variant = "default",
  label,
  className = "",
  ...props
}: TagProps) {
  return (
    <button type="button" className={`${VARIANT_CLASSES[variant]} ${className}`} {...props}>
      {label}
    </button>
  );
}
