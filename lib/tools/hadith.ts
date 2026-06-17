/* A curated set of short, well-attested hadiths (mostly Bukhari/Muslim and the
   40 Hadith of an-Nawawi tradition), given as widely-accepted English renderings
   with their source. Arabic is included only for a few very well-known texts to
   keep transcription risk low. Conservative starter set — verify wording in the
   original collections. Static data, server-rendered for SEO. */

export interface Hadith {
  text: string;
  source: string;
  arabic?: string;
}

export const HADITHS: Hadith[] = [
  {
    text: "Actions are but by intentions, and every person will have only what they intended.",
    source: "Bukhari & Muslim",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
  },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
    source: "Bukhari & Muslim",
  },
  {
    text: "The strong person is not the one who overcomes people by his strength, but the one who controls himself when angry.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Make things easy and do not make them difficult; give glad tidings and do not repel people.",
    source: "Bukhari",
  },
  {
    text: "The best of you are those who are best to their families.",
    source: "Tirmidhi",
  },
  {
    text: "He who does not thank people has not thanked Allah.",
    source: "Abu Dawud & Tirmidhi",
  },
  {
    text: "A good word is a charity.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Allah is gentle and loves gentleness in all matters.",
    source: "Bukhari & Muslim",
  },
  {
    text: "The most beloved deeds to Allah are those done consistently, even if they are small.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Fear Allah wherever you are, follow a bad deed with a good one to erase it, and treat people with good character.",
    source: "Tirmidhi",
  },
  {
    text: "Modesty (haya) is part of faith.",
    source: "Bukhari & Muslim",
    arabic: "الْحَيَاءُ مِنَ الْإِيمَانِ",
  },
  {
    text: "Purity is half of faith.",
    source: "Muslim",
    arabic: "الطُّهُورُ شَطْرُ الْإِيمَانِ",
  },
  {
    text: "Whoever does not show mercy to people, Allah will not show mercy to him.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Whoever treads a path seeking knowledge, Allah will make easy for him a path to Paradise.",
    source: "Muslim",
  },
  {
    text: "Smiling in the face of your brother is a charity.",
    source: "Tirmidhi",
  },
  {
    text: "True richness is not an abundance of possessions; rather, true richness is the richness of the soul.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Part of the excellence of a person's Islam is his leaving that which does not concern him.",
    source: "Tirmidhi",
  },
  {
    text: "Whoever guides someone to good will have a reward like the one who does it.",
    source: "Muslim",
  },
  {
    text: "Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.",
    source: "Muslim",
  },
  {
    text: "Be in this world as though you were a stranger or a traveller.",
    source: "Bukhari",
  },
  {
    text: "Whoever relieves a believer of a hardship of this world, Allah will relieve him of a hardship on the Day of Resurrection.",
    source: "Muslim",
  },
  {
    text: "The believer is not the one who eats his fill while his neighbour beside him goes hungry.",
    source: "Al-Adab al-Mufrad",
  },
  {
    text: "Kindness is not found in anything except that it beautifies it, and it is not removed from anything except that it disgraces it.",
    source: "Muslim",
  },
];
