import { NextResponse } from 'next/server';

/**
 * GET /api/tafsir/[surahNumber]?tafsir_slug=en-tafisr-ibn-kathir
 *
 * Returns tafsir text (HTML) for every ayah in the requested surah,
 * sourced from Quran.com's authenticated tafsir library.
 *
 * Authentic sources include: Ibn Kathir, Tabari, Qurtubi, Al-Sa'di,
 * Ma'arif al-Qur'an, Tazkirul Quran, etc.
 * Default: Ibn Kathir (Abridged) — one of the most cited classical tafsirs.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ surahNumber: string }> }
) {
  try {
    const { surahNumber: surahStr } = await params;
    const surahNumber = parseInt(surahStr, 10);
    const url = new URL(request.url);
    const slug = url.searchParams.get('tafsir_slug') || 'en-tafisr-ibn-kathir';

    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return NextResponse.json(
        { error: 'Invalid surah number. Must be 1-114.' },
        { status: 400 }
      );
    }

    // Get ayah count from Quran.com chapter endpoint
    const chapterRes = await fetch(
      `https://api.quran.com/api/v4/chapters/${surahNumber}`,
      { signal: request.signal }
    );
    if (!chapterRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch chapter data.' },
        { status: 502 }
      );
    }
    const chapterData = await chapterRes.json();
    const totalAyahs: number = chapterData.chapter?.verses_count ?? 0;

    if (!totalAyahs || totalAyahs < 1) {
      return NextResponse.json(
        { error: 'Could not determine ayah count.' },
        { status: 502 }
      );
    }

    // Build verse keys: "1:1", "1:2", ... "1:N"
    const verseKeys = Array.from({ length: totalAyahs }, (_, i) =>
      `${surahNumber}:${i + 1}`
    );

    // Fetch all ayah tafsirs in parallel
    const results = await Promise.allSettled(
      verseKeys.map((verseKey) =>
        fetch(
          `https://api.quran.com/api/v4/tafsirs/${encodeURIComponent(slug)}/by_ayah/${encodeURIComponent(verseKey)}`,
          { signal: request.signal }
        )
          .then((r) => r.json())
          .then((json) => ({
            verseKey,
            tafsir: json?.tafsir?.text ?? null,
          }))
          .catch(() => ({ verseKey, tafsir: null }))
      )
    );

    const byVerseKey: Record<string, string> = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.tafsir) {
        byVerseKey[result.value.verseKey] = result.value.tafsir;
      }
    });

    return NextResponse.json({
      surahNumber,
      tafsirSlug: slug,
      totalAyahs,
      byVerseKey,
    });
  } catch (error) {
    console.error('Tafsir fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching tafsir.' },
      { status: 500 }
    );
  }
}
