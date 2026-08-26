"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from 'next-intl';
import { useSearchParams } from "next/navigation";
import PageHead from "@/components/page-head";
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
  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";
  const initialSurah = searchParams?.get("surah") || "all";
  const initialEdition = searchParams?.get("edition") || "en";

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
        setError(t('atLeastTwoChars'));
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
        setError(e instanceof Error ? e.message : tCommon('unknownError'));
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
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>

      <main className="mx-auto max-w-[920px] px-6 py-10 page-enter">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-sm border border-gold bg-paper p-4 shadow-[var(--shadow-deep)] sm:p-6">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeSearch(1, query)}
                  placeholder={t('placeholder')}
                  className="w-full rounded-sm border border-gold/40 bg-white/60 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <button
                onClick={() => executeSearch(1, query)}
                disabled={loading || query.trim().length < 2}
                className="rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-emerald-mid disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? t('searchingText') : t('searchButton')}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={surah}
                onChange={(e) => setSurah(e.target.value)}
                className="flex-1 rounded-sm border border-gold/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="all" className="bg-background text-foreground">{t('allSurahs')}</option>
                {Array.from({ length: 114 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="bg-background text-foreground">
                    {num}. {getSurahName(num)}
                  </option>
                ))}
              </select>

              <select
                value={isArabic ? "ar" : edition}
                onChange={(e) => setEdition(e.target.value)}
                className="flex-1 rounded-sm border border-gold/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="en" className="bg-background text-foreground">{t('englishAll')}</option>
                <option value="en.sahih" className="bg-background text-foreground">{t('sahihInternational')}</option>
                <option value="en.pickthall" className="bg-background text-foreground">{t('pickthall')}</option>
                <option value="en.yusufali" className="bg-background text-foreground">{t('yusufAli')}</option>
                <option value="ar" className="bg-background text-foreground">{t('arabicAll')}</option>
                <option value="quran-uthmani" className="bg-background text-foreground">{t('uthmaniScript')}</option>
              </select>
            </div>

            <p className="mt-2 font-ui text-[11px] text-muted-foreground/60">
              {t('tip')}
            </p>
            {isArabic && (
              <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-maroon/20 bg-maroon/5 p-2">
                <AlertCircle className="h-3.5 w-3.5 text-maroon mt-0.5 shrink-0" />
                <p className="text-[11px] text-maroon/80">
                  {t.rich('arabicSearchWarning', {
                    count: results?.matches?.length ?? 10,
                  })}
                </p>
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                {isArabic ? t('searchingArabic') : t('searchingQuran')}
              </span>
            </div>
          )}

          {results && !loading && (
            <div className="mt-8">
              <p className="mb-4 font-ui text-sm text-muted-foreground">
                {t.rich('foundMatches', {
                  n: results.totalCount,
                  query: query,
                })}
              </p>

              <div className="space-y-3">
                {results.matches.map((match) => (
                  <a
                    key={match.number}
                    href={`/quran?surah=${match.surah.number}`}
                    className="warm-card-hover block rounded-sm p-4 sm:p-6 group"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-ui text-xs text-emerald-deep group-hover:text-maroon transition-colors">
                        <BookOpen className="h-3 w-3" />
                        {match.surah.englishName} ({match.surah.number}:{match.surah.numberOfAyahs})
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        #{match.number}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed text-ink ${containsArabic(match.text) ? "arabic-name text-base" : ""}`} dir={containsArabic(match.text) ? "rtl" : undefined} style={containsArabic(match.text) ? { textAlign: "left" } : undefined}>
                      {match.text}
                    </p>
                  </a>
                ))}
              </div>

              {results.matches.length === 0 && (
                <div className="rounded-sm border border-border bg-card p-8 text-center">
                  <p className="font-ui text-muted-foreground">{tCommon('noMatches')}</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => executeSearch(Math.max(1, currentPage - 1), query)}
                    disabled={currentPage <= 1 || loading}
                    className="flex items-center gap-1 rounded-sm border border-border px-4 py-2 text-sm text-muted-foreground hover:border-gold hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {tCommon('previous')}
                  </button>
                  <span className="font-ui text-xs text-muted-foreground">
                    {tCommon('page')} {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => executeSearch(Math.min(totalPages, currentPage + 1), query)}
                    disabled={currentPage >= totalPages || loading}
                    className="flex items-center gap-1 rounded-sm border border-border px-4 py-2 text-sm text-muted-foreground hover:border-gold hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {tCommon('next')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {!searched && !loading && (
            <div className="tile-corners mt-12 rounded-sm border border-gold/30 bg-paper p-8 text-center shadow-[var(--shadow-deep)]">
              <Search className="mx-auto h-10 w-10 text-gold/50 mb-3" />
              <p className="font-ui text-sm text-muted-foreground">
                {t('searchForWords')}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["mercy", "patience", "gratitude", "paradise", "forgiveness"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      executeSearch(1, term);
                    }}
                    className="rounded-full border border-emerald-deep/25 px-3 py-1 font-ui text-xs text-emerald-deep hover:bg-emerald-deep hover:text-ivory transition-colors"
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
