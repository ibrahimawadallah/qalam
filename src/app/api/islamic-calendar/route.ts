import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CalendarDay = {
  readonly date: {
    readonly readable: string;
    readonly gregorian: {
      readonly date: string;
      readonly day: string;
      readonly month: { readonly number: number; readonly en: string };
      readonly year: string;
      readonly weekday: { readonly en: string };
    };
    readonly hijri: {
      readonly date: string;
      readonly day: string;
      readonly month: { readonly number: number; readonly en: string; readonly ar: string };
      readonly year: string;
      readonly weekday: { readonly en: string };
    };
  };
};

type CalendarResponse = {
  readonly code: number;
  readonly status: string;
  readonly data: CalendarDay[];
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  if (!month || !year) {
    return NextResponse.json({ error: "Missing month or year parameter" }, { status: 400 });
  }

  const endpoint = `https://api.aladhan.com/v1/calendar/${encodeURIComponent(year)}/${encodeURIComponent(month)}?method=2&latitude=21.4225&longitude=39.8262`;

  try {
    let res: Response | null = null;
    for (let i = 0; i <= 2; i++) {
      res = await fetch(endpoint);
      if (res.ok) break;
      if (i < 2) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
    if (!res || !res.ok) {
      return NextResponse.json({ error: "Upstream Islamic calendar API failed" }, { status: 502 });
    }
    const json = (await res.json()) as CalendarResponse;
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Failed to load Islamic calendar" }, { status: 502 });
  }
}
