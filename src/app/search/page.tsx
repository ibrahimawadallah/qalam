"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SiteNav from "@/components/site-nav";
import { Search, BookOpen } from "lucide-react";

type SearchMatch = {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
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

export default function QuranSearchPage() {
  const [query, setQuery] = useState("");
  const [surah, setSurah] = useState("all");
  const [edition, setEdition] = useState("en");
  const [results, setResults] = useState<SearchResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: trimmed,
        surah,
        edition,
      });
      const res = await fetch(`/api/quran-search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const json = (await res.json()) as SearchResponse;
      setResults(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, surah, edition]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSearch();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleSearch]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (containsArabic(value)) {
      setEdition("ar");
    } else {
      setEdition("en");
    }
  }, []);

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
                  placeholder="Search the Quran... (e.g. mercy, patience, Allah)"
                  className="w-full rounded-lg border border-purple-500/20 bg-purple-500/5 pl-9 pr-3 py-2 text-sm text-purple-100 placeholder:text-purple-300/40 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-[#0a0518] hover:bg-purple-400 disabled:opacity-50"
              >
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
                value={edition}
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
              Tip: Press Ctrl+Enter to search
            </p>
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

          {results && (
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
                      handleSearch();
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
