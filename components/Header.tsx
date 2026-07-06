import Link from "next/link";
import Logo from "@/components/Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-base font-bold text-gray-900 tracking-tight">
            Project Relay
          </span>
        </Link>
      </div>
    </header>
  );
}
