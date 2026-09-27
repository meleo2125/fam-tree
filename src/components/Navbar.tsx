"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, GitFork, Settings, LogOut, Users } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export function Navbar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navItems = [
    { href: "/", label: "Search", icon: Search },
    { href: "/tree", label: "Tree", icon: GitFork },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-primary text-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Users className="w-4 h-4" />
          </div>
          <span>Family Tree</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-textSecondary hover:text-textPrimary hover:bg-bg"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <form action={logoutAction} className="ml-2 pl-2 border-l border-border">
            <button
              type="submit"
              title="Logout"
              className="p-1.5 rounded-card text-textSecondary hover:text-primary hover:bg-bg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
