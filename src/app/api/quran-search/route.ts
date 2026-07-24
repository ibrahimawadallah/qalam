import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SearchMatch = {
  readonly number: number;
  readonly text: string;
  readonly surah: {
    readonly number: number;
    readonly name: string;
    readonly englishName: string;
    readonly numberOfAyahs: number;
  };
  readonly edition: {
    readonly identifier: string;
    readonly language: string;
    readonly name: string;
  };
};

type SearchResponse = {
  readonly code: number;
  readonly status: string;
  readonly data: {
    readonly matches: SearchMatch[];
    readonly count: number;
    readonly page: number;
    readonly totalPages: number;
    readonly totalCount: number;
    readonly currentPage: number;
  };
};

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

async function searchUpstream(endpoint: string): Promise<SearchResponse> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(endpoint, {
        next: { revalidate: 0 },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upstream API returned ${res.status}: ${text.substring(0, 100)}`);
      }

      return (await res.json()) as SearchResponse;
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e instanceof Error ? e : new Error(String(e));

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error("Upstream search failed");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  let surah = url.searchParams.get("surah") || "all";
  let edition = url.searchParams.get("edition") || "en";
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "20");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter: q" }, { status: 400 });
  }

  if (containsArabic(q)) {
    edition = "ar";
  }

  const endpoint = `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/${encodeURIComponent(surah)}/${encodeURIComponent(edition)}`;

  try {
    const json = await searchUpstream(endpoint);

    const allMatches = json.data.matches;
    const totalCount = json.data.totalCount || allMatches.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, limit)));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * limit;
    const pagedMatches = allMatches.slice(start, start + limit);

    const response = {
      code: json.code,
      status: json.status,
      data: {
        matches: pagedMatches,
        count: pagedMatches.length,
        page: safePage,
        totalPages,
        totalCount,
        currentPage: safePage,
      },
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error("Search API error", e);
    return NextResponse.json(
      { error: "Failed to search Quran. The service may be temporarily unavailable." },
      { status: 502 }
    );
  }
}
