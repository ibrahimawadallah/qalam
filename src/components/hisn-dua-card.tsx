"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Play, Pause } from "lucide-react";
import { useHisnAudio } from "@/components/hisn-audio-context";
import type { Dua } from "@/lib/hisn-muslim-types";

export default function DuaCard({ dua }: { dua: Dua }) {
  const t = useTranslations('hisnDuaCard');

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playingId, setPlayingId } = useHisnAudio();

  const isCurrentlyPlaying = playingId === dua.id;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isCurrentlyPlaying) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isCurrentlyPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setPlayingId(null);
    } else {
      setPlayingId(dua.id);
    }
  };

  const audioSrc = `/api/hisn-audio?url=${encodeURIComponent(dua.audioUrl)}`;

  return (
    <div className={`warm-card rounded-sm p-5 sm:p-7 ${isCurrentlyPlaying ? "playing-highlight" : ""}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          {dua.audioUrl ? (
            <>
              <audio
                ref={audioRef}
                src={audioSrc}
                preload="none"
                onEnded={() => setPlayingId(null)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
              <button
                type="button"
                onClick={togglePlay}
                 aria-label={isPlaying ? t('pauseRecitation') : t('playRecitation')}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                  isPlaying
                    ? "border border-navy bg-navy text-gold-bright"
                    : "border border-navy/25 bg-transparent text-navy hover:bg-navy hover:text-gold-bright"
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="ml-px h-3.5 w-3.5" />
                )}
              </button>
            </>
          ) : (
            <span className="font-ui text-[10px] uppercase tracking-wider text-muted-foreground/50">
              #{dua.id}
            </span>
          )}
          {dua.repeat > 1 && (
            <span className="shrink-0 whitespace-nowrap rounded-full border border-crimson px-2.5 py-1 font-ui text-[10.5px] uppercase tracking-wider text-crimson">
              ×{dua.repeat}
            </span>
          )}
        </div>

        <p
          className="arabic-name mb-1 text-[clamp(19px,2.4vw,23px)] leading-loose text-ink"
          dir="rtl"
        >
          {dua.arabicText}
        </p>

        {(dua.transliteration || dua.englishTranslation) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {dua.transliteration && (
               <div className="rounded-sm border-l-[3px] border-gold bg-muted/40 p-3">
                 <p className="eyebrow mb-1.5 text-[9.5px] tracking-[0.1em] text-crimson">{t('transliteration')}</p>
                <p className="font-serif text-[13px] italic leading-relaxed text-[#4a4433]" dir="ltr">
                  {dua.transliteration}
                </p>
              </div>
            )}
            {dua.englishTranslation && (
               <div className={`rounded-sm border-l-[3px] border-gold bg-muted/40 p-3 ${!dua.transliteration ? "sm:col-span-2" : ""}`}>
                 <p className="eyebrow mb-1.5 text-[9.5px] tracking-[0.1em] text-crimson">{t('translation')}</p>
                <p className="font-serif text-[13.5px] leading-relaxed text-ink" dir="ltr">
                  {dua.englishTranslation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
