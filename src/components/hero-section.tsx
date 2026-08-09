'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, BookOpen, Mic } from 'lucide-react';
import { useAudioStore } from '@/lib/audio-store';
import { RECITERS, getStationsByCategory } from '@/lib/quran-data';

export default function HeroSection() {
  const { currentReciter, toggleReciterPanel, setRadioMode, isRadioMode, currentRadioId, toggleRadioPanel } = useAudioStore();
  const quranStations = getStationsByCategory('quran');
  const ruqyahStations = getStationsByCategory('ruqyah');
  const hisnStations = getStationsByCategory('hisn_muslim');
  const quranFirst = quranStations[0] ?? null;
  const ruqyahFirst = ruqyahStations[0] ?? null;
  const hisnFirst = hisnStations[0] ?? null;

  const reciterInfo = RECITERS.find((r) => r.id === currentReciter);

  return (
    <section className="relative overflow-hidden bg-card border-b border-border">
      <div className="px-4 pt-14 pb-4 max-w-lg mx-auto">
        {/* Title */}
        <div className="mb-4">
          <h1
            className="text-2xl font-bold text-primary mb-0.5"
            style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif' }}
          >
            القرآن الكريم
          </h1>
          <p className="text-xs text-muted-foreground">The Recited Mushaf</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span><span className="text-primary font-semibold">114</span> Surahs</span>
          <span className="text-border">·</span>
          <span><span className="text-primary font-semibold">6,236</span> Ayahs</span>
          <span className="text-border">·</span>
          <span><span className="text-primary font-semibold">30</span> Juz</span>
        </div>

        {/* Quick actions row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleReciterPanel}
            className="border-border bg-background text-foreground gap-2 shrink-0 rounded-xl"
          >
            <Mic className="w-3.5 h-3.5" />
            {reciterInfo?.name ?? 'Select Reciter'}
          </Button>

          {quranFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isRadioMode && currentRadioId === quranFirst.id) { toggleRadioPanel(); return; }
                setRadioMode(quranFirst);
              }}
              className={`gap-2 shrink-0 rounded-xl ${
                isRadioMode && currentRadioId === quranFirst.id
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032-.441-.046-.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              إذاعة القرآن
            </Button>
          )}

          {ruqyahFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isRadioMode && currentRadioId === ruqyahFirst.id) { toggleRadioPanel(); return; }
                setRadioMode(ruqyahFirst);
              }}
              className={`gap-2 shrink-0 rounded-xl ${
                isRadioMode && currentRadioId === ruqyahFirst.id
                  ? "border-secondary/40 bg-secondary/15 text-secondary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              الرقية الشرعية
            </Button>
          )}

          {hisnFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isRadioMode && currentRadioId === hisnFirst.id) { toggleRadioPanel(); return; }
                setRadioMode(hisnFirst);
              }}
              className={`gap-2 shrink-0 rounded-xl ${
                isRadioMode && currentRadioId === hisnFirst.id
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              حصن المسلم
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRadioPanel}
            className="text-muted-foreground shrink-0 rounded-xl text-[11px]"
          >
            All Stations
          </Button>
        </div>
      </div>
    </section>
  );
}
