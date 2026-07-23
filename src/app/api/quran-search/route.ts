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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  let surah = url.searchParams.get("surah") || "all";
  let edition = url.searchParams.get("edition") || "en";

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter: q" }, { status: 400 });
  }

  if (containsArabic(q)) {
    edition = "ar";
  }

  const endpoint = `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/${encodeURIComponent(surah)}/${encodeURIComponent(edition)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(endpoint, {
      next: { revalidate: 0 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      console.error("Upstream search API error", res.status, text);
      return NextResponse.json(
        { error: `Upstream Quran search API failed: ${res.status}` },
        { status: 502 }
      );
    }

    const json = (await res.json()) as SearchResponse;
    return NextResponse.json(json);
  } catch (e) {
    console.error("Search API error", e);
    return NextResponse.json(
      { error: "Failed to search Quran. The service may be temporarily unavailable." },
      { status: 502 }
    );
  }
}
