"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, X, Loader2, Signal, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const CATEGORY_BADGE: Record<string, { label: string; cls: string }> = {
  quran: { label: "Quran", cls: "border-amber-500/30 text-amber-400" },
  ruqyah: { label: "Ruqyah", cls: "border-red-500/30 text-red-400" },
  adhkar: { label: "Adhkar", cls: "border-blue-500/30 text-blue-400" },
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
    <span className="tabular-nums text-amber-400/80 text-xs" title={timezone}>
      {time}
    </span>
  );
}

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
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

  const isPlayingRef = useRef(isRadioPlaying);
  isPlayingRef.current = isRadioPlaying;

  // Connect / disconnect audio stream
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentRadio) return;

    if (isRadioPlaying) {
      setIsConnecting(true);
      setHasError(false);
      audio.src = currentRadio.streamUrl;
      audio.load();
      audio.play().catch(() => {
        setIsConnecting(false);
        setHasError(true);
      });
    } else {
      audio.pause();
      audio.src = "";
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [currentRadio, isRadioPlaying]);

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
  }, []);

  // Volume
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
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-emerald-500/20 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: "rgba(5, 18, 10, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 opacity-60" />

        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 max-w-screen-xl mx-auto">
          {/* Icon + info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <Signal className={`w-5 h-5 ${isConnecting ? "text-emerald-400/50" : "text-emerald-400"}`} />
              {isConnecting && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider shrink-0">
                  LIVE
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 ${
                    CATEGORY_BADGE[currentRadio.category]?.cls ?? "border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {CATEGORY_BADGE[currentRadio.category]?.label ?? currentRadio.category}
                </Badge>
                <span className="text-xs sm:text-sm text-emerald-100 truncate">
                  {currentRadio.arabicName}
                </span>
                <span className="text-[11px] text-emerald-300/60 hidden sm:inline truncate">
                  — {currentRadio.name}
                </span>
              </div>
              {currentRadio.reciterArabicName && (
                <p className="text-[11px] text-emerald-300/50 mt-0.5">{currentRadio.reciterArabicName}</p>
              )}
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/50 mt-0.5">
                <span>{currentRadio.location}</span>
                <span>•</span>
                <CairoClock timezone={currentRadio.timezone} />
                {hasError && (
                  <>
                    <span className="text-red-400 ml-2">Connection lost — retrying...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-1 shrink-0">
            {/* Prev station */}
            <button
              onClick={() => cycleRadioStation(-1)}
              className="hidden sm:flex p-1 text-emerald-300/60 hover:text-emerald-300 transition-colors rounded-full hover:bg-emerald-500/10 active:scale-95"
              aria-label="Previous station"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Next station */}
            <button
              onClick={() => cycleRadioStation(1)}
              className="hidden sm:flex p-1 text-emerald-300/60 hover:text-emerald-300 transition-colors rounded-full hover:bg-emerald-500/10 active:scale-95"
              aria-label="Next station"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className={`p-3 sm:p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                isRadioPlaying && !hasError
                  ? "bg-emerald-500 text-[#050a05] hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
                  : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              }`}
              aria-label={isRadioPlaying ? "Pause" : "Play"}
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
              ) : isRadioPlaying ? (
                <Pause className="w-5 h-5 sm:w-5 sm:h-5" />
              ) : (
                <Play className="w-5 h-5 sm:w-5 sm:h-5 ml-0.5" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-emerald-300/60 hover:text-emerald-300 transition-colors p-1 rounded-full hover:bg-emerald-500/10"
                aria-label={isMuted ? "Unmute" : "Mute"}
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
                  className="cursor-pointer [&_[role=slider]]:bg-emerald-400 [&_[role=slider]]:border-emerald-400"
                />
              </div>
            </div>

            <button
              onClick={toggleRadioPanel}
              className="p-2.5 sm:p-1.5 text-emerald-300/60 hover:text-emerald-300 transition-colors rounded-full hover:bg-emerald-500/10 active:scale-95 touch-manipulation"
              aria-label="Browse stations"
            >
              <List className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-2.5 sm:p-1.5 text-emerald-300/60 hover:text-emerald-300 transition-colors rounded-full hover:bg-emerald-500/10 active:scale-95 touch-manipulation"
              aria-label="Close radio"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
