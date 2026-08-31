"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Shuffle,
  Repeat,
  Download,
  ChevronUp,
  ChevronDown,
  GripHorizontal,
} from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import Khatam from "@/components/khatam";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AyahTiming {
  timestamp: number;
  ayahKey: string;
  audioUrl: string;
  duration: number;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const touchStartX = useRef(0);
  const isSeekingRef = useRef(false);

  const ayahTimingsRef = useRef<AyahTiming[]>([]);
  const totalDurationRef = useRef(0);
  const fullUrlRef = useRef("");
  const lastAyahRef = useRef(0);

  const {
    isPlayerVisible,
    hidePlayer,
    isPlaying,
    setIsPlaying,
    currentSurah,
    nextSurah,
    prevSurah,
    togglePlay,
    currentReciter,
    setIsBuffering,
    isBuffering,
    audioError,
    setAudioError,
    currentAyahInSurah,
    setCurrentAyah,
    playbackSpeed,
    setPlaybackSpeed,
    saveBookmark,
    loadBookmark,
    clearBookmark,
    toggleShuffleMode,
    toggleRepeatOne,
    shuffleMode,
    repeatOne,
  } = useAudioStore();

  const t = useTranslations("audioPlayer");

  const [displayTime, setDisplayTime] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [ayahProgress, setAyahProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  const fullAudioUrl = useCallback(
    (surahNum: number, reciterId: string) =>
      `/api/audio-stream?reciter=${encodeURIComponent(reciterId)}&surah=${surahNum}`,
    []
  );

  const findAyahForTime = useCallback((ct: number): number => {
    const timings = ayahTimingsRef.current;
    if (!timings.length) return 0;
    let cumulative = 0;
    for (let i = 0; i < timings.length; i++) {
      if (ct < cumulative + timings[i].duration) return i;
      cumulative += timings[i].duration;
    }
    return timings.length - 1;
  }, []);

  // ------------------------------------------------------------------
  // Load surah + timing data
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!currentSurah || !currentReciter) return;

    const controller = new AbortController();
    const url = fullAudioUrl(currentSurah.number, currentReciter);
    fullUrlRef.current = url;

    // Reset state
    ayahTimingsRef.current = [];
    totalDurationRef.current = 0;
    lastAyahRef.current = 0;
    setDisplayTime(0);
    setDisplayDuration(0);
    setAyahProgress(0);
    setAudioError(null);
    setIsBuffering(true);
    setPendingPlay(false);

    const audio = audioRef.current;
    if (audio) {
      audio.src = url;
      audio.load();
    }

    fetch(`/api/timing/${currentSurah.number}?reciter=${currentReciter}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted || !data?.timings?.length) return;
        ayahTimingsRef.current = data.timings;
        totalDurationRef.current = data.timings.reduce(
          (s: number, t: AyahTiming) => s + t.duration,
          0
        );
        setDisplayDuration(totalDurationRef.current);
        if (isPlaying) {
          setPendingPlay(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAudioError(t("loadError"));
          setIsBuffering(false);
        }
      });

    return () => controller.abort();
  }, [currentSurah, currentReciter, fullAudioUrl, isPlaying, setAudioError, setIsBuffering, t]);

  // ------------------------------------------------------------------
  // Play / pause sync
  // ------------------------------------------------------------------

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !fullUrlRef.current) return;

    if (isPlaying) {
      audio.play().then(() => setPendingPlay(false)).catch(() => {
        if (fullUrlRef.current && audio.src !== fullUrlRef.current) {
          audio.src = fullUrlRef.current;
          audio.load();
          setPendingPlay(true);
        }
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // ------------------------------------------------------------------
  // Audio events
  // ------------------------------------------------------------------

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlers: Record<string, EventListener> = {
      canplay: () => {
        setIsBuffering(false);
        if (pendingPlay && isPlaying) {
          setPendingPlay(false);
          audio.play().catch(() => {});
        }
      },
      waiting: () => setIsBuffering(true),
      playing: () => {
        setIsBuffering(false);
        setAudioError(null);
      },
      ended: () => {
        if (repeatOne) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          return;
        }
        nextSurah();
      },
      error: () => {
        setIsBuffering(false);
        setAudioError(t("loadError"));
      },
      loadedmetadata: () => {
        if (audio.duration && isFinite(audio.duration)) {
          setDisplayDuration(audio.duration);
          totalDurationRef.current = audio.duration;
        }
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, [nextSurah, setIsBuffering, setAudioError, repeatOne, pendingPlay, isPlaying, t]);

  // ------------------------------------------------------------------
  // RAF — ayah tracking + progress
  // ------------------------------------------------------------------

  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      const timings = ayahTimingsRef.current;
      if (!audio || !timings.length || audio.paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ct = audio.currentTime || 0;
      const idx = findAyahForTime(ct);
      const ayahNum = idx + 1;

      if (ayahNum !== lastAyahRef.current) {
        lastAyahRef.current = ayahNum;
        setCurrentAyah(ayahNum);
      }

      setDisplayTime(ct);

      // Ayah progress
      let cum = 0;
      for (let i = 0; i < idx; i++) cum += timings[i].duration;
      const dur = timings[idx]?.duration || 1;
      setAyahProgress(Math.max(0, Math.min(1, (ct - cum) / dur)));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [findAyahForTime, setCurrentAyah]);

  // ------------------------------------------------------------------
  // Volume / speed
  // ------------------------------------------------------------------

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // ------------------------------------------------------------------
  // Preload next surah
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!isPlaying || !currentSurah || !currentReciter) return;
    const preload = preloadRef.current;
    if (!preload) return;

    const nextNum = currentSurah.number >= 114 ? 1 : currentSurah.number + 1;
    preload.src = fullAudioUrl(nextNum, currentReciter);
    preload.load();
  }, [isPlaying, currentSurah, currentReciter, fullAudioUrl]);

  // ------------------------------------------------------------------
  // Bookmarks
  // ------------------------------------------------------------------

  useEffect(() => {
    if (currentSurah && currentReciter) {
      const key = `${currentSurah.number}-${currentReciter}`;
      setIsBookmarked(loadBookmark(key) != null);
    } else {
      setIsBookmarked(false);
    }
  }, [currentSurah, currentReciter, loadBookmark]);

  // ------------------------------------------------------------------
  // Seek
  // ------------------------------------------------------------------

  const seekTo = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !totalDurationRef.current) return;

      isSeekingRef.current = true;
      audio.currentTime = Math.max(0, Math.min(time, totalDurationRef.current));
      setDisplayTime(audio.currentTime);

      const idx = findAyahForTime(audio.currentTime);
      lastAyahRef.current = idx + 1;
      setCurrentAyah(idx + 1);

      if (isPlaying) audio.play().catch(() => {});

      setTimeout(() => { isSeekingRef.current = false; }, 250);
    },
    [isPlaying, findAyahForTime, setCurrentAyah]
  );

  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      if (!bar || !totalDurationRef.current) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekTo(ratio * totalDurationRef.current);
    },
    [seekTo]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleProgressInteraction(e.clientX);
    },
    [handleProgressInteraction]
  );

  const handleProgressPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      handleProgressInteraction(e.clientX);
    },
    [handleProgressInteraction]
  );

  // ------------------------------------------------------------------
  // Retry
  // ------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    if (!currentSurah || !currentReciter) return;
    setAudioError(null);
    setIsBuffering(true);
    lastAyahRef.current = 0;
    setCurrentAyah(1);
    setDisplayTime(0);
    setAyahProgress(0);
    setPendingPlay(true);

    const url = fullAudioUrl(currentSurah.number, currentReciter);
    fullUrlRef.current = url;

    const audio = audioRef.current;
    if (audio) {
      audio.src = url;
      audio.load();
    }
  }, [currentSurah, currentReciter, fullAudioUrl, setAudioError, setIsBuffering, setCurrentAyah]);

  // ------------------------------------------------------------------
  // Touch swipe
  // ------------------------------------------------------------------

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 60) {
      dx > 0 ? nextSurah() : prevSurah();
    }
  };

  // ------------------------------------------------------------------
  // Keyboard
  // ------------------------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isPlayerVisible || !currentSurah) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekTo(Math.max(0, (audioRef.current?.currentTime || 0) - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekTo(Math.min(totalDurationRef.current, (audioRef.current?.currentTime || 0) + 10));
          break;
        case "Escape":
          e.preventDefault();
          hidePlayer();
          break;
        case "KeyN":
          e.preventDefault();
          nextSurah();
          break;
        case "KeyP":
          e.preventDefault();
          prevSurah();
          break;
        case "KeyB":
          e.preventDefault();
          if (currentSurah && currentReciter) {
            const key = `${currentSurah.number}-${currentReciter}`;
            if (isBookmarked) {
              clearBookmark(key);
              setIsBookmarked(false);
            } else {
              saveBookmark(key, audioRef.current?.currentTime || 0);
              setIsBookmarked(true);
            }
          }
          break;
        case "Digit1": setPlaybackSpeed(0.5); break;
        case "Digit2": setPlaybackSpeed(1.0); break;
        case "Digit3": setPlaybackSpeed(1.25); break;
        case "Digit4": setPlaybackSpeed(1.5); break;
        case "Digit5": setPlaybackSpeed(2.0); break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlayerVisible, currentSurah, currentReciter, togglePlay, hidePlayer, seekTo, nextSurah, prevSurah, isBookmarked, saveBookmark, clearBookmark, setPlaybackSpeed]);

  // ------------------------------------------------------------------
  // Render guard
  // ------------------------------------------------------------------

  if (!isPlayerVisible || !currentSurah) return null;

  const progressPct = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  // ------------------------------------------------------------------
  // JSX
  // ------------------------------------------------------------------

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <audio ref={preloadRef} preload="none" className="hidden" />

      <div
        className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Error banner */}
        {audioError && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-red-950/80 border-b border-red-500/30 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-ui text-sm text-red-200">{audioError}</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-200 rounded-full hover:bg-red-500/30 transition-colors font-ui text-sm min-h-[44px] touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              {t("retry")}
            </button>
          </div>
        )}

        {/* Mini player — always visible */}
        <div
          className="bg-ink/95 border-t border-gold/30 backdrop-blur-md"
          onClick={() => !expanded && setExpanded(true)}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <GripHorizontal className="w-5 h-5 text-gold/40" />
          </div>

          {/* Progress bar — tall on mobile for easy seeking */}
          <div className="px-0 sm:px-2">
            <div className="relative h-1.5 sm:h-1 bg-white/10 cursor-pointer touch-manipulation"
              onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
              onPointerDown={(e) => { e.stopPropagation(); handleProgressPointer(e); }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-gold rounded-r-full"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-gold-bright rounded-full shadow-lg opacity-0 sm:opacity-100 transition-opacity"
                style={{ left: `${progressPct}%`, marginLeft: "-7px" }}
              />
            </div>
          </div>

          {/* Player content */}
          <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5 sm:py-3">
            {/* Surah info + artwork */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl border border-gold/60 bg-gold/10 flex items-center justify-center">
                <Khatam className="w-6 h-6 sm:w-7 sm:h-7 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base sm:text-lg text-cream truncate leading-tight" dir="rtl">
                  {currentSurah.arabicName}
                </p>
                <p className="font-ui text-[11px] sm:text-xs text-gold-bright/80 truncate mt-0.5">
                  {currentSurah.englishName} · {currentSurah.ayahCount} Ayat
                  {currentAyahInSurah > 0 && (
                    <span className="ml-1 text-cream/70">· {currentAyahInSurah}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Main controls — always visible */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Play / Pause — large on mobile */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className={`w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-95 touch-manipulation ${
                  isPlaying
                    ? "bg-gold text-ink shadow-lg"
                    : "bg-gold text-ink shadow-lg"
                }`}
                aria-label={isPlaying ? t("pause") : t("play")}
              >
                {isBuffering ? (
                  <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-4 sm:h-4" />
                ) : (
                  <Play className="w-5 h-5 sm:w-4 sm:h-4 ml-0.5" />
                )}
              </button>

              {/* Skip prev/next — hidden on small mobile, shown on sm+ */}
              <button
                onClick={(e) => { e.stopPropagation(); prevSurah(); }}
                className="hidden sm:flex p-2.5 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                aria-label={t("previousSurah")}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); nextSurah(); }}
                className="hidden sm:flex p-2.5 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                aria-label={t("nextSurah")}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Shuffle / Repeat — shown on desktop, also in mobile expanded panel */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleShuffleMode(); }}
                className={`hidden sm:flex p-2.5 rounded-full transition-colors active:scale-95 touch-manipulation ${
                  shuffleMode ? "text-gold-bright bg-gold/15" : "text-cream/70 hover:text-gold-bright hover:bg-white/5"
                }`}
                aria-label={t("shuffle")}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); toggleRepeatOne(); }}
                className={`hidden sm:flex p-2.5 rounded-full transition-colors active:scale-95 touch-manipulation ${
                  repeatOne ? "text-gold-bright bg-gold/15" : "text-cream/70 hover:text-gold-bright hover:bg-white/5"
                }`}
                aria-label={t("repeatOne")}
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Expand button — mobile only */}
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="flex sm:hidden p-2 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                aria-label={expanded ? t("closePlayer") : t("showMore")}
              >
                {expanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded controls panel */}
          {expanded && (
            <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-gold/10 space-y-4">
              {/* Row 1: prev/next + repeat/shuffle (mobile) */}
              <div className="flex items-center justify-center gap-4 sm:hidden">
                <button
                  onClick={prevSurah}
                  className="p-3 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                  aria-label={t("previousSurah")}
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleShuffleMode}
                  className={`p-3 rounded-full transition-colors active:scale-95 touch-manipulation ${
                    shuffleMode ? "text-gold-bright bg-gold/15" : "text-cream/70 hover:text-gold-bright hover:bg-white/5"
                  }`}
                  aria-label={t("shuffle")}
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleRepeatOne}
                  className={`p-3 rounded-full transition-colors active:scale-95 touch-manipulation ${
                    repeatOne ? "text-gold-bright bg-gold/15" : "text-cream/70 hover:text-gold-bright hover:bg-white/5"
                  }`}
                  aria-label={t("repeatOne")}
                >
                  <Repeat className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSurah}
                  className="p-3 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                  aria-label={t("nextSurah")}
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Row 2: Time display (mobile) */}
              <div className="flex items-center justify-between font-ui text-xs text-cream/70 sm:hidden">
                <span className="tabular-nums w-12 text-left">{formatTime(displayTime)}</span>
                <span className="text-gold-bright/60 text-[10px]">Ayah {currentAyahInSurah} / {currentSurah.ayahCount}</span>
                <span className="tabular-nums w-12 text-right">{formatTime(displayDuration)}</span>
              </div>

              {/* Row 3: Volume + speed + extras */}
              <div className="flex items-center justify-between gap-3">
                {/* Volume — left */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                    aria-label={isMuted ? t("unmute") : t("mute")}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className="hidden sm:block w-24">
                    <Slider
                      min={0} max={1} step={0.01}
                      value={[isMuted ? 0 : volume]}
                      onValueChange={(v) => { setVolume(v[0]); if (v[0] > 0) setIsMuted(false); }}
                      className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-track]]:bg-white/15"
                    />
                  </div>
                </div>

                {/* Speed + extras — right */}
                <div className="flex items-center gap-1">
                  <Select
                    value={playbackSpeed.toString()}
                    onValueChange={(v) => setPlaybackSpeed(parseFloat(v))}
                  >
                    <SelectTrigger className="h-8 w-14 font-ui text-xs bg-white/5 border-gold/30 text-cream/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => {
                      if (!currentSurah || !currentReciter) return;
                      const key = `${currentSurah.number}-${currentReciter}`;
                      if (isBookmarked) {
                        clearBookmark(key);
                        setIsBookmarked(false);
                      } else {
                        saveBookmark(key, audioRef.current?.currentTime || 0);
                        setIsBookmarked(true);
                      }
                    }}
                    className={`p-2 rounded-full transition-colors active:scale-95 touch-manipulation ${
                      isBookmarked ? "text-gold hover:text-gold-bright bg-gold/10" : "text-cream/70 hover:text-gold-bright hover:bg-white/5"
                    }`}
                    aria-label={isBookmarked ? t("removeBookmark") : t("bookmark")}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={hidePlayer}
                    className="p-2 text-cream/70 hover:text-gold-bright rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                    aria-label={t("closePlayer")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
