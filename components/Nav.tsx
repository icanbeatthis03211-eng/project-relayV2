"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/feedback/new", label: "저장", icon: "✍️" },
  { href: "/feedbacks", label: "목록", icon: "📋" },
  { href: "/pattern", label: "패턴", icon: "🔁" },
  { href: "/checklist", label: "체크", icon: "✅" },
  { href: "/library", label: "라이브러리", icon: "📚" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="max-w-5xl mx-auto grid grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "text-indigo-600 font-semibold" : "text-gray-400 hover:text-indigo-500"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
