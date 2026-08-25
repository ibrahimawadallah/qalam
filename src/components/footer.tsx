import Link from 'next/link';
import Khatam from '@/components/khatam';

const FOOT_LINKS = [
  { href: '/quran', label: 'Quran' },
  { href: '/azkar', label: 'Azkar' },
  { href: '/prayer-times', label: 'Prayer Times' },
  { href: '/about', label: 'About' },
];

export default function Footer() {
  return (
    <footer className="bg-night px-6 pb-8 pt-14 text-center text-ivory-dim">
      <Khatam className="mb-4 inline-block h-5 w-5 text-gold" />
      <p className="font-ui mx-auto mb-5 max-w-[560px] text-xs leading-relaxed text-[#8FA79A]">
        Under the authority of MedTechAI Arab Organization — a registered organization dedicated
        to leveraging technology for the service of Islam and the Muslim Ummah.
      </p>
      <div className="font-ui mb-5 flex flex-wrap justify-center gap-6 text-xs">
        {FOOT_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-ivory-dim transition-colors hover:text-gold-bright"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <p className="font-ui text-[11px] text-[#5F7A6C]">
        © {new Date().getFullYear()} Quran Kareem — Full Surah Audio &amp; Translations App.
      </p>
    </footer>
  );
}
