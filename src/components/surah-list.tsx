'use client';

import { Play, Pause, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudioStore } from '@/lib/audio-store';
import type { Surah } from '@/lib/quran-types';

export default function SurahList() {
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
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm font-medium">No surahs found</p>
        <p className="text-xs mt-1">Try a different search</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="divide-y divide-border">
        {surahs.map((surah) => {
          const isCurrentSurah = currentSurah?.number === surah.number;
          return (
            <div
              key={surah.number}
              onClick={() => handleSurahClick(surah)}
              className={`flex items-center gap-3 py-3 cursor-pointer active:bg-muted/50 transition-colors ${
                isCurrentSurah ? 'bg-primary/5' : ''
              }`}
            >
              {/* Surah number */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                isCurrentSurah && isPlaying
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              }`}>
                {surah.number}
              </div>

              {/* Surah info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{surah.englishName}</p>
                  <Badge
                    variant="outline"
                    className={`text-[8px] px-1 py-0 rounded-md shrink-0 ${
                      surah.revelationType === 'Meccan'
                        ? 'border-primary/20 text-primary'
                        : 'border-secondary/20 text-secondary'
                    }`}
                  >
                    {surah.revelationType === 'Meccan' ? 'M' : 'Md'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'var(--font-arabic), serif' }}>
                    {surah.arabicName}
                  </p>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <p className="text-[10px] text-muted-foreground">{surah.ayahCount}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    openReadingModal(surah);
                  }}
                  className="w-8 h-8 text-muted-foreground"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handlePlay(surah, e)}
                  className={`w-10 h-10 rounded-xl ${
                    isCurrentSurah && isPlaying
                      ? 'bg-primary text-primary-foreground'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  {isCurrentSurah && isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>

                {isCurrentSurah && isPlaying && (
                  <div className="flex items-center gap-0.5 ml-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="audio-bar w-0.5 bg-primary rounded-full" style={{ height: '3px', animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
