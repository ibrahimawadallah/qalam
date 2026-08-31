import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Khatam from '@/components/khatam';

const FOOT_HREFS = ['/quran', '/azkar', '/prayer-times', '/about'];
const FOOT_LABEL_KEYS = ['quran', 'azkar', 'prayerTimes', 'about'];

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="relative bg-night px-6 pb-10 pt-16 text-center text-cream/70 overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-40" aria-hidden="true" />
      <div className="relative z-10">
        <div className="divider-star mx-auto mb-6 max-w-[120px] text-gold">
          <Khatam className="h-4 w-4" />
        </div>
        <p className="font-ui mx-auto mb-6 max-w-[560px] text-xs leading-relaxed text-cream/60">
          {t('authority')}
        </p>
        <div className="font-ui mb-6 flex flex-wrap justify-center gap-6 text-xs">
          {FOOT_HREFS.map((href, i) => (
            <Link
              key={href}
              href={href}
              className="text-cream/70 transition-colors hover:text-gold-bright"
            >
              {t(FOOT_LABEL_KEYS[i])}
            </Link>
          ))}
        </div>
        <p className="font-ui text-[11px] text-cream/40">
          {t('copyright', { year: String(new Date().getFullYear()) })}
        </p>
      </div>
    </footer>
  );
}
