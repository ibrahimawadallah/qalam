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
      <div className="relative z-10 mx-auto -mt-7 max-w-[920px] px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <FilterBar />
          </div>
          <button
            onClick={toggleReciterPanel}
            className="font-ui flex shrink-0 items-center gap-2 rounded-sm border border-gold bg-paper px-4 py-3 text-xs font-semibold text-emerald-deep shadow-[var(--shadow-deep)] transition-colors hover:bg-gold/10"
            aria-label="Choose reciter"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
            </svg>
            <span className="hidden sm:inline">{reciter?.name ?? t('reciters')}</span>
            <span className="sm:hidden">{t('reciters')}</span>
          </button>
        </div>
      </div>

      {/* Continue Listening carousel */}
      {recentSurahData.length > 0 && (
        <div className="mx-auto mt-8 max-w-[920px] px-6">
          <p className="eyebrow mb-3 text-maroon">
            <Khatam className="mr-1 inline-block h-[11px] w-[11px]" />
            {t('continueListening')}
          </p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {recentSurahData.map((surah) => {
              if (!surah) return null;
              const isActive = currentSurah?.number === surah.number;
              return (
                <div
                  key={surah.number}
                  className={`warm-card-hover w-40 shrink-0 cursor-pointer rounded-sm p-3 ${
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
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-xs ${
                        isActive && isPlaying
                          ? 'border-gold bg-gold text-ink'
                          : 'border-maroon text-maroon'
                      }`}
                    >
                      {surah.number}
                    </span>
                    <p className="min-w-0 flex-1 truncate font-display text-sm text-ink">
                      {surah.englishName}
                    </p>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isActive ? 'bg-gold text-ink' : 'bg-emerald-deep/5 text-emerald-deep'
                      }`}
                    >
                      {isActive && isPlaying ? <Pause className="h-3 w-3" /> : <Play className="ml-px h-3 w-3" />}
                    </span>
                  </div>
                  <p className="arabic-name truncate text-base leading-snug text-emerald-deep" dir="rtl">
                    {surah.arabicName}
                  </p>
                  <p className="mt-1 font-ui text-[10px] uppercase tracking-wide text-muted-foreground">
                    {surah.ayahCount} Ayat · {surah.revelationType === 'Meccan' ? 'Makkan' : 'Madani'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full index */}
      <main className="mx-auto w-full max-w-[920px] px-6 pb-28 pt-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-emerald-mid">{t('allSurahs')}</p>
          <span className="font-ui text-[11px] text-muted-foreground">{t('totalSurahs')}</span>
        </div>
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'All', label: t('allFilter') },
            { key: 'Meccan', label: t.rich('meccanFilter', { count: meccanCount }) },
            { key: 'Medinan', label: t.rich('medinanFilter', { count: medinanCount }) },
          ] as const).map((chip) => (
            <button
              key={chip.key}
              onClick={() => setRevelationFilter(chip.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 font-ui text-xs font-semibold transition-colors ${
                revelationFilter === chip.key
                  ? 'border-gold bg-gold text-ink'
                  : 'border-gold/40 bg-paper text-emerald-deep hover:bg-gold/10'
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
