import { NextResponse } from 'next/server';
import { getSurahAudioUrl, getFallbackAudioUrl, getFallbackAudioUrlAlt } from '@/lib/quran-data';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surahNumber = url.searchParams.get('surah');
  const reciterId = url.searchParams.get('reciter');

  if (!surahNumber || !reciterId) {
    return NextResponse.json({ error: 'Missing surah or reciter parameter' }, { status: 400 });
  }

  // Return the primary URL; fall back to cdn.islamic.network paths (audio-surah
  // then audio/128) which together cover the large majority of reciters.
  const primaryUrl = getSurahAudioUrl(reciterId, Number(surahNumber));
  const fallbackUrl = getFallbackAudioUrl(reciterId, Number(surahNumber));
  const fallbackUrlAlt = getFallbackAudioUrlAlt(reciterId, Number(surahNumber));
  const audioUrl = primaryUrl || fallbackUrl || fallbackUrlAlt;

  return NextResponse.json({
    audioUrl,
    format: 'mp3',
    source: primaryUrl ? 'mp3quran' : 'islamic-network',
  });
}
