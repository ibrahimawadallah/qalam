import { NextResponse } from "next/server";
import type { Dua, Chapter } from "@/lib/hisn-muslim-types";

function decodeUtf8Json(buf: ArrayBuffer): any {
  const decoder = new TextDecoder("utf-8");
  return JSON.parse(decoder.decode(buf));
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

async function getMorningEveningAzkar(): Promise<Chapter[]> {
  const listingUrl = "https://hisnmuslim.com/api/ar/husn_ar.json";
  const listing = await fetchJson(listingUrl);

  const morningEveningEntry = listing["العربية"].find(
    (entry: any) => entry.ID === 27
  );

  if (!morningEveningEntry) {
    throw new Error("Morning/Evening Azkar category not found");
  }

  const textUrl = morningEveningEntry.TEXT;
  if (!textUrl) {
    throw new Error("Morning/Evening Azkar text URL missing");
  }

  const detail = await fetchJson(textUrl);
  const chapterKeys = Object.keys(detail);
  if (!chapterKeys.length) {
    throw new Error("Empty morning/evening azkar data");
  }

  const duaList = detail[chapterKeys[0]] as any[];
  const duas: Dua[] = duaList.map((item) => ({
    id: item.ID,
    arabicText: item.ARABIC_TEXT ?? "",
    transliteration: item.LANGUAGE_ARABIC_TRANSLATED_TEXT ?? "",
    englishTranslation: item.TRANSLATED_TEXT ?? "",
    repeat: item.REPEAT ?? 1,
    audioUrl: item.AUDIO ?? "",
  }));

  return [
    {
      name: "أذكار الصباح والمساء",
      duas,
    },
  ];
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chapters = await getMorningEveningAzkar();
    return NextResponse.json({ chapters } satisfies { chapters: Chapter[] }, { status: 200 });
  } catch (err) {
    console.error("azkar api error", err);
    return NextResponse.json(
      { error: "Failed to load morning/evening azkar" },
      { status: 500 }
    );
  }
}
