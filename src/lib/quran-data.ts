import { Surah, Reciter, RadioStation } from "./quran-types";

// Quran Ayah timing data - approximate start times (seconds) used only as a
// base proportion until real audio duration scaling is applied by the player.
export const QURAN_TIMINGS: Record<string, Record<number, number[]>> = {
  // Mishary Rashid Alafasy - moderate pace
  'ar.alafasy': {
    // Surah Al-Fatiha (7 ayahs) - approximate timings based on audio analysis
    1: [0, 4.2, 8.1, 12.3, 16.8, 21.2, 26.1],
  },
  // Abdullah Basfar - faster pace
  'ar.abdullahbasfar': {
    1: [0, 3.8, 7.2, 10.9, 14.8, 18.5, 22.8],
  },
  // Abu Bakr Al-Shatri - slower, more melodic
  'ar.shaatree': {
    1: [0, 5.1, 9.8, 14.7, 20.2, 25.5, 31.2],
  },
  // Mahmoud Khalil Al-Husary - traditional style
  'ar.husary': {
    1: [0, 4.8, 9.5, 14.2, 19.1, 24.3, 29.8],
  },
  // Default timing for other reciters - based on average recitation
  'default': {
    1: [0, 4.2, 8.1, 12.3, 16.8, 21.2, 26.1],
  }
};

// Function to get ayah timing for a specific surah and reciter
export function getAyahTimings(surahNumber: number, reciterId: string): number[] {
  // Get timing data for this specific reciter and surah
  const reciterTimings = QURAN_TIMINGS[reciterId];
  if (reciterTimings && reciterTimings[surahNumber]) {
    return reciterTimings[surahNumber];
  }

  // Fallback to default timing
  const defaultTimings = QURAN_TIMINGS['default'][surahNumber];
  if (defaultTimings) {
    return defaultTimings;
  }

  // Generate more accurate timing based on surah characteristics
  const surah = SURAH_DATA.find(s => s.number === surahNumber);
  if (!surah) return [0];

  const totalAyahs = surah.ayahCount;
  const timings: number[] = [0];

  // Different recitation styles have different average speeds
  let avgAyahDuration = 18; // default
  if (reciterId.includes('husary') || reciterId.includes('minsh')) {
    avgAyahDuration = 22; // slower, more traditional
  } else if (reciterId.includes('alafasy') || reciterId.includes('shatri')) {
    avgAyahDuration = 20; // moderate
  } else if (reciterId.includes('basfar') || reciterId.includes('shur')) {
    avgAyahDuration = 16; // faster
  }

  // Adjust for surah length - longer surahs tend to have slightly faster pacing
  if (totalAyahs > 100) {
    avgAyahDuration *= 0.9; // 10% faster for very long surahs
  } else if (totalAyahs < 10) {
    avgAyahDuration *= 1.2; // 20% slower for very short surahs
  }

  // Add deterministic variation (±10%) based on surah+ayah so timings are consistent across calls
  for (let i = 1; i <= totalAyahs; i++) {
    const seed = (surahNumber * 7919 + i * 6271) % 1000;
    const variation = ((seed / 1000) - 0.5) * 0.2; // ±10%
    const duration = avgAyahDuration * (1 + variation);
    const cumulativeTime = timings[i - 1] + duration;
    timings.push(Math.round(cumulativeTime * 10) / 10);
  }

  return timings;
}

