export interface Surah {
  number: number;
  arabicName: string;
  englishName: string;
  englishMeaning: string;
  ayahCount: number;
  revelationType: "Meccan" | "Medinan";
  description: string;
}

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  country: string;
  category: "Popular" | "Egyptian" | "Saudi" | "Other";
  style: "Murattal" | "Mujawwad";
  /** Audio source type: "ayah" = per-ayah files from cdn.islamic.network, "surah" = per-surah files from mp3quran.net */
  audioSource?: "ayah" | "surah";
  /** For surah-source reciters: the CDN base URL (authoritative values live in quran-data.ts MP3QURAN_BASE) */
  audioBaseUrl?: string;
  /** For surah-source reciters: retained for compatibility; actual mapping is in quran-data.ts MP3QURAN_BASE */
  audioPrefix?: string;
  /** mp3quran.net folder code retained for compatibility; actual server+folder mapping is in quran-data.ts MP3QURAN_BASE */
  mp3quranFolder?: string;
}

export interface AyahText {
  number: number;
  numberInSurah: number;
  text: string;
}

export interface SurahText {
  surahNumber: number;
  arabicAyahs: AyahText[];
  englishAyahs: AyahText[];
  urduAyahs?: AyahText[];
  frenchAyahs?: AyahText[];
  indonesianAyahs?: AyahText[];
  turkishAyahs?: AyahText[];
  russianAyahs?: AyahText[];
  spanishAyahs?: AyahText[];
  germanAyahs?: AyahText[];
  malayAyahs?: AyahText[];
  bengaliAyahs?: AyahText[];
  chineseAyahs?: AyahText[];
}

export type TranslationLanguage = 
  | 'english'
  | 'urdu'
  | 'french'
  | 'indonesian'
  | 'turkish'
  | 'russian'
  | 'spanish'
  | 'german'
  | 'malay'
  | 'bengali'
  | 'chinese';

export interface TranslationLanguageInfo {
  code: string;
  name: string;
  arabicName: string;
  apiEndpoint: string;
  flag: string;
  rtl: boolean;
}

export const TRANSLATION_LANGUAGES: Record<TranslationLanguage, TranslationLanguageInfo> = {
  english: {
    code: 'en',
    name: 'English',
    arabicName: 'إنجليزي',
    apiEndpoint: 'en.hilali',
    flag: '🇬🇧',
    rtl: false,
  },
  urdu: {
    code: 'ur',
    name: 'Urdu',
    arabicName: 'أردو',
    apiEndpoint: 'ur.junagarhi',
    flag: '🇵🇰',
    rtl: true,
  },
  french: {
    code: 'fr',
    name: 'French',
    arabicName: 'فرنسي',
    apiEndpoint: 'fr.hamidullah',
    flag: '🇫🇷',
    rtl: false,
  },
  indonesian: {
    code: 'id',
    name: 'Indonesian',
    arabicName: 'إندونيسي',
    apiEndpoint: 'id.indonesian',
    flag: '🇮🇩',
    rtl: false,
  },
  turkish: {
    code: 'tr',
    name: 'Turkish',
    arabicName: 'تركي',
    apiEndpoint: 'tr.diyanet',
    flag: '🇹🇷',
    rtl: false,
  },
  russian: {
    code: 'ru',
    name: 'Russian',
    arabicName: 'روسية',
    apiEndpoint: 'ru.kuliev',
    flag: '🇷🇺',
    rtl: false,
  },
  spanish: {
    code: 'es',
    name: 'Spanish',
    arabicName: 'إسبانية',
    apiEndpoint: 'es.garcia',
    flag: '🇪🇸',
    rtl: false,
  },
  german: {
    code: 'de',
    name: 'German',
    arabicName: 'ألماني',
    apiEndpoint: 'de.bubenheim',
    flag: '🇩🇪',
    rtl: false,
  },
  malay: {
    code: 'ms',
    name: 'Malay',
    arabicName: 'مالاي',
    apiEndpoint: 'ms.basmeih',
    flag: '🇲🇾',
    rtl: false,
  },
  bengali: {
    code: 'bn',
    name: 'Bengali',
    arabicName: 'بنغالي',
    apiEndpoint: 'bn.bengali',
    flag: '🇧🇩',
    rtl: false,
  },
  chinese: {
    code: 'zh',
    name: 'Chinese',
    arabicName: 'صينية',
    apiEndpoint: 'zh.simpsons',
    flag: '🇨🇳',
    rtl: false,
  },
};

