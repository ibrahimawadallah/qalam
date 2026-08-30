'use client';

import { Play, Pause, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAudioStore } from '@/lib/audio-store';
import type { Surah } from '@/lib/quran-types';

export default function SurahList() {
  const t = useTranslations('surahList');

  const { filteredSurahs, currentSurah, isPlaying, play, togglePlay, openReadingModal } =
    useAudioStore();

  const surahs = filteredSurahs();

  const handlePlay = (surah: Surah, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSurah?.number === surah.number) {
      togglePlay();
    } else {
      play(surah.number);
    }
  };

  const handleSurahClick = (surah: Surah) => {
    openReadingModal(surah);
  };

  if (surahs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-16 text-muted-foreground">
        <svg className="mb-3 h-10 w-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
         <p className="font-ui text-sm font-medium">{t('noSurahsFound')}</p>
         <p className="mt-1 font-ui text-xs">{t('tryDifferentSearch')}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-emerald-deep/15">
      {surahs.map((surah) => {
        const isCurrentSurah = currentSurah?.number === surah.number;
        return (
          <div
            key={surah.number}
            onClick={() => handleSurahClick(surah)}
            className={`grid grid-cols-[36px_1fr_auto] sm:grid-cols-[36px_1fr_auto] items-center gap-2 sm:gap-4 border-b border-emerald-deep/10 px-1 py-2.5 sm:py-3 transition-colors hover:bg-gold/10 cursor-pointer ${
              isCurrentSurah ? 'bg-gold/5' : ''
            }`}
          >
            {/* Number */}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm ${
                isCurrentSurah && isPlaying
                  ? 'border-gold bg-gold text-ink'
                  : 'border-maroon text-maroon'
              }`}
            >
              {surah.number}
            </span>

            {/* Name + Arabic */}
            <div className="min-w-0">
              <p className="truncate font-display text-base sm:text-lg leading-snug text-ink">
                {surah.englishName}
              </p>
              <p className="font-ui text-[10px] sm:text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                {surah.revelationType === 'Meccan' ? 'Makkan' : 'Madani'}
                <span className="hidden sm:inline"> · {surah.ayahCount} {t('ayat')}</span>
              </p>
              <p className="arabic-name text-sm sm:text-xl leading-none text-emerald-deep sm:hidden" dir="rtl">
                {surah.arabicName}
              </p>
            </div>

            {/* Actions — desktop */}
            <div className="hidden sm:flex shrink-0 items-center gap-3">
              <span className="arabic-name text-xl leading-none text-emerald-deep" dir="rtl">
                {surah.arabicName}
              </span>
              <span className="whitespace-nowrap text-right font-ui text-[10.5px] text-[#8a8168]">
                {surah.ayahCount} {t('ayat')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openReadingModal(surah);
                }}
                aria-label={`Read ${surah.englishName}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-deep transition-colors hover:bg-emerald-deep/5 hover:text-maroon"
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handlePlay(surah, e)}
                aria-label={isCurrentSurah && isPlaying ? `Pause ${surah.englishName}` : `Play ${surah.englishName}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  isCurrentSurah && isPlaying
                    ? 'bg-gold text-ink hover:bg-gold-bright'
                    : 'border border-emerald-deep/25 text-emerald-deep hover:border-gold hover:bg-emerald-deep hover:text-gold-bright'
                }`}
              >
                {isCurrentSurah && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>
              {isCurrentSurah && isPlaying && (
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="audio-bar w-0.5 rounded-full bg-gold"
                      style={{ height: '3px', animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </span>
              )}
            </div>

            {/* Actions — mobile (play only) */}
            <div className="flex sm:hidden shrink-0 items-center">
              <button
                onClick={(e) => handlePlay(surah, e)}
                aria-label={isCurrentSurah && isPlaying ? `Pause ${surah.englishName}` : `Play ${surah.englishName}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 touch-manipulation ${
                  isCurrentSurah && isPlaying
                    ? 'bg-gold text-ink'
                    : 'border border-emerald-deep/25 text-emerald-deep active:border-gold active:bg-emerald-deep active:text-gold-bright'
                }`}
              >
                {isCurrentSurah && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>
              {isCurrentSurah && isPlaying && (
                <span className="flex items-center gap-0.5 ml-1.5" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="audio-bar w-0.5 rounded-full bg-gold"
                      style={{ height: '3px', animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
