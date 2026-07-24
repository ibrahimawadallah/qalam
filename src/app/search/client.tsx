"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteNav from "@/components/site-nav";
import { Search, BookOpen, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

type SearchMatch = {
  number: number;
  text: string;
  surah: {
    number: number;
    englishName: string;
    numberOfAyahs: number;
  };
  edition: {
    identifier: string;
    language: string;
    name: string;
  };
};

type SearchResponse = {
  code: number;
  status: string;
  data: {
    matches: SearchMatch[];
    count: number;
    page: number;
    totalPages: number;
    totalCount: number;
    currentPage: number;
  };
};

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function getSurahName(num: number): string {
  const surah = [
    "Al-Fatihah", "Al-Baqarah", "Aal-E-Imran", "An-Nisa", "Al-Ma'idah",
    "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
    "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr",
    "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
  ];
  const more = [
    "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
    "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
    "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir",
    "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
    "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
    "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
    "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
    "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
    "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
    "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
    "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
    "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
    "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
    "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
    "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
    "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
    "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil",
    "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
    "Al-Masad", "An-Nas", "Al-Falaq",
  ];
  if (num <= 20) return surah[num - 1] || `Surah ${num}`;
  return more[num - 21] || `Surah ${num}`;
}

export default function QuranSearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialSurah = searchParams.get("surah") || "all";
  const initialEdition = searchParams.get("edition") || "en";

  const [query, setQuery] = useState(initialQuery);
  const [surah, setSurah] = useState(initialSurah);
  const [edition, setEdition] = useState(initialEdition);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [isArabic, setIsArabic] = useState(() => containsArabic(initialQuery));

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const executeSearch = useCallback(
    async (pageNum = 1, searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) {
        setError("Please enter at least 2 characters to search.");
        return;
      }

      setLoading(true);
      setError(null);
      setSearched(true);
      setPage(pageNum);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          surah,
          edition: containsArabic(trimmed) ? "ar" : edition,
          page: String(pageNum),
          limit: containsArabic(trimmed) ? "10" : "20",
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const res = await fetch(`/api/quran-search?${params.toString()}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as SearchResponse;
        setResults(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [surah, edition]
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed) {
      setSearched(true);
      executeSearch(1, trimmed);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        executeSearch(1, query);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [query, executeSearch]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setIsArabic(containsArabic(value));

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const trimmed = value.trim();
      if (trimmed.length >= 2) {
        debounceRef.current = setTimeout(() => {
          executeSearch(1, trimmed);
        }, 600);
      }
    },
    [executeSearch]
  );

  const totalPages = results?.totalPages ?? 1;
  const currentPage = results?.currentPage ?? page;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0518" }}>
      <SiteNav />
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-amber-200 mb-2">Quran Search</h1>
          <p className="text-amber-300/60 text-sm">Search across the Holy Quran by keyword, surah, or translation</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4 sm:p-6">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300/50" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeSearch(1, query)}
                  placeholder="Search the Quran... (e.g. mercy, patience, Allah)"
                  className="w-full rounded-lg border border-purple-500/20 bg-purple-500/5 pl-9 pr-3 py-2 text-sm text-purple-100 placeholder:text-purple-300/40 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                />
              </div>
              <button
                onClick={() => executeSearch(1, query)}
                disabled={loading || query.trim().length < 2}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-[#0a0518] hover:bg-purple-400 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={surah}
                onChange={(e) => setSurah(e.target.value)}
                className="flex-1 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-sm text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              >
                <option value="all" className="bg-[#0a0518] text-purple-100">All Surahs</option>
                {Array.from({ length: 114 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="bg-[#0a0518] text-purple-100">
                    {num}. {getSurahName(num)}
                  </option>
                ))}
              </select>

              <select
                value={isArabic ? "ar" : edition}
                onChange={(e) => setEdition(e.target.value)}
                className="flex-1 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-sm text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              >
                <option value="en" className="bg-[#0a0518] text-purple-100">English (all)</option>
                <option value="en.sahih" className="bg-[#0a0518] text-purple-100">Sahih International</option>
                <option value="en.pickthall" className="bg-[#0a0518] text-purple-100">Pickthall</option>
                <option value="en.yusufali" className="bg-[#0a0518] text-purple-100">Yusuf Ali</option>
                <option value="ar" className="bg-[#0a0518] text-purple-100">Arabic (all)</option>
                <option value="quran-uthmani" className="bg-[#0a0518] text-purple-100">Uthmani Script</option>
              </select>
            </div>

            <p className="mt-2 text-[11px] text-purple-300/40">
              Tip: Press Enter or Ctrl+Enter to search
            </p>
            {isArabic && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 p-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-300/80">
                  Arabic searches may take longer because some queries match thousands of verses.
                  Showing {results?.matches?.length ?? 10} results per page.
                </p>
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-purple-300/60">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                {isArabic ? "Searching Arabic text — this may take a moment..." : "Searching the Quran..."}
              </span>
            </div>
          )}

          {results && !loading && (
            <div className="mt-6">
              <p className="mb-4 text-sm text-purple-300/60">
                Found <span className="font-semibold text-purple-200">{results.totalCount}</span> matches for &ldquo;{query}&rdquo;
              </p>

              <div className="space-y-4">
                {results.matches.map((match) => (
                  <div
                    key={match.number}
                    className="rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4 sm:p-6 hover:border-purple-500/20 transition-colors"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <a
                        href={`/quran?surah=${match.surah.number}`}
                        className="flex items-center gap-1.5 text-xs text-purple-300/60 hover:text-purple-200"
                      >
                        <BookOpen className="h-3 w-3" />
                        {match.surah.englishName} ({match.surah.number}:{match.surah.numberOfAyahs})
                      </a>
                      <span className="text-[10px] text-purple-300/40">
                        #{match.number}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-purple-100">
                      {match.text}
                    </p>
                  </div>
                ))}
              </div>

              {results.matches.length === 0 && (
                <div className="rounded-2xl border border-purple-500/10 bg-purple-500/5 p-8 text-center">
                  <p className="text-purple-300/60">No matches found. Try a different keyword or translation.</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => executeSearch(Math.max(1, currentPage - 1), query)}
                    disabled={currentPage <= 1 || loading}
                    className="flex items-center gap-1 rounded-lg border border-purple-500/20 px-4 py-2 text-sm text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-xs text-purple-300/50">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => executeSearch(Math.min(totalPages, currentPage + 1), query)}
                    disabled={currentPage >= totalPages || loading}
                    className="flex items-center gap-1 rounded-lg border border-purple-500/20 px-4 py-2 text-sm text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {!searched && !loading && (
            <div className="mt-12 rounded-2xl border border-purple-500/10 bg-purple-500/5 p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-purple-300/30 mb-3" />
              <p className="text-purple-300/60 text-sm">
                Search for words, phrases, or themes across the Holy Quran
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["mercy", "patience", "gratitude", "paradise", "forgiveness"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      executeSearch(1, term);
                    }}
                    className="rounded-full border border-purple-500/20 px-3 py-1 text-xs text-purple-300/70 hover:bg-purple-500/10"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
