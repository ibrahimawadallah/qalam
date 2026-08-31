'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import SurahList from '@/components/surah-list';
import FilterBar from '@/components/filter-bar';
import SurahReadingModal from '@/components/surah-reading-modal';
import PageHead from '@/components/page-head';
import Khatam from '@/components/khatam';
import { useAudioStore } from '@/lib/audio-store';
import { SURAH_DATA } from '@/lib/quran-data';
import { Play, Pause } from 'lucide-react';

export default function QuranPage() {
  const t = useTranslations('quran');
  const { isPlayerVisible, currentSurah, isPlaying, playSurah, pauseAudio, toggleReciterPanel, reciter, openReadingModal, revelationFilter, setRevelationFilter, meccanCount, medinanCount } = useAudioStore();
  const [recentSurahs, setRecentSurahs] = useState<number[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSurahs');
      if (saved) setRecentSurahs(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (currentSurah) {
      setRecentSurahs(prev => {
        const next = [currentSurah.number, ...prev.filter(n => n !== currentSurah.number)].slice(0, 10);
        try { localStorage.setItem('recentSurahs', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, [currentSurah]);

  /* Deep link support: /quran?surah=N opens the reading modal */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const num = parseInt(params.get('surah') || '', 10);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      const surah = SURAH_DATA.find(s => s.number === num);
      if (surah) openReadingModal(surah);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentSurahData = recentSurahs
    .map(n => SURAH_DATA.find(s => s.number === n))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>

      {/* Floating search panel */}
      <div className="relative z-10 mx-auto -mt-5 max-w-[920px] px-5 sm:-mt-7 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <FilterBar />
          </div>
          <button
            onClick={toggleReciterPanel}
            className="font-ui flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-sm border border-gold bg-parchment px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-navy shadow-[var(--shadow-deep)] transition-colors hover:bg-gold/10"
            aria-label="Choose reciter"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
            </svg>
            <span className="hidden sm:inline">{reciter?.name ?? t('reciters')}</span>
            <span className="sm:hidden">{t('reciters')}</span>
          </button>
        </div>
      </div>

      {/* Continue Listening carousel */}
      {recentSurahData.length > 0 && (
        <div className="mx-auto mt-6 sm:mt-8 max-w-[920px] px-5 sm:px-6">
          <p className="eyebrow mb-2 sm:mb-3 text-crimson">
            <Khatam className="mr-1 inline-block h-2.5 w-2.5 sm:h-[11px] sm:w-[11px]" />
            {t('continueListening')}
          </p>
          <div className="no-scrollbar flex gap-2 sm:gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {recentSurahData.map((surah) => {
              if (!surah) return null;
              const isActive = currentSurah?.number === surah.number;
              return (
                <div
                  key={surah.number}
                  className={`warm-card-hover w-[140px] sm:w-40 shrink-0 cursor-pointer rounded-sm p-2.5 sm:p-3 ${
                    isActive ? 'playing-highlight' : ''
                  }`}
                  style={{ scrollSnapAlign: 'start' }}
                  onClick={() => {
                    if (isActive && isPlaying) {
                      pauseAudio();
                    } else {
                      playSurah(surah);
                    }
                  }}
                >
                  <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border font-display text-[10px] sm:text-xs ${
                        isActive && isPlaying
                          ? 'border-gold bg-gold text-ink'
                          : 'border-crimson text-crimson'
                      }`}
                    >
                      {surah.number}
                    </span>
                    <p className="min-w-0 flex-1 truncate font-display text-xs sm:text-sm text-ink">
                      {surah.englishName}
                    </p>
                    <span
                      className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full ${
                        isActive ? 'bg-gold text-ink' : 'bg-navy/5 text-navy'
                      }`}
                    >
                      {isActive && isPlaying ? <Pause className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Play className="ml-px h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                    </span>
                  </div>
                  <p className="arabic-name truncate text-sm sm:text-base leading-snug text-navy" dir="rtl">
                    {surah.arabicName}
                  </p>
                  <p className="mt-0.5 sm:mt-1 font-ui text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                    {surah.ayahCount} Ayat · {surah.revelationType === 'Meccan' ? 'Makkan' : 'Madani'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full index */}
      <main className="mx-auto w-full max-w-[920px] px-5 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-navy-light text-[10px] sm:text-xs">{t('allSurahs')}</p>
          <span className="font-ui text-[10px] sm:text-[11px] text-muted-foreground">{t('totalSurahs')}</span>
        </div>
        <div className="no-scrollbar mb-3 sm:mb-4 flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
          {([
            { key: 'All', label: t('allFilter') },
            { key: 'Meccan', label: t.rich('meccanFilter', { count: meccanCount }) },
            { key: 'Medinan', label: t.rich('medinanFilter', { count: medinanCount }) },
          ] as const).map((chip) => (
            <button
              key={chip.key}
              onClick={() => setRevelationFilter(chip.key)}
              className={`shrink-0 rounded-full border px-3 sm:px-4 py-1 sm:py-1.5 font-ui text-[11px] sm:text-xs font-semibold transition-colors ${
                revelationFilter === chip.key
                  ? 'border-gold bg-gold text-ink'
                  : 'border-gold/40 bg-parchment text-navy hover:bg-gold/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <SurahList />
      </main>

      <SurahReadingModal />

      {isPlayerVisible && <div className="h-24" />}
    </div>
  );
}
