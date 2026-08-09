import { NextResponse } from 'next/server';
import { getSurahAudioUrl, getFallbackAudioUrl } from '@/lib/quran-data';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surahNumber = url.searchParams.get('surah');
  const reciterId = url.searchParams.get('reciter');

  if (!surahNumber || !reciterId) {
    return NextResponse.json({ error: 'Missing surah or reciter parameter' }, { status: 400 });
  }

  // Return both URLs; client-side caching handles the rest.
  // Server-side HEAD check is omitted — Workers may have outbound fetch issues
  // and the browser is better positioned to handle audio loading.
  const primaryUrl = getSurahAudioUrl(reciterId, Number(surahNumber));
  const fallbackUrl = getFallbackAudioUrl(reciterId, Number(surahNumber));

  return NextResponse.json({
    audioUrl: primaryUrl || fallbackUrl,
    format: 'mp3',
    source: primaryUrl ? 'mp3quran' : 'islamic-network',
  });
}
