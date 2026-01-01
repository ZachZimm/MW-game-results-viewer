"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNavItems = [
  { href: "/", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
];

interface HeaderProps {
  showNextGame?: boolean;
}

export function Header({ showNextGame = false }: HeaderProps) {
  const pathname = usePathname();
  
  const navItems = showNextGame
    ? [...baseNavItems, { href: "/2026", label: "2026 Game" }]
    : baseNavItems;

  return (
    <header className="border-b border-border-color bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="w-8 h-8 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3v18h18" />
                <path d="M7 16l4-4 4 4 5-6" />
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-base text-text-primary">
                  The West Is
                </span>
                <span className="font-semibold text-base text-text-primary">
                  The Best
                </span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-bg-tertiary text-text-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="text-sm text-text-secondary">
            2025
          </div>
        </div>
      </div>
    </header>
  );
}
