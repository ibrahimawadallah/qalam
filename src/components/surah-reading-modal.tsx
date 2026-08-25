'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, X, RefreshCw, Loader2, Languages, BookOpen, ChevronLeft, ChevronRight, Copy, Bookmark, BookmarkCheck, AlignJustify, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAudioStore } from "@/lib/audio-store";
import { getSurahInfo } from "@/lib/quran-utils";
import { RECITERS } from "@/lib/quran-data";
import type { SurahText, AyahText, TranslationLanguage } from "@/lib/quran-types";
import { TRANSLATION_LANGUAGES } from "@/lib/quran-types";
import TranslationSelector from '@/components/translation-selector';
import Khatam from '@/components/khatam';
import DOMPurify from 'dompurify';

type ReaderViewMode = 'full' | 'translation' | 'arabic';
type TafsirSource = 'both' | 'ibn-kathir' | 'muyassar';

const RECITER_OPTIONS = RECITERS.map((r) => ({ id: r.id, name: r.name }));
const TAFSIR_SOURCES: { value: TafsirSource; label: string }[] = [
  { value: 'both', label: 'Tafsir · Both' },
  { value: 'ibn-kathir', label: 'Ibn Kathir (EN)' },
  { value: 'muyassar', label: 'Al-Muyassar (AR)' },
];
const VIEW_MODES: { value: ReaderViewMode; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'translation', label: 'Translation' },
  { value: 'arabic', label: 'Arabic' },
];

