import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HadithItem = {
  readonly number: number;
  readonly arab: string;
  readonly id: string;
};

type UpstreamHadithResponse = {
  readonly name: string;
  readonly slug: string;
  readonly total: number;
  readonly pagination: {
    readonly totalItems: number;
    readonly currentPage: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
  readonly items: HadithItem[];
};

type HadithResponse = {
  readonly hadiths: HadithItem[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const collection = url.searchParams.get("collection") || "bukhari";
  const page = url.searchParams.get("page") || "1";
  const limit = url.searchParams.get("limit") || "20";
  const hadithNumber = url.searchParams.get("hadith_number");

  let endpoint: string;
  if (hadithNumber) {
    endpoint = `https://hadis-api-id.vercel.app/hadith/${encodeURIComponent(collection)}/${encodeURIComponent(hadithNumber)}`;
  } else {
    endpoint = `https://hadis-api-id.vercel.app/hadith/${encodeURIComponent(collection)}?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
  }

  try {
    let res: Response | null = null;
    for (let i = 0; i <= 2; i++) {
      res = await fetch(endpoint);
      if (res.ok) break;
      if (i < 2) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
    if (!res || !res.ok) {
      return NextResponse.json({ error: "Upstream hadith API failed" }, { status: 502 });
    }
    const upstream = (await res.json()) as UpstreamHadithResponse;

    const response: HadithResponse = {
      hadiths: upstream.items.map((item) => ({
        number: item.number,
        arab: item.arab,
        id: item.id,
      })),
      pagination: {
        total: upstream.total,
        page: upstream.pagination.currentPage,
        limit: upstream.pagination.pageSize,
        totalPages: upstream.pagination.totalPages,
      },
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Failed to load hadiths" }, { status: 502 });
  }
}
