'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, X, RefreshCw, Loader2, Languages, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudioStore } from "@/lib/audio-store";
import { getSurahInfo } from "@/lib/quran-utils";
import type { SurahText, AyahText, TranslationLanguage } from "@/lib/quran-types";
import { TRANSLATION_LANGUAGES } from "@/lib/quran-types";
import TranslationSelector from '@/components/translation-selector';

interface TafsirEntry {
  verseKey: string;
  arabicText: string;
  englishText: string;
}

export default function SurahReadingModal() {
  const {
    showSurahModal,
    readingModalSurah,
    closeReadingModal,
    surahModalNumber,
    play,
    playSurah,
    isPlaying,
    currentSurah,
    currentAyahInSurah,
    pauseAudio,
    resumeAudio,
    togglePlay,
    selectedTranslations,
    showTranslations,
    setShowTranslations,
  } = useAudioStore();

  const [surahText, setSurahText] = useState<SurahText | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tafsirData, setTafsirData] = useState<Record<string, TafsirEntry>>({});
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedTafsirAyah, setSelectedTafsirAyah] = useState<number | null>(null);
  const cacheRef = useRef<Map<number, SurahText>>(new Map());
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tafsirScrollRef = useRef<HTMLDivElement>(null);

  const surahInfo = readingModalSurah ?? getSurahInfo(surahModalNumber);
  const surahNumber = readingModalSurah?.number ?? surahModalNumber;

  const isViewingPlayingSurah = currentSurah?.number === surahNumber;
  const currentAyah = currentAyahInSurah;

  const fetchSurahText = useCallback(async (signal?: AbortSignal) => {
    if (!surahNumber) return;

    if (cacheRef.current.has(surahNumber)) {
      setSurahText(cacheRef.current.get(surahNumber)!);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/surah/${surahNumber}`, { signal });
      if (!res.ok) {
        throw new Error("Failed to fetch surah text");
      }
      const data: SurahText = await res.json();
      if (signal?.aborted) return;
      cacheRef.current.set(surahNumber, data);
      setSurahText(data);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [surahNumber]);

  useEffect(() => {
    if (!showSurahModal || !surahNumber) return;

    const abortController = new AbortController();
    fetchSurahText(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [showSurahModal, surahNumber, fetchSurahText]);

  useEffect(() => {
    if (!surahNumber || !showTafsir) return;
    
    const abortController = new AbortController();
    
    const fetchTafsir = async () => {
      setLoadingTafsir(true);
      try {
        const [arRes, enRes] = await Promise.all([
          fetch(`/api/tafsir/${surahNumber}?tafsir_slug=ar-muyassar`, { signal: abortController.signal }),
          fetch(`/api/tafsir/${surahNumber}?tafsir_slug=en-tafisr-ibn-kathir`, { signal: abortController.signal }),
        ]);
        
        const arData = await arRes.json();
        const enData = await enRes.json();
        
        if (abortController.signal.aborted) return;
        
        const combined: Record<string, TafsirEntry> = {};
        
        for (const key of Object.keys(arData.byVerseKey || {})) {
          combined[key] = {
            verseKey: key,
            arabicText: arData.byVerseKey[key] || '',
            englishText: enData.byVerseKey?.[key] || '',
          };
        }
        
        for (const key of Object.keys(enData.byVerseKey || {})) {
          if (!combined[key]) {
            combined[key] = {
              verseKey: key,
              arabicText: '',
              englishText: enData.byVerseKey[key] || '',
            };
          }
        }
        
        setTafsirData(combined);
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch tafsir:', err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingTafsir(false);
        }
      }
    };
    
    fetchTafsir();
    
    return () => {
      abortController.abort();
    };
  }, [surahNumber, showTafsir]);

  useEffect(() => {
    if (!isViewingPlayingSurah || !isPlaying || !surahText) return;

    const ayahEl = ayahRefs.current.get(currentAyah);
    if (ayahEl && scrollContainerRef.current) {
      ayahEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentAyah, isViewingPlayingSurah, isPlaying, surahText]);

  const handlePlayToggle = () => {
    if (!surahInfo) return;

    if (currentSurah?.number === surahInfo.number) {
      togglePlay();
    } else {
      play(surahInfo.number);
    }
  };

  const isCurrentlyPlaying =
    isPlaying && currentSurah?.number === surahNumber;

  const basmala = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

  const navigateTafsir = (direction: 'prev' | 'next') => {
    if (!surahText) return;
    const ayahs = surahText.arabicAyahs;
    const currentIdx = selectedTafsirAyah !== null ? selectedTafsirAyah - 1 : 0;
    let newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    newIdx = Math.max(0, Math.min(ayahs.length - 1, newIdx));
    setSelectedTafsirAyah(newIdx + 1);
  };

  if (showTafsir) {
    const currentTafsirAyah = selectedTafsirAyah || 1;
    const tafsirEntry = tafsirData[`${surahNumber}:${currentTafsirAyah}`];
    const arabicAyah = surahText?.arabicAyahs[currentTafsirAyah - 1];

    return (
      <Dialog open={showSurahModal} onOpenChange={(open) => !open && closeReadingModal()}>
        <DialogContent
          className="flex flex-col gap-0 p-0 overflow-hidden max-h-[95vh] sm:max-h-[85vh] border-purple-900/30 sm:max-w-2xl w-[95vw] sm:w-auto"
          style={{
            background: "rgba(15, 10, 30, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          showCloseButton={false}
        >
          {/* Tafsir Header */}
          <div className="flex-shrink-0 border-b border-white/10 px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setShowTafsir(false)}
                  className="p-2.5 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95 touch-manipulation"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600/30 text-purple-300 text-sm sm:text-base font-bold flex-shrink-0">
                  {surahInfo?.number}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-white text-sm sm:text-lg font-semibold truncate">
                    Tafsir — {surahInfo?.arabicName}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 text-xs sm:text-xs">
                    Ayah {currentTafsirAyah} of {surahInfo?.ayahCount}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => navigateTafsir('prev')}
                  disabled={currentTafsirAyah <= 1}
                  className="p-2.5 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateTafsir('next')}
                  disabled={currentTafsirAyah >= (surahInfo?.ayahCount || 1)}
                  className="p-2.5 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={closeReadingModal}
                  className="p-2.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ayah quick selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {Array.from({ length: surahInfo?.ayahCount || 0 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedTafsirAyah(num)}
                  className={`flex-shrink-0 min-w-[36px] h-9 rounded-full text-sm font-medium transition-all active:scale-95 ${
                    num === currentTafsirAyah
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Tafsir Content */}
          <div
            ref={tafsirScrollRef}
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 max-h-[65vh] sm:max-h-[70vh]"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(139, 92, 246, 0.3) transparent",
            }}
          >
            {loadingTafsir ? (
              <div className="space-y-4">
                <Skeleton className="h-24 bg-purple-900/20" />
                <Skeleton className="h-32 bg-purple-900/10" />
              </div>
            ) : tafsirEntry ? (
              <div className="space-y-4">
                {/* Arabic Ayah */}
                {arabicAyah && (
                  <div className="p-3 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <p
                      className="text-lg sm:text-xl leading-[2] text-amber-100"
                      style={{
                        fontFamily: "'Scheherazade New', 'Traditional Arabic', serif",
                        direction: "rtl",
                        textAlign: "right",
                      }}
                    >
                      {arabicAyah.text}
                      <span className="inline-block mx-1 text-sm text-amber-400/60">
                        ﴿{arabicAyah.numberInSurah}﴾
                      </span>
                    </p>
                  </div>
                )}

                {/* Arabic Tafsir */}
                {tafsirEntry.arabicText && (
                  <div className="p-3 sm:p-4 rounded-xl bg-purple-900/20 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">التفسير الميسر</span>
                    </div>
                    <p
                      className="text-sm sm:text-base leading-[2] text-gray-200"
                      style={{
                        fontFamily: "'Scheherazade New', 'Traditional Arabic', serif",
                        direction: "rtl",
                        textAlign: "right",
                      }}
                      dangerouslySetInnerHTML={{ __html: tafsirEntry.arabicText }}
                    />
                  </div>
                )}

                {/* English Tafsir */}
                {tafsirEntry.englishText && (
                  <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Tafsir Ibn Kathir</span>
                    </div>
                    <p
                      className="text-xs sm:text-sm leading-relaxed text-gray-300"
                      dangerouslySetInnerHTML={{ __html: tafsirEntry.englishText }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No tafsir available for this ayah</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showSurahModal} onOpenChange={(open) => !open && closeReadingModal()}>
      <DialogContent
        className="flex flex-col gap-0 p-0 overflow-hidden max-h-[95vh] sm:max-h-[85vh] border-purple-900/30 sm:max-w-lg w-[95vw] sm:w-auto"
        style={{
          background: "rgba(15, 10, 30, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600/30 text-purple-300 text-sm sm:text-base font-bold flex-shrink-0">
                {surahInfo?.number}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-white text-sm sm:text-lg font-semibold truncate">
                  {surahInfo?.arabicName} — {surahInfo?.englishName}
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-xs">
                  {surahInfo?.englishMeaning} • {surahInfo?.ayahCount} Ayahs •{" "}
                  {surahInfo?.revelationType}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {isViewingPlayingSurah && isPlaying && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                  </span>
                  Ayah {currentAyah}
                </span>
              )}

              <button
                onClick={() => setShowTranslations(!showTranslations)}
                className={`p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                  showTranslations || selectedTranslations.length > 1
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-muted-foreground hover:text-amber-400 hover:bg-white/10'
                }`}
                aria-label="Toggle translations"
              >
                <Languages className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayToggle}
                className={`p-2.5 sm:p-3 rounded-full transition-all active:scale-95 touch-manipulation ${
                  isCurrentlyPlaying
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                aria-label={isCurrentlyPlaying ? "Pause" : "Play surah"}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={closeReadingModal}
                className="p-2.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setShowTafsir(true); setSelectedTafsirAyah(1); }}
                className={`p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                  showTafsir ? 'bg-purple-500/20 text-purple-400' : 'text-muted-foreground hover:text-purple-400 hover:bg-white/10'
                }`}
                aria-label="Toggle tafsir"
              >
                <BookOpen className="w-5 h-5" />
              </button>
            </div>
          </div>

          {(showTranslations || selectedTranslations.length > 1) && (
            <div className="mt-3">
              <TranslationSelector />
            </div>
          )}

          {surahNumber !== 9 && surahNumber !== 1 && (
            <div className="mt-3 text-center">
              <p
                className="text-amber-400/90 text-lg sm:text-xl" 
                style={{ 
                  fontFamily: "'Scheherazade New', 'Traditional Arabic', serif",
                  direction: "rtl"
                }}
              >
                {basmala}
              </p>
            </div>
          )}
        </div>

        {/* Content area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 max-h-[55vh] sm:max-h-[60vh] scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(139, 92, 246, 0.3) transparent",
          }}
        >
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full bg-purple-900/30 flex-shrink-0" />
                    <Skeleton className="h-5 w-3/4 bg-purple-900/20" />
                  </div>
                  <Skeleton className="h-3 w-5/6 bg-purple-900/10 ml-9" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="text-red-400 text-sm text-center px-4">{error}</p>
              <button
                onClick={() => fetchSurahText()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm touch-manipulation"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {surahText && !loading && !error && (
            <div className="space-y-2 sm:space-y-3">
              {surahText.arabicAyahs.map((ayah: AyahText, index: number) => {
                const isBasmalaAyah =
                  surahNumber === 1 && ayah.numberInSurah === 1;

                const isCurrentPlayingAyah =
                  isViewingPlayingSurah &&
                  isPlaying &&
                  currentAyah === ayah.numberInSurah;

                return (
                  <div
                    key={ayah.number}
                    ref={(el) => {
                      if (el) ayahRefs.current.set(ayah.numberInSurah, el);
                    }}
                    className={`group rounded-lg p-2.5 sm:p-3 transition-all duration-300 touch-manipulation ${
                      isCurrentPlayingAyah
                        ? "bg-amber-500/15 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                        : isBasmalaAyah
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div
                        className={`flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-bold border transition-all duration-300 ${
                          isCurrentPlayingAyah
                            ? "bg-amber-500/30 text-amber-300 border-amber-400/50 shadow-md shadow-amber-500/20"
                            : isBasmalaAyah
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-purple-600/20 text-purple-300 border-purple-500/30"
                        }`}
                      >
                        {isCurrentPlayingAyah ? (
                          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-amber-400" />
                          </span>
                        ) : (
                          ayah.numberInSurah
                        )}
                      </div>

                      <p
                        className={`leading-[1.8] sm:leading-[2.2] flex-1 text-sm sm:text-base transition-colors duration-300 ${
                          isCurrentPlayingAyah ? "text-amber-100" : "text-white/90"
                        }`}
                        style={{
                          fontFamily:
                            "'Scheherazade New', 'Traditional Arabic', serif",
                          fontSize: "clamp(18px, 4vw, 22px)",
                          direction: "rtl",
                          textAlign: "right",
                        }}
                      >
                        {ayah.text}
                        <span className={`inline-block mx-1 text-sm ${isCurrentPlayingAyah ? "text-amber-400/80" : "text-amber-500/60"}`}>
                          ﴿{ayah.numberInSurah}﴾
                        </span>
                      </p>
                    </div>

                    {surahText.englishAyahs[index] && (
                      <p className={`text-sm leading-relaxed mt-2 ml-9 sm:ml-11 transition-colors duration-300 ${
                        isCurrentPlayingAyah ? "text-amber-200/70" : "text-gray-400"
                      }`}>
                        <span className="text-amber-400/60 text-xs uppercase tracking-wider mr-2">EN</span>
                        {surahText.englishAyahs[index].text}
                      </p>
                    )}

                    {selectedTranslations.filter(t => t !== 'english').map((lang) => {
                      const translationKey = `${lang}Ayahs` as keyof SurahText;
                      const translation = surahText[translationKey] as AyahText[] | undefined;
                      const langInfo = TRANSLATION_LANGUAGES[lang];

                      if (!translation || !translation[index]) return null;

                      return (
                        <p
                          key={lang}
                          className={`text-sm leading-relaxed mt-1 ml-9 sm:ml-11 transition-colors duration-300 ${
                            isCurrentPlayingAyah ? "text-amber-200/60" : "text-gray-500"
                          } ${
                            langInfo.rtl ? "pr-4" : ""
                          }`}
                          style={{
                            direction: langInfo.rtl ? "rtl" : "ltr",
                            fontFamily: langInfo.rtl ? "'Scheherazade New', serif" : "inherit",
                          }}
                        >
                          <span className="text-amber-400/40 text-xs uppercase tracking-wider mr-2">
                            {langInfo.flag}
                          </span>
                          {translation[index].text}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
