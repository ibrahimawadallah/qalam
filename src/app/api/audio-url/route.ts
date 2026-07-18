export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getSurahAudioUrl, getFallbackAudioUrl } from '@/lib/quran-data';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surahNumber = url.searchParams.get('surah');
  const reciterId = url.searchParams.get('reciter');

  if (!surahNumber || !reciterId) {
    return NextResponse.json({ error: 'Missing surah or reciter parameter' }, { status: 400 });
  }

  const fallbackUrl = getFallbackAudioUrl(reciterId, Number(surahNumber));

  // Primary source: cdn.islamic.network — reliable for most reciters.
  try {
    const check = await fetch(fallbackUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    });
    if (check.ok) {
      return NextResponse.json({ audioUrl: fallbackUrl, format: 'mp3', source: 'islamic-network' });
    }
  } catch {
    // fall through to mp3quran.net
  }

  // Fallback source: mp3quran.net — covers the remaining reciters.
  const primaryUrl = getSurahAudioUrl(reciterId, Number(surahNumber));
  if (primaryUrl) {
    return NextResponse.json({ audioUrl: primaryUrl, format: 'mp3', source: 'mp3quran' });
  }

  return NextResponse.json({ audioUrl: fallbackUrl, format: 'mp3', source: 'islamic-network' });
}
