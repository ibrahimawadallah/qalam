"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { Play, Pause, Volume2, VolumeX, X, Loader2, Signal, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const CATEGORY_BADGE: Record<string, { cls: string }> = {
  quran: { cls: "border-gold/40 text-gold-bright" },
  ruqyah: { cls: "border-[#e07a6a]/50 text-[#eda092]" },
  hisn_muslim: { cls: "border-gold/40 text-gold-bright" },
};

function CairoClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      try {
        setTime(
          new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: timezone,
          }).format(new Date())
        );
      } catch {
        setTime("--:--:--");
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <span className="tabular-nums text-gold-bright/70 font-ui text-xs" title={timezone}>
      {time}
    </span>
  );
}

export default function RadioPlayer() {
  const t = useTranslations('radioPlayer');
  const audioRef = useRef<HTMLAudioElement>(null);
  const userGestureRef = useRef(false);
  const pendingPlayRef = useRef<(() => void) | null>(null);
  const fallbackIndexRef = useRef(0);

  const {
    isRadioMode,
    currentRadio,
    isRadioPlaying,
    setRadioMode,
    stopRadio,
    cycleRadioStation,
    toggleRadioPanel,
  } = useAudioStore();

  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isPlayingRef = useRef(isRadioPlaying);
  isPlayingRef.current = isRadioPlaying;

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'quran': return t('categoryQuran');
      case 'ruqyah': return t('categoryRuqyah');
      case 'hisn_muslim': return t('categoryHisn');
      default: return cat;
    }
  };

  const stopReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopReconnect();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [stopReconnect]);

  const resolveCurrentUrl = useCallback(() => {
    if (!currentRadio) return null;
    const urls = [currentRadio.streamUrl];
    if (currentRadio.fallbackUrls) {
      urls.push(...currentRadio.fallbackUrls);
    }
    const idx = Math.min(fallbackIndexRef.current, urls.length - 1);
    return { url: urls[idx], urls };
  }, [currentRadio]);

  const attemptPlayStream = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsConnecting(true);
    setHasError(false);
    audio.src = url;
    audio.load();
    const tryPlay = () => {
      audio.play().then(() => {
        setIsConnecting(false);
      }).catch(() => {
        setIsConnecting(false);
      });
    };
    if (userGestureRef.current) {
      tryPlay();
      userGestureRef.current = false;
    } else {
      pendingPlayRef.current = tryPlay;
    }
  }, []);

  const consumePendingPlay = useCallback(() => {
    if (pendingPlayRef.current) {
      const fn = pendingPlayRef.current;
      pendingPlayRef.current = null;
      fn();
    }
  }, []);

  const handleUserInteraction = useCallback(() => {
    userGestureRef.current = true;
    consumePendingPlay();
  }, [consumePendingPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    stopReconnect();
    reconnectCountRef.current = 0;
    fallbackIndexRef.current = 0;

    if (isRadioPlaying) {
      const resolved = resolveCurrentUrl();
      if (resolved) {
        attemptPlayStream(resolved.url);
      }
    } else {
      audio.pause();
      audio.src = "";
    }

    return () => {
      audio.pause();
    };
  }, [currentRadio, isRadioPlaying, attemptPlayStream, stopReconnect, resolveCurrentUrl]);

  const onCanPlay = useCallback(() => {
    setIsConnecting(false);
    setHasError(false);
    const audio = audioRef.current;
    if (audio && isPlayingRef.current) {
      audio.play().catch(() => {});
    }
  }, []);

  const onWaiting = useCallback(() => {
    setIsConnecting(true);
  }, []);

  const onPlaying = useCallback(() => {
    setIsConnecting(false);
    setHasError(false);
  }, []);

  const onErrorEvt = useCallback(() => {
    setIsConnecting(false);
    setHasError(true);
    stopReconnect();
    reconnectCountRef.current += 1;

    const resolved = resolveCurrentUrl();
    if (!resolved) return;

    const nextIndex = fallbackIndexRef.current + 1;
    if (nextIndex < resolved.urls.length) {
      fallbackIndexRef.current = nextIndex;
      const nextUrl = resolved.urls[nextIndex];
      setTimeout(() => {
        if (!isPlayingRef.current || !currentRadio) return;
        attemptPlayStream(nextUrl);
      }, 500);
      return;
    }

    const maxRetries = 4;
    if (reconnectCountRef.current <= maxRetries && isPlayingRef.current && currentRadio) {
      const delay = Math.min(1000 * Math.pow(1.8, reconnectCountRef.current - 1), 20000);
      reconnectTimerRef.current = setTimeout(() => {
        if (!isPlayingRef.current) return;
        const retryUrl = resolved.urls[fallbackIndexRef.current];
        attemptPlayStream(retryUrl);
      }, delay);
    }
  }, [currentRadio, attemptPlayStream, stopReconnect, resolveCurrentUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => handleUserInteraction();
    audio.addEventListener("play", onPlay);
    return () => audio.removeEventListener("play", onPlay);
  }, [handleUserInteraction]);

  useEffect(() => {
    const onInteract = () => handleUserInteraction();
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [handleUserInteraction]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    useAudioStore.setState((s) => ({
      isRadioPlaying: !s.isRadioPlaying,
      isPlayerVisible: true,
    }));
  }, []);

  const handleClose = useCallback(() => {
    stopRadio();
  }, [stopRadio]);

  if (!isRadioMode || !currentRadio) return null;

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onCanPlay={onCanPlay}
        onWaiting={onWaiting}
        onPlaying={onPlaying}
        onError={onErrorEvt}
      />

      <div
        className="player-bar fixed bottom-0 left-0 right-0 z-50 border-t border-gold/40 text-ivory pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <Signal className={`w-5 h-5 ${isConnecting ? "text-gold/60" : "text-gold-bright"}`} />
              {isConnecting && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="eyebrow text-[10px] text-gold-bright shrink-0">
                  {t('live')}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 ${
                    CATEGORY_BADGE[currentRadio.category]?.cls ?? "border-gold/40 text-gold-bright"
                  }`}
                >
                  {getCategoryLabel(currentRadio.category)}
                </Badge>
                <span className="font-display text-sm sm:text-base text-ivory truncate" dir="rtl">
                  {currentRadio.arabicName}
                </span>
                <span className="font-ui text-[11px] text-ivory-dim hidden sm:inline truncate">
                  — {currentRadio.name}
                </span>
              </div>
              {currentRadio.reciterArabicName && (
                <p className="arabic-name text-[11px] text-ivory-dim mt-0.5">{currentRadio.reciterArabicName}</p>
              )}
              <div className="flex items-center gap-2 font-ui text-[11px] text-ivory-dim mt-0.5">
                <span>{currentRadio.location}</span>
                {currentRadio.location && <span>•</span>}
                {currentRadio.isLive !== false && (
                  <CairoClock timezone={currentRadio.timezone} />
                )}
                {currentRadio.isLive !== false && hasError && (
                  <span className="text-[#f0a08e] ml-2">
                    {reconnectCountRef.current > 0
                      ? t.rich('reconnecting', { n: reconnectCountRef.current })
                      : t('connectionLost')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {currentRadio.isLive !== false && (
              <>
                <button
                  onClick={() => cycleRadioStation(-1)}
                  className="hidden sm:flex p-1 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95"
                  aria-label={t('previousStation')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => cycleRadioStation(1)}
                  className="hidden sm:flex p-1 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95"
                  aria-label={t('nextStation')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={togglePlay}
              className={`p-3 sm:p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                isRadioPlaying && !hasError
                  ? "bg-gold text-ink hover:bg-gold-bright shadow-lg"
                  : "bg-gold/15 text-gold-bright hover:bg-gold/25"
              }`}
               aria-label={isRadioPlaying ? t('pause') : t('play')}
             >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRadioPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-ivory-dim hover:text-gold-bright transition-colors p-1 rounded-full hover:bg-white/5"
                 aria-label={isMuted ? t('unmute') : t('mute')}
               >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <div className="w-16">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(val) => {
                    setVolume(val[0]);
                    if (val[0] > 0) setIsMuted(false);
                  }}
                  className="cursor-pointer [&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-track]]:bg-white/15"
                />
              </div>
            </div>

            {currentRadio.isLive !== false && (
              <button
                 onClick={toggleRadioPanel}
                 className="p-2.5 sm:p-1.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                 aria-label={t('browseStations')}
               >
                <List className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            )}
            <button
               onClick={handleClose}
               className="p-2.5 sm:p-1.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
               aria-label={t('closeRadio')}
             >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
