import { create } from "zustand";
import { RECITERS, SURAH_DATA, RADIO_STATIONS, getStationsByCategory } from "./quran-data";
import type { Surah, Reciter, TranslationLanguage, RadioStation } from "./quran-types";
import { getSurahInfo } from "./quran-utils";

type RevelationFilter = "All" | "Meccan" | "Medinan";
type ViewMode = "list" | "grid";

interface AudioState {
  // Audio playback state
  currentSurah: Surah | null;
  isPlaying: boolean;
  currentReciter: string;
  isBuffering: boolean;
  audioError: string | null;
  isUsingFallback: boolean;
  currentAyahInSurah: number;  // Track current ayah (1-based)
  playbackSpeed: number;  // Playback speed (0.5 to 2.0)
  bookmarks: Record<string, number>;  // Bookmarks: surahKey -> currentTime
  theme: 'light' | 'dark' | 'system';  // Theme preference
  recentlyPlayed: number[];  // Recently played surah numbers

  // Translation state
  selectedTranslations: TranslationLanguage[];
  showTranslations: boolean;

  // UI state - main page
  searchQuery: string;
  revelationFilter: RevelationFilter;
  viewMode: ViewMode;

  // UI state - panels
  isPlayerVisible: boolean;
  showSurahModal: boolean;
  surahModalNumber: number;
  showReciterPanel: boolean;
  isReciterPanelOpen: boolean;

  // Computed helpers
  filteredSurahs: () => Surah[];
  meccanCount: number;
  medinanCount: number;
  reciter: Reciter;

  // Audio actions
  play: (surahNumber: number) => void;
  playSurah: (surah: Surah) => void;
  setIsPlaying: (playing: boolean) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  setCurrentReciter: (reciterId: string) => void;
  setReciter: (reciter: Reciter) => void;
  setIsBuffering: (buffering: boolean) => void;
  setAudioError: (error: string | null) => void;
  setIsUsingFallback: (using: boolean) => void;
  setCurrentAyah: (ayahNumber: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  saveBookmark: (surahKey: string, currentTime: number) => void;
  loadBookmark: (surahKey: string) => number | null;
  clearBookmark: (surahKey: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToRecentlyPlayed: (surahNumber: number) => void;
  nextSurah: () => void;
  prevSurah: () => void;
  togglePlay: () => void;

  // Translation actions
  toggleTranslation: (lang: TranslationLanguage) => void;
  setShowTranslations: (show: boolean) => void;

  // UI setters
  setSearchQuery: (query: string) => void;
  setRevelationFilter: (filter: RevelationFilter) => void;
  setViewMode: (mode: ViewMode) => void;

  // Player visibility
  showPlayer: () => void;
  hidePlayer: () => void;

  // Surah modal
  setShowSurahModal: (show: boolean) => void;
  setSurahModalNumber: (number: number) => void;
  openReadingModal: (surah: Surah) => void;
  closeReadingModal: () => void;
  readingModalSurah: Surah | null;

  // Radio
  isRadioMode: boolean;
  currentRadioId: string | null;
  currentRadio: RadioStation | null;
  isRadioPlaying: boolean;
  showRadioPanel: boolean;
  setRadioMode: (radio: RadioStation | null) => void;
  stopRadio: () => void;
  cycleRadioStation: (direction: 1 | -1) => void;
  toggleRadioPanel: () => void;

  // Reciter panel
  setShowReciterPanel: (show: boolean) => void;
  toggleReciterPanel: () => void;
  closeReciterPanel: () => void;
}



// Load bookmarks from localStorage
const loadBookmarks = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('quran-kareem-bookmarks');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Apply theme to document
const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  root.classList.remove('light', 'dark');
  root.classList.add(effectiveTheme);
};

// Load theme from localStorage
const loadTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('quran-kareem-theme');
    return (stored as 'light' | 'dark' | 'system') || 'system';
  } catch {
    return 'system';
  }
};

