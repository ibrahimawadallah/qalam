"use client";

import { Play, Pause, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/lib/audio-store";
import type { RadioStation } from "@/lib/quran-types";

export default function ReciterCard({ station }: { station: RadioStation }) {
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
        isActive ? "border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/10" : "border-red-500/10 bg-red-500/5 hover:bg-red-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${isActive ? "bg-red-500/20 text-red-300" : "bg-red-500/10 text-red-400/70"}`}>
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-100 truncate">{station.arabicName}</h3>
          {station.reciterArabicName && (
            <p className="text-xs text-red-300/60 mt-0.5">{station.reciterArabicName}</p>
          )}
          <p className="text-[11px] text-red-300/40 mt-1 line-clamp-2">{station.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-red-300/40">{station.location}</span>
        <Button
          size="sm"
          onClick={handlePlay}
          className={`gap-1.5 text-xs ${
            isActive && isRadioPlaying
              ? "bg-red-500 text-[#0a0518] hover:bg-red-400 shadow-lg shadow-red-500/30"
              : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
          }`}
        >
          {isActive && isRadioPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
          {isActive && isRadioPlaying ? "Pause" : "Listen"}
        </Button>
      </div>
    </div>
  );
}
