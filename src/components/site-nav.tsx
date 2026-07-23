"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Shield, Sun, Clock, ScrollText, Heart, Search, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quran", label: "Quran", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/ruqyah", label: "Ruqyah", icon: Shield },
  { href: "/hisn-muslim", label: "Hisn Muslim", icon: Sun },
  { href: "/azkar", label: "Azkar", icon: Heart },
  { href: "/hadiths", label: "Hadiths", icon: ScrollText },
  { href: "/islamic-calendar", label: "Calendar", icon: CalendarDays },
  { href: "/prayer-times", label: "Prayer Times", icon: Clock },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-purple-500/10 backdrop-blur-xl"
      style={{
        background: "rgba(10, 5, 24, 0.92)",
      }}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg overflow-hidden ring-2 ring-amber-500/30">
            <img src="/logo.jpg" alt="Quran Kareem" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            Quran Kareem
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-xs ${
                    active
                      ? "bg-purple-500/15 text-purple-200"
                      : "text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/10"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