// Load recently played from localStorage
const loadRecentlyPlayed = (): number[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('quran-kareem-recently-played');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

let hydrated = false;
export const hydrateStore = () => {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  const store = useAudioStore.getState();
  const bookmarks = loadBookmarks();
  const theme = loadTheme();
  const recentlyPlayed = loadRecentlyPlayed();
  const needsUpdate =
    Object.keys(bookmarks).length > 0 ||
    theme !== 'system' ||
    recentlyPlayed.length > 0;
  if (needsUpdate) {
    store.setTheme(theme);
    useAudioStore.setState({ bookmarks, recentlyPlayed });
  }
};

export const useAudioStore = create<AudioState>((set, get) => {
  const meccanCount = SURAH_DATA.filter((s) => s.revelationType === "Meccan").length;
  const medinanCount = SURAH_DATA.filter((s) => s.revelationType === "Medinan").length;

  return {
    // Audio playback state
    currentSurah: null,
    isPlaying: false,
    currentReciter: RECITERS[0].id, // Mishary Alafasy default
    isBuffering: false,
    audioError: null,
    isUsingFallback: false,
    currentAyahInSurah: 1,  // Start at first ayah
    playbackSpeed: 1.0,  // Normal speed
    bookmarks: {},  // Hydrated from localStorage after mount
    theme: 'system' as const,  // Hydrated from localStorage after mount
    recentlyPlayed: [],  // Hydrated from localStorage after mount

    // Translation state
    selectedTranslations: ['english'],
    showTranslations: false,

    // UI state - main page
    searchQuery: "",
    revelationFilter: "All" as RevelationFilter,
    viewMode: "list" as ViewMode,

    // Radio state
    isRadioMode: false,
    currentRadioId: null,
    currentRadio: null,
    isRadioPlaying: false,
    showRadioPanel: false,

    // UI state - panels
    isPlayerVisible: false,
    showSurahModal: false,
    surahModalNumber: 1,
    showReciterPanel: false,
    isReciterPanelOpen: false,

    // Computed helpers
    filteredSurahs: () => {
      const { searchQuery, revelationFilter } = get();
      return SURAH_DATA.filter((surah) => {
        const matchesSearch =
          searchQuery === "" ||
          surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          surah.arabicName.includes(searchQuery) ||
          surah.englishMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
          surah.number.toString() === searchQuery;

        const matchesFilter =
          revelationFilter === "All" || surah.revelationType === revelationFilter;

        return matchesSearch && matchesFilter;
      });
    },
    meccanCount,
    medinanCount,
    reciter: RECITERS[0],

    // Audio actions
    play: (surahNumber) => {
      const surahInfo = getSurahInfo(surahNumber);
      if (!surahInfo) return;
      set({
        currentSurah: surahInfo,
        isPlaying: true,
        isPlayerVisible: true,
        isBuffering: true,
        audioError: null,
        isUsingFallback: false,
        currentAyahInSurah: 1,  // Reset to first ayah
      });
    },

    playSurah: (surah) => {
      set({
        currentSurah: surah,
        isPlaying: true,
        isPlayerVisible: true,
        isBuffering: true,
        audioError: null,
        isUsingFallback: false,
        currentAyahInSurah: 1,  // Reset to first ayah
      });
      // Add to recently played
      get().addToRecentlyPlayed(surah.number);
    },

    setIsPlaying: (playing) => set({ isPlaying: playing }),

    pauseAudio: () => set({ isPlaying: false }),
    resumeAudio: () => set({ isPlaying: true }),

    setCurrentReciter: (reciterId) => {
      const reciterObj = RECITERS.find((r) => r.id === reciterId);
      set({ currentReciter: reciterId, reciter: reciterObj ?? RECITERS[0] });
    },

    setReciter: (reciter) => set({ currentReciter: reciter.id, reciter }),

    setIsBuffering: (buffering) => set({ isBuffering: buffering }),

    setAudioError: (error) => set({ audioError: error }),

    setIsUsingFallback: (using) => set({ isUsingFallback: using }),

    setCurrentAyah: (ayahNumber) => set({ currentAyahInSurah: ayahNumber }),

    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    saveBookmark: (surahKey, currentTime) => {
      const bookmarks = { ...get().bookmarks };
      bookmarks[surahKey] = currentTime;
      set({ bookmarks });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('quran-kareem-bookmarks', JSON.stringify(bookmarks));
      }
    },

    loadBookmark: (surahKey) => {
      const { bookmarks } = get();
      return bookmarks[surahKey] || null;
    },

    clearBookmark: (surahKey) => {
      const bookmarks = { ...get().bookmarks };
      delete bookmarks[surahKey];
      set({ bookmarks });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('quran-kareem-bookmarks', JSON.stringify(bookmarks));
      }
    },

    setTheme: (theme) => {
      set({ theme });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('quran-kareem-theme', theme);
      }

      // Apply theme immediately
      applyTheme(theme);
    },

    addToRecentlyPlayed: (surahNumber) => {
      const recentlyPlayed = [...get().recentlyPlayed];
      // Remove if already exists
      const index = recentlyPlayed.indexOf(surahNumber);
      if (index > -1) {
        recentlyPlayed.splice(index, 1);
      }
      // Add to beginning
      recentlyPlayed.unshift(surahNumber);
      // Keep only last 10
      const trimmed = recentlyPlayed.slice(0, 10);
      set({ recentlyPlayed: trimmed });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('quran-kareem-recently-played', JSON.stringify(trimmed));
      }
    },

    nextSurah: () => {
      const { currentSurah } = get();
      const currentNum = currentSurah?.number ?? 0;
      const nextNum = currentNum >= 114 ? 1 : currentNum + 1;
      const surahInfo = getSurahInfo(nextNum);
      if (!surahInfo) return;
      set({
        currentSurah: surahInfo,
        isPlaying: true,
        isBuffering: true,
        audioError: null,
        isUsingFallback: false,
        currentAyahInSurah: 1,  // Reset to first ayah
      });
    },

    prevSurah: () => {
      const { currentSurah } = get();
      const currentNum = currentSurah?.number ?? 2;
      const prevNum = currentNum <= 1 ? 114 : currentNum - 1;
      const surahInfo = getSurahInfo(prevNum);
      if (!surahInfo) return;
      set({
        currentSurah: surahInfo,
        isPlaying: true,
        isBuffering: true,
        audioError: null,
        isUsingFallback: false,
        currentAyahInSurah: 1,  // Reset to first ayah
      });
    },

    togglePlay: () => {
      const { isPlaying } = get();
      set({ isPlaying: !isPlaying });
    },

    // Translation actions
    toggleTranslation: (lang) => {
      const { selectedTranslations } = get();
      const isSelected = selectedTranslations.includes(lang);
      
      if (isSelected) {
        // Remove translation (keep at least English)
        if (selectedTranslations.length > 1) {
          set({ 
            selectedTranslations: selectedTranslations.filter(t => t !== lang) 
          });
        }
      } else {
        // Add translation (max 5)
        if (selectedTranslations.length < 5) {
          set({ 
            selectedTranslations: [...selectedTranslations, lang] 
          });
        }
      }
    },

    setShowTranslations: (show) => set({ showTranslations: show }),

    // UI setters
    setSearchQuery: (query) => set({ searchQuery: query }),
    setRevelationFilter: (filter) => set({ revelationFilter: filter }),
    setViewMode: (mode) => set({ viewMode: mode }),

    // Player visibility
    showPlayer: () => set({ isPlayerVisible: true }),
    hidePlayer: () => set({ 
      isPlayerVisible: false, 
      isPlaying: false, 
      audioError: null, 
      currentAyahInSurah: 1,
      showTranslations: false
    }),

    // Surah modal
    setShowSurahModal: (show) => set({ showSurahModal: show }),
    setSurahModalNumber: (number) => set({ surahModalNumber: number }),
    openReadingModal: (surah) =>
      set({
        showSurahModal: true,
        surahModalNumber: surah.number,
        readingModalSurah: surah,
        currentAyahInSurah: 1,
      }),
    closeReadingModal: () =>
      set({ 
        showSurahModal: false, 
        readingModalSurah: null, 
        currentAyahInSurah: 1,
        showTranslations: false
      }),
    readingModalSurah: null,

    // Radio
    setRadioMode: (radio) =>
      set((state) => {
        if (!radio) {
          return {
            isRadioMode: false,
            currentRadioId: null,
            currentRadio: null,
            isRadioPlaying: false,
            isPlayerVisible: false,
            isPlaying: false,
            showRadioPanel: false,
          };
        }
        return {
          isRadioMode: true,
          currentRadioId: radio.id,
          currentRadio: radio,
          isRadioPlaying: true,
          isPlayerVisible: true,
          isPlaying: false,
          currentSurah: null,
          audioError: null,
          isBuffering: true,
          showRadioPanel: false,
        };
      }),
    stopRadio: () =>
      set({
        isRadioMode: false,
        currentRadioId: null,
        currentRadio: null,
        isRadioPlaying: false,
        isPlayerVisible: false,
        isPlaying: false,
        showRadioPanel: false,
      }),
    cycleRadioStation: (direction) =>
      set((state) => {
        const { currentRadio } = state;
        if (!currentRadio) return {};
        const same = getStationsByCategory(currentRadio.category);
        const idx = same.findIndex((s) => s.id === currentRadio.id);
        if (idx < 0 || same.length <= 1) return {};
        const next = same[(idx + direction + same.length) % same.length];
        return {
          currentRadio: next,
          currentRadioId: next.id,
          isRadioPlaying: true,
          isBuffering: true,
          audioError: null,
        };
      }),
    toggleRadioPanel: () =>
      set((state) => ({
        showRadioPanel: !state.showRadioPanel,
      })),

    // Reciter panel
    setShowReciterPanel: (show) => set({ showReciterPanel: show }),
    toggleReciterPanel: () =>
      set((state) => ({
        showReciterPanel: !state.showReciterPanel,
        isReciterPanelOpen: !state.isReciterPanelOpen,
      })),
    closeReciterPanel: () => set({ showReciterPanel: false, isReciterPanelOpen: false }),
  };
});
