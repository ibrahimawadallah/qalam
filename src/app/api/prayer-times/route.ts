import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type PrayerTimings = Record<string, string>;
type PrayerMeta = {
  readonly timezone: string;
  readonly latitude: number;
  readonly longitude: number;
};

type PrayerDay = {
  readonly timings: PrayerTimings;
  readonly date: { readable: string; hijri: { date: string; month: { en: string }; year: string } };
  readonly meta: PrayerMeta;
};

export type PrayerTimesResponse = {
  readonly code: number;
  readonly status: string;
  readonly data: PrayerDay;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const method = url.searchParams.get("method") || "2";
  const school = url.searchParams.get("school") || "0";

  let endpoint: string;
  const city = url.searchParams.get("city");
  const country = url.searchParams.get("country");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (lat && lng) {
    endpoint = `https://api.aladhan.com/v1/timings?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&method=${method}&school=${school}`;
  } else if (city) {
    endpoint = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country || "")}&method=${method}&school=${school}`;
  } else {
    return NextResponse.json({ error: "Provide city or lat/lng" }, { status: 400 });
  }

  try {
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream prayer API failed" }, { status: 502 });
    }
    const json = (await res.json()) as PrayerTimesResponse;
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Failed to load prayer times" }, { status: 502 });
  }
}
