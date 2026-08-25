"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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
  Image,
  Shuffle,
  Repeat,
  Download,
} from "lucide-react";
import { useAudioStore, setAudioPlayNow } from "@/lib/audio-store";
import { getSurahInfo } from "@/lib/quran-utils";
import { getAyahTimings } from "@/lib/quran-data";
import type { SurahText } from "@/lib/quran-types";
import Khatam from "@/components/khatam";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const urlCache = new Map<string, string>();
const surahTextCache = new Map<number, SurahText>();

// Base (unscaled) ayah timing estimates for a surah/reciter pair.
// `points` are cumulative start times; `total` is the estimated full duration
// they were built against, so the player can rescale them to real audio.
interface TimingsBase {
  points: number[];
  total: number;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function AudioWave({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          style={{
            height: isPlaying ? undefined : "4px",
            animation: isPlaying
              ? `audioWave 0.8s ease-in-out ${i * 0.12}s infinite alternate`
              : "none",
          }}
        />
      ))}
      <style>{`
        @keyframes audioWave {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </div>
  );
}

function getCurrentAyahFromTime(currentTime: number, totalAyahs: number, timings: number[]): number {
  if (!timings || timings.length === 0) return 1;

  for (let i = timings.length - 1; i >= 0; i--) {
    if (currentTime >= timings[i]) {
      return Math.min(i + 1, totalAyahs);
    }
  }

  return 1;
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadAudioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const durationRef = useRef(0);
  const lastAyahRef = useRef(1);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const fetchAudioAbortRef = useRef<AbortController | null>(null);
  const expectedSurahKeyRef = useRef("");

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
    reciter,
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
    selectedTranslations,
    showTranslations,
    setShowTranslations,
    toggleTranslation,
    toggleShuffleMode,
    toggleRepeatOne,
    shuffleMode,
    repeatOne,
    setCurrentReciter,
  } = useAudioStore();

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    setAudioPlayNow((url) => {
      const audio = audioRef.current;
      if (audio) {
        audio.src = url;
        audio.load();
        audio.play().catch(() => {});
      }
    });
    return () => setAudioPlayNow(null);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        nextSurah();
      } else {
        prevSurah();
      }
    }
  };

  const [displayTime, setDisplayTime] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [ayahProgress, setAyahProgress] = useState(0);
  const [audioSrc, setAudioSrc] = useState('');
  const [showSpiritualVideo, setShowSpiritualVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [overlaySurahText, setOverlaySurahText] = useState<SurahText | null>(null);
  const [currentTranslation, setCurrentTranslation] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const ayahTimingsRef = useRef<number[]>([]);
  const timingsBaseRef = useRef<TimingsBase | null>(null);
  const lastScaleDurationRef = useRef(0);
  const currentAyahRef = useRef<any>(null);
  const prevSurahNumberRef = useRef<number | null>(null);
  const prevReciterRef = useRef<string>('');
  const seekToTimeRef = useRef<{ ratio: number } | null>(null);
  const timingsCacheRef = useRef<Map<string, TimingsBase>>(new Map());

  useEffect(() => {
    if (!currentSurah || !currentReciter) return;

    fetchAudioAbortRef.current?.abort();
    const abortController = new AbortController();
    fetchAudioAbortRef.current = abortController;

    const currentSurahNumber = currentSurah.number;
    const cacheKey = `${currentReciter}-${currentSurahNumber}`;

    expectedSurahKeyRef.current = cacheKey;

    const fetchAudioUrl = async () => {
      const cached = urlCache.get(cacheKey);
      if (cached && !abortController.signal.aborted) {
        setAudioSrc(cached);
        return;
      }

      const streamUrl = `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${currentSurahNumber}`;
      urlCache.set(cacheKey, streamUrl);
      if (!abortController.signal.aborted) {
        setAudioSrc(streamUrl);
      }
    };

    fetchAudioUrl();

    return () => {
      abortController.abort();
    };
  }, [currentSurah, currentReciter, setAudioError]);

  const loadAudio = useCallback(
    (url: string, autoPlay: boolean) => {
      const audio = audioRef.current;
      if (!audio || !url) return;

      audio.src = url;
      audio.load();

      if (autoPlay) {
        audio.play().catch(() => {});
      }
    },
    []
  );

  useEffect(() => {
    if (!audioSrc) return;

    const currentCacheKey = currentSurah ? `${currentReciter}-${currentSurah.number}` : "";
    if (expectedSurahKeyRef.current !== currentCacheKey) return;

    const expectedSrc = currentSurah
      ? `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${currentSurah.number}`
      : "";
    if (audioSrc !== expectedSrc) return;

    const isReciterChangeOnly =
      prevSurahNumberRef.current === currentSurah?.number &&
      prevReciterRef.current !== currentReciter &&
      prevReciterRef.current !== '';

    if (isReciterChangeOnly && audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      const ratio = audioRef.current.currentTime / audioRef.current.duration;
      seekToTimeRef.current = { ratio };
    } else {
      timeRef.current = 0;
      seekToTimeRef.current = null;
    }

    durationRef.current = 0;
    lastAyahRef.current = 1;

    setAudioError(null);
    setIsBuffering(true);

    loadAudio(audioSrc, isPlayingRef.current);
  }, [audioSrc, loadAudio, setAudioError, setIsBuffering, currentSurah, currentReciter]);

  // Scale base proportional timings so their total matches the real audio
  // duration. Preserves relative ayah lengths (from per-ayah file-size
  // analysis) instead of assuming every ayah takes equal time.
  const applyScaledTimings = useCallback(
    (duration: number) => {
      const base = timingsBaseRef.current;
      if (!currentSurah || !base || base.points.length === 0) return;
      if (!isFinite(duration) || duration <= 0) return;
      // Same duration as last application -> nothing to do.
      if (Math.abs(duration - lastScaleDurationRef.current) < 0.5) return;

      let scaled = base.points;
      if (base.total > 0 && Math.abs(base.total - duration) / duration > 0.02) {
        const factor = duration / base.total;
        scaled = base.points.map((t) => Math.min(t * factor, duration));
      }

      ayahTimingsRef.current = scaled;
      lastScaleDurationRef.current = duration;
    },
    [currentSurah]
  );

  useEffect(() => {
    if (!currentSurah) return;

    prevSurahNumberRef.current = currentSurah.number;
    prevReciterRef.current = currentReciter;

    const cacheKey = `${currentSurah.number}-${currentReciter}`;

    const activateBase = (base: TimingsBase) => {
      timingsBaseRef.current = base;
      lastScaleDurationRef.current = 0;
      setAyahProgress(0);
      const dur = audioRef.current?.duration;
      if (dur && isFinite(dur)) {
        applyScaledTimings(dur);
      } else {
        ayahTimingsRef.current = base.points;
      }
    };

    const cachedBase = timingsCacheRef.current.get(cacheKey);
    if (cachedBase) {
      activateBase(cachedBase);
      return;
    }

    const fallbackPoints = getAyahTimings(currentSurah.number, currentReciter);
    const fallbackTotal =
      fallbackPoints[fallbackPoints.length - 1] *
      (1 + 1 / Math.max(1, currentSurah.ayahCount));
    activateBase({ points: fallbackPoints, total: fallbackTotal });

    const controller = new AbortController();
    fetch(`/api/timing/${currentSurah.number}?reciter=${currentReciter}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted || !data?.timings?.length) return;
        const points = data.timings.map((t: { timestamp: number }) => t.timestamp / 1000);
        const total =
          data.totalDuration > 0
            ? data.totalDuration / 1000
            : points[points.length - 1] * (1 + 1 / Math.max(1, currentSurah.ayahCount));

        const base: TimingsBase = { points, total };
        timingsCacheRef.current.set(cacheKey, base);
        if (timingsBaseRef.current && timingsBaseRef.current.points === fallbackPoints) {
          // Only override if the API data is still for this surah/reciter.
          activateBase(base);
        }
      })
      .catch(() => {
        timingsCacheRef.current.set(cacheKey, { points: fallbackPoints, total: fallbackTotal });
      });

    return () => controller.abort();
  }, [currentSurah, currentReciter, applyScaledTimings]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Keep background video in sync with audio playback, including when the
  // overlay mounts mid-playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, showSpiritualVideo]);

  // Load real surah text for the immersive overlay instead of placeholder copy.
  useEffect(() => {
    if (!showSpiritualVideo || !currentSurah) return;

    setVideoFailed(false);

    const surahNumber = currentSurah.number;
    const cached = surahTextCache.get(surahNumber);
    if (cached) {
      setOverlaySurahText(cached);
      return;
    }

    setOverlaySurahText(null);
    const controller = new AbortController();
    fetch(`/api/surah/${surahNumber}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch surah text"))))
      .then((data: SurahText) => {
        if (controller.signal.aborted || !data?.arabicAyahs?.length) return;
        surahTextCache.set(surahNumber, data);
        setOverlaySurahText(data);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [showSpiritualVideo, currentSurah]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const rescaleToDuration = () => {
      const audio = audioRef.current;
      if (audio && audio.duration && isFinite(audio.duration)) {
        applyScaledTimings(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      rescaleToDuration();
    };

    const onCanPlay = () => {
      setIsBuffering(false);
      rescaleToDuration();

      const audio = audioRef.current;
      if (!audio) return;

      if (seekToTimeRef.current !== null) {
        const { ratio } = seekToTimeRef.current;
        const newDuration = audio.duration;
        if (isFinite(newDuration) && newDuration > 0) {
          audio.currentTime = ratio * newDuration;
        }
        seekToTimeRef.current = null;
        if (isPlayingRef.current) {
          audio.play().catch(() => {});
        }
        return;
      }

      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }

      if (currentSurah && currentReciter) {
        const key = `${currentSurah.number}-${currentReciter}`;
        const bookmarkTime = loadBookmark(key);
        if (bookmarkTime && bookmarkTime > 0) {
          audio.currentTime = bookmarkTime;
        }
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setAudioError(null);
    };

    const onEnded = () => {
      if (repeatOne) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        return;
      }
      nextSurah();
    };

    const onError = () => {
      setIsBuffering(false);
      setAudioError("Unable to load audio. Please check your internet connection or try a different reciter.");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [nextSurah, setIsBuffering, setAudioError, loadBookmark, currentSurah, currentReciter, applyScaledTimings]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        const ct = audio.currentTime;
        const dur = audio.duration;
        if (timeRef.current !== ct) {
          timeRef.current = ct;
          setDisplayTime(ct);

          if (currentSurah) {
            const newAyah = getCurrentAyahFromTime(
              ct,
              currentSurah.ayahCount,
              ayahTimingsRef.current
            );
            if (newAyah !== lastAyahRef.current) {
              lastAyahRef.current = newAyah;
              setCurrentAyah(newAyah);
              setAyahProgress(0);
            } else {
              const timings = ayahTimingsRef.current;
              if (timings.length > newAyah) {
                const ayahStart = timings[newAyah - 1];
                const ayahEnd = timings[newAyah] || dur;
                const ayahDuration = ayahEnd - ayahStart;
                if (ayahDuration > 0) {
                  const progressInAyah = (ct - ayahStart) / ayahDuration;
                  setAyahProgress(Math.max(0, Math.min(1, progressInAyah)));
                }
              }
            }
          }
        }
        if (isFinite(dur) && durationRef.current !== dur) {
          durationRef.current = dur;
          setDisplayDuration(dur);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [currentSurah, setCurrentAyah]);

  const preloadNextSurah = useCallback(async () => {
    if (!currentSurah || !currentReciter) return;

    const nextSurahNum = currentSurah.number >= 114 ? 1 : currentSurah.number + 1;
    const nextSurah = getSurahInfo(nextSurahNum);
    if (!nextSurah) return;

    const preloadAudio = preloadAudioRef.current;
    if (!preloadAudio) return;

    const cacheKey = `${currentReciter}-${nextSurahNum}`;
    let url = urlCache.get(cacheKey);

    if (!url) {
      const streamUrl = `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${nextSurahNum}`;
      url = streamUrl;
      urlCache.set(cacheKey, streamUrl);
    }

    if (url) {
      preloadAudio.src = url;
      preloadAudio.preload = "metadata";
      preloadAudio.load();
    }
  }, [currentSurah, currentReciter]);

  useEffect(() => {
    if (isPlaying && currentSurah) {
      preloadNextSurah();

      const checkPreload = () => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;

        const remainingTime = audio.duration - audio.currentTime;
        if (remainingTime <= 30) {
          preloadNextSurah();
        }
      };

      const interval = setInterval(checkPreload, 5000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentSurah, preloadNextSurah]);

  useEffect(() => {
    if (currentSurah && currentReciter) {
      const key = `${currentSurah.number}-${currentReciter}`;
      const bookmarkTime = loadBookmark(key);
      setIsBookmarked(bookmarkTime !== null);
    } else {
      setIsBookmarked(false);
    }
  }, [currentSurah, currentReciter, loadBookmark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayerVisible || !currentSurah) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(
              0,
              audioRef.current.currentTime - 10
            );
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(
              audioRef.current.duration || 0,
              audioRef.current.currentTime + 10
            );
          }
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
              const audio = audioRef.current;
              if (audio) {
                saveBookmark(key, audio.currentTime);
                setIsBookmarked(true);
              }
            }
          }
          break;
        case "Digit1":
          e.preventDefault();
          setPlaybackSpeed(0.5);
          break;
        case "Digit2":
          e.preventDefault();
          setPlaybackSpeed(1.0);
          break;
        case "Digit3":
          e.preventDefault();
          setPlaybackSpeed(1.5);
          break;
        case "Digit4":
          e.preventDefault();
          setPlaybackSpeed(2.0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlayerVisible, currentSurah, togglePlay, hidePlayer]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !durationRef.current) return;

      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = ratio * durationRef.current;
    },
    []
  );

  const handleProgressDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !durationRef.current) return;

      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = ratio * durationRef.current;
    },
    []
  );

  const handleRetry = useCallback(() => {
    if (!currentSurah) return;
    setAudioError(null);
    setIsBuffering(true);
    timeRef.current = 0;
    durationRef.current = 0;
    lastAyahRef.current = 1;
    setCurrentAyah(1);

    const audio = audioRef.current;
    if (audio && audioSrc) {
      audio.src = audioSrc;
      audio.load();
      audio.play().catch(() => {});
    }
  }, [currentSurah, audioSrc, setAudioError, setIsBuffering, setCurrentAyah]);

  if (!isPlayerVisible || !currentSurah) return null;

  const progressPercent =
    displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  const overlayArabicAyah = overlaySurahText?.arabicAyahs?.find(
    (a) => a.numberInSurah === currentAyahInSurah
  );
  const overlayEnglishAyah = overlaySurahText?.englishAyahs?.find(
    (a) => a.numberInSurah === currentAyahInSurah
  );

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <audio ref={preloadAudioRef} preload="none" style={{ display: 'none' }} />

      <div
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {audioError && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="font-ui text-sm text-destructive">{audioError}</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-2 bg-destructive/15 text-destructive rounded-sm hover:bg-destructive/25 transition-colors font-ui text-sm min-h-[44px] touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        <div className="player-bar flex items-center justify-between gap-3 py-3 pl-4 pr-3 sm:pl-6 sm:pr-5 border-t border-gold/40 text-ivory">
          {/* Left: Artwork + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 border border-gold/70 bg-gold/10 flex items-center justify-center">
              <Khatam className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base leading-snug text-ivory truncate" dir="rtl">
                {currentSurah?.arabicName}
              </p>
              <p className="font-ui text-[11px] text-gold-bright/80 truncate">
                {currentSurah?.englishName} · {currentSurah?.ayahCount} ayat
                {currentAyahInSurah > 0 && (
                  <span className="ml-1.5">· Āyah {currentAyahInSurah}</span>
                )}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleShuffleMode}
                className={`p-2 rounded-full transition-colors active:scale-95 touch-manipulation ${
                  shuffleMode
                    ? "text-gold-bright bg-gold/15"
                    : "text-ivory-dim hover:text-gold-bright hover:bg-white/5"
                }`}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevSurah}
                className="p-2 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                aria-label="Previous surah"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (audioError) {
                    handleRetry();
                    return;
                  }
                  const willPlay = !isPlaying;
                  togglePlay();
                  if (willPlay) {
                    const audio = audioRef.current;
                    if (audio && audio.src) {
                      audio.play().catch(() => {});
                    }
                  }
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 touch-manipulation ${
                  isPlaying
                    ? "bg-gold text-ink shadow-lg hover:bg-gold-bright"
                    : "bg-gold/15 text-gold-bright hover:bg-gold/25"
                }`}
                aria-label={audioError ? "Retry" : isPlaying ? "Pause" : "Play"}
              >
                {audioError ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isBuffering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              <button
                onClick={nextSurah}
                className="p-2 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                aria-label="Next surah"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleRepeatOne}
                className={`p-2 rounded-full transition-colors active:scale-95 touch-manipulation ${
                  repeatOne
                    ? "text-gold-bright bg-gold/15"
                    : "text-ivory-dim hover:text-gold-bright hover:bg-white/5"
                }`}
                aria-label="Repeat one"
                title="Repeat one"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2.5 w-full max-w-md">
              <span className="hidden sm:block font-ui text-[10.5px] text-ivory-dim tabular-nums w-9">
                {formatTime(displayTime)}
              </span>
              <div
                ref={progressRef}
                className="group relative h-1 flex-1 bg-white/15 rounded-full cursor-pointer touch-none select-none"
                onClick={handleProgressClick}
                onPointerMove={(e) => {
                  if (e.buttons > 0) handleProgressDrag(e);
                }}
                onPointerDown={handleProgressDrag}
              >
                <div
                  className="h-full bg-gold rounded-full transition-all duration-100 pointer-events-none"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold-bright rounded-full shadow-md touch-none sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity pointer-events-none"
                  style={{ left: `${progressPercent}%`, marginLeft: "-6px" }}
                />
              </div>
              <span className="hidden sm:block font-ui text-[10.5px] text-ivory-dim tabular-nums w-9 text-right">
                {formatTime(displayDuration)}
              </span>
            </div>
          </div>

          {/* Right: Volume, Playback Speed, Extra Controls */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-ivory-dim hover:text-gold-bright transition-colors p-1 rounded-full hover:bg-white/5"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <div className="w-14">
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

            <div className="hidden sm:flex items-center gap-1">
              <Select
                value={playbackSpeed.toString()}
                onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
              >
                <SelectTrigger className="w-11 h-7 font-ui text-[11px] bg-white/5 border-gold/30 text-ivory-dim hover:bg-white/10">
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
            </div>

            <button
              onClick={() => setShowSpiritualVideo(!showSpiritualVideo)}
              className="hidden sm:flex p-1.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
              aria-label={showSpiritualVideo ? "Hide video" : "Show video"}
            >
              <Image className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (!currentSurah || !currentReciter) return;
                const audio = audioRef.current;
                if (!audio) return;
                const key = `${currentSurah.number}-${currentReciter}`;
                if (isBookmarked) {
                  clearBookmark(key);
                  setIsBookmarked(false);
                } else {
                  saveBookmark(key, audio.currentTime);
                  setIsBookmarked(true);
                }
              }}
              className={`p-1.5 transition-colors rounded-full active:scale-95 touch-manipulation ${
                isBookmarked
                  ? "text-gold hover:text-gold-bright hover:bg-white/5"
                  : "text-ivory-dim hover:text-gold-bright hover:bg-white/5"
              }`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => {
                if (!currentSurah) return;
                const a = document.createElement("a");
                a.href = `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${currentSurah.number}`;
                a.download = `surah-${currentSurah.number}-${currentReciter}.mp3`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
              className="p-1.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
              aria-label="Download surah audio"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={hidePlayer}
              className="p-1.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showSpiritualVideo && (
        <div className="fixed inset-0 z-[60] overflow-hidden bg-black">
          {/* Video background layer */}
          {videoFailed ? (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-black" />
          ) : (
            <video
              ref={videoRef}
              src="/spiritual-video.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
            />
          )}

          {/* Scrim for text readability */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/10 to-black/90" />

          {/* Close control */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setShowSpiritualVideo(false)}
              className="p-2.5 text-white hover:text-primary transition-colors rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 active:scale-95 touch-manipulation"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live ayah content */}
          <div className="absolute inset-x-0 bottom-0 z-10 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-xs font-semibold text-primary bg-primary/15 border border-primary/30 px-2.5 py-1 rounded-full">
                    {currentSurah?.number}
                  </span>
                  <span dir="rtl" lang="ar" className="text-lg sm:text-xl font-bold text-white truncate">
                    {currentSurah?.arabicName}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-medium text-white/90 bg-white/10 border border-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  Ayah {currentAyahInSurah} / {currentSurah?.ayahCount}
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl px-5 py-4 sm:px-6 sm:py-5">
                {overlayArabicAyah ? (
                  <>
                    <p
                      dir="rtl"
                      lang="ar"
                      className="text-right text-xl sm:text-2xl leading-[2.2] text-amber-50"
                    >
                      {overlayArabicAyah.text}
                    </p>
                    {overlayEnglishAyah?.text && (
                      <p className="mt-3 pt-3 border-t border-white/10 text-sm sm:text-base leading-relaxed text-white/75">
                        {overlayEnglishAyah.text}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading ayah…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
