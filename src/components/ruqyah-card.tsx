"use client";

import { Play, Pause, Shield } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/lib/audio-store";
import type { RadioStation } from "@/lib/quran-types";

export default function ReciterCard({ station }: { station: RadioStation }) {
  const t = useTranslations('ruqyahCard');
  const { isRadioMode, currentRadioId, isRadioPlaying, setRadioMode, stopRadio, cycleRadioStation } = useAudioStore();
  const isActive = isRadioMode && currentRadioId === station.id;

  const handlePlay = () => {
    if (isActive) {
      if (isRadioPlaying) {
        useAudioStore.setState({ isRadioPlaying: false });
      } else {
        useAudioStore.setState({ isRadioPlaying: true, isPlayerVisible: true });
      }
      return;
    }
    setRadioMode(station);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isActive ? "border-primary/30 bg-primary/8 shadow-lg shadow-warm-sm" : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{station.arabicName}</h3>
          {station.reciterArabicName && (
            <p className="text-xs text-muted-foreground mt-0.5">{station.reciterArabicName}</p>
          )}
          <p className="text-[11px] text-muted-foreground/60 mt-1 line-clamp-2">{station.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/50">{station.location}</span>
        <Button
          size="sm"
          onClick={handlePlay}
          className={`gap-1.5 text-xs ${
            isActive && isRadioPlaying
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-warm"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {isActive && isRadioPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
           {isActive && isRadioPlaying ? t('pause') : t('listen')}
         </Button>
      </div>
    </div>
  );
}
