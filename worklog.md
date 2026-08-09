---
Task ID: 1
Agent: Main
Task: Rebuild Quran Kareem audio system - full surah streaming with reliable sources

Work Log:
- Read all current project files (audio-store, audio-player, quran-data, quran-types, page.tsx, etc.)
- Analyzed that the current architecture already uses full-surah audio files (not ayah-by-ayah) but had reliability issues with the audio source
- Updated `quran-data.ts`: Added `mp3quranFolder` field to reciters for reliable mp3quran.net CDN access, added `getSurahAudioUrl()` (primary: mp3quran.net) and `getFallbackAudioUrl()` (fallback: cdn.islamic.network), added Mahmoud Khalil Al-Husary as a prominent reciter, ensured Abdalbaset Abdalsamad (Murattal + Mujawwad) is prominently available
- Updated `quran-types.ts`: Added optional `mp3quranFolder` field to Reciter interface
- Rebuilt `audio-store.ts`: Added `audioError`, `isUsingFallback` state fields, added `setAudioError()`, `setIsUsingFallback()` actions, reset error state on surah/reciter changes
- Rebuilt `audio-player.tsx`: Implemented dual-source fallback (try primary mp3quran.net, then cdn.islamic.network), added retry button on error, removed auto-skip on error, added error display bar with retry, show "backup source" indicator when using fallback, cleaned up audio loading logic
- Updated `reciter-panel.tsx`: Updated audio quality description to reflect new source strategy
- Ran lint (0 errors, 1 existing warning), tested app loads (200 OK)

Stage Summary:
- Audio system now uses mp3quran.net as primary source (fast, reliable CDN with full surah MP3s)
- Automatic fallback to cdn.islamic.network if primary fails
- Visual error feedback with retry button instead of silent auto-skip
- Abdalbaset Abdalsamad available in both Murattal and Mujawwad styles
- Added Mahmoud Khalil Al-Husary as a popular reciter
- All reciters with mp3quran.net folders get reliable full-surah streaming
