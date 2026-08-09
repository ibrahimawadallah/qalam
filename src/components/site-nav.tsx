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
      className="sticky top-0 z-40 w-full warm-sticky"
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg overflow-hidden ring-1 ring-primary/20">
            <img src="/logo.jpg" alt="Quran Kareem" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-bold text-primary" style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif' }}>
            Quran Kareem
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-xs ${
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
