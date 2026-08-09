'use client';

import { useState, useEffect } from 'react';
import SurahList from '@/components/surah-list';
import FilterBar from '@/components/filter-bar';
import SurahReadingModal from '@/components/surah-reading-modal';
import DrawerNav from '@/components/drawer-nav';
import { useAudioStore } from '@/lib/audio-store';
import { SURAH_DATA } from '@/lib/quran-data';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function QuranPage() {
  const { isPlayerVisible, currentSurah, isPlaying, playSurah, pauseAudio, toggleReciterPanel, reciter } = useAudioStore();
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

  const recentSurahData = recentSurahs
    .map(n => SURAH_DATA.find(s => s.number === n))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="min-h-screen bg-background">
      <DrawerNav />

      {/* Spacer for hamburger */}
      <div className="h-16" />

      {/* Search bar - prominent at top */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <FilterBar />
        </div>
        <button
          onClick={toggleReciterPanel}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors whitespace-nowrap"
          aria-label="Choose reciter"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
          </svg>
          <span className="hidden sm:inline">{reciter?.name ?? 'Reciters'}</span>
          <span className="sm:hidden">Reciters</span>
        </button>
      </div>

      {/* Continue Listening carousel */}
      {recentSurahData.length > 0 && (
        <div className="mb-4">
          <div className="px-4 mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Continue Listening
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
            {recentSurahData.map((surah) => {
              if (!surah) return null;
              const isActive = currentSurah?.number === surah.number;
              return (
                <div
                  key={surah.number}
                  className={`flex-shrink-0 w-40 warm-card rounded-2xl p-3 cursor-pointer scroll-snap-start ${
                    isActive ? 'ring-1 ring-primary/20' : ''
                  }`}
                  onClick={() => {
                    if (isActive && isPlaying) {
                      pauseAudio();
                    } else {
                      playSurah(surah);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {surah.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{surah.englishName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-7 h-7 rounded-full ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {isActive && isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                  </div>
                  <p className="text-sm text-primary truncate" style={{ fontFamily: 'var(--font-arabic), serif' }}>
                    {surah.arabicName}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {surah.ayahCount} Ayahs · {surah.revelationType === 'Meccan' ? 'Meccan' : 'Medinan'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="divider-ornate mx-4 mt-2" />
        </div>
      )}

      {/* All Surahs section header */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          All Surahs
        </h2>
        <span className="text-[10px] text-muted-foreground">114 Surahs</span>
      </div>

      {/* Surah List */}
      <main className="flex-1 w-full pb-24">
        <SurahList />
      </main>

      <SurahReadingModal />

      {isPlayerVisible && <div className="h-20" />}
    </div>
  );
}
