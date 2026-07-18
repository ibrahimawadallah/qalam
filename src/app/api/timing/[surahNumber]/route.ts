export const runtime = 'edge';

import { NextResponse } from 'next/server';

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

    const alquranReciter = RECITER_MAP[reciterId] || 'ar.alafasy';

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
    const timings: { timestamp: number; ayahKey: string }[] = [];
    let cumulativeTime = 0;

    const batchSize = 5;
    for (let i = 0; i < ayahs.length; i += batchSize) {
      const batch = ayahs.slice(i, i + batchSize);
      const durationPromises = batch.map(async (ayah: any) => {
        try {
          const audioUrl = ayah.audio;
          const headRes = await fetch(audioUrl, {
            method: 'HEAD',
            signal: request.signal,
            cache: 'no-store',
          });
          const contentLength = parseInt(
            headRes.headers.get('content-length') || '0',
            10
          );
          // MP3 at 128kbps: ~16KB per second
          const duration = contentLength > 0 ? contentLength / 16000 : (ayah.text.length * 0.08);
          return { ayahKey: ayah.verse_key || `${surahNumber}:${ayah.numberInSurah}`, duration };
        } catch {
          // Fallback: estimate based on text length
          const duration = ayah.text.length * 0.08;
          return { ayahKey: ayah.verse_key || `${surahNumber}:${ayah.numberInSurah}`, duration };
        }
      });

      const durations = await Promise.all(durationPromises);

      for (const { ayahKey, duration } of durations) {
        timings.push({ timestamp: Math.round(cumulativeTime * 1000), ayahKey });
        cumulativeTime += duration;
      }
    }

    return NextResponse.json({
      surahNumber,
      reciterId,
      timings,
    });
  } catch (error) {
    console.error('Timing fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching timing data.' },
      { status: 500 }
    );
  }
}
