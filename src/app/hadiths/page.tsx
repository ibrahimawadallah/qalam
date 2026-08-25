"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/page-head";
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
    <div className="min-h-screen">
      <PageHead eyebrow="Prophetic traditions" title="الأحاديث النبوية">
        Authentic narrations from the major collections — presented in Arabic with translation.
      </PageHead>

      <main className="mx-auto max-w-[820px] px-6 py-12 page-enter">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <select
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-sm border border-gold/40 bg-paper px-3 py-3 font-ui text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {COLLECTIONS.map((c) => (
              <option key={c.id} value={c.id} className="bg-background text-foreground">
                {c.name} — {c.arabicName}
              </option>
            ))}
          </select>
          <button
            onClick={loadHadiths}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-sm bg-emerald-deep px-5 py-3 font-ui text-sm font-semibold text-ivory transition-colors hover:bg-emerald-mid disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && <p className="mb-4 font-ui text-xs text-destructive">{error}</p>}

        <div className="mb-4 flex items-center justify-between border-b border-emerald-deep/15 pb-3">
          <p className="eyebrow text-maroon">{currentCollection.name}</p>
          {data && (
            <p className="font-ui text-xs text-muted-foreground">
              Page {data.pagination.page} of {totalPages} · {data.pagination.total} hadiths
            </p>
          )}
        </div>

        <div className="space-y-4">
          {data?.hadiths.map((hadith) => (
            <article key={hadith.number} className="warm-card rounded-sm p-5 sm:p-7">
              <span className="font-display text-sm text-maroon">#{hadith.number}</span>
              <p
                className="arabic-name mt-2 mb-4 text-[clamp(18px,2.2vw,22px)] leading-loose text-ink"
                dir="rtl"
              >
                {hadith.arab}
              </p>
              <div className="divider-line mb-2.5" />
              <p className="font-serif text-[13px] leading-relaxed text-muted-foreground line-clamp-2">{hadith.id}</p>
            </article>
          ))}
        </div>

        {data && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-sm border border-border px-4 py-2.5 font-ui text-sm text-muted-foreground hover:border-gold hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="font-ui text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-sm border border-border px-4 py-2.5 font-ui text-sm text-muted-foreground hover:border-gold hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
