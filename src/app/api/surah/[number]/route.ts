import { NextResponse } from 'next/server';
import { SurahText, TranslationLanguage } from '@/lib/quran-types';

// Languages to fetch (configurable)
const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  'english',
  'urdu',
  'french',
  'indonesian',
  'turkish',
  'russian',
  'spanish',
  'german',
  'malay',
  'bengali',
  'chinese',
];

const LANGUAGE_ENDPOINTS: Record<TranslationLanguage, string> = {
  english: 'en.hilali',
  urdu: 'ur.junagarhi',
  french: 'fr.hamidullah',
  indonesian: 'id.indonesian',
  turkish: 'tr.diyanet',
  russian: 'ru.kuliev',
  spanish: 'es.garcia',
  german: 'de.bubenheim',
  malay: 'ms.basmeih',
  bengali: 'bn.bengali',
  chinese: 'zh.simpsons',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number: surahNumberStr } = await params;
    const surahNumber = parseInt(surahNumberStr, 10);

    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return NextResponse.json(
        { error: 'Invalid surah number. Must be between 1 and 114.' },
        { status: 400 }
      );
    }

    // Fetch Arabic (Uthmani) text
    const arabicRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
    
    if (!arabicRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Arabic text from external API.' },
        { status: 502 }
      );
    }

    const arabicData = await arabicRes.json();

    if (arabicData.code !== 200) {
      return NextResponse.json(
        { error: 'External API returned an error for Arabic text.', details: arabicData },
        { status: 502 }
      );
    }

    const arabicAyahs = arabicData.data.ayahs.map(
      (ayah: { number: number; numberInSurah: number; text: string }) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
      })
    );

    // Fetch all translations in parallel
    const translationPromises = TRANSLATION_LANGUAGES.map(async (lang) => {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${LANGUAGE_ENDPOINTS[lang]}`);
        
        if (!res.ok) {
          console.warn(`Failed to fetch ${lang} translation: ${res.status}`);
          return { lang, data: null };
        }

        const data = await res.json();

        if (data.code !== 200) {
          console.warn(`API error for ${lang} translation:`, data);
          return { lang, data: null };
        }

        const ayahs = data.data.ayahs.map(
          (ayah: { number: number; numberInSurah: number; text: string }) => ({
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            text: ayah.text,
          })
        );

        return { lang, data: ayahs };
      } catch (error) {
        console.warn(`Error fetching ${lang} translation:`, error);
        return { lang, data: null };
      }
    });

    const translationResults = await Promise.all(translationPromises);

    // Build result object with available translations
    const result: SurahText = {
      surahNumber,
      arabicAyahs,
      englishAyahs: translationResults.find(r => r.lang === 'english')?.data || [],
      urduAyahs: translationResults.find(r => r.lang === 'urdu')?.data,
      frenchAyahs: translationResults.find(r => r.lang === 'french')?.data,
      indonesianAyahs: translationResults.find(r => r.lang === 'indonesian')?.data,
      turkishAyahs: translationResults.find(r => r.lang === 'turkish')?.data,
      russianAyahs: translationResults.find(r => r.lang === 'russian')?.data,
      spanishAyahs: translationResults.find(r => r.lang === 'spanish')?.data,
      germanAyahs: translationResults.find(r => r.lang === 'german')?.data,
      malayAyahs: translationResults.find(r => r.lang === 'malay')?.data,
      bengaliAyahs: translationResults.find(r => r.lang === 'bengali')?.data,
      chineseAyahs: translationResults.find(r => r.lang === 'chinese')?.data,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching surah:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching surah data.' },
      { status: 500 }
    );
  }
}
