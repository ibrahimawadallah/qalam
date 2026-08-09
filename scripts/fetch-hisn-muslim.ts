import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_PATH = path.join(process.cwd(), "src", "lib", "hisn-muslim-data.json");
const LOOKUP_PATH = path.join(process.cwd(), "src", "lib", "hisn-muslim-lookup.json");
const AR_LISTING = "https://hisnmuslim.com/api/ar/husn_ar.json";

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf-8").replace(/^\uFEFF/, "");
        try {
          resolve(JSON.parse(text));
        } catch (e) {
          reject(new Error(`Invalid JSON from ${url}: ${(e as Error).message}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function main() {
  console.log("Loading English lookup...");
  const lookupRaw = fs.readFileSync(LOOKUP_PATH, "utf-8");
  const lookup: Record<number, { transliteration: string; englishTranslation: string }> = JSON.parse(lookupRaw);
  console.log(`Loaded lookup with ${Object.keys(lookup).length} duas`);

  console.log("Fetching Arabic listing...");
  const listing = await fetchJson(AR_LISTING);

  const chapters: any[] = [];
  let totalDuas = 0;

  for (const [arChapterName, entries] of Object.entries(listing)) {
    const duas: any[] = [];
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
        } catch (err) {
          console.error(`  Failed to fetch Arabic detail ${id}: ${(err as Error).message}`);
        }
      }

      const en = lookup[id];
      if (en) {
        if (!transliteration) transliteration = en.transliteration;
        if (!englishTranslation) englishTranslation = en.englishTranslation;
      }

      // Fallback audio from lookup if needed
      const finalAudioUrl = audioUrl || en?.audioUrl || "";

      duas.push({
        id,
        arabicText,
        transliteration,
        englishTranslation,
        repeat,
        audioUrl: finalAudioUrl,
      });
      totalDuas++;
    }

    chapters.push({
      name: arChapterName,
      duas,
    });
  }

  const output = { chapters, totalDuas };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nSaved ${totalDuas} duas across ${chapters.length} chapters to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