export const SURAH_DATA: Surah[] = [
  { number: 1, arabicName: "الفاتحة", englishName: "Al-Fatihah", englishMeaning: "The Opening", ayahCount: 7, revelationType: "Meccan", description: "The opening chapter of the Quran, recited in every prayer. It is a summary of the entire Quran." },
  { number: 2, arabicName: "البقرة", englishName: "Al-Baqarah", englishMeaning: "The Cow", ayahCount: 286, revelationType: "Medinan", description: "The longest surah in the Quran, covering legislation, stories of past prophets, and guidance for the Muslim community." },
  { number: 3, arabicName: "آل عمران", englishName: "Aal-E-Imran", englishMeaning: "The Family of Imran", ayahCount: 200, revelationType: "Medinan", description: "Discusses the family of Imran, the Battle of Uhud, and interfaith dialogue with Christians and Jews." },
  { number: 4, arabicName: "النساء", englishName: "An-Nisa", englishMeaning: "The Women", ayahCount: 176, revelationType: "Medinan", description: "Deals with women's rights, inheritance laws, and social justice in the Muslim community." },
  { number: 5, arabicName: "المائدة", englishName: "Al-Ma'idah", englishMeaning: "The Table Spread", ayahCount: 120, revelationType: "Medinan", description: "Covers dietary laws, the story of the table from heaven, and final legislation for the Muslim ummah." },
  { number: 6, arabicName: "الأنعام", englishName: "Al-An'am", englishMeaning: "The Cattle", ayahCount: 165, revelationType: "Meccan", description: "Emphasizes the oneness of Allah and refutes polytheism through arguments from nature and revelation." },
  { number: 7, arabicName: "الأعراف", englishName: "Al-A'raf", englishMeaning: "The Heights", ayahCount: 206, revelationType: "Meccan", description: "Narrates stories of past prophets and the fate of those who rejected their messages." },
  { number: 8, arabicName: "الأنفال", englishName: "Al-Anfal", englishMeaning: "The Spoils of War", ayahCount: 75, revelationType: "Medinan", description: "Deals with the Battle of Badr and rules regarding war booty and military conduct." },
  { number: 9, arabicName: "التوبة", englishName: "At-Tawbah", englishMeaning: "The Repentance", ayahCount: 129, revelationType: "Medinan", description: "Discusses the Tabuk expedition, treaties with polytheists, and the importance of repentance." },
  { number: 10, arabicName: "يونس", englishName: "Yunus", englishMeaning: "Jonah", ayahCount: 109, revelationType: "Meccan", description: "Centers on the story of Prophet Yunus and the message that no community is beyond Allah's mercy." },
  { number: 11, arabicName: "هود", englishName: "Hud", englishMeaning: "Hud", ayahCount: 123, revelationType: "Meccan", description: "Narrates stories of several prophets, emphasizing the consequences of rejecting divine guidance." },
  { number: 12, arabicName: "يوسف", englishName: "Yusuf", englishMeaning: "Joseph", ayahCount: 111, revelationType: "Meccan", description: "Tells the beautiful story of Prophet Yusuf in detail, highlighting patience and divine wisdom." },
  { number: 13, arabicName: "الرعد", englishName: "Ar-Ra'd", englishMeaning: "The Thunder", ayahCount: 43, revelationType: "Medinan", description: "Discusses the power of Allah as manifested in nature and the truth of revelation." },
  { number: 14, arabicName: "إبراهيم", englishName: "Ibrahim", englishMeaning: "Abraham", ayahCount: 52, revelationType: "Meccan", description: "Highlights the prayer of Prophet Ibrahim and the gratitude owed to Allah for His blessings." },
  { number: 15, arabicName: "الحجر", englishName: "Al-Hijr", englishMeaning: "The Rocky Tract", ayahCount: 99, revelationType: "Meccan", description: "Recounts the stories of past nations and reassures the Prophet of the truth of his mission." },
  { number: 16, arabicName: "النحل", englishName: "An-Nahl", englishMeaning: "The Bee", ayahCount: 128, revelationType: "Meccan", description: "Invites reflection on Allah's signs in creation, especially the bee, and outlines various blessings." },
  { number: 17, arabicName: "الإسراء", englishName: "Al-Isra", englishMeaning: "The Night Journey", ayahCount: 111, revelationType: "Meccan", description: "Opens with the Prophet's night journey from Makkah to Jerusalem and discusses moral and legal injunctions." },
  { number: 18, arabicName: "الكهف", englishName: "Al-Kahf", englishMeaning: "The Cave", ayahCount: 110, revelationType: "Meccan", description: "Contains four major stories: the People of the Cave, the Two Gardens, Musa and Khidr, and Dhul-Qarnayn." },
  { number: 19, arabicName: "مريم", englishName: "Maryam", englishMeaning: "Mary", ayahCount: 98, revelationType: "Meccan", description: "Recounts the stories of Maryam and the births of Yahya and Isa, emphasizing Allah's power." },
  { number: 20, arabicName: "طه", englishName: "Ta-Ha", englishMeaning: "Ta-Ha", ayahCount: 135, revelationType: "Meccan", description: "Focuses on the story of Musa, his mission to Pharaoh, and the Israelites' exodus from Egypt." },
  { number: 21, arabicName: "الأنبياء", englishName: "Al-Anbiya", englishMeaning: "The Prophets", ayahCount: 112, revelationType: "Meccan", description: "Mentions numerous prophets and their struggles, affirming the unity of the prophetic message." },
  { number: 22, arabicName: "الحج", englishName: "Al-Hajj", englishMeaning: "The Pilgrimage", ayahCount: 78, revelationType: "Medinan", description: "Discusses the rites of Hajj, the Day of Judgment, and the struggle in the path of Allah." },
  { number: 23, arabicName: "المؤمنون", englishName: "Al-Mu'minun", englishMeaning: "The Believers", ayahCount: 118, revelationType: "Meccan", description: "Describes the qualities of true believers and stages of human creation as signs of Allah." },
  { number: 24, arabicName: "النور", englishName: "An-Nur", englishMeaning: "The Light", ayahCount: 64, revelationType: "Medinan", description: "Contains laws on modesty, adultery, and social ethics, crowned by the Verse of Light." },
  { number: 25, arabicName: "الفرقان", englishName: "Al-Furqan", englishMeaning: "The Criterion", ayahCount: 77, revelationType: "Meccan", description: "Discusses the Quran as the criterion between truth and falsehood and refutes accusations against it." },
  { number: 26, arabicName: "الشعراء", englishName: "Ash-Shu'ara", englishMeaning: "The Poets", ayahCount: 227, revelationType: "Meccan", description: "Recounts stories of Musa, Ibrahim, Nuh, and others, ending with a mention of poets." },
  { number: 27, arabicName: "النمل", englishName: "An-Naml", englishMeaning: "The Ant", ayahCount: 93, revelationType: "Meccan", description: "Includes the story of Sulaiman and the ant, the Queen of Sheba, and the signs of Allah in nature." },
  { number: 28, arabicName: "القصص", englishName: "Al-Qasas", englishMeaning: "The Stories", ayahCount: 88, revelationType: "Meccan", description: "Details the story of Musa from birth to his mission, drawing lessons for the Prophet's own struggle." },
  { number: 29, arabicName: "العنكبوت", englishName: "Al-Ankabut", englishMeaning: "The Spider", ayahCount: 69, revelationType: "Meccan", description: "Uses the spider's web as a metaphor for the fragility of false worship and tests the sincerity of believers." },
  { number: 30, arabicName: "الروم", englishName: "Ar-Rum", englishMeaning: "The Romans", ayahCount: 60, revelationType: "Meccan", description: "Opens with the prophecy of Roman victory and discusses the signs of Allah in creation and history." },
  { number: 31, arabicName: "لقمان", englishName: "Luqman", englishMeaning: "Luqman", ayahCount: 34, revelationType: "Meccan", description: "Contains the wise counsel of Luqman to his son and emphasizes Tawhid and gratitude." },
  { number: 32, arabicName: "السجدة", englishName: "As-Sajdah", englishMeaning: "The Prostration", ayahCount: 30, revelationType: "Meccan", description: "Discusses creation, revelation, and the Day of Judgment, with a prostration verse." },
  { number: 33, arabicName: "الأحزاب", englishName: "Al-Ahzab", englishMeaning: "The Combined Forces", ayahCount: 73, revelationType: "Medinan", description: "Covers the Battle of the Trench, family laws, and the status of the Prophet's wives." },
  { number: 34, arabicName: "سبأ", englishName: "Saba", englishMeaning: "Sheba", ayahCount: 54, revelationType: "Meccan", description: "Recounts the story of the people of Sheba and the blessings and warnings from Allah." },
  { number: 35, arabicName: "فاطر", englishName: "Fatir", englishMeaning: "Originator", ayahCount: 45, revelationType: "Meccan", description: "Emphasizes Allah as the originator of creation and the grace He bestows on humanity." },
  { number: 36, arabicName: "يس", englishName: "Ya-Sin", englishMeaning: "Ya-Sin", ayahCount: 83, revelationType: "Meccan", description: "Known as the heart of the Quran, it reaffirms the truth of the message and the reality of resurrection." },
  { number: 37, arabicName: "الصافات", englishName: "As-Saffat", englishMeaning: "Those Ranged in Ranks", ayahCount: 182, revelationType: "Meccan", description: "Describes the ranks of angels and recounts stories of prophets to affirm the oneness of Allah." },
  { number: 38, arabicName: "ص", englishName: "Sad", englishMeaning: "The Letter Sad", ayahCount: 88, revelationType: "Meccan", description: "Discusses the stories of Dawud, Sulaiman, and Ayyub, and the patience of the righteous." },
  { number: 39, arabicName: "الزمر", englishName: "Az-Zumar", englishMeaning: "The Troops", ayahCount: 75, revelationType: "Meccan", description: "Urges sincere devotion to Allah alone and warns of the Day when all troops will be gathered." },
  { number: 40, arabicName: "غافر", englishName: "Ghafir", englishMeaning: "The Forgiver", ayahCount: 85, revelationType: "Meccan", description: "Opens with Allah's attributes of forgiveness and recounts the story of a believing man in Pharaoh's court." },
  { number: 41, arabicName: "فصلت", englishName: "Fussilat", englishMeaning: "Explained in Detail", ayahCount: 54, revelationType: "Meccan", description: "Discusses the Quran's detailed explanation and the fate of past nations who rejected their prophets." },
  { number: 42, arabicName: "الشورى", englishName: "Ash-Shura", englishMeaning: "The Consultation", ayahCount: 53, revelationType: "Meccan", description: "Emphasizes mutual consultation in community affairs and the unity of the divine message." },
  { number: 43, arabicName: "الزخرف", englishName: "Az-Zukhruf", englishMeaning: "The Ornaments of Gold", ayahCount: 89, revelationType: "Meccan", description: "Refutes the Makkan aristocracy's love of wealth and affirms the truth of the Quran over worldly ornaments." },
  { number: 44, arabicName: "الدخان", englishName: "Ad-Dukhan", englishMeaning: "The Smoke", ayahCount: 59, revelationType: "Meccan", description: "Warns of a smoke that will appear before the Day of Judgment and recounts the fate of Pharaoh." },
  { number: 45, arabicName: "الجاثية", englishName: "Al-Jathiyah", englishMeaning: "The Crouching", ayahCount: 37, revelationType: "Meccan", description: "Describes the Day when all will crouch before Allah and urges reflection on natural signs." },
  { number: 46, arabicName: "الأحقاف", englishName: "Al-Ahqaf", englishMeaning: "The Wind-Curved Sandhills", ayahCount: 35, revelationType: "Meccan", description: "Addresses the people of Aad and their destruction, and advises patience in delivering the message." },
  { number: 47, arabicName: "محمد", englishName: "Muhammad", englishMeaning: "Muhammad", ayahCount: 38, revelationType: "Medinan", description: "Deals with the Battle of Badr and contrasts the fate of believers and disbelievers." },
  { number: 48, arabicName: "الفتح", englishName: "Al-Fath", englishMeaning: "The Victory", ayahCount: 29, revelationType: "Medinan", description: "Celebrates the Treaty of Hudaybiyyah as a clear victory and outlines future conquests." },
  { number: 49, arabicName: "الحجرات", englishName: "Al-Hujurat", englishMeaning: "The Rooms", ayahCount: 18, revelationType: "Medinan", description: "Teaches social etiquette, avoiding backbiting, and verifying news before acting." },
  { number: 50, arabicName: "ق", englishName: "Qaf", englishMeaning: "The Letter Qaf", ayahCount: 45, revelationType: "Meccan", description: "Reminds of death and resurrection and the recording of all deeds by angelic scribes." },
  { number: 51, arabicName: "الذاريات", englishName: "Adh-Dhariyat", englishMeaning: "The Winnowing Winds", ayahCount: 60, revelationType: "Meccan", description: "Swears by the winds and recounts the stories of Ibrahim, Musa, and past nations." },
  { number: 52, arabicName: "الطور", englishName: "At-Tur", englishMeaning: "The Mount", ayahCount: 49, revelationType: "Meccan", description: "Describes the Day of Judgment and warns the deniers of their impending punishment." },
  { number: 53, arabicName: "النجم", englishName: "An-Najm", englishMeaning: "The Star", ayahCount: 62, revelationType: "Meccan", description: "Describes the Prophet's night journey and ascension and refutes the claim of intercessors beside Allah." },
  { number: 54, arabicName: "القمر", englishName: "Al-Qamar", englishMeaning: "The Moon", ayahCount: 55, revelationType: "Meccan", description: "Refers to the splitting of the moon and recounts the fate of past disbelieving nations." },
  { number: 55, arabicName: "الرحمن", englishName: "Ar-Rahman", englishMeaning: "The Beneficent", ayahCount: 78, revelationType: "Medinan", description: "Enumerates Allah's countless blessings and repeatedly asks, 'Which of the favors of your Lord will you deny?'" },
  { number: 56, arabicName: "الواقعة", englishName: "Al-Waqi'ah", englishMeaning: "The Inevitable", ayahCount: 96, revelationType: "Meccan", description: "Describes the Day of Judgment and the three categories of people: the foremost, the people of the right, and the people of the left." },
  { number: 57, arabicName: "الحديد", englishName: "Al-Hadid", englishMeaning: "The Iron", ayahCount: 29, revelationType: "Medinan", description: "Discusses the power of iron, the transience of worldly life, and the need for faith and charity." },
  { number: 58, arabicName: "المجادلة", englishName: "Al-Mujadilah", englishMeaning: "The Pleading Woman", ayahCount: 22, revelationType: "Medinan", description: "Reveals laws regarding the pre-Islamic practice of Zihar and the etiquette of private counsel with the Prophet." },
  { number: 59, arabicName: "الحشر", englishName: "Al-Hashr", englishMeaning: "The Exile", ayahCount: 24, revelationType: "Medinan", description: "Describes the exile of the Banu Nadir and contains the beautiful names of Allah in the final verses." },
  { number: 60, arabicName: "الممتحنة", englishName: "Al-Mumtahanah", englishMeaning: "She That Is Examined", ayahCount: 13, revelationType: "Medinan", description: "Deals with the testing of believing women who migrate and rules about alliances with disbelievers." },
  { number: 61, arabicName: "الصف", englishName: "As-Saff", englishMeaning: "The Ranks", ayahCount: 14, revelationType: "Medinan", description: "Urges believers to align their words with their deeds and mentions Isa's prophecy of Ahmad." },
  { number: 62, arabicName: "الجمعة", englishName: "Al-Jumu'ah", englishMeaning: "The Congregation", ayahCount: 11, revelationType: "Medinan", description: "Institutes the Friday congregational prayer and urges leaving trade when the call to prayer is made." },
  { number: 63, arabicName: "المنافقون", englishName: "Al-Munafiqun", englishMeaning: "The Hypocrites", ayahCount: 11, revelationType: "Medinan", description: "Exposes the hypocrites of Madinah and warns against being deceived by their outward appearance." },
  { number: 64, arabicName: "التغابن", englishName: "At-Taghabun", englishMeaning: "The Mutual Disillusion", ayahCount: 18, revelationType: "Medinan", description: "Discusses the Day of Mutual Disillusion and urges obedience to Allah and care for family." },
  { number: 65, arabicName: "الطلاق", englishName: "At-Talaq", englishMeaning: "The Divorce", ayahCount: 12, revelationType: "Medinan", description: "Outlines the rules of divorce, the waiting period, and the rights of women in Islam." },
  { number: 66, arabicName: "التحريم", englishName: "At-Tahrim", englishMeaning: "The Prohibition", ayahCount: 12, revelationType: "Medinan", description: "Addresses an incident in the Prophet's household and reminds of the examples of the wives of Nuh and Lut." },
  { number: 67, arabicName: "الملك", englishName: "Al-Mulk", englishMeaning: "The Sovereignty", ayahCount: 30, revelationType: "Meccan", description: "Glorifies Allah's sovereignty over all creation and serves as a protection from the torment of the grave." },
  { number: 68, arabicName: "القلم", englishName: "Al-Qalam", englishMeaning: "The Pen", ayahCount: 52, revelationType: "Meccan", description: "Defends the Prophet's character against slanders and tells the parable of the owners of the garden." },
  { number: 69, arabicName: "الحاقة", englishName: "Al-Haqqah", englishMeaning: "The Reality", ayahCount: 52, revelationType: "Meccan", description: "Describes the overwhelming reality of the Day of Judgment and the fate of past nations." },
  { number: 70, arabicName: "المعارج", englishName: "Al-Ma'arij", englishMeaning: "The Ascending Stairways", ayahCount: 44, revelationType: "Meccan", description: "Discusses the Day of Judgment whose measure is fifty thousand years and the qualities of true believers." },
  { number: 71, arabicName: "نوح", englishName: "Nuh", englishMeaning: "Noah", ayahCount: 28, revelationType: "Meccan", description: "Recounts Prophet Nuh's long struggle to call his people to Allah and their eventual destruction." },
  { number: 72, arabicName: "الجن", englishName: "Al-Jinn", englishMeaning: "The Jinn", ayahCount: 28, revelationType: "Meccan", description: "Describes a group of jinn who listened to the Quran and believed, and discusses their nature." },
  { number: 73, arabicName: "المزمل", englishName: "Al-Muzzammil", englishMeaning: "The Enshrouded One", ayahCount: 20, revelationType: "Meccan", description: "Addresses the Prophet wrapped in his cloak and commands prayer during the night." },
  { number: 74, arabicName: "المدثر", englishName: "Al-Muddaththir", englishMeaning: "The Cloaked One", ayahCount: 56, revelationType: "Meccan", description: "Commands the Prophet to arise and warn, and describes the terrible fate of the deniers." },
  { number: 75, arabicName: "القيامة", englishName: "Al-Qiyamah", englishMeaning: "The Resurrection", ayahCount: 40, revelationType: "Meccan", description: "Describes the Day of Resurrection and rebukes those who deny the possibility of being raised again." },
  { number: 76, arabicName: "الإنسان", englishName: "Al-Insan", englishMeaning: "The Human", ayahCount: 31, revelationType: "Medinan", description: "Describes the creation of man and the reward of the righteous in Paradise." },
  { number: 77, arabicName: "المرسلات", englishName: "Al-Mursalat", englishMeaning: "The Emissaries", ayahCount: 50, revelationType: "Meccan", description: "Swears by the winds sent forth and warns of the Day of Decision for the disbelievers." },
  { number: 78, arabicName: "النبأ", englishName: "An-Naba", englishMeaning: "The Tidings", ayahCount: 40, revelationType: "Meccan", description: "Discusses the great news of the Day of Judgment which people dispute about." },
  { number: 79, arabicName: "النازعات", englishName: "An-Nazi'at", englishMeaning: "Those Who Drag Forth", ayahCount: 46, revelationType: "Meccan", description: "Describes the angels who extract souls and recounts the story of Musa and Pharaoh." },
  { number: 80, arabicName: "عبس", englishName: "Abasa", englishMeaning: "He Frowned", ayahCount: 42, revelationType: "Meccan", description: "Reproaches the Prophet for frowning at a blind seeker of knowledge and emphasizes equal access to guidance." },
  { number: 81, arabicName: "التكوير", englishName: "At-Takwir", englishMeaning: "The Overthrowing", ayahCount: 29, revelationType: "Meccan", description: "Vividly describes cosmic events of the Day of Judgment when the sun is overthrown." },
  { number: 82, arabicName: "الانفطار", englishName: "Al-Infitar", englishMeaning: "The Cleaving", ayahCount: 19, revelationType: "Meccan", description: "Describes the sky being cleft apart on the Day of Judgment and the recording angels." },
  { number: 83, arabicName: "المطففين", englishName: "Al-Mutaffifin", englishMeaning: "The Defrauding", ayahCount: 36, revelationType: "Meccan", description: "Condemns those who cheat in weighing and measuring and contrasts the records of the righteous and wicked." },
  { number: 84, arabicName: "الانشقاق", englishName: "Al-Inshiqaq", englishMeaning: "The Sundering", ayahCount: 25, revelationType: "Meccan", description: "Describes the sky being rent asunder and the earth bringing forth its burdens on the Day of Judgment." },
  { number: 85, arabicName: "البروج", englishName: "Al-Buruj", englishMeaning: "The Mansions of the Stars", ayahCount: 22, revelationType: "Meccan", description: "Refers to the story of the People of the Ditch and warns of Allah's severe punishment." },
  { number: 86, arabicName: "الطارق", englishName: "At-Tariq", englishMeaning: "The Morning Star", ayahCount: 17, revelationType: "Meccan", description: "Swears by the night visitor and discusses human creation from a fluid, affirming resurrection." },
  { number: 87, arabicName: "الأعلى", englishName: "Al-A'la", englishMeaning: "The Most High", ayahCount: 19, revelationType: "Meccan", description: "Glorifies the name of the Lord Most High and mentions the books of Ibrahim and Musa." },
  { number: 88, arabicName: "الغاشية", englishName: "Al-Ghashiyah", englishMeaning: "The Overwhelming", ayahCount: 26, revelationType: "Meccan", description: "Describes the faces on the Day of Judgment—some humbled and some joyful—and reflects on creation." },
  { number: 89, arabicName: "الفجر", englishName: "Al-Fajr", englishMeaning: "The Dawn", ayahCount: 30, revelationType: "Meccan", description: "Swears by the dawn and recounts the destruction of Aad, Thamud, and Pharaoh." },
  { number: 90, arabicName: "البلد", englishName: "Al-Balud", englishMeaning: "The City", ayahCount: 20, revelationType: "Meccan", description: "Refers to the sacred city of Makkah and describes the steep path of righteousness." },
  { number: 91, arabicName: "الشمس", englishName: "Ash-Shams", englishMeaning: "The Sun", ayahCount: 15, revelationType: "Meccan", description: "Swears by the sun and its brightness and recounts the story of the she-camel of Thamud." },
  { number: 92, arabicName: "الليل", englishName: "Al-Layl", englishMeaning: "The Night", ayahCount: 21, revelationType: "Meccan", description: "Contrasts the paths of the righteous who give and the wicked who are greedy." },
  { number: 93, arabicName: "الضحى", englishName: "Ad-Duhaa", englishMeaning: "The Morning Hours", ayahCount: 11, revelationType: "Meccan", description: "Reassures the Prophet that Allah has not forsaken him and promises a future better than the past." },
  { number: 94, arabicName: "الشرح", englishName: "Ash-Sharh", englishMeaning: "The Relief", ayahCount: 8, revelationType: "Meccan", description: "Reminds the Prophet that with hardship comes ease and urges turning to Allah in devotion." },
  { number: 95, arabicName: "التين", englishName: "At-Tin", englishMeaning: "The Fig", ayahCount: 8, revelationType: "Meccan", description: "Swears by the fig, the olive, Mount Sinai, and the secure city, affirming human potential." },
  { number: 96, arabicName: "العلق", englishName: "Al-Alaq", englishMeaning: "The Clot", ayahCount: 19, revelationType: "Meccan", description: "The first revelation received by the Prophet, beginning with 'Read in the name of your Lord.'" },
  { number: 97, arabicName: "القدر", englishName: "Al-Qadr", englishMeaning: "The Power", ayahCount: 5, revelationType: "Meccan", description: "Describes the Night of Power (Laylatul Qadr) as better than a thousand months." },
  { number: 98, arabicName: "البينة", englishName: "Al-Bayyinah", englishMeaning: "The Clear Proof", ayahCount: 8, revelationType: "Medinan", description: "Discusses the clear proof that came to the People of the Book and the fate of disbelievers." },
  { number: 99, arabicName: "الزلزلة", englishName: "Az-Zalzalah", englishMeaning: "The Earthquake", ayahCount: 8, revelationType: "Medinan", description: "Describes the earthquake of the Day of Judgment and that even an atom's weight of good or evil will be seen." },
  { number: 100, arabicName: "العاديات", englishName: "Al-Adiyat", englishMeaning: "The Courser", ayahCount: 11, revelationType: "Meccan", description: "Swears by the charging warhorses and exposes human ingratitude and love of wealth." },
  { number: 101, arabicName: "القارئة", englishName: "Al-Qari'ah", englishMeaning: "The Calamity", ayahCount: 11, revelationType: "Meccan", description: "Describes the striking calamity of the Day of Judgment and the weighing of deeds." },
  { number: 102, arabicName: "التكاثر", englishName: "At-Takathur", englishMeaning: "The Rivalry in World Increase", ayahCount: 8, revelationType: "Meccan", description: "Warns against the competition in worldly accumulation that distracts from the Hereafter." },
  { number: 103, arabicName: "العصر", englishName: "Al-Asr", englishMeaning: "The Declining Day", ayahCount: 3, revelationType: "Meccan", description: "Declares that all of humanity is in loss except those who believe, do good, and enjoin truth and patience." },
  { number: 104, arabicName: "الهمزة", englishName: "Al-Humazah", englishMeaning: "The Traducer", ayahCount: 9, revelationType: "Meccan", description: "Condemns those who mock others and hoard wealth, warning of the crushing Fire." },
  { number: 105, arabicName: "الفيل", englishName: "Al-Fil", englishMeaning: "The Elephant", ayahCount: 5, revelationType: "Meccan", description: "Recounts how Allah destroyed the army of the elephant that came to destroy the Ka'bah." },
  { number: 106, arabicName: "قريش", englishName: "Quraysh", englishMeaning: "Quraysh", ayahCount: 4, revelationType: "Meccan", description: "Reminds the Quraysh of Allah's blessings of security and provision and calls them to worship the Lord of the Ka'bah." },
  { number: 107, arabicName: "الماعون", englishName: "Al-Ma'un", englishMeaning: "The Small Kindnesses", ayahCount: 7, revelationType: "Meccan", description: "Condemns those who neglect prayer and deny small kindnesses to the needy." },
  { number: 108, arabicName: "الكوثر", englishName: "Al-Kawthar", englishMeaning: "The Abundance", ayahCount: 3, revelationType: "Meccan", description: "Grants the Prophet the abundance of Al-Kawthar and tells him to pray and sacrifice." },
  { number: 109, arabicName: "الكافرون", englishName: "Al-Kafirun", englishMeaning: "The Disbelievers", ayahCount: 6, revelationType: "Meccan", description: "Declares a clear separation between the worship of Allah and the worship of false deities." },
  { number: 110, arabicName: "النصر", englishName: "An-Nasr", englishMeaning: "The Divine Support", ayahCount: 3, revelationType: "Medinan", description: "Announces the coming of Allah's help and victory and urges glorifying Him with praise." },
  { number: 111, arabicName: "المسد", englishName: "Al-Masad", englishMeaning: "The Palm Fiber", ayahCount: 5, revelationType: "Meccan", description: "Condemns Abu Lahab and his wife for their hostility to the Prophet, promising them the Fire." },
  { number: 112, arabicName: "الإخلاص", englishName: "Al-Ikhlas", englishMeaning: "The Sincerity", ayahCount: 4, revelationType: "Meccan", description: "Affirms the absolute oneness of Allah, equal to one-third of the Quran in meaning." },
  { number: 113, arabicName: "الفلق", englishName: "Al-Falaq", englishMeaning: "The Daybreak", ayahCount: 5, revelationType: "Meccan", description: "Seeks refuge in Allah from the evils of creation, darkness, sorcerers, and the envious." },
  { number: 114, arabicName: "الناس", englishName: "An-Nas", englishMeaning: "Mankind", ayahCount: 6, revelationType: "Meccan", description: "Seeks refuge in the Lord of mankind from the whisperings of Satan and evil-minded people." },
];

