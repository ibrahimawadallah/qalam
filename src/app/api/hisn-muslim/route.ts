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

async function getHisnData(): Promise<Chapter[]> {
  const arListingUrl = "https://hisnmuslim.com/api/ar/husn_ar.json";
  const arListing = await fetchJson(arListingUrl);

  const chapters: Chapter[] = [];

  for (const [arChapterName, entries] of Object.entries(arListing)) {
    const duas: Dua[] = [];
    const items = entries as any[];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.ID;
      const textUrl = item.TEXT;
      const audioUrl = item.AUDIO_URL ?? "";

      let arabicText = item.TITLE ?? "";
      let transliteration = "";
      let englishTranslation = "";
      let repeat = 1;

      if (textUrl) {
        try {
          const detail = await fetchJson(textUrl);
          const chapterKey = Object.keys(detail)[0];
          if (chapterKey) {
            const duaList = detail[chapterKey] as any[];
            const matched = duaList.find((d) => d.ID === id);
            if (matched) {
              arabicText = matched.ARABIC_TEXT ?? arabicText;
              transliteration = matched.LANGUAGE_ARABIC_TRANSLATED_TEXT ?? "";
              englishTranslation = matched.TRANSLATED_TEXT ?? "";
              repeat = matched.REPEAT ?? 1;
              if (!audioUrl && matched.AUDIO) {
                audioUrl = matched.AUDIO;
              }
            }
          }
        } catch {
          // keep title as text if detail fetch fails
        }
      }

      duas.push({
        id,
        arabicText,
        transliteration,
        englishTranslation,
        repeat,
        audioUrl,
      });
    }

    chapters.push({
      name: arChapterName,
      duas,
    });
  }

  return chapters;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chapters = await getHisnData();
    return NextResponse.json({ chapters } satisfies { chapters: Chapter[] }, { status: 200 });
  } catch (err) {
    console.error("hisn-muslim api error", err);
    return NextResponse.json(
      { error: "Failed to load Hisn Muslim data" },
      { status: 500 }
    );
  }
}
