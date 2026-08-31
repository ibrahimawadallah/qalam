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
    <header className="sticky top-0 z-40 flex h-[62px] items-center justify-between gap-3 border-b border-gold/30 bg-navy/95 px-3 backdrop-blur-md sm:px-[6vw]">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 text-left"
        aria-label={t('brandAria')}
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-navy-light/40">
          <Khatam className="h-[18px] w-[18px] text-gold-bright" />
        </div>
        <div className="hidden sm:block">
          <span className="block font-display text-lg leading-tight text-cream">
            {t('brandName')}
          </span>
          <small className="eyebrow block text-[8.5px] tracking-[0.22em] text-gold-bright">
            {t('orgName')}
          </small>
        </div>
        <span className="sm:hidden font-display text-base leading-tight text-cream">{t('brandName')}</span>
      </Link>

      <div className="flex items-center gap-2">
        <nav className="flex items-center overflow-x-auto no-scrollbar" aria-label="Primary">
          <ul className="flex items-center gap-0.5 rounded-full border border-gold/20 bg-navy-light/30 p-0.5 backdrop-blur-sm">
            {NAV_HREFS.map((href, i) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'font-ui inline-block rounded-full px-3 py-1.5 text-[13px] tracking-wide transition-all whitespace-nowrap',
                    isActive(href)
                      ? 'bg-gold text-ink shadow-sm'
                      : 'text-cream/80 hover:text-cream'
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
          className="flex h-8 items-center gap-1 rounded-full border border-gold/25 bg-navy-light/40 px-2.5 font-ui text-[10px] font-semibold tracking-wide hover:bg-gold/10 hover:border-gold/40 transition-colors shrink-0"
          aria-label="Switch language"
          title={locale === 'en' ? 'العربية' : 'English'}
        >
          <Languages className="h-3.5 w-3.5 text-gold hidden sm:block" />
          <span className={cn(locale === 'en' && 'text-gold')}>EN</span>
          <span className="h-3 w-px bg-gold/15" />
          <span className={cn(locale === 'ar' && 'text-gold')}>AR</span>
        </button>
      </div>
    </header>
  );
}
