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
    <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              active
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