/**
 * Reciters with full-surah audio support.
 *
 * Audio sources (resolved at request time by /api/audio-url):
 *   1. cdn.islamic.network/quran/audio-surah/128/{reciterId}/{surah}.mp3 (primary — reliable)
 *   2. mp3quran.net per-reciter server+folder (fallback — authoritative base URLs in MP3QURAN_BASE)
 *
 * The reciter objects below carry an mp3quranFolder field retained for compatibility;
 * the actual server+folder mapping lives in MP3QURAN_BASE.
 */
export const RECITERS: Reciter[] = [
  // ─── Popular ───────────────────────────────────────────────────────────
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy", arabicName: "مشاري راشد العفاسي", country: "Kuwait", category: "Popular", style: "Murattal", mp3quranFolder: "afs" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit Abdul Samad", arabicName: "عبدالباسط عبدالصمد", country: "Egypt", category: "Popular", style: "Murattal", mp3quranFolder: "basit" },
  { id: "ar.abdulbasitmujawwad", name: "Abdul Basit Abdul Samad (Mujawwad)", arabicName: "عبدالباسط عبدالصمد مجود", country: "Egypt", category: "Popular", style: "Mujawwad", mp3quranFolder: "basit_j" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", arabicName: "محمود خليل الحصري", country: "Egypt", category: "Popular", style: "Murattal", mp3quranFolder: "husr" },
  { id: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi", arabicName: "محمد صديق المنشاوي", country: "Egypt", category: "Popular", style: "Mujawwad", mp3quranFolder: "minsh" },
  { id: "ar.yasseraldossari", name: "Yasser Ad-Dosari", arabicName: "ياسر الدوسري", country: "Saudi Arabia", category: "Popular", style: "Murattal", mp3quranFolder: "dosari" },
  { id: "ar.saudalshuraim", name: "Saoud Ash-Shuraym", arabicName: "سعود الشريم", country: "Saudi Arabia", category: "Popular", style: "Murattal", mp3quranFolder: "shur" },
  { id: "ar.mahershakhashiro", name: "Maher Al Muaiqly", arabicName: "ماهر المعيقلي", country: "Saudi Arabia", category: "Popular", style: "Murattal", mp3quranFolder: "maher" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", arabicName: "عبدالرحمن السديس", country: "Saudi Arabia", category: "Popular", style: "Murattal", mp3quranFolder: "sds" },

  // ─── Egyptian ──────────────────────────────────────────────────────────
  { id: "ar.muhammadayyub", name: "Muhammad Ayyub", arabicName: "محمد أيوب", country: "Egypt", category: "Egyptian", style: "Murattal", mp3quranFolder: "ayyub" },
  { id: "ar.haniarrifai", name: "Hani Ar-Rifai", arabicName: "هاني الرفاعي", country: "Egypt", category: "Egyptian", style: "Murattal", mp3quranFolder: "rifai" },
  { id: "ar.ahmedalajmi", name: "Ahmed Al-Ajamy", arabicName: "أحمد العجمي", country: "Egypt", category: "Egyptian", style: "Murattal", mp3quranFolder: "ajm" },
  { id: "ar.mahmoudalialbanna", name: "Mahmoud Ali Al-Banna", arabicName: "محمود علي البنا", country: "Egypt", category: "Egyptian", style: "Murattal", mp3quranFolder: "banna" },
  { id: "ar.muhammadanwarshahat", name: "Mohammad Ash-Shahat", arabicName: "محمد الشحات", country: "Egypt", category: "Egyptian", style: "Murattal", mp3quranFolder: "shhat" },
  { id: "ar.mustafaismail", name: "Mustafa Ismail", arabicName: "مصطفى إسماعيل", country: "Egypt", category: "Egyptian", style: "Murattal", mp3quranFolder: "sm_ismail" },

  // ─── Saudi ─────────────────────────────────────────────────────────────
  { id: "ar.aliabdurrahmanalhuthaify", name: "Ali Al-Hudhaify", arabicName: "علي الحذيفي", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "huthfi" },
  { id: "ar.abdullahbasfar", name: "Abdullah Basfar", arabicName: "عبدالله بصفر", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "basfar" },
  { id: "ar.faresabbad", name: "Fares Abbaad", arabicName: "فارست عباد", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "abbad" },
  { id: "ar.ibrahimalakhdar", name: "Ibrahim Al-Akhdar", arabicName: "إبراهيم الأخضر", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "akdr" },
  { id: "ar.abdullahalmatrood", name: "Abdullah Al-Matrood", arabicName: "عبدالله المطرود", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "mtrod" },
  { id: "ar.salahalbudair", name: "Salah Al-Budair", arabicName: "صلاح البدير", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "bdar" },
  { id: "ar.muhammadalluhaidan", name: "Muhammad Al-Luhaidan", arabicName: "محمد اللحيدان", country: "Saudi Arabia", category: "Saudi", style: "Murattal", mp3quranFolder: "lhdn" },

  // ─── Other ─────────────────────────────────────────────────────────────
  { id: "ar.ibrahimaldossari", name: "Ibrahim Al-Dossari", arabicName: "إبراهيم الدوسري", country: "Saudi Arabia", category: "Other", style: "Murattal", mp3quranFolder: "dosri2" },
  { id: "ar.nasseralqatami", name: "Nasser Al-Qatami", arabicName: "ناصر القطامي", country: "Saudi Arabia", category: "Other", style: "Murattal", mp3quranFolder: "qtmi" },
  { id: "ar.khaledalqahtani", name: "Khaled Al-Qahtani", arabicName: "خالد القحطاني", country: "Saudi Arabia", category: "Other", style: "Murattal", mp3quranFolder: "qhtani" },
  { id: "ar.abdulbariaththubaity", name: "Abdul Bari Ath-Thubaity", arabicName: "عبدالباري الثبيتي", country: "Saudi Arabia", category: "Other", style: "Murattal", mp3quranFolder: "thbyty" },
];

/** Zero-pad a surah number to 3 digits (001-114). */
export function padSurah(num: number): string {
  return num.toString().padStart(3, "0");
}

/**
 * Authoritative mp3quran.net base URLs (server + folder) per reciter,
 * sourced from https://www.mp3quran.net/api/v3/reciters. Each value is the
 * base path; the zero-padded surah number + ".mp3" is appended.
 */
export const MP3QURAN_BASE: Record<string, string> = {
  "ar.alafasy": "https://server8.mp3quran.net/afs",
  "ar.abdulbasitmurattal": "https://server7.mp3quran.net/basit",
  "ar.abdulbasitmujawwad": "https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad",
  "ar.husary": "https://server13.mp3quran.net/husr",
  "ar.minshawi": "https://server10.mp3quran.net/minsh",
  "ar.yasseraldossari": "https://server11.mp3quran.net/yasser",
  "ar.saudalshuraim": "https://server7.mp3quran.net/shur",
  "ar.mahershakhashiro": "https://server12.mp3quran.net/maher/Almusshaf-Al-Mojawwad",
  "ar.abdurrahmaansudais": "https://server11.mp3quran.net/sds",
  "ar.muhammadayyub": "https://server16.mp3quran.net/ayyoub2/Rewayat-Hafs-A-n-Assem",
  "ar.haniarrifai": "https://server8.mp3quran.net/hani",
  "ar.ahmedalajmi": "https://server10.mp3quran.net/ajm",
  "ar.mahmoudalialbanna": "https://server8.mp3quran.net/bna/Almusshaf-Al-Mojawwad",
  "ar.muhammadanwarshahat": "https://server12.mp3quran.net/shah",
  "ar.mustafaismail": "https://server8.mp3quran.net/mustafa/Almusshaf-Al-Mojawwad",
  "ar.aliabdurrahmanalhuthaify": "https://server9.mp3quran.net/hthfi/Rewayat-Sho-bah-A-n-Asim",
  "ar.abdullahbasfar": "https://server6.mp3quran.net/bsfr",
  "ar.faresabbad": "https://server8.mp3quran.net/frs_a",
  "ar.ibrahimalakhdar": "https://server6.mp3quran.net/akdr",
  "ar.abdullahalmatrood": "https://server8.mp3quran.net/mtrod",
  "ar.salahalbudair": "https://server6.mp3quran.net/s_bud",
  "ar.muhammadalluhaidan": "https://server8.mp3quran.net/lhdan",
  "ar.ibrahimaldossari": "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem",
  "ar.nasseralqatami": "https://server6.mp3quran.net/qtm",
  "ar.khaledalqahtani": "https://server10.mp3quran.net/qht",
  "ar.abdulbariaththubaity": "https://server6.mp3quran.net/thubti",
};

/**
 * Live Quran radio stations — 24/7 streaming from major broadcasters.
 * Stream URLs sourced from mp3quran.net radio API & radiojar.com.
 */
export const RADIO_STATIONS: RadioStation[] = [
  {
    id: "egypt-cairo-holyquranradio",
    name: "Egypt — Quran Radio Cairo (HolyQuranRadio.com)",
    arabicName: "إذاعة القرآن الكريم من القاهرة",
    description: "Official Holy Quran Radio from Cairo — Egyptian Radio and Television Union / Maspero — holyquranradio.com",
    streamUrl: "https://stream.radiojar.com/8s5u5tpdtwzuv",
    fallbackUrls: ["https://backup.qurango.net/radio/mahmoud_khalil_alhussary"],
    location: "Cairo, Egypt",
    timezone: "Africa/Cairo",
    category: "quran",
    reciterName: "Various Reciters",
    reciterArabicName: "عدة قراء",
  },
  {
    id: "egypt-hussary",
    name: "Egypt — Quran Radio (Al-Hussary)",
    arabicName: "إذاعة القرآن الكريم — محمود خليل الحصري",
    description: "Egyptian Quran Radio — continuous recitation by Sheikh Al-Hussary from Cairo",
    streamUrl: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary",
    location: "Cairo, Egypt",
    timezone: "Africa/Cairo",
    category: "quran",
    reciterName: "Mahmoud Khalil Al-Hussary",
    reciterArabicName: "محمود خليل الحصري",
  },
  {
    id: "egypt-basit",
    name: "Egypt — Quran Radio (Abdulbasit)",
    arabicName: "إذاعة القرآن الكريم — عبدالباسط عبدالصمد",
    description: "Egyptian Quran Radio — renowned recitation by Sheikh Abdulbasit",
    streamUrl: "https://backup.qurango.net/radio/abdulbasit_abdulsamad",
    location: "Cairo, Egypt",
    timezone: "Africa/Cairo",
    category: "quran",
    reciterName: "Abdulbasit Abdusamad",
    reciterArabicName: "عبدالباسط عبدالصمد",
  },
  {
    id: "kuwait-afasy",
    name: "Quran — Mishary Rashid Alafasy",
    arabicName: "القرآن الكريم — مشاري العفاسي",
    description: "24/7 Quran recitation by Sheikh Mishary Alafasy",
    streamUrl: "https://backup.qurango.net/radio/mishary_alafasi",
    location: "Kuwait",
    timezone: "Asia/Kuwait",
    category: "quran",
    reciterName: "Mishary Rashid Alafasy",
    reciterArabicName: "مشاري راشد العفاسي",
  },

  // ── Ruqyah al-Shariah ──────────────────────────────────
  {
    id: "ruqyah-general",
    name: "Ruqyah al-Shariah — Various Reciters",
    arabicName: "الرقية الشرعية من عدة قراء",
    description: "Comprehensive ruqyah recitations from multiple renowned sheikhs — Quranic healing and protection incantations",
    streamUrl: "https://backup.qurango.net/radio/roqiah",
    location: "Various",
    timezone: "Asia/Riyadh",
    category: "ruqyah",
    reciterName: "Various Reciters",
    reciterArabicName: "عدة قراء",
  },
  {
    id: "ruqyah-minshawi",
    name: "Ruqyah — Muhammad Siddiq Al-Minshawi",
    arabicName: "الرقية الشرعية — محمد صديق المنشاوي",
    description: "Ruqyah and healing recitations by the legendary Egyptian Qari Al-Minshawi",
    streamUrl: "https://backup.qurango.net/radio/mohammed_siddiq_alminshawi",
    location: "Egypt",
    timezone: "Africa/Cairo",
    category: "ruqyah",
    reciterName: "Muhammad Siddiq Al-Minshawi",
    reciterArabicName: "محمد صديق المنشاوي",
  },
  {
    id: "ruqyah-basit",
    name: "Ruqyah — Abdulbasit Abdusamad",
    arabicName: "الرقية الشرعية — عبدالباسط عبدالصمد",
    description: "Powerful ruqyah and Quranic healing by the legendary Sheikh Abdulbasit Abdusamad",
    streamUrl: "https://backup.qurango.net/radio/abdulbasit_abdulsamad",
    location: "Egypt",
    timezone: "Africa/Cairo",
    category: "ruqyah",
    reciterName: "Abdulbasit Abdusamad",
    reciterArabicName: "عبدالباسط عبدالصمد",
  },
  {
    id: "ruqyah-hussary",
    name: "Ruqyah — Mahmoud Khalil Al-Hussary",
    arabicName: "الرقية الشرعية — محمود خليل الحصري",
    description: "Ruqyah recitations by the renowned Egyptian Qari Sheikh Al-Hussary",
    streamUrl: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary",
    location: "Egypt",
    timezone: "Africa/Cairo",
    category: "ruqyah",
    reciterName: "Mahmoud Khalil Al-Hussary",
    reciterArabicName: "محمود خليل الحصري",
  },
  {
    id: "ruqyah-afasy",
    name: "Ruqyah — Mishary Al-Afasy",
    arabicName: "الرقية الشرعية — مشاري العفاسي",
    description: "Soothing ruqyah recitations by Sheikh Mishary Al-Afasy",
    streamUrl: "https://backup.qurango.net/radio/mishary_alafasi",
    location: "Kuwait",
    timezone: "Asia/Kuwait",
    category: "ruqyah",
    reciterName: "Mishary Al-Afasy",
    reciterArabicName: "مشاري العفاسي",
  },
  {
    id: "ruqyah-shuraym",
    name: "Ruqyah — Saud Al-Shuraym",
    arabicName: "الرقية الشرعية — سعود الشريم",
    description: "Ruqyah and healing recitations by Imam of Masjid al-Haram Sheikh Saud Al-Shuraym",
    streamUrl: "https://backup.qurango.net/radio/saud_alshuraim",
    location: "Mecca, Saudi Arabia",
    timezone: "Asia/Riyadh",
    category: "ruqyah",
    reciterName: "Saud Al-Shuraym",
    reciterArabicName: "سعود الشريم",
  },
  {
    id: "ruqyah-sudais",
    name: "Ruqyah — Abdulrahman Al-Sudais",
    arabicName: "الرقية الشرعية — عبدالرحمن السديس",
    description: "Ruqyah and healing recitations by Imam of Masjid al-Haram Sheikh Al-Sudais",
    streamUrl: "https://backup.qurango.net/radio/abdulrahman_alsudaes",
    location: "Mecca, Saudi Arabia",
    timezone: "Asia/Riyadh",
    category: "ruqyah",
    reciterName: "Abdulrahman Al-Sudais",
    reciterArabicName: "عبدالرحمن السديس",
  },

  // Note: No additional live audio radio stations available at this time.

  // ── Hisn Muslim ──────────────────────────────────────────
  {
    id: "hisn-cd1",
    name: "Hisn Muslim — Part 1 (CD 1)",
    arabicName: "حصن المسلم — الجزء الأول",
    description: "Fortress of the Muslim — authentic duas and adhkar, recited by Hafiz Shaykh Yahya Hawwa — Part 1 of 2",
    streamUrl: "https://archive.org/download/Hisnul-Muslim-Fortress-Of-The-Muslim-Audio-MP3-CD/Hisnul-Muslim_CD_1_%28www.TheChoice.one%29.mp3",
    location: "Various",
    timezone: "Asia/Riyadh",
    category: "hisn_muslim",
    isLive: false,
  },
  {
    id: "hisn-cd2",
    name: "Hisn Muslim — Part 2 (CD 2)",
    arabicName: "حصن المسلم — الجزء الثاني",
    description: "Fortress of the Muslim — authentic duas and adhkar, recited by Hafiz Shaykh Yahya Hawwa — Part 2 of 2",
    streamUrl: "https://archive.org/download/Hisnul-Muslim-Fortress-Of-The-Muslim-Audio-MP3-CD/Hisnul-Muslim_CD_2_%28www.TheChoice.one%29.mp3",
    location: "Various",
    timezone: "Asia/Riyadh",
    category: "hisn_muslim",
    isLive: false,
  },
];

/** Get all stations for a given category */
export function getStationsByCategory(category: RadioStation["category"]): RadioStation[] {
  return RADIO_STATIONS.filter((s) => s.category === category);
}

/** Get next station in the same category (for cycling) */
export function getNextStation(current: RadioStation): RadioStation | null {
  const same = getStationsByCategory(current.category);
  const idx = same.findIndex((s) => s.id === current.id);
  if (idx < 0 || same.length <= 1) return null;
  return same[(idx + 1) % same.length];
}

/** Get previous station in the same category */
export function getPrevStation(current: RadioStation): RadioStation | null {
  const same = getStationsByCategory(current.category);
  const idx = same.findIndex((s) => s.id === current.id);
  if (idx < 0 || same.length <= 1) return null;
  return same[(idx - 1 + same.length) % same.length];
}

/**
 * Primary audio URL for a full surah — mp3quran.net CDN.
 * Returns "" when no base is configured for the reciter.
 */
export function getSurahAudioUrl(reciterId: string, surahNumber: number): string {
  const base = MP3QURAN_BASE[reciterId];
  if (base) {
    return `${base}/${padSurah(surahNumber)}.mp3`;
  }
  return "";
}

/**
 * Fallback audio URL for a full surah — cdn.islamic.network.
 * The `audio-surah/128` path covers the vast majority of reciters
 * (verified 200 for ~22/30). Used as the first fallback candidate.
 */
export function getFallbackAudioUrl(reciterId: string, surahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${surahNumber}.mp3`;
}

/**
 * Second fallback candidate for cdn.islamic.network. The `audio/128` path
 * covers a different subset of reciters (e.g. ar.alafasy, ar.husary), so it
 * is tried after `audio-surah/128` when the latter is unavailable.
 */
export function getFallbackAudioUrlAlt(reciterId: string, surahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${surahNumber}.mp3`;
}
