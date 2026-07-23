import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const LOOKUP_PATH = path.join(process.cwd(), "src", "lib", "hisn-muslim-lookup.json");

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (res) => {
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
  const lookup: Record<number, { transliteration: string; englishTranslation: string }> = {};
  let chapterId = 1;

  while (true) {
    const url = `https://hisnmuslim.com/api/en/${chapterId}.json`;
    try {
      const data = await fetchJson(url);
      const chapterKey = Object.keys(data)[0];
      if (!chapterKey) break;
      const duas = data[chapterKey] as any[];
      for (const dua of duas) {
        lookup[dua.ID] = {
          transliteration: dua.LANGUAGE_ARABIC_TRANSLATED_TEXT ?? "",
          englishTranslation: dua.TRANSLATED_TEXT ?? "",
        };
      }
      console.log(`Fetched chapter ${chapterId}: ${chapterKey} (${duas.length} duas)`);
      chapterId++;
    } catch (err) {
      console.error(`Stopped at chapter ${chapterId}: ${(err as Error).message}`);
      break;
    }
  }

  fs.writeFileSync(LOOKUP_PATH, JSON.stringify(lookup, null, 2), "utf-8");
  console.log(`\nSaved lookup with ${Object.keys(lookup).length} duas to ${LOOKUP_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
