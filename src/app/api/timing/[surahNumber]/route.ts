import { NextResponse } from 'next/server';

// Legacy numeric reciter ids -> alquran.cloud audio edition
const RECITER_MAP: Record<string, string> = {
  '7': 'ar.alafasy',
  '1': 'ar.abdulbasit',
  '2': 'ar.abdulbasit',
  '3': 'ar.sudais',
  '4': 'ar.shatri',
  '5': 'ar.hanirifai',
  '6': 'ar.husary',
  '12': 'ar.husarymuallim',
  '9': 'ar.minshawi',
  '8': 'ar.minshawi',
  '10': 'ar.shuraym',
  '11': 'ar.tablawi',
};

// App reciter ids -> alquran.cloud audio edition.
// alquran.cloud only carries *audio* for certain editions (others are text-only),
// so this map routes the app's ids onto the matching audio edition ids.
const REVERSE_RECITER_MAP: Record<string, string> = {
  'ar.alafasy': 'ar.alafasy',
  'ar.abdulbasitmurattal': 'ar.abdulbasitmurattal',
  'ar.abdulbasitmujawwad': 'ar.abdulbasitmujawwad',
  'ar.husary': 'ar.husary',
  'ar.minshawi': 'ar.minshawi',
  'ar.yasseraldossari': 'ar.yasseraldossari',
  'ar.saudalshuraim': 'ar.saudalshuraim',
  'ar.mahershakhashiro': 'ar.mahermuaiqly',
  'ar.abdurrahmaansudais': 'ar.sudais',
  'ar.muhammadayyub': 'ar.muhammadayyub',
  'ar.haniarrifai': 'ar.hanirifai',
  'ar.ahmedalajmi': 'ar.ahmedalajmi',
  'ar.aliabdurrahmanalhuthaify': 'ar.hudhaify',
  'ar.shatri': 'ar.shatri',
  'ar.shuraym': 'ar.shuraym',
  'ar.tablawi': 'ar.tablawi',
};

interface AyahTiming {
  ayahKey: string;
  number: number;          // global ayah number
  numberInSurah: number;
  duration: number;        // seconds
  audioUrl: string | null; // proxied per-ayah stream (null => fall back to full-surah file)
}

/** Extract the nominal bitrate (kbps) from a cdn.islamic.network audio URL. */
function bitrateBytesPerSec(audioUrl: string): number | null {
  const match = audioUrl.match(/\/audio\/(\d+)\//);
  if (!match) return null;
  const kbps = parseInt(match[1], 10);
  if (!isFinite(kbps) || kbps <= 0) return null;
  return (kbps * 1000) / 8; // bits/sec -> bytes/sec
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ surahNumber: string }> }
) {
  try {
    const { surahNumber: surahStr } = await params;
    const surahNumber = parseInt(surahStr, 10);
    const url = new URL(request.url);
    let reciterId = url.searchParams.get('reciter') || '7';

    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return NextResponse.json(
        { error: 'Invalid surah number. Must be between 1 and 114.' },
        { status: 400 }
      );
    }

    const alquranReciter =
      RECITER_MAP[reciterId] ?? REVERSE_RECITER_MAP[reciterId] ?? reciterId;

    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/${alquranReciter}`,
      { signal: request.signal }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch audio data from alquran.cloud' },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.code !== 200 || !data.data?.ayahs) {
      return NextResponse.json(
        { error: 'Invalid response from alquran.cloud' },
        { status: 502 }
      );
    }

    const ayahs = data.data.ayahs;

    // Whether the edition actually carries per-ayah audio.
    const hasPerAyahAudio = ayahs.some(
      (a: any) => typeof a?.audio === 'string' && a.audio.length > 0
    );

    const timings: AyahTiming[] = [];
    let cumulativeTime = 0;

    const batchSize = 10;
    const proxyPath = `/api/audio-stream?reciter=${encodeURIComponent(alquranReciter)}&surah=${surahNumber}`;

    for (let i = 0; i < ayahs.length; i += batchSize) {
      const batch = ayahs.slice(i, i + batchSize);
      const durationPromises = batch.map(async (ayah: any) => {
        const numberInSurah = ayah.numberInSurah;
        const ayahKey = ayah.verse_key || `${surahNumber}:${numberInSurah}`;
        const audioUrl = ayah.audio;

        if (!hasPerAyahAudio || typeof audioUrl !== 'string' || !audioUrl) {
          return { ayahKey, number: ayah.number, numberInSurah, duration: ayah.text.length * 0.08, audioUrl: null as string | null };
        }

        let duration = ayah.text.length * 0.08;
        const directUrl = audioUrl;
        let finalUrl: string | null = `${proxyPath}&ayah=${ayah.number}`;
        try {
          const bytesPerSec = bitrateBytesPerSec(directUrl);
          const headRes = await fetch(directUrl, {
            method: 'HEAD',
            signal: request.signal,
            cache: 'no-store',
          });
          if (!headRes.ok) {
            finalUrl = null;
          } else {
            const contentLength = parseInt(
              headRes.headers.get('content-length') || '0',
              10
            );
            if (contentLength > 0 && bytesPerSec) {
              duration = contentLength / bytesPerSec;
            } else if (contentLength > 0) {
              duration = contentLength / 16000;
            }
          }
        } catch {
          // keep the text-length estimate
        }

        return {
          ayahKey,
          number: ayah.number,
          numberInSurah,
          duration,
          audioUrl: finalUrl,
        };
      });

      const results = await Promise.all(durationPromises);

      for (const r of results) {
        timings.push(r);
        cumulativeTime += r.duration;
      }
    }

    const allSegmented =
      hasPerAyahAudio && timings.every((t) => t.audioUrl != null);

    return NextResponse.json({
      surahNumber,
      reciterId: alquranReciter,
      source: allSegmented ? 'segments' : 'full',
      timings,
      totalDuration: Math.round(cumulativeTime * 1000),
    });
  } catch (error) {
    console.error('Timing fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching timing data.' },
      { status: 500 }
    );
  }
}