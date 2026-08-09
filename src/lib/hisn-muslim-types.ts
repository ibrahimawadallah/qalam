export type Dua = {
  id: number;
  arabicText: string;
  transliteration: string;
  englishTranslation: string;
  repeat: number;
  audioUrl: string;
};

export type Chapter = {
  name: string;
  duas: Dua[];
};
