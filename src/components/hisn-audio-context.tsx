"use client";

import { createContext, useContext, useState, useCallback } from "react";

type HisnAudioContextType = {
  playingId: number | null;
  setPlayingId: (id: number | null) => void;
};

const HisnAudioContext = createContext<HisnAudioContextType | null>(null);

export function HisnAudioProvider({ children }: { children: React.ReactNode }) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  
  const handleSetPlayingId = useCallback((id: number | null) => {
    setPlayingId(id);
  }, []);

  return (
    <HisnAudioContext.Provider value={{ playingId, setPlayingId: handleSetPlayingId }}>
      {children}
    </HisnAudioContext.Provider>
  );
}

export function useHisnAudio() {
  const ctx = useContext(HisnAudioContext);
  if (!ctx) {
    throw new Error("useHisnAudio must be used within HisnAudioProvider");
  }
  return ctx;
}
