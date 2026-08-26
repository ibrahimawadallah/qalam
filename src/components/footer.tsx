import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Khatam from '@/components/khatam';

const FOOT_HREFS = ['/quran', '/azkar', '/prayer-times', '/about'];

const FOOT_LABEL_KEYS = ['quran', 'azkar', 'prayerTimes', 'about'];

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-night px-6 pb-8 pt-14 text-center text-ivory-dim">
      <Khatam className="mb-4 inline-block h-5 w-5 text-gold" />
      <p className="font-ui mx-auto mb-5 max-w-[560px] text-xs leading-relaxed text-[#8FA79A]">
        {t('authority')}
      </p>
      <div className="font-ui mb-5 flex flex-wrap justify-center gap-6 text-xs">
        {FOOT_HREFS.map((href, i) => (
          <Link
            key={href}
            href={href}
            className="text-ivory-dim transition-colors hover:text-gold-bright"
          >
            {t(FOOT_LABEL_KEYS[i])}
          </Link>
        ))}
      </div>
      <p className="font-ui text-[11px] text-[#5F7A6C]">
        {t('copyright', { year: String(new Date().getFullYear()) })}
      </p>
    </footer>
  );
}
