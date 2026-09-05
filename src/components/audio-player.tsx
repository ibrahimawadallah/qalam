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
  ChevronUp,
  ChevronDown,
  GripHorizontal,
} from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import Khatam from "@/components/khatam";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AyahTiming {
  ayahKey?: string;
  number?: number;
  numberInSurah: number;
  duration: number; // seconds
  audioUrl: string | null; // per-ayah stream URL, or null => use full-surah file
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const touchStartX = useRef(0);
  const isSeekingRef = useRef(false);

  // Timing model — expressed in *virtual seconds* that always match playback.
  const timingsRef = useRef<AyahTiming[]>([]);
  const cumStartRef = useRef<number[]>([]);
  const totalDurationRef = useRef(0);
  const modeRef = useRef<"segments" | "full">("segments");
  const fullUrlRef = useRef("");
  const activeIdxRef = useRef(0);
  const pendingStartOffsetRef = useRef<number | null>(null);
  const pendingPlayRef = useRef(false);
  const rescaledRef = useRef(false);
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

  /** Map a virtual time (seconds) onto a surah index and in-segment offset. */
  const indexForVirtualTime = useCallback((vt: number): number => {
    const starts = cumStartRef.current;
    if (!starts.length) return 0;
    let lo = 0;
    let hi = starts.length - 1;
    if (vt >= starts[hi]) return hi;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= vt) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }, []);

  const currentVirtualTime = useCallback((): number => {
    const audio = audioRef.current;
    if (!audio) return 0;
    if (modeRef.current === "segments") {
      const idx = Math.min(activeIdxRef.current, cumStartRef.current.length - 1);
      return cumStartRef.current[idx] + (audio.currentTime || 0);
    }
    return audio.currentTime || 0;
  }, []);

  /** Recompute cumulative start times from timingsRef durations. */
  const rebuildCumulative = useCallback(() => {
    let sum = 0;
    const starts: number[] = [];
    for (const tm of timingsRef.current) {
      starts.push(sum);
      sum += tm.duration;
    }
    cumStartRef.current = starts;
    totalDurationRef.current = sum;
  }, []);

  // ------------------------------------------------------------------
  // Load a timed entry (segment or position inside the full file)
  // ------------------------------------------------------------------

  const loadTimedEntry = useCallback((idx: number, offsetSec: number) => {
    const audio = audioRef.current;
    const timings = timingsRef.current;
    if (!audio || !timings.length) return;

    const safeIdx = Math.max(0, Math.min(idx, timings.length - 1));
    const entry = timings[safeIdx];
    activeIdxRef.current = safeIdx;

    if (!entry.audioUrl || modeRef.current !== "segments") {
      // Fallback: seek inside the full-surah file.
      looseSeekInto(fullUrlRef.current, offsetSec + (cumStartRef.current[safeIdx] || 0));
      return;
    }

    const src = entry.audioUrl;
    const shouldPlay = useAudioStore.getState().isPlaying;
    pendingStartOffsetRef.current = offsetSec;
    pendingPlayRef.current = shouldPlay;

    if (audio.getAttribute("src") !== src) {
      audio.src = src;
      audio.load();
    } else {
      // Already playing the right file — just seek.
      const apply = () => {
        try {
          audio.currentTime = offsetSec;
        } catch {}
        if (pendingPlayRef.current && audio.paused) {
          pendingPlayRef.current = false;
          audio.play().catch(() => {});
        }
      };
      apply();
    }
  }, []);

  /** For full-surah mode: set the element to the full file and seek to `timeSec`. */
  const looseSeekInto = useCallback((src: string, timeSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldPlay = useAudioStore.getState().isPlaying;

    if (audio.getAttribute("src") !== src) {
      audio.src = src;
      pendingStartOffsetRef.current = timeSec;
      pendingPlayRef.current = shouldPlay;
      audio.load();
    } else {
      pendingStartOffsetRef.current = null;
      pendingPlayRef.current = shouldPlay;
      try {
        audio.currentTime = timeSec;
      } catch {}
      if (pendingPlayRef.current && audio.paused) {
        pendingPlayRef.current = false;
        audio.play().catch(() => {});
      }
    }
  }, []);

  /** Preload the segment right after `idx` into the browser cache. */
  const preloadNext = useCallback((idx: number) => {
    const timings = timingsRef.current;
    if (modeRef.current !== "segments" || !timings[idx + 1]?.audioUrl) return;
    const next = timings[idx + 1];
    const audio = audioRef.current;
    if (!audio) return;
    // A lightweight warm-up fetch so the next segment is ready when 'ended' fires.
    fetch(next.audioUrl as string, { method: "HEAD", cache: "force-cache" }).catch(() => {});
  }, []);


  // ------------------------------------------------------------------
  // Load surah + timing data
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!currentSurah || !currentReciter) return;

    const controller = new AbortController();

    // Reset state
    timingsRef.current = [];
    cumStartRef.current = [];
    totalDurationRef.current = 0;
    activeIdxRef.current = 0;
    lastAyahRef.current = 0;
    pendingStartOffsetRef.current = null;
    pendingPlayRef.current = false;
    rescaledRef.current = false;
    setDisplayTime(0);
    setDisplayDuration(0);
    setAyahProgress(0);
    setAudioError(null);
    setIsBuffering(true);

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    fullUrlRef.current = fullAudioUrl(currentSurah.number, currentReciter);

    fetch(`/api/timing/${currentSurah.number}?reciter=${currentReciter}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted || !data?.timings?.length) return;

        timingsRef.current = data.timings as AyahTiming[];
        modeRef.current = data.source === "segments" ? "segments" : "full";
        rebuildCumulative();
        setDisplayDuration(totalDurationRef.current);

        // Auto-start (and resume from a saved bookmark) if the user already
        // hit play while the timing data was loading.
        if (useAudioStore.getState().isPlaying) {
          const key = `${currentSurah.number}-${currentReciter}`;
          const bookmarkTime = loadBookmark(key);
          const startAt = bookmarkTime != null ? bookmarkTime : 0;
          const idx = indexForVirtualTime(startAt);
          const offset = Math.max(0, startAt - cumStartRef.current[idx]);
          pendingPlayRef.current = true;
          loadTimedEntry(idx, offset);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAudioError(t("loadError"));
          setIsBuffering(false);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSurah, currentReciter]);

  // ------------------------------------------------------------------
  // Play / pause sync
  // ------------------------------------------------------------------

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const hasSrc = !!audio.getAttribute("src");
      if (hasSrc) {
        audio.play().then(() => setPendingPlay(false)).catch(() => {
          pendingPlayRef.current = true;
        });
      } else {
        pendingPlayRef.current = true;
      }
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
        const off = pendingStartOffsetRef.current;
        if (off != null) {
          pendingStartOffsetRef.current = null;
          try {
            audio.currentTime = off;
          } catch {}
        }
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          audio.play().catch(() => setPendingPlay(true));
        }
      },
      waiting: () => {
        // Only show the spinner for real initial/seek stalls, not the tiny
        // buffering that happens between per-ayah segments.
        if (!audio.readyState || audio.readyState === 0) {
          setIsBuffering(true);
        }
      },
      playing: () => {
        setIsBuffering(false);
        setPendingPlay(false);
        pendingPlayRef.current = false;
        setAudioError(null);
      },
      ended: () => {
        if (modeRef.current === "segments") {
          if (repeatOne) {
            loadTimedEntry(activeIdxRef.current, 0);
          } else if (activeIdxRef.current < timingsRef.current.length - 1) {
            const nextIdx = activeIdxRef.current + 1;
            loadTimedEntry(nextIdx, 0);
            lastAyahRef.current = timingsRef.current[nextIdx].numberInSurah;
            setCurrentAyah(lastAyahRef.current);
          } else {
            nextSurah();
          }
        } else {
          // Full-file playback reached the end of the surah.
          if (repeatOne) {
            looseSeekInto(fullUrlRef.current, 0);
          } else {
            nextSurah();
          }
        }
      },
      error: () => {
        setIsBuffering(false);
        setAudioError(t("loadError"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextSurah, loadTimedEntry, looseSeekInto, repeatOne, t]);

  // ------------------------------------------------------------------
  // RAF — ayah tracking + progress (virtual time based)
  // ------------------------------------------------------------------

  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      const timings = timingsRef.current;
      if (!audio || !timings.length || audio.paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Rescale full-file timings to the real duration once known.
      if (
        modeRef.current === "full" &&
        !rescaledRef.current &&
        isFinite(audio.duration) &&
        audio.duration > 0 &&
        totalDurationRef.current > 0
      ) {
        const k = audio.duration / totalDurationRef.current;
        if (Math.abs(k - 1) > 0.02) {
          for (const tm of timings) tm.duration *= k;
          rebuildCumulative();
          totalDurationRef.current = audio.duration;
          setDisplayDuration(audio.duration);
        }
        rescaledRef.current = true;
      }

      const vt = currentVirtualTime();
      const idx = indexForVirtualTime(vt);
      const entry = timings[idx];
      if (entry) {
        const ayahNum = entry.numberInSurah;
        if (ayahNum !== lastAyahRef.current) {
          lastAyahRef.current = ayahNum;
          setCurrentAyah(ayahNum);
          if (modeRef.current === "segments") preloadNext(idx);
        }
        setDisplayTime(vt);
        const segDur = entry.duration || 1;
        setAyahProgress(
          Math.max(0, Math.min(1, (vt - cumStartRef.current[idx]) / segDur))
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentVirtualTime, indexForVirtualTime, preloadNext, rebuildCumulative, setCurrentAyah]);

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
  // Seek — virtual time, works anywhere in the surah
  // ------------------------------------------------------------------

  const seekToVirtual = useCallback(
    (timeSec: number) => {
      const audio = audioRef.current;
      if (!audio || !totalDurationRef.current) return;

      isSeekingRef.current = true;
      const clamped = Math.max(0, Math.min(timeSec, totalDurationRef.current));
      setDisplayTime(clamped);

      const idx = indexForVirtualTime(clamped);
      const offset = Math.max(0, clamped - cumStartRef.current[idx]);
      lastAyahRef.current = timingsRef.current[idx].numberInSurah;
      setCurrentAyah(lastAyahRef.current);
      setAyahProgress(
        Math.max(0, Math.min(1, offset / (timingsRef.current[idx].duration || 1)))
      );

      loadTimedEntry(idx, offset);

      setTimeout(() => {
        isSeekingRef.current = false;
      }, 250);
    },
    [indexForVirtualTime, loadTimedEntry, setCurrentAyah]
  );

  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      if (!bar || !totalDurationRef.current) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekToVirtual(ratio * totalDurationRef.current);
    },
    [seekToVirtual]
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
    setCurrentAyah(timingsRef.current[0]?.numberInSurah || 1);
    setDisplayTime(0);
    setAyahProgress(0);
    pendingPlayRef.current = true;
    loadTimedEntry(0, 0);
  }, [currentSurah, currentReciter, loadTimedEntry, setAudioError, setIsBuffering, setCurrentAyah]);

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
          seekToVirtual(Math.max(0, currentVirtualTime() - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekToVirtual(currentVirtualTime() + 10);
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
              saveBookmark(key, currentVirtualTime());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerVisible, currentSurah, currentReciter, togglePlay, hidePlayer, seekToVirtual, currentVirtualTime, nextSurah, prevSurah, isBookmarked, saveBookmark, clearBookmark, setPlaybackSpeed]);

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
                        saveBookmark(key, currentVirtualTime());
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