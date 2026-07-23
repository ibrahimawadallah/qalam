export interface HisnMuslimEntry {
  id: string;
  title: string;
  titleEn: string;
  audioUrl: string;
  category: "hisn_muslim";
}

export const HISN_MUSLIM_ENTRIES: HisnMuslimEntry[] = [
  {
    id: "hisn-cd1",
    title: "حصن المسلم - الجزء الأول",
    titleEn: "Hisn Muslim - Part 1",
    audioUrl:
      "https://archive.org/download/Hisnul-Muslim-Fortress-Of-The-Muslim-Audio-MP3-CD/Hisnul-Muslim_CD_1_%28www.TheChoice.one%29.mp3",
    category: "hisn_muslim",
  },
  {
    id: "hisn-cd2",
    title: "حصن المسلم - الجزء الثاني",
    titleEn: "Hisn Muslim - Part 2",
    audioUrl:
      "https://archive.org/download/Hisnul-Muslim-Fortress-Of-The-Muslim-Audio-MP3-CD/Hisnul-Muslim_CD_2_%28www.TheChoice.one%29.mp3",
    category: "hisn_muslim",
  },
];
