"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SiteNav from "@/components/site-nav";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type HadithItem = {
  number: number;
  arab: string;
  id: string;
};

type HadithResponse = {
  hadiths: HadithItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type Collection = {
  id: string;
  name: string;
  arabicName: string;
};

const COLLECTIONS: Collection[] = [
  { id: "bukhari", name: "Sahih Bukhari", arabicName: "صحيح البخاري" },
  { id: "muslim", name: "Sahih Muslim", arabicName: "صحيح مسلم" },
  { id: "abudawud", name: "Sunan Abu Dawud", arabicName: "سنن أبي داود" },
  { id: "tirmidzi", name: "Jami` at-Tirmidzi", arabicName: "جامع الترمذي" },
  { id: "nasai", name: "Sunan an-Nasa'i", arabicName: "سنن النسائي" },
  { id: "ibn_majah", name: "Sunan Ibn Majah", arabicName: "سنن ابن ماجه" },
  { id: "ahmad", name: "Musnad Ahmad", arabicName: "مسند أحمد" },
  { id: "malik", name: "Muwatta Malik", arabicName: "موطأ مالك" },
  { id: "riwayah", name: "Riwayah", arabicName: "رواية" },
  { id: "daruqutni", name: "Al-Daruqutni", arabicName: "الدارقطني" },
];

export default function HadithsPage() {
  const [collection, setCollection] = useState("bukhari");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [data, setData] = useState<HadithResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHadiths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hadiths?collection=${encodeURIComponent(collection)}&page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load hadiths");
      const json = (await res.json()) as HadithResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [collection, page, limit]);

  useEffect(() => {
    loadHadiths();
  }, [loadHadiths]);

  const currentCollection = useMemo(
    () => COLLECTIONS.find((c) => c.id === collection) || COLLECTIONS[0],
    [collection]
  );

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0518" }}>
      <SiteNav />
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-amber-200 mb-2">الأحاديث النبوية</h1>
          <p className="text-amber-300/60 text-sm">Prophetic Hadiths — authentic narrations from the major books</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={collection}
              onChange={(e) => {
                setCollection(e.target.value);
                setPage(1);
              }}
              className="flex-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            >
              {COLLECTIONS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0518] text-amber-100">
                  {c.name} — {c.arabicName}
                </option>
              ))}
            </select>
            <button
              onClick={loadHadiths}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#0a0518] hover:bg-amber-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <p className="mb-4 text-xs text-red-400">{error}</p>}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-amber-300/50">
              {currentCollection.arabicName} — {currentCollection.name}
            </p>
            {data && (
              <p className="text-xs text-amber-300/50">
                Page {data.pagination.page} of {totalPages} — {data.pagination.total} hadiths
              </p>
            )}
          </div>

          <div className="space-y-4">
            {data?.hadiths.map((hadith) => (
              <div
                key={hadith.number}
                className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 sm:p-6"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-300/60">
                    #{hadith.number}
                  </span>
                </div>

                <div
                  className="mb-4 text-base leading-relaxed text-amber-50"
                  style={{ direction: "rtl", fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  {hadith.arab}
                </div>

                <div className="border-t border-amber-500/10 pt-2">
                  <p className="text-[11px] text-amber-300/40 line-clamp-2">{hadith.id}</p>
                </div>
              </div>
            ))}
          </div>

          {data && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 rounded-lg border border-amber-500/20 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs text-amber-300/50">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 rounded-lg border border-amber-500/20 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
