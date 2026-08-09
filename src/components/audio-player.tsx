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
} from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import { getSurahInfo } from "@/lib/quran-utils";
import { getAyahTimings } from "@/lib/quran-data";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const urlCache = new Map<string, string>();

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
  } = useAudioStore();

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

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
  const [spiritualVideoPlaying, setSpiritualVideoPlaying] = useState(true);
  const [currentTranslation, setCurrentTranslation] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const ayahTimingsRef = useRef<number[]>([]);
  const currentAyahRef = useRef<any>(null);
  const prevSurahNumberRef = useRef<number | null>(null);
  const prevReciterRef = useRef<string>('');
  const seekToTimeRef = useRef<{ ratio: number } | null>(null);
  const timingsCacheRef = useRef<Map<string, number[]>>(new Map());

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

      try {
        const res = await fetch(
          `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${currentSurahNumber}`,
          { signal: abortController.signal }
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        // The proxy returns the audio stream itself (same-origin). Use the
        // request URL directly so the <audio> element loads it cross-origin-free.
        const streamUrl = `/api/audio-stream?reciter=${encodeURIComponent(currentReciter)}&surah=${currentSurahNumber}`;
        urlCache.set(cacheKey, streamUrl);
        if (!abortController.signal.aborted) {
          setAudioSrc(streamUrl);
        }
        return;
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch audio URL:', error);
          setAudioError("Unable to load audio. Please check your internet connection or try a different reciter.");
        }
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

  useEffect(() => {
    if (!currentSurah) return;

    prevSurahNumberRef.current = currentSurah.number;
    prevReciterRef.current = currentReciter;

    const cacheKey = `${currentSurah.number}-${currentReciter}`;
    const cachedTimings = timingsCacheRef.current.get(cacheKey);
    if (cachedTimings) {
      ayahTimingsRef.current = cachedTimings;
      lastAyahRef.current = 1;
      setAyahProgress(0);
      return;
    }

    const fallbackTimings = getAyahTimings(currentSurah.number, currentReciter);
    ayahTimingsRef.current = fallbackTimings;
    lastAyahRef.current = 1;
    setAyahProgress(0);

    const controller = new AbortController();
    fetch(`/api/timing/${currentSurah.number}?reciter=${currentReciter}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted || !data?.timings?.length) return;
        const apiTimings = data.timings.map((t: { timestamp: number }) => t.timestamp / 1000);
        
        timingsCacheRef.current.set(cacheKey, apiTimings);
        ayahTimingsRef.current = apiTimings;
      })
      .catch(() => {
        timingsCacheRef.current.set(cacheKey, fallbackTimings);
        ayahTimingsRef.current = fallbackTimings;
      });

    return () => controller.abort();
  }, [currentSurah, currentReciter]);

  const updateTimingsFromAudio = useCallback((duration: number) => {
    if (!currentSurah || !duration || !isFinite(duration)) return;
    
    const ayahCount = currentSurah.ayahCount;
    if (ayahCount <= 0) return;
    
    const baseTimings: number[] = [0];
    const avgAyahDuration = duration / ayahCount;
    
    for (let i = 1; i <= ayahCount; i++) {
      baseTimings.push(Math.min(avgAyahDuration * i, duration));
    }
    
    ayahTimingsRef.current = baseTimings;
    lastAyahRef.current = 1;
    setAyahProgress(0);
  }, [currentSurah]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onCanPlay = () => {
      setIsBuffering(false);

      const audio = audioRef.current;
      if (audio && audio.duration && isFinite(audio.duration)) {
        updateTimingsFromAudio(audio.duration);
      }

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
      nextSurah();
    };

    const onError = () => {
      setIsBuffering(false);
      setAudioError("Unable to load audio. Please check your internet connection or try a different reciter.");
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
  }, [nextSurah, setIsBuffering, setAudioError, loadBookmark, currentSurah, currentReciter]);

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

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <audio ref={preloadAudioRef} preload="none" style={{ display: 'none' }} />

      <div
        className="fixed bottom-16 left-0 right-0 z-40 mx-3 mb-3 sm:mx-4 sm:mb-4 pb-[env(safe-area-inset-bottom)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={progressRef}
          className="w-full h-1.5 cursor-pointer group relative touch-none select-none overflow-hidden bg-muted/30 rounded-full"
          onClick={handleProgressClick}
          onPointerMove={(e) => {
            if (e.buttons > 0) handleProgressDrag(e);
          }}
          onPointerDown={handleProgressDrag}
        >
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-[width] duration-100 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-lg shadow-warm-sm touch-none sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
            style={{ left: `${progressPercent}%`, marginLeft: "-7px" }}
          />
        </div>

        {audioError && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-sm text-destructive">{audioError}</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-2 bg-destructive/15 text-destructive rounded-lg hover:bg-destructive/25 transition-colors text-sm min-h-[44px] touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        <div className="flex items-center justify-between py-2 px-3 bg-card rounded-2xl shadow-warm-lg border border-border">
          {/* Left: Artwork + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex-shrink-0 shadow-lg flex items-center justify-center text-xl font-bold text-primary-foreground">
              {currentSurah?.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">
                  {currentSurah?.arabicName}
                </span>
                <button
                  onClick={() => setShowSpiritualVideo(!showSpiritualVideo)}
                  className="p-1 text-primary hover:text-primary/80 transition-colors rounded-full hover:bg-primary/15 active:scale-95 touch-manipulation flex-shrink-0"
                  aria-label={showSpiritualVideo ? "Hide video" : "Show video"}
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentSurah?.englishMeaning} • {currentSurah?.ayahCount} Ayahs
                {currentAyahInSurah > 0 && (
                  <span className="text-primary/70 ml-1">Ayah {currentAyahInSurah}</span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={prevSurah}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted active:scale-95 touch-manipulation"
                aria-label="Previous surah"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={audioError ? handleRetry : togglePlay}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-95 touch-manipulation ${
                  isPlaying
                    ? "bg-primary text-primary-foreground shadow-lg shadow-warm"
                    : "bg-muted text-primary hover:bg-muted/80"
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
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted active:scale-95 touch-manipulation"
                aria-label="Next surah"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div
                ref={progressRef}
                className="h-1 bg-muted/30 rounded-full cursor-pointer transition-colors hover:bg-muted/50"
                onClick={handleProgressClick}
                onPointerMove={(e) => {
                  if (e.buttons > 0) handleProgressDrag(e);
                }}
                onPointerDown={handleProgressDrag}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-warm-sm touch-none sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                  style={{ left: `${progressPercent}%`, marginLeft: "-6px" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{formatTime(displayTime)}</span>
                <span>{formatTime(displayDuration)}</span>
              </div>
            </div>
          </div>

          {/* Right: Volume, Playback Speed, Extra Controls */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
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
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1">
              <Select
                value={playbackSpeed.toString()}
                onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
              >
                <SelectTrigger className="w-10 h-6 text-xs bg-muted/30 border-border hover:bg-muted/50">
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
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/15 active:scale-95 touch-manipulation"
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
                  ? "text-primary hover:text-primary/80 hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              onClick={hidePlayer}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted active:scale-95 touch-manipulation"
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showSpiritualVideo && (
        <div className="fixed inset-0 z-40 bg-black/50 overflow-hidden">
          <video
            ref={videoRef}
            src="/spiritual-video.mp4"
            className="fixed inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            onPlay={() => setSpiritualVideoPlaying(true)}
            onPause={() => setSpiritualVideoPlaying(false)}
          />
          
          <div className="fixed inset-0 z-45 pointer-events-none">
            <div className="relative h-full w-full">
              <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto flex flex-col">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-xs font-semibold text-primary bg-black/50 px-2 py-1 rounded-full">
                      {currentSurah?.number}
                    </span>
                    <span className="text-sm font-semibold text-white truncate">
                      {currentSurah?.arabicName}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {currentSurah?.englishMeaning} • {currentSurah?.ayahCount} Ayahs
                    {currentAyahInSurah > 0 && (
                      <span className="text-primary/70 ml-1">Ayah {currentAyahInSurah}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 bg-black/60 backdrop-blur-sm px-4 py-3 overflow-y-auto">
                  <div className="text-sm text-white leading-relaxed">
                    <p className="font-semibold text-primary mb-2">تفسير القرآن (ابن كثير):</p>
                    <p className="text-white/90 mb-2">
                      سياق الرواية والتفسير للآية، مع مراعاة السياق التاريخي واللغوي.
                    </p>
                    <p className="text-white/90">
                      هذا المحتوى يوفر التفسير الإسلامي الموثوق للقرآن الكريم، مع الإشارة إلى أثر الرواية في السياق العربي.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (spiritualVideoPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                }
              }}
              className="p-2.5 text-white hover:text-primary transition-colors rounded-full bg-black/50 hover:bg-black/70 active:scale-95 touch-manipulation"
              aria-label={spiritualVideoPlaying ? "Pause video" : "Play video"}
            >
              {spiritualVideoPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setShowSpiritualVideo(false)}
              className="p-2.5 text-white hover:text-gray-300 transition-colors rounded-full bg-black/50 hover:bg-black/70 active:scale-95 touch-manipulation"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