const sanitizeTafsir = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'span', 'div', 'ul', 'ol', 'li', 'blockquote', 'sup', 'sub'],
    ALLOWED_ATTR: ['dir', 'class', 'lang'],
  });

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
    currentReciter,
    setCurrentReciter,
    openReadingModal,
  } = useAudioStore();

  const [surahText, setSurahText] = useState<SurahText | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tafsirData, setTafsirData] = useState<Record<string, TafsirEntry>>({});
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedTafsirAyah, setSelectedTafsirAyah] = useState<number | null>(null);
  const [openTafsirAyahs, setOpenTafsirAyahs] = useState<Set<number>>(new Set);
  const [showTranslit, setShowTranslit] = useState(false);
  const [viewMode, setViewMode] = useState<ReaderViewMode>('full');
  const [tafsirSource, setTafsirSource] = useState<TafsirSource>('both');
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [ayahBookmarks, setAyahBookmarks] = useState<Set<string>>(new Set());
  const cacheRef = useRef<Map<number, SurahText>>(new Map());
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tafsirScrollRef = useRef<HTMLDivElement>(null);

  const AYAH_BOOKMARK_KEY = 'quran-kareem-ayah-bookmarks';
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AYAH_BOOKMARK_KEY);
      if (stored) setAyahBookmarks(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const toggleAyahBookmark = (ayahKey: string) => {
    setAyahBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(ayahKey)) next.delete(ayahKey);
      else next.add(ayahKey);
      try {
        localStorage.setItem(AYAH_BOOKMARK_KEY, JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  };

  const copyAyah = async (text: string, ayahNumberInSurah: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyah(ayahNumberInSurah);
      setTimeout(() => setCopiedAyah((c) => (c === ayahNumberInSurah ? null : c)), 1500);
    } catch { /* ignore */ }
  };

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
    if (!surahNumber || (!showTafsir && openTafsirAyahs.size === 0)) return;

    const abortController = new AbortController();
    
    const fetchTafsir = async () => {
      setLoadingTafsir(true);
      try {
        const needsAr = tafsirSource === 'both' || tafsirSource === 'muyassar';
        const needsEn = tafsirSource === 'both' || tafsirSource === 'ibn-kathir';

        const [arRes, enRes] = await Promise.all([
          needsAr
            ? fetch(`/api/tafsir/${surahNumber}?tafsir_slug=ar-tafsir-muyassar`, { signal: abortController.signal })
            : Promise.resolve(null),
          needsEn
            ? fetch(`/api/tafsir/${surahNumber}?tafsir_slug=en-tafisr-ibn-kathir`, { signal: abortController.signal })
            : Promise.resolve(null),
        ]);
        
        const arData = arRes ? await arRes.json() : null;
        const enData = enRes ? await enRes.json() : null;
        
        if (abortController.signal.aborted) return;
        
        const combined: Record<string, TafsirEntry> = {};
        
        for (const key of Object.keys(arData?.byVerseKey || {})) {
          combined[key] = {
            verseKey: key,
            arabicText: arData.byVerseKey[key] || '',
            englishText: enData?.byVerseKey?.[key] || '',
          };
        }
        
        for (const key of Object.keys(enData?.byVerseKey || {})) {
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
  }, [surahNumber, showTafsir, openTafsirAyahs, tafsirSource]);

  /* Reset inline tafsir panels when switching surah */
  useEffect(() => {
    setOpenTafsirAyahs(new Set);
  }, [surahNumber]);

  const toggleInlineTafsir = (ayahNumber: number) => {
    setOpenTafsirAyahs(prev => {
      const next = new Set(prev);
      if (next.has(ayahNumber)) {
        next.delete(ayahNumber);
      } else {
        next.add(ayahNumber);
      }
      return next;
    });
  };

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
      const willPlay = !isPlaying;
      togglePlay();
      if (willPlay) {
        try {
          const audio = document.querySelector('audio');
          if (audio && audio.src) {
            audio.play().catch(() => {});
          }
        } catch {}
      }
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
          className="flex flex-col gap-0 p-0 overflow-hidden max-h-[95vh] sm:max-h-[85vh] border-gold/40 sm:max-w-2xl w-[95vw] sm:w-auto"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
          }}
          showCloseButton={false}
        >
          {/* Tafsir Header */}
          <div className="flex-shrink-0 bg-emerald-deep text-ivory px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setShowTafsir(false)}
                  className="p-2.5 rounded-full text-ivory-dim hover:text-gold-bright hover:bg-white/10 transition-all active:scale-95 touch-manipulation"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gold text-gold-bright font-display text-sm sm:text-base flex-shrink-0">
                  {surahInfo?.number}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-ivory font-display text-base sm:text-lg truncate" dir="rtl">
                    التفسير — {surahInfo?.arabicName}
                  </DialogTitle>
                  <DialogDescription className="font-ui text-gold-bright/80 text-xs">
                    Āyah {currentTafsirAyah} of {surahInfo?.ayahCount}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => navigateTafsir('prev')}
                  disabled={currentTafsirAyah <= 1}
                  className="p-2.5 rounded-full text-ivory-dim hover:text-gold-bright hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateTafsir('next')}
                  disabled={currentTafsirAyah >= (surahInfo?.ayahCount || 1)}
                  className="p-2.5 rounded-full text-ivory-dim hover:text-gold-bright hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={closeReadingModal}
                  className="p-2.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/10 active:scale-95 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ayah quick selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {Array.from({ length: surahInfo?.ayahCount || 0 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedTafsirAyah(num)}
                  className={`flex-shrink-0 min-w-[36px] h-9 rounded-full font-ui text-sm font-medium transition-all active:scale-95 ${
                    num === currentTafsirAyah
                      ? 'bg-gold text-ink'
                      : 'bg-white/10 text-ivory-dim hover:bg-white/20'
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
              scrollbarColor: "rgba(199, 161, 92, 0.4) transparent",
            }}
          >
            {loadingTafsir ? (
              <div className="space-y-4">
                <Skeleton className="h-24 bg-gold/15" />
                <Skeleton className="h-32 bg-gold/10" />
              </div>
            ) : tafsirEntry ? (
              <div className="space-y-4">
                {/* Arabic Ayah */}
                {arabicAyah && (
                  <div className="p-4 sm:p-5 rounded-sm bg-[#F1E9D4] border border-gold/30">
                    <span className="eyebrow mb-2 block text-maroon">Āyah</span>
                    <p
                      className="arabic-name text-lg sm:text-xl leading-loose text-emerald-deep"
                    >
                      {arabicAyah.text}
                      <span className="inline-block mx-1 text-sm text-maroon/60">
                        ﴿{arabicAyah.numberInSurah}﴾
                      </span>
                    </p>
                  </div>
                )}

                {/* Arabic Tafsir */}
                {tafsirEntry.arabicText && (
                  <div className="p-4 sm:p-5 rounded-sm border-l-4 border-gold bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Khatam className="h-3 w-3 text-maroon" />
                      <span className="eyebrow text-[9.5px] text-maroon">التفسير الميسر · Arabic</span>
                    </div>
                    <p
                      className="arabic-name text-base leading-loose text-ink"
                      dangerouslySetInnerHTML={{ __html: sanitizeTafsir(tafsirEntry.arabicText) }}
                    />
                  </div>
                )}

                {/* English Tafsir */}
                {tafsirEntry.englishText && (
                  <div className="p-4 sm:p-5 rounded-sm border-l-4 border-emerald-deep bg-white/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-mid" />
                      <span className="eyebrow text-[9.5px] text-emerald-mid">Tafsir Ibn Kathir · English</span>
                    </div>
                    <p
                      className="font-serif text-base leading-relaxed text-[#2C2418]"
                      dangerouslySetInnerHTML={{ __html: sanitizeTafsir(tafsirEntry.englishText) }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <BookOpen className="w-10 h-10 text-gold/40" />
                <p className="font-ui text-muted-foreground text-sm">No tafsir available for this āyah</p>
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
        className="flex flex-col gap-0 p-0 overflow-hidden max-h-[95vh] sm:max-h-[85vh] border-gold/40 sm:max-w-lg w-[95vw] sm:w-auto"
        style={{
          background: "var(--paper)",
          color: "var(--ink)",
        }}
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-emerald-deep text-ivory px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gold text-gold-bright font-display text-sm sm:text-base flex-shrink-0">
                {surahInfo?.number}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-ivory font-display text-base sm:text-xl truncate" dir="rtl">
                  {surahInfo?.arabicName}
                  <span className="ml-2 align-middle font-ui text-xs tracking-wide text-gold-bright" dir="ltr">
                    {surahInfo?.englishName}
                  </span>
                </DialogTitle>
                <DialogDescription className="font-ui text-gold-bright/80 text-[11px] uppercase tracking-wider">
                  {surahInfo?.englishMeaning} · {surahInfo?.ayahCount} āyāt ·{" "}
                  {surahInfo?.revelationType === 'Meccan' ? 'Makkan' : 'Madani'}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {isViewingPlayingSurah && isPlaying && (
                <span className="hidden sm:inline-flex items-center gap-1.5 font-ui text-[11px] text-gold-bright bg-gold/15 px-2 py-1 rounded-full border border-gold/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                  </span>
                  Āyah {currentAyah}
                </span>
              )}

              <button
                onClick={() => setShowTranslations(!showTranslations)}
                className={`p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                  showTranslations || selectedTranslations.length > 1
                    ? 'bg-gold/20 text-gold-bright'
                    : 'text-ivory-dim hover:text-gold-bright hover:bg-white/10'
                }`}
                aria-label="Toggle translations"
              >
                <Languages className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowTranslit((v) => !v)}
                className={`p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                  showTranslit
                    ? 'bg-gold/20 text-gold-bright'
                    : 'text-ivory-dim hover:text-gold-bright hover:bg-white/10'
                }`}
                aria-label="Toggle transliteration"
                title="Transliteration"
              >
                <AlignJustify className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayToggle}
                className={`p-2.5 sm:p-3 rounded-full transition-all active:scale-95 touch-manipulation ${
                  isCurrentlyPlaying
                    ? "bg-gold text-ink hover:bg-gold-bright"
                    : "bg-white/10 text-ivory hover:bg-white/20"
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
                className="p-2.5 text-ivory-dim hover:text-gold-bright transition-colors rounded-full hover:bg-white/10 active:scale-95 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setShowTafsir(true); setSelectedTafsirAyah(1); }}
                className={`p-2.5 rounded-full transition-all active:scale-95 touch-manipulation ${
                  showTafsir ? 'bg-gold/20 text-gold-bright' : 'text-ivory-dim hover:text-gold-bright hover:bg-white/10'
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

          {/* Reader controls: view mode, reciter, tafsir source */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full bg-white/10 p-0.5">
              {VIEW_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setViewMode(m.value)}
                  className={`px-3 py-1 rounded-full font-ui text-xs font-medium transition-all ${
                    viewMode === m.value ? 'bg-gold text-ink' : 'text-ivory-dim hover:text-gold-bright'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <Select value={currentReciter} onValueChange={setCurrentReciter}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-full bg-white/10 border-gold/30 text-ivory text-xs px-3">
                <SelectValue placeholder="Reciter" />
              </SelectTrigger>
              <SelectContent className="bg-paper border-gold/40 max-h-60">
                {RECITER_OPTIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="font-ui text-xs">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tafsirSource} onValueChange={(v) => setTafsirSource(v as TafsirSource)}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-full bg-white/10 border-gold/30 text-ivory text-xs px-3">
                <SelectValue placeholder="Tafsir" />
              </SelectTrigger>
              <SelectContent className="bg-paper border-gold/40">
                {TAFSIR_SOURCES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="font-ui text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(showTranslations || selectedTranslations.length > 1) && (
            <div className="mt-3">
              <TranslationSelector />
            </div>
          )}

          {surahNumber !== 9 && surahNumber !== 1 && (
            <div className="mt-3 text-center">
              <p className="arabic-name basmala-glow text-lg sm:text-xl text-gold-bright">
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
            scrollbarColor: "rgba(199, 161, 92, 0.4) transparent",
          }}
        >
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full bg-gold/20 flex-shrink-0" />
                    <Skeleton className="h-5 w-3/4 bg-gold/10" />
                  </div>
                  <Skeleton className="h-3 w-5/6 bg-emerald-deep/10 ml-9" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="font-ui text-destructive text-sm text-center px-4">{error}</p>
              <button
                onClick={() => fetchSurahText()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-deep text-ivory rounded-sm hover:bg-emerald-mid transition-colors font-ui text-sm touch-manipulation"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {surahText && !loading && !error && (
            <div className="divide-y divide-emerald-deep/10">
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
                    className={`group p-3 sm:p-4 transition-all duration-300 touch-manipulation ${
                      isCurrentPlayingAyah
                        ? "bg-gold/10 shadow-[inset_3px_0_0_var(--gold)]"
                        : isBasmalaAyah
                        ? "bg-gold/5"
                        : "hover:bg-emerald-deep/[0.03]"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div
                        className={`flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mt-1 rounded-full font-display text-[11px] sm:text-xs border transition-all duration-300 ${
                          isCurrentPlayingAyah
                            ? "bg-gold text-ink border-gold"
                            : isBasmalaAyah
                            ? "bg-gold/10 text-maroon border-maroon/40"
                            : "border-maroon/50 text-maroon"
                        }`}
                      >
                        {isCurrentPlayingAyah ? (
                          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink opacity-60" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-ink" />
                          </span>
                        ) : (
                          ayah.numberInSurah
                        )}
                      </div>

                      <p
                        className={`arabic-name flex-1 leading-loose transition-colors duration-300 ${
                          isCurrentPlayingAyah ? "text-emerald-deep" : "text-ink"
                        }`}
                        style={{ fontSize: "clamp(18px, 4vw, 22px)" }}
                      >
                        {ayah.text}
                        <span className={`inline-block mx-1 text-sm ${isCurrentPlayingAyah ? "text-gold" : "text-maroon/50"}`}>
                          ﴿{ayah.numberInSurah}﴾
                         </span>
                       </p>
                    </div>

                    {showTranslit && surahText.translitAyahs?.[index] && (
                      <p className="font-ui text-sm italic text-muted-foreground mt-1.5 ml-9 sm:ml-11" dir="ltr">
                        {surahText.translitAyahs[index].text}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-2">
                      <button
                        onClick={() => copyAyah(ayah.text, ayah.numberInSurah)}
                        className="p-1.5 rounded-full text-maroon/70 hover:text-emerald-deep hover:bg-gold/10 transition-colors active:scale-95 touch-manipulation"
                        aria-label="Copy ayah"
                        title="Copy"
                      >
                        {copiedAyah === ayah.numberInSurah ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => toggleAyahBookmark(`${surahNumber}:${ayah.numberInSurah}`)}
                        className={`p-1.5 rounded-full transition-colors active:scale-95 touch-manipulation ${
                          ayahBookmarks.has(`${surahNumber}:${ayah.numberInSurah}`)
                            ? "text-gold hover:text-gold-bright hover:bg-gold/10"
                            : "text-maroon/70 hover:text-emerald-deep hover:bg-gold/10"
                        }`}
                        aria-label="Bookmark ayah"
                        title="Bookmark"
                      >
                        {ayahBookmarks.has(`${surahNumber}:${ayah.numberInSurah}`) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>

                    {viewMode !== 'arabic' && surahText.englishAyahs[index] && (
                      <p className={`font-serif text-base leading-relaxed mt-3 ml-9 sm:ml-11 transition-colors duration-300 ${
                        isCurrentPlayingAyah ? "text-[#2C2418]" : "text-muted-foreground"
                      }`}>
                        <span className="font-ui text-[10px] uppercase tracking-wider mr-2 text-maroon">EN</span>
                        {surahText.englishAyahs[index].text}
                      </p>
                    )}

                    {viewMode !== 'arabic' && selectedTranslations.filter(t => t !== 'english').map((lang) => {
                      const translationKey = `${lang}Ayahs` as keyof SurahText;
                      const translation = surahText[translationKey] as AyahText[] | undefined;
                      const langInfo = TRANSLATION_LANGUAGES[lang];

                      if (!translation || !translation[index]) return null;

                      return (
                        <p
                          key={lang}
                          className={`font-serif text-base leading-relaxed mt-2 ml-9 sm:ml-11 transition-colors duration-300 ${
                            isCurrentPlayingAyah ? "text-[#2C2418]/90" : "text-muted-foreground"
                          } ${
                            langInfo.rtl ? "pr-4" : ""
                          }`}
                          style={{
                            direction: langInfo.rtl ? "rtl" : "ltr",
                            fontFamily: langInfo.rtl ? "var(--font-amiri), 'Amiri', serif" : undefined,
                          }}
                        >
                                          <span className="font-ui text-[10px] uppercase tracking-wider mr-2 text-maroon/70">
                            {langInfo.flag}
                          </span>
                          {translation[index].text}
                        </p>
                      );
                    })}

                    {/* Per-ayah tafsir (Arabic + English) */}
                    {viewMode === 'full' && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleInlineTafsir(ayah.numberInSurah)}
                          className="font-ui flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-mid transition-colors hover:text-maroon"
                          aria-expanded={openTafsirAyahs.has(ayah.numberInSurah)}
                        >
                          <Khatam className="h-[11px] w-[11px]" />
                          {openTafsirAyahs.has(ayah.numberInSurah) ? "Hide tafsir" : "Show tafsir"}
                        </button>

                        {openTafsirAyahs.has(ayah.numberInSurah) && (
                          <div className="mt-3 rounded-sm border-l-4 border-gold bg-[#F1E9D4] p-4">
                            {loadingTafsir ? (
                              <div className="flex items-center gap-2 py-1 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="font-ui text-xs">Loading tafsir…</span>
                              </div>
                            ) : (
                              <InlineTafsir entry={tafsirData[`${surahNumber}:${ayah.numberInSurah}`]} />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Surah navigation footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gold/30 bg-emerald-deep text-ivory">
          <button
            onClick={() => {
              const prevNum = surahNumber <= 1 ? 114 : surahNumber - 1;
              const prevInfo = getSurahInfo(prevNum);
              if (prevInfo) openReadingModal(prevInfo);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-ui text-xs touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="truncate max-w-[40vw]">{surahNumber <= 1 ? 'Al-Nas' : getSurahInfo(surahNumber - 1)?.englishName}</span>
          </button>
          <button
            onClick={() => {
              const nextNum = surahNumber >= 114 ? 1 : surahNumber + 1;
              const nextInfo = getSurahInfo(nextNum);
              if (nextInfo) openReadingModal(nextInfo);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-ui text-xs touch-manipulation"
          >
            <span className="truncate max-w-[40vw]">{surahNumber >= 114 ? 'Al-Fatiha' : getSurahInfo(surahNumber + 1)?.englishName}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

function InlineTafsir({ entry }: { entry?: TafsirEntry }) {
  if (!entry || (!entry.arabicText && !entry.englishText)) {
    return (
      <p className="font-ui text-xs text-muted-foreground">No tafsir available for this āyah.</p>
    );
  }
  return (
    <>
      {entry.arabicText && (
        <>
          <span className="eyebrow mb-1.5 block text-[9.5px] text-maroon">التفسير الميسر · Arabic</span>
          <p
            className="arabic-name text-base leading-loose text-emerald-deep"
            dangerouslySetInnerHTML={{ __html: sanitizeTafsir(entry.arabicText) }}
          />
        </>
      )}
      {entry.englishText && (
        <div className={entry.arabicText ? "mt-3.5 border-t border-dashed border-emerald-deep/20 pt-3.5" : ""}>
          <span className="eyebrow mb-1.5 block text-[9.5px] text-maroon">Tafsir Ibn Kathir · English</span>
          <p
            className="font-serif text-sm leading-relaxed text-[#2C2418]"
            dangerouslySetInnerHTML={{ __html: sanitizeTafsir(entry.englishText) }}
          />
        </div>
      )}
    </>
  );
}
