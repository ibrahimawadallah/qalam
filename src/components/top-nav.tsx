'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Khatam from '@/components/khatam';
import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';

const NAV_HREFS = ['/', '/quran', '/search', '/azkar', '/prayer-times'];

const NAV_LABEL_KEYS = ['home', 'listen', 'search', 'azkar', 'prayerTimes'];

export default function TopNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const path = pathname ?? '/';
  const isActive = (href: string) =>
    mounted && (href === '/' ? path === '/' : path.startsWith(href));

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const newPath = pathname.replace(/^\/(en|ar)/, `/${newLocale}`) || `/${newLocale}`;
    router.push(newPath);
  };

  return (
    <header className="sticky top-0 z-40 flex h-[58px] items-center justify-between gap-3 border-b border-gold/25 bg-emerald-deep/95 px-3 backdrop-blur-md sm:px-[6vw]">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-left"
        aria-label={t('brandAria')}
      >
        <Khatam className="h-[18px] w-[18px] text-gold" />
        <div className="hidden sm:block">
          <span className="block font-display text-lg leading-tight text-ivory">
            {t('brandName')}
          </span>
          <small className="eyebrow block text-[8.5px] tracking-[0.22em] text-gold-bright">
            {t('orgName')}
          </small>
        </div>
        <span className="sm:hidden font-display text-base leading-tight text-ivory">{t('brandName')}</span>
      </Link>

      <div className="flex items-center gap-2">
        <nav className="flex items-center overflow-x-auto no-scrollbar" aria-label="Primary">
          <ul className="flex items-center gap-0.5 rounded-full bg-black/20 p-0.5 backdrop-blur-sm">
            {NAV_HREFS.map((href, i) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'font-ui inline-block rounded-full px-3 py-1.5 text-[13px] tracking-wide transition-colors whitespace-nowrap',
                    isActive(href)
                      ? 'bg-gold font-semibold text-ink shadow-sm'
                      : 'text-ivory-dim hover:text-ivory'
                  )}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  {t(NAV_LABEL_KEYS[i])}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={switchLocale}
          className="flex h-7 items-center gap-1 rounded-full border border-gold/15 bg-black/10 px-2 font-ui text-[10px] font-medium tracking-wide hover:bg-black/20 hover:border-gold/25 transition-colors shrink-0"
          aria-label="Switch language"
          title={locale === 'en' ? 'العربية' : 'English'}
        >
          <Languages className="h-3 w-3 text-gold/60 hidden sm:block" />
          <span className={locale === 'en' ? 'text-gold' : 'text-ivory/40'}>EN</span>
          <span className="h-3 w-px bg-gold/15" />
          <span className={locale === 'ar' ? 'text-gold' : 'text-ivory/40'}>AR</span>
        </button>
      </div>
    </header>
  );
}
