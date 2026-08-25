import { NextRequest } from "next/server";
import { getSurahAudioUrl, getFallbackAudioUrl, getFallbackAudioUrlAlt } from "@/lib/quran-data";

// Streams surah audio through the Cloudflare Worker so the browser loads it
// same-origin. This avoids direct cross-origin fetches to mp3quran.net (which
// can fail due to regional/CORS/network blocks for some users).
// Primary source: mp3quran.net. Fallbacks: cdn.islamic.network (audio-surah/128,
// then audio/128) — these cover the majority of reciters.
// Supports HTTP Range requests so the <audio> element can seek (returns 206).

export const runtime = "nodejs";

function buildCandidateUrls(reciterId: string, surahNumber: number): string[] {
  const primary = getSurahAudioUrl(reciterId, surahNumber); // mp3quran
  const fallback = getFallbackAudioUrl(reciterId, surahNumber); // islamic.network /audio-surah/
  const fallbackAlt = getFallbackAudioUrlAlt(reciterId, surahNumber); // islamic.network /audio/
  const urls: string[] = [];
  if (primary) urls.push(primary);
  if (fallback && fallback !== primary && !urls.includes(fallback)) urls.push(fallback);
  if (fallbackAlt && fallbackAlt !== primary && !urls.includes(fallbackAlt)) urls.push(fallbackAlt);
  return urls;
}

async function streamFrom(
  url: string,
  range: string | null
): Promise<Response | null> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (range) headers["Range"] = range;

  const res = await fetch(url, { headers });
  if (!res.ok && res.status !== 206) return null;
  return res;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reciterId = url.searchParams.get("reciter");
  const surahParam = url.searchParams.get("surah");
  const range = request.headers.get("range") ?? null;

  if (!reciterId || !surahParam) {
    return new Response(
      JSON.stringify({ error: "Missing reciter or surah parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const surahNumber = Number(surahParam);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return new Response(JSON.stringify({ error: "Invalid surah number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const candidates = buildCandidateUrls(reciterId, surahNumber);

  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const upstream = await streamFrom(candidate, range);
      if (!upstream) continue;

      const headers = new Headers();
      const contentType =
        upstream.headers.get("Content-Type") || "audio/mpeg";
      headers.set("Content-Type", contentType);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "public, max-age=86400");
      headers.set("Access-Control-Allow-Origin", "*");

      const upstreamRange = upstream.headers.get("Content-Range");
      const contentLength = upstream.headers.get("Content-Length");
      const upstreamStatus = upstream.status;

      if (upstreamRange) headers.set("Content-Range", upstreamRange);
      if (contentLength) headers.set("Content-Length", contentLength);

      // 206 if upstream returned a partial response, else 200.
      const status = upstreamStatus === 206 ? 206 : 200;

      // Stream the body through.
      return new Response(upstream.body, { status, headers });
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  console.error("audio-stream: all sources failed", { reciterId, surahNumber, lastError });
  return new Response(
    JSON.stringify({ error: "Unable to load audio from any source" }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
