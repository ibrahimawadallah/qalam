'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Khatam from '@/components/khatam';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/quran', label: 'Listen' },
  { href: '/search', label: 'Search' },
  { href: '/azkar', label: 'Azkar' },
  { href: '/hisn-muslim', label: 'Hisn al-Muslim' },
  { href: '/prayer-times', label: 'Prayer Times' },
  { href: '/hadiths', label: 'Hadiths' },
  { href: '/ruqyah', label: 'Ruqyah' },
  { href: '/islamic-calendar', label: 'Calendar' },
  { href: '/about', label: 'About' },
];

export default function TopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const path = pathname ?? '/';
  const isActive = (href: string) =>
    mounted && (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <header className="sticky top-0 z-40 flex h-[66px] items-center justify-between gap-5 border-b border-gold/25 bg-emerald-deep/95 px-4 backdrop-blur-md sm:px-[6vw]">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-3 text-left"
        aria-label="Quran Kareem home"
      >
        <Khatam className="h-[22px] w-[22px] text-gold" />
        <div>
          <span className="block font-display text-lg leading-tight text-ivory">
            Quran Kareem
          </span>
          <small className="eyebrow block text-[8.5px] tracking-[0.22em] text-gold-bright">
            MedTechAI Arab Organization
          </small>
        </div>
      </Link>

      <nav className="no-scrollbar -mx-1 flex-1 overflow-x-auto" aria-label="Primary">
        <ul className="flex items-center gap-1 whitespace-nowrap px-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'font-ui inline-block rounded-full px-3 py-2 text-xs tracking-wide transition-colors sm:px-[13px] sm:py-[9px] sm:text-[12.5px]',
                  isActive(item.href)
                    ? 'bg-gold font-semibold text-ink'
                    : 'text-ivory-dim hover:text-gold-bright'
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
