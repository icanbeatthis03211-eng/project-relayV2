"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/feedback/new", label: "저장" },
  { href: "/feedbacks", label: "내 피드백" },
  { href: "/pattern", label: "패턴" },
  { href: "/checklist", label: "체크" },
  { href: "/library", label: "공유" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-[57px] z-30 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto grid grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center justify-center py-3 text-sm transition-colors"
            >
              <span
                className={
                  active
                    ? "font-semibold text-indigo-600"
                    : "text-gray-400 hover:text-indigo-500"
                }
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
