'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Khatam from '@/components/khatam';
import { cn } from '@/lib/utils';

const PRIMARY_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/quran', label: 'Listen' },
  { href: '/search', label: 'Search' },
  { href: '/azkar', label: 'Azkar' },
  { href: '/prayer-times', label: 'Prayer Times' },
];

const SECONDARY_ITEMS = [
  { href: '/hisn-muslim', label: 'Hisn al-Muslim' },
  { href: '/hadiths', label: 'Hadiths' },
  { href: '/ruqyah', label: 'Ruqyah' },
  { href: '/islamic-calendar', label: 'Calendar' },
  { href: '/about', label: 'About' },
];

export default function TopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const path = pathname ?? '/';
  const isActive = (href: string) =>
    mounted && (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-gold/25 bg-emerald-deep/[0.94] px-[6vw] py-3 backdrop-blur-md sm:py-3.5">
      <div className="flex items-center justify-between">
        {/* Brandmark */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          aria-label="Quran Kareem home"
        >
          <Khatam className="h-[22px] w-[22px] text-gold" />
          <div>
            <span className="font-display block text-xl leading-tight tracking-[0.04em] text-ivory">
              Quran Kareem
            </span>
            <small className="eyebrow block text-[9px] !leading-tight tracking-[0.24em] text-gold-bright">
              MedTechAI Arab Organization
            </small>
          </div>
        </Link>

        {/* Desktop pill switcher */}
        <nav
          className="hidden items-center gap-0.5 rounded-full bg-black/25 p-[3px] lg:flex"
          aria-label="Primary"
        >
          {PRIMARY_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'font-ui whitespace-nowrap rounded-full px-3.5 py-[7px] text-[12.5px] tracking-wide transition-all',
                isActive(item.href)
                  ? 'bg-gold font-semibold text-ink'
                  : 'text-ivory-dim hover:text-gold-bright'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="-mr-2 p-2 text-ivory-dim transition-colors hover:text-gold-bright lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="mt-3 max-h-[calc(100vh-140px)] space-y-0.5 overflow-y-auto border-t border-gold/20 pt-2 lg:hidden"
          aria-label="Primary mobile"
        >
          {[...PRIMARY_ITEMS, ...SECONDARY_ITEMS].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'font-ui flex min-h-[44px] items-center rounded-full px-3.5 text-[13.5px] transition-colors',
                isActive(item.href)
                  ? 'bg-gold font-semibold text-ink'
                  : 'text-ivory-dim hover:bg-white/5 hover:text-gold-bright'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
