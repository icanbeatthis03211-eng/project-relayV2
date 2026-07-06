import { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "highlight" | "share" | "repeat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  hoverable?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: "bg-white rounded-2xl shadow-md border border-gray-100 p-5",
  highlight: "bg-indigo-50 rounded-2xl border border-indigo-100 p-5",
  share: "bg-white rounded-2xl shadow-xl border border-gray-100 p-6",
  repeat: "bg-emerald-50 rounded-2xl border border-emerald-100 p-5",
};

export default function Card({
  variant = "default",
  hoverable = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`${VARIANT_CLASSES[variant]} ${
        hoverable ? "hover:-translate-y-1 hover:shadow-xl transition-all" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
