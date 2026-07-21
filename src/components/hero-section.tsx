'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, BookOpen } from 'lucide-react';
import { useAudioStore } from '@/lib/audio-store';
import { RECITERS, getStationsByCategory } from '@/lib/quran-data';

export default function HeroSection() {
  const { currentReciter, toggleReciterPanel, setRadioMode, isRadioMode, currentRadioId, toggleRadioPanel } = useAudioStore();
  const quranStations = getStationsByCategory('quran');
  const ruqyahStations = getStationsByCategory('ruqyah');
  const adhkarStations = getStationsByCategory('adhkar');

  const reciterInfo = RECITERS.find((r) => r.id === currentReciter);

  return (
    <section className="hero-gradient relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20">
      {/* Centered amber glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Logo with mushaf image */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30">
            <Image
              src="/logo.jpg"
              alt="Quran Kareem"
              width={48}
              height={48}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span
            className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            Quran Kareem
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight"
          style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
        >
          <span className="bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            Quran Kareem
          </span>
        </h1>

        {/* Basmala */}
        <p className="arabic-name text-2xl sm:text-3xl text-amber-400 basmala-glow mb-6" style={{ direction: 'rtl' }}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 text-sm text-muted-foreground mb-6 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">114</span> Surahs
          </span>
          <span className="text-purple-500/40">·</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">6,236</span> Ayahs
          </span>
          <span className="text-purple-500/40">·</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">30</span> Juz
          </span>
          <span className="text-purple-500/40">·</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">7</span> Manzils
          </span>
        </div>

        {/* Live streaming badge + controls */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Live badge */}
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-400 gap-2 px-3 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            Full Surah Streaming
          </Badge>

          {/* Reciter selector */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleReciterPanel}
            className="border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 hover:text-purple-100 hover:border-purple-500/40 gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            {reciterInfo?.name ?? 'Select Reciter'}
          </Button>

          {/* Radio — Cairo Quran */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isRadioMode && currentRadioId === quranStations[0]?.id) { toggleRadioPanel(); return; }
              setRadioMode(quranStations[0] ?? null);
            }}
            className={`gap-2 ${
              isRadioMode && currentRadioId === quranStations[0]?.id
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                : "border-amber-500/20 bg-amber-500/5 text-amber-300/70 hover:bg-amber-500/15 hover:text-amber-300"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            إذاعة القرآن
          </Button>

          {/* Ruqyah */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isRadioMode && currentRadioId === ruqyahStations[0]?.id) { toggleRadioPanel(); return; }
              setRadioMode(ruqyahStations[0] ?? null);
            }}
            className={`gap-2 ${
              isRadioMode && currentRadioId === ruqyahStations[0]?.id
                ? "border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "border-red-500/20 bg-red-500/5 text-red-300/70 hover:bg-red-500/15 hover:text-red-300"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            الرقية الشرعية
          </Button>

          {/* Adhkar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isRadioMode && currentRadioId === adhkarStations[0]?.id) { toggleRadioPanel(); return; }
              setRadioMode(adhkarStations[0] ?? null);
            }}
            className={`gap-2 ${
              isRadioMode && currentRadioId === adhkarStations[0]?.id
                ? "border-blue-500/50 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                : "border-blue-500/20 bg-blue-500/5 text-blue-300/70 hover:bg-blue-500/15 hover:text-blue-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            الأذكار
          </Button>

          {/* Browse all */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRadioPanel}
            className="border-emerald-500/20 bg-emerald-500/5 text-emerald-300/60 hover:text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/30 gap-1 text-[11px]"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
            All Stations
          </Button>
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0518] to-transparent pointer-events-none" />
    </section>
  );
}
