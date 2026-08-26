"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
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
import { useAudioStore } from "@/lib/audio-store";
import type { SurahText } from "@/lib/quran-types";
import Khatam from "@/components/khatam";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const surahTextCache = new Map<number, SurahText>();

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

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadAudioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const lastAyahRef = useRef(1);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const ayahTimingsRef = useRef<AyahTiming[]>([]);
  const currentAyahIndexRef = useRef(0);
  const totalDurationRef = useRef(0);
  const virtualTimeRef = useRef(0);
  const playingRef = useRef(false);
  const fetchControllerRef = useRef<AbortController | null>(null);

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

  const t = useTranslations('audioPlayer');

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);  const handleTouchStart = (e: React.TouchEvent) => {
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
  const [showSpiritualVideo, setShowSpiritualVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [overlaySurahText, setOverlaySurahText] = useState<SurahText | null>(null);
  const [currentTranslation, setCurrentTranslation] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sequential ayah playback: fetch timing data + per-ayah URLs, play ayahs one by one.
  useEffect(() => {
    if (!currentSurah || !currentReciter) return;

    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    // Reset state for new surah
    ayahTimingsRef.current = [];
    currentAyahIndexRef.current = 0;
    virtualTimeRef.current = 0;
    timeRef.current = 0;
    lastAyahRef.current = 1;
    setDisplayTime(0);
    setAyahProgress(0);
    setAudioError(null);
    setIsBuffering(true);

    const playAyahAtIndex = (index: number) => {
      const timings = ayahTimingsRef.current;
      const audio = audioRef.current;
      if (!audio || index >= timings.length) return;

      currentAyahIndexRef.current = index;
      const ayah = timings[index];
      audio.src = ayah.audioUrl;
      audio.load();
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }
    };

    // Fetch timing data (includes per-ayah audio URLs)
    fetch(`/api/timing/${currentSurah.number}?reciter=${currentReciter}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted || !data?.timings?.length) return;

        ayahTimingsRef.current = data.timings;
        totalDurationRef.current = data.timings.reduce((sum: number, t: AyahTiming) => sum + t.duration, 0);
        setDisplayDuration(totalDurationRef.current);

        // Start playing from ayah 0
        playAyahAtIndex(0);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAudioError(t('loadError'));
          setIsBuffering(false);
        }
      });

    return () => controller.abort();
  }, [currentSurah, currentReciter, setAudioError, setIsBuffering, t]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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

    const onCanPlay = () => {
      setIsBuffering(false);
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setAudioError(null);
    };

    const onEnded = () => {
      const timings = ayahTimingsRef.current;
      const idx = currentAyahIndexRef.current;

      if (repeatOne) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      // Play next ayah in sequence
      if (idx + 1 < timings.length) {
        currentAyahIndexRef.current = idx + 1;
        const nextAyah = timings[idx + 1];
        audio.src = nextAyah.audioUrl;
        audio.load();
        audio.play().catch(() => {});
      } else {
        // Surah ended
        nextSurah();
      }
    };

    const onError = () => {
      setIsBuffering(false);
      setAudioError(t('loadError'));
    };

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [nextSurah, setIsBuffering, setAudioError, repeatOne, t]);

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
      const timings = ayahTimingsRef.current;
      if (audio && timings.length > 0) {
        const idx = currentAyahIndexRef.current;
        const ayahTime = audio.currentTime || 0;

        // Virtual time = sum of completed ayah durations + current ayah's playback time
        let virtualTime = 0;
        for (let i = 0; i < idx; i++) {
          virtualTime += timings[i].duration;
        }
        virtualTime += ayahTime;
        virtualTimeRef.current = virtualTime;

        if (timeRef.current !== virtualTime) {
          timeRef.current = virtualTime;
          setDisplayTime(virtualTime);

          // Determine which ayah is playing based on virtual time
          let cumulative = 0;
          let newAyahIndex = 0;
          for (let i = 0; i < timings.length; i++) {
            if (virtualTime >= cumulative && virtualTime < cumulative + timings[i].duration) {
              newAyahIndex = i;
              break;
            }
            cumulative += timings[i].duration;
            if (i === timings.length - 1) newAyahIndex = i;
          }

          const newAyahNumber = newAyahIndex + 1;
          if (newAyahNumber !== lastAyahRef.current) {
            lastAyahRef.current = newAyahNumber;
            currentAyahIndexRef.current = newAyahIndex;
            setCurrentAyah(newAyahNumber);
            setAyahProgress(0);
          } else {
            // Calculate progress within current ayah
            const ayahDuration = timings[newAyahIndex].duration;
            if (ayahDuration > 0) {
              const progressInAyah = ayahTime / ayahDuration;
              setAyahProgress(Math.max(0, Math.min(1, progressInAyah)));
            }
          }
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

    const preloadAudio = preloadAudioRef.current;
    if (!preloadAudio) return;

    const streamUrl = `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${nextSurahNum}`;
    preloadAudio.src = streamUrl;
    preloadAudio.preload = "metadata";
    preloadAudio.load();
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

  const seekToVirtualTime = useCallback((targetTime: number) => {
    const audio = audioRef.current;
    const timings = ayahTimingsRef.current;
    if (!audio || timings.length === 0) return;

    // Find which ayah the target time falls in
    let cumulative = 0;
    for (let i = 0; i < timings.length; i++) {
      if (targetTime < cumulative + timings[i].duration || i === timings.length - 1) {
        const offsetInAyah = targetTime - cumulative;
        currentAyahIndexRef.current = i;
        lastAyahRef.current = i + 1;
        setCurrentAyah(i + 1);
        audio.src = timings[i].audioUrl;
        audio.load();
        audio.addEventListener("canplay", function onCanPlay() {
          audio.removeEventListener("canplay", onCanPlay);
          audio.currentTime = Math.max(0, offsetInAyah);
          if (isPlayingRef.current) {
            audio.play().catch(() => {});
          }
        });
        return;
      }
      cumulative += timings[i].duration;
    }
  }, [setCurrentAyah]);

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
          seekToVirtualTime(Math.max(0, virtualTimeRef.current - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekToVirtualTime(Math.min(totalDurationRef.current, virtualTimeRef.current + 10));
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
              saveBookmark(key, virtualTimeRef.current);
              setIsBookmarked(true);
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
  }, [isPlayerVisible, currentSurah, currentReciter, togglePlay, hidePlayer, seekToVirtualTime, nextSurah, prevSurah, isBookmarked, saveBookmark, clearBookmark, setPlaybackSpeed]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressRef.current;
      if (!bar || !totalDurationRef.current) return;

      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      seekToVirtualTime(ratio * totalDurationRef.current);
    },
    [seekToVirtualTime]
  );

  const handleProgressDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const bar = progressRef.current;
      if (!bar || !totalDurationRef.current) return;

      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      seekToVirtualTime(ratio * totalDurationRef.current);
    },
    [seekToVirtualTime]
  );

  const handleRetry = useCallback(() => {
    if (!currentSurah) return;
    setAudioError(null);
    setIsBuffering(true);
    timeRef.current = 0;
    lastAyahRef.current = 1;
    currentAyahIndexRef.current = 0;
    virtualTimeRef.current = 0;
    setCurrentAyah(1);

    const timings = ayahTimingsRef.current;
    const audio = audioRef.current;
    if (audio && timings.length > 0) {
      audio.src = timings[0].audioUrl;
      audio.load();
      audio.play().catch(() => {});
    }
  }, [currentSurah, setAudioError, setIsBuffering, setCurrentAyah]);

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
              <RefreshCw className="w-4 h-4" /            >
              {t('retry')}
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
                aria-label={t('shuffle')}
                title={t('shuffle')}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevSurah}
                className="p-2 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
                aria-label={t('previousSurah')}
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
                    if (audio) {
                      // If no src yet (first play), start from ayah 0
                      if (!audio.src || audio.src === location.href) {
                        const timings = ayahTimingsRef.current;
                        if (timings.length > 0) {
                          currentAyahIndexRef.current = 0;
                          audio.src = timings[0].audioUrl;
                          audio.load();
                        }
                      }
                      audio.play().catch(() => {});
                    }
                  }
                }}
                 className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 touch-manipulation ${
                  isPlaying
                    ? "bg-gold text-ink shadow-lg hover:bg-gold-bright"
                    : "bg-gold/15 text-gold-bright hover:bg-gold/25"
                }`}
                aria-label={audioError ? t('retry') : isPlaying ? t('pause') : t('play')}
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
                aria-label={t('nextSurah')}
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
                aria-label={t('repeatOne')}
                title={t('repeatOne')}
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
                aria-label={isMuted ? t('unmute') : t('mute')}
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
                aria-label={showSpiritualVideo ? t('hideVideo') : t('showVideo')}
              >
              <Image className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (!currentSurah || !currentReciter) return;
                const key = `${currentSurah.number}-${currentReciter}`;
                if (isBookmarked) {
                  clearBookmark(key);
                  setIsBookmarked(false);
                } else {
                  saveBookmark(key, virtualTimeRef.current);
                  setIsBookmarked(true);
                }
              }}
              className={`p-1.5 transition-colors rounded-full active:scale-95 touch-manipulation ${
                isBookmarked
                  ? "text-gold hover:text-gold-bright hover:bg-white/5"
                  : "text-ivory-dim hover:text-gold-bright hover:bg-white/5"
              }              `}
              aria-label={isBookmarked ? t('removeBookmark') : t('bookmark')}
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
              aria-label={t('downloadAudio')}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={hidePlayer}
              className="p-1.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/5 active:scale-95 touch-manipulation"
              aria-label={t('closePlayer')}
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
               aria-label={t('closeVideo')}
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
                    {t('loadingAyah')}
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
