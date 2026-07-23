"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHisnAudio } from "@/components/hisn-audio-context";
import type { Dua } from "@/lib/hisn-muslim-types";

export default function DuaCard({ dua }: { dua: Dua }) {
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
    <div className="rounded-xl border border-amber-500/10 bg-[#0a0518] p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-400/60 mb-1">#{dua.id}</p>
            <p className="arabic-name text-base sm:text-lg text-amber-300 leading-relaxed" style={{ direction: "rtl" }}>
              {dua.arabicText}
            </p>
          </div>
          {dua.audioUrl && (
            <div className="shrink-0">
              <audio 
                ref={audioRef} 
                src={audioSrc} 
                preload="none" 
                onEnded={() => setPlayingId(null)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
              <Button
                type="button"
                size="sm"
                onClick={togglePlay}
                className="gap-1.5 text-xs bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                )}
                {isPlaying ? "Pause" : "Listen"}
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-purple-300/60 mb-1">Transliteration</p>
            <p className="text-xs text-purple-100 leading-relaxed">{dua.transliteration || "—"}</p>
          </div>
          <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-purple-300/60 mb-1">Translation</p>
            <p className="text-xs text-purple-100 leading-relaxed">{dua.englishTranslation || "—"}</p>
          </div>
        </div>
        {dua.repeat > 1 && (
          <p className="text-[11px] text-amber-300/50">Repeat {dua.repeat}x</p>
        )}
      </div>
    </div>
  );
}
