/* A curated library of authentic everyday duas, grouped by occasion.
   Each dua cites its source (Qur'an reference or hadith collection). This is a
   conservative starter set of widely-accepted, well-attested supplications —
   not an exhaustive collection. Static data, rendered server-side for SEO.
   Always learn pronunciation from a qualified teacher. */

export interface Dua {
  title: string;
  arabic: string;
  translit: string;
  translation: string;
  source: string;
}

export interface DuaGroup {
  occasion: string;
  items: Dua[];
}

export const DUA_GROUPS: DuaGroup[] = [
  {
    occasion: "Morning & night",
    items: [
      {
        title: "On waking up",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        translit: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
        translation: "All praise is for Allah who gave us life after He caused us to die, and to Him is the return.",
        source: "Sahih al-Bukhari",
      },
      {
        title: "Before sleeping",
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        translit: "Bismika Allahumma amutu wa ahya",
        translation: "In Your name, O Allah, I die and I live.",
        source: "Sahih al-Bukhari",
      },
    ],
  },
  {
    occasion: "Before & after eating",
    items: [
      {
        title: "Before eating",
        arabic: "بِسْمِ اللَّهِ",
        translit: "Bismillah",
        translation:
          "In the name of Allah. (If forgotten at the start, say: 'Bismillahi awwalahu wa akhirahu' — In the name of Allah, at its beginning and its end.)",
        source: "Abu Dawud, At-Tirmidhi",
      },
      {
        title: "After eating",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
        translit: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
        translation:
          "All praise is for Allah who fed me this and provided it for me, without any might or power on my part.",
        source: "Abu Dawud, At-Tirmidhi",
      },
    ],
  },
  {
    occasion: "Coming & going",
    items: [
      {
        title: "Leaving the home",
        arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        translit: "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
        translation:
          "In the name of Allah, I place my trust in Allah; there is no might nor power except with Allah.",
        source: "Abu Dawud, At-Tirmidhi",
      },
      {
        title: "Entering the masjid",
        arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        translit: "Allahumma-ftah li abwaba rahmatik",
        translation: "O Allah, open for me the gates of Your mercy.",
        source: "Sahih Muslim",
      },
      {
        title: "Leaving the masjid",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
        translit: "Allahumma inni as'aluka min fadlik",
        translation: "O Allah, I ask You from Your bounty.",
        source: "Sahih Muslim",
      },
    ],
  },
  {
    occasion: "Travel",
    items: [
      {
        title: "When setting out to travel",
        arabic:
          "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
        translit:
          "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun",
        translation:
          "Glory to Him who has subjected this to us, and we could never have accomplished it. And indeed, to our Lord we will surely return.",
        source: "Qur'an 43:13–14; Sahih Muslim",
      },
    ],
  },
  {
    occasion: "Purification & prayer",
    items: [
      {
        title: "After wudu (ablution)",
        arabic:
          "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
        translit:
          "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh",
        translation:
          "I bear witness that there is no deity but Allah alone, with no partner, and that Muhammad is His servant and Messenger.",
        source: "Sahih Muslim",
      },
      {
        title: "Entering the toilet",
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
        translit: "Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith",
        translation: "O Allah, I seek refuge in You from all evil and impurity.",
        source: "Sahih al-Bukhari, Sahih Muslim",
      },
    ],
  },
  {
    occasion: "Hardship, knowledge & forgiveness",
    items: [
      {
        title: "In distress (the dua of Yunus ﷺ)",
        arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
        translit: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
        translation:
          "There is no deity except You; glory be to You. Indeed, I have been of the wrongdoers.",
        source: "Qur'an 21:87",
      },
      {
        title: "Good in both worlds",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        translit: "Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina 'adhaban-nar",
        translation:
          "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        source: "Qur'an 2:201",
      },
      {
        title: "Asking for knowledge",
        arabic: "رَبِّ زِدْنِي عِلْمًا",
        translit: "Rabbi zidni 'ilma",
        translation: "My Lord, increase me in knowledge.",
        source: "Qur'an 20:114",
      },
      {
        title: "The chief of seeking forgiveness (Sayyid al-Istighfar)",
        arabic:
          "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        translit:
          "Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mas-tata't, a'udhu bika min sharri ma sana't, abu'u laka bi ni'matika 'alayy, wa abu'u bi dhanbi, faghfir li fa innahu la yaghfirudh-dhunuba illa ant",
        translation:
          "O Allah, You are my Lord, there is no deity but You. You created me and I am Your servant; I keep Your covenant and pledge to You as best I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
        source: "Sahih al-Bukhari",
      },
    ],
  },
];
