'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Khatam from '@/components/khatam';
import { SURAH_DATA } from '@/lib/quran-data';

const ayahs = [
  {
    arabic: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ',
    english: 'Indeed, this Quran guides to that which is most suitable.',
    surah: 'Surah Al-Isra, 17:9',
  },
  {
    arabic: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
    english: 'And We send down of the Quran that which is a healing and a mercy for those who believe.',
    surah: 'Surah Al-Isra, 17:82',
  },
  {
    arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
    english: 'Allah is the light of the heavens and the earth.',
    surah: 'Surah An-Nur, 24:35',
  },
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    english: 'Indeed, with hardship comes ease.',
    surah: 'Surah Ash-Sharh, 94:6',
  },
];

const TILES = [
  { href: '/quran', title: 'Listen', desc: 'Gapless recitation streaming, surah by surah.' },
  { href: '/search', title: 'Search', desc: 'Find any verse by keyword, name, or number.' },
  { href: '/azkar', title: 'Daily Azkar', desc: 'Morning and evening remembrance, in order.' },
  { href: '/hisn-muslim', title: 'Hisn al-Muslim', desc: 'The Fortress of the Muslim, by occasion.' },
  { href: '/prayer-times', title: 'Prayer Times', desc: 'Accurate times for your location, five times daily.' },
  { href: '/hadiths', title: 'Hadiths', desc: 'Authentic collections, searchable by topic.' },
  { href: '/ruqyah', title: 'Ruqyah', desc: 'Quranic healing and protective supplications.' },
  { href: '/islamic-calendar', title: 'Islamic Calendar', desc: 'Hijri dates and upcoming sacred events.' },
  { href: '/about', title: 'About', desc: 'The mission behind Quran Kareem.' },
];

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto mb-11 max-w-[640px] text-center">
      <p className="eyebrow flex items-center justify-center gap-2.5 text-maroon">
        <Khatam className="h-3 w-3" />
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(26px,3.2vw,38px)]">{title}</h2>
    </div>
  );
}

export default function LandingPage() {
  const [activeAyah, setActiveAyah] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAyah(prev => (prev + 1) % ayahs.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const previewSurahs = SURAH_DATA.slice(0, 8);

  return (
    <main className="min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="hero-bg relative overflow-hidden px-6 pb-[60px] pt-[min(11vw,90px)] text-center text-ivory">
        <div
          className="pointer-events-none absolute left-0 right-0 top-[-30%] mx-auto h-[min(120vw,1400px)] w-[min(120vw,1400px)]"
          aria-hidden="true"
        >
          <Khatam className="star-spin h-full w-full text-gold opacity-[0.16]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[760px]">
          <p className="hero-basmala basmala-glow mb-6" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="verse-block">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAyah}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="hero-ar mb-3" dir="rtl">
                  {ayahs[activeAyah].arabic}
                </p>
                <p className="font-display mx-auto max-w-[480px] text-[clamp(15px,1.9vw,19px)] italic leading-relaxed text-ivory-dim">
                  &ldquo;{ayahs[activeAyah].english}&rdquo;
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="eyebrow mt-3.5 tracking-[0.1em] text-gold">{ayahs[activeAyah].surah}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/quran"
              className="font-ui inline-flex items-center gap-2.5 rounded-sm bg-gold px-[30px] py-3.5 text-[13px] font-semibold tracking-wide text-ink transition-all hover:-translate-y-0.5 hover:bg-gold-bright hover:shadow-[0_10px_30px_rgba(199,161,92,.35)]"
            >
              Listen to the Quran
            </Link>
            <Link
              href="/search"
              className="font-ui inline-flex items-center gap-2.5 rounded-sm border border-ivory/35 px-[30px] py-3.5 text-[13px] font-semibold tracking-wide text-ivory transition-all hover:-translate-y-0.5 hover:border-gold-bright hover:text-gold-bright"
            >
              Search Surahs
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- QUICK ACCESS ---------------- */}
      <section id="quick-access" className="px-6 py-20">
        <SectionHead eyebrow="Begin here" title="Nine ways into the Book" />
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="tile-corners group block w-full border border-gold/25 bg-emerald-deep p-7 pb-6 text-left text-ivory transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-[var(--shadow-deep)]"
            >
              <Khatam className="mb-4 h-6 w-6 text-gold transition-transform duration-300 group-hover:rotate-45" />
              <h3 className="mb-1.5 text-lg leading-snug">{tile.title}</h3>
              <p className="font-ui text-xs leading-relaxed text-ivory-dim">{tile.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- INDEX PREVIEW ---------------- */}
      <section id="index" className="bg-[#F1E9D4] px-6 py-20">
        <SectionHead eyebrow="114 surahs" title="The Index" />
        <div className="mx-auto max-w-[920px]">
          <div className="border-t border-emerald-deep/15">
            {previewSurahs.map((surah) => (
              <Link
                key={surah.number}
                href={`/quran?surah=${surah.number}`}
                className="group grid grid-cols-[36px_1fr_auto_auto] items-center gap-4 border-b border-emerald-deep/10 py-3.5 pr-1 transition-colors hover:bg-gold/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-maroon font-display text-sm text-maroon">
                  {surah.number}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg leading-snug text-ink">
                    {surah.englishName}
                    <span className="ml-2 align-middle font-ui text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      {surah.revelationType === 'Meccan' ? 'Makkan' : 'Madani'}
                    </span>
                  </span>
                </span>
                <span className="arabic-name text-xl leading-none text-emerald-deep" dir="rtl">
                  {surah.arabicName}
                </span>
                <span className="whitespace-nowrap text-right font-ui text-[10.5px] text-[#8a8168]">
                  {surah.ayahCount} ayat
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-9 flex justify-center">
            <Link
              href="/quran"
              className="font-ui inline-flex items-center gap-2.5 rounded-sm bg-emerald-deep px-[30px] py-3.5 text-[13px] font-semibold tracking-wide text-ivory transition-all hover:-translate-y-0.5 hover:bg-emerald-mid hover:shadow-[0_10px_30px_rgba(11,59,44,.35)]"
            >
              View all 114 surahs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
