import "server-only";

/* Qur'an text, translation and recitation via the AlQuran.cloud API (free,
   keyless, CORS). Arabic from quran-uthmani (Tanzil), English from Saheeh
   International (en.sahih), audio from Mishary al-Afasy (ar.alafasy). Cached for
   ~30 days since the text is static. Same free/keyless/cached pattern as
   lib/prayer-times.ts. Returns null on failure so pages can degrade gracefully.

   Attribution shown to users; translations remain © their publishers. */

const BASE = "https://api.alquran.cloud/v1";
const REVALIDATE = 60 * 60 * 24 * 30; // 30 days
export const QURAN_ATTRIBUTION =
  "Arabic: Tanzil (Uthmani) · Translation: Saheeh International · Audio: Mishary al-Afasy — via AlQuran.cloud";

export interface Ayah { n: number; arabic: string; english: string; audio: string }
export interface SurahContent {
  number: number;
  nameArabic: string;
  englishName: string;
  englishMeaning: string;
  revelation: string;
  ayahCount: number;
  ayahs: Ayah[];
}

export interface SearchMatch { surah: number; surahName: string; ayah: number; text: string }
export interface SearchResult { count: number; matches: SearchMatch[] }

export async function getSurah(n: number): Promise<SurahContent | null> {
  if (!Number.isInteger(n) || n < 1 || n > 114) return null;
  try {
    const res = await fetch(`${BASE}/surah/${n}/editions/quran-uthmani,en.sahih,ar.alafasy`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const editions = json?.data as Array<{
      englishName: string;
      englishNameTranslation: string;
      name: string;
      revelationType: string;
      numberOfAyahs: number;
      ayahs: Array<{ numberInSurah: number; text: string; audio?: string }>;
    }> | undefined;
    if (!Array.isArray(editions) || editions.length < 2) return null;
    const [ar, en, audio] = editions;
    const ayahs: Ayah[] = ar.ayahs.map((a, i) => ({
      n: a.numberInSurah,
      arabic: a.text,
      english: en.ayahs[i]?.text || "",
      audio: audio?.ayahs?.[i]?.audio || "",
    }));
    return {
      number: n,
      nameArabic: ar.name,
      englishName: ar.englishName,
      englishMeaning: ar.englishNameTranslation,
      revelation: ar.revelationType,
      ayahCount: ar.numberOfAyahs,
      ayahs,
    };
  } catch {
    return null;
  }
}

export async function searchQuran(q: string): Promise<SearchResult | null> {
  const keyword = q.trim();
  if (!keyword) return { count: 0, matches: [] };
  try {
    const res = await fetch(`${BASE}/search/${encodeURIComponent(keyword)}/all/en.sahih`, {
      next: { revalidate: REVALIDATE },
    });
    // The API returns 404 when there are no matches — treat as an empty result.
    if (res.status === 404) return { count: 0, matches: [] };
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data as
      | { count: number; matches: Array<{ text: string; numberInSurah: number; surah: { number: number; englishName: string } }> }
      | undefined;
    if (!data || !Array.isArray(data.matches)) return { count: 0, matches: [] };
    const matches: SearchMatch[] = data.matches.slice(0, 100).map((m) => ({
      surah: m.surah.number,
      surahName: m.surah.englishName,
      ayah: m.numberInSurah,
      text: m.text,
    }));
    return { count: data.count ?? matches.length, matches };
  } catch {
    return null;
  }
}
