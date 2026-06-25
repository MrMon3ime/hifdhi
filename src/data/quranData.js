// Quran data - all 114 surahs with ayah counts and juz
export const SURAHS = [
  { number: 1,  nameAr: 'الفاتحة',       nameEn: 'Al-Fatihah',         ayahs: 7,   juz: 1  },
  { number: 2,  nameAr: 'البقرة',         nameEn: 'Al-Baqarah',         ayahs: 286, juz: 1  },
  { number: 3,  nameAr: 'آل عمران',       nameEn: "Ali 'Imran",         ayahs: 200, juz: 3  },
  { number: 4,  nameAr: 'النساء',         nameEn: 'An-Nisa',            ayahs: 176, juz: 4  },
  { number: 5,  nameAr: 'المائدة',        nameEn: 'Al-Maidah',          ayahs: 120, juz: 6  },
  { number: 6,  nameAr: 'الأنعام',        nameEn: 'Al-An\'am',          ayahs: 165, juz: 7  },
  { number: 7,  nameAr: 'الأعراف',        nameEn: 'Al-A\'raf',          ayahs: 206, juz: 8  },
  { number: 8,  nameAr: 'الأنفال',        nameEn: 'Al-Anfal',           ayahs: 75,  juz: 9  },
  { number: 9,  nameAr: 'التوبة',         nameEn: 'At-Tawbah',          ayahs: 129, juz: 10 },
  { number: 10, nameAr: 'يونس',           nameEn: 'Yunus',              ayahs: 109, juz: 11 },
  { number: 11, nameAr: 'هود',            nameEn: 'Hud',                ayahs: 123, juz: 11 },
  { number: 12, nameAr: 'يوسف',           nameEn: 'Yusuf',              ayahs: 111, juz: 12 },
  { number: 13, nameAr: 'الرعد',          nameEn: 'Ar-Ra\'d',           ayahs: 43,  juz: 13 },
  { number: 14, nameAr: 'إبراهيم',        nameEn: 'Ibrahim',            ayahs: 52,  juz: 13 },
  { number: 15, nameAr: 'الحجر',          nameEn: 'Al-Hijr',            ayahs: 99,  juz: 14 },
  { number: 16, nameAr: 'النحل',          nameEn: 'An-Nahl',            ayahs: 128, juz: 14 },
  { number: 17, nameAr: 'الإسراء',        nameEn: "Al-Isra'",           ayahs: 111, juz: 15 },
  { number: 18, nameAr: 'الكهف',          nameEn: 'Al-Kahf',            ayahs: 110, juz: 15 },
  { number: 19, nameAr: 'مريم',           nameEn: 'Maryam',             ayahs: 98,  juz: 16 },
  { number: 20, nameAr: 'طه',             nameEn: 'Ta-Ha',              ayahs: 135, juz: 16 },
  { number: 21, nameAr: 'الأنبياء',       nameEn: 'Al-Anbiya',          ayahs: 112, juz: 17 },
  { number: 22, nameAr: 'الحج',           nameEn: 'Al-Hajj',            ayahs: 78,  juz: 17 },
  { number: 23, nameAr: 'المؤمنون',       nameEn: 'Al-Mu\'minun',       ayahs: 118, juz: 18 },
  { number: 24, nameAr: 'النور',          nameEn: 'An-Nur',             ayahs: 64,  juz: 18 },
  { number: 25, nameAr: 'الفرقان',        nameEn: 'Al-Furqan',          ayahs: 77,  juz: 18 },
  { number: 26, nameAr: 'الشعراء',        nameEn: "Ash-Shu'ara",        ayahs: 227, juz: 19 },
  { number: 27, nameAr: 'النمل',          nameEn: 'An-Naml',            ayahs: 93,  juz: 19 },
  { number: 28, nameAr: 'القصص',          nameEn: 'Al-Qasas',           ayahs: 88,  juz: 20 },
  { number: 29, nameAr: 'العنكبوت',       nameEn: 'Al-Ankabut',         ayahs: 69,  juz: 20 },
  { number: 30, nameAr: 'الروم',          nameEn: 'Ar-Rum',             ayahs: 60,  juz: 21 },
  { number: 31, nameAr: 'لقمان',          nameEn: 'Luqman',             ayahs: 34,  juz: 21 },
  { number: 32, nameAr: 'السجدة',         nameEn: 'As-Sajdah',          ayahs: 30,  juz: 21 },
  { number: 33, nameAr: 'الأحزاب',        nameEn: 'Al-Ahzab',           ayahs: 73,  juz: 21 },
  { number: 34, nameAr: 'سبأ',            nameEn: 'Saba',               ayahs: 54,  juz: 22 },
  { number: 35, nameAr: 'فاطر',           nameEn: 'Fatir',              ayahs: 45,  juz: 22 },
  { number: 36, nameAr: 'يس',             nameEn: 'Ya-Sin',             ayahs: 83,  juz: 22 },
  { number: 37, nameAr: 'الصافات',        nameEn: 'As-Saffat',          ayahs: 182, juz: 23 },
  { number: 38, nameAr: 'ص',              nameEn: 'Sad',                ayahs: 88,  juz: 23 },
  { number: 39, nameAr: 'الزمر',          nameEn: 'Az-Zumar',           ayahs: 75,  juz: 23 },
  { number: 40, nameAr: 'غافر',           nameEn: 'Ghafir',             ayahs: 85,  juz: 24 },
  { number: 41, nameAr: 'فصلت',           nameEn: 'Fussilat',           ayahs: 54,  juz: 24 },
  { number: 42, nameAr: 'الشورى',         nameEn: 'Ash-Shuraa',         ayahs: 53,  juz: 25 },
  { number: 43, nameAr: 'الزخرف',         nameEn: 'Az-Zukhruf',         ayahs: 89,  juz: 25 },
  { number: 44, nameAr: 'الدخان',         nameEn: 'Ad-Dukhan',          ayahs: 59,  juz: 25 },
  { number: 45, nameAr: 'الجاثية',        nameEn: 'Al-Jathiyah',        ayahs: 37,  juz: 25 },
  { number: 46, nameAr: 'الأحقاف',        nameEn: 'Al-Ahqaf',           ayahs: 35,  juz: 26 },
  { number: 47, nameAr: 'محمد',           nameEn: 'Muhammad',           ayahs: 38,  juz: 26 },
  { number: 48, nameAr: 'الفتح',          nameEn: 'Al-Fath',            ayahs: 29,  juz: 26 },
  { number: 49, nameAr: 'الحجرات',        nameEn: 'Al-Hujurat',         ayahs: 18,  juz: 26 },
  { number: 50, nameAr: 'ق',              nameEn: 'Qaf',                ayahs: 45,  juz: 26 },
  { number: 51, nameAr: 'الذاريات',       nameEn: 'Adh-Dhariyat',       ayahs: 60,  juz: 26 },
  { number: 52, nameAr: 'الطور',          nameEn: 'At-Tur',             ayahs: 49,  juz: 27 },
  { number: 53, nameAr: 'النجم',          nameEn: 'An-Najm',            ayahs: 62,  juz: 27 },
  { number: 54, nameAr: 'القمر',          nameEn: 'Al-Qamar',           ayahs: 55,  juz: 27 },
  { number: 55, nameAr: 'الرحمن',         nameEn: 'Ar-Rahman',          ayahs: 78,  juz: 27 },
  { number: 56, nameAr: 'الواقعة',        nameEn: "Al-Waqi'ah",         ayahs: 96,  juz: 27 },
  { number: 57, nameAr: 'الحديد',         nameEn: 'Al-Hadid',           ayahs: 29,  juz: 27 },
  { number: 58, nameAr: 'المجادلة',       nameEn: 'Al-Mujadila',        ayahs: 22,  juz: 28 },
  { number: 59, nameAr: 'الحشر',          nameEn: 'Al-Hashr',           ayahs: 24,  juz: 28 },
  { number: 60, nameAr: 'الممتحنة',       nameEn: 'Al-Mumtahanah',      ayahs: 13,  juz: 28 },
  { number: 61, nameAr: 'الصف',           nameEn: 'As-Saf',             ayahs: 14,  juz: 28 },
  { number: 62, nameAr: 'الجمعة',         nameEn: "Al-Jumu'ah",         ayahs: 11,  juz: 28 },
  { number: 63, nameAr: 'المنافقون',      nameEn: 'Al-Munafiqun',       ayahs: 11,  juz: 28 },
  { number: 64, nameAr: 'التغابن',        nameEn: 'At-Taghabun',        ayahs: 18,  juz: 28 },
  { number: 65, nameAr: 'الطلاق',         nameEn: 'At-Talaq',           ayahs: 12,  juz: 28 },
  { number: 66, nameAr: 'التحريم',        nameEn: 'At-Tahrim',          ayahs: 12,  juz: 28 },
  { number: 67, nameAr: 'الملك',          nameEn: 'Al-Mulk',            ayahs: 30,  juz: 29 },
  { number: 68, nameAr: 'القلم',          nameEn: 'Al-Qalam',           ayahs: 52,  juz: 29 },
  { number: 69, nameAr: 'الحاقة',         nameEn: "Al-Haqqah",          ayahs: 52,  juz: 29 },
  { number: 70, nameAr: 'المعارج',        nameEn: "Al-Ma'arij",         ayahs: 44,  juz: 29 },
  { number: 71, nameAr: 'نوح',            nameEn: 'Nuh',                ayahs: 28,  juz: 29 },
  { number: 72, nameAr: 'الجن',           nameEn: 'Al-Jinn',            ayahs: 28,  juz: 29 },
  { number: 73, nameAr: 'المزمل',         nameEn: 'Al-Muzzammil',       ayahs: 20,  juz: 29 },
  { number: 74, nameAr: 'المدثر',         nameEn: 'Al-Muddaththir',     ayahs: 56,  juz: 29 },
  { number: 75, nameAr: 'القيامة',        nameEn: 'Al-Qiyamah',         ayahs: 40,  juz: 29 },
  { number: 76, nameAr: 'الإنسان',        nameEn: 'Al-Insan',           ayahs: 31,  juz: 29 },
  { number: 77, nameAr: 'المرسلات',       nameEn: 'Al-Mursalat',        ayahs: 50,  juz: 29 },
  { number: 78, nameAr: 'النبأ',          nameEn: "An-Naba'",           ayahs: 40,  juz: 30 },
  { number: 79, nameAr: 'النازعات',       nameEn: "An-Nazi'at",         ayahs: 46,  juz: 30 },
  { number: 80, nameAr: 'عبس',            nameEn: "Abasa",              ayahs: 42,  juz: 30 },
  { number: 81, nameAr: 'التكوير',        nameEn: 'At-Takwir',          ayahs: 29,  juz: 30 },
  { number: 82, nameAr: 'الانفطار',       nameEn: 'Al-Infitar',         ayahs: 19,  juz: 30 },
  { number: 83, nameAr: 'المطففين',       nameEn: 'Al-Mutaffifin',      ayahs: 36,  juz: 30 },
  { number: 84, nameAr: 'الانشقاق',       nameEn: 'Al-Inshiqaq',        ayahs: 25,  juz: 30 },
  { number: 85, nameAr: 'البروج',         nameEn: 'Al-Buruj',           ayahs: 22,  juz: 30 },
  { number: 86, nameAr: 'الطارق',         nameEn: 'At-Tariq',           ayahs: 17,  juz: 30 },
  { number: 87, nameAr: 'الأعلى',         nameEn: "Al-A'la",            ayahs: 19,  juz: 30 },
  { number: 88, nameAr: 'الغاشية',        nameEn: 'Al-Ghashiyah',       ayahs: 26,  juz: 30 },
  { number: 89, nameAr: 'الفجر',          nameEn: 'Al-Fajr',            ayahs: 30,  juz: 30 },
  { number: 90, nameAr: 'البلد',          nameEn: 'Al-Balad',           ayahs: 20,  juz: 30 },
  { number: 91, nameAr: 'الشمس',          nameEn: 'Ash-Shams',          ayahs: 15,  juz: 30 },
  { number: 92, nameAr: 'الليل',          nameEn: 'Al-Layl',            ayahs: 21,  juz: 30 },
  { number: 93, nameAr: 'الضحى',          nameEn: 'Ad-Duha',            ayahs: 11,  juz: 30 },
  { number: 94, nameAr: 'الشرح',          nameEn: 'Ash-Sharh',          ayahs: 8,   juz: 30 },
  { number: 95, nameAr: 'التين',          nameEn: 'At-Tin',             ayahs: 8,   juz: 30 },
  { number: 96, nameAr: 'العلق',          nameEn: "Al-Alaq",            ayahs: 19,  juz: 30 },
  { number: 97, nameAr: 'القدر',          nameEn: 'Al-Qadr',            ayahs: 5,   juz: 30 },
  { number: 98, nameAr: 'البينة',         nameEn: 'Al-Bayyinah',        ayahs: 8,   juz: 30 },
  { number: 99, nameAr: 'الزلزلة',        nameEn: 'Az-Zalzalah',        ayahs: 8,   juz: 30 },
  { number: 100,nameAr: 'العاديات',       nameEn: "Al-Adiyat",          ayahs: 11,  juz: 30 },
  { number: 101,nameAr: 'القارعة',        nameEn: "Al-Qari'ah",         ayahs: 11,  juz: 30 },
  { number: 102,nameAr: 'التكاثر',        nameEn: 'At-Takathur',        ayahs: 8,   juz: 30 },
  { number: 103,nameAr: 'العصر',          nameEn: "Al-Asr",             ayahs: 3,   juz: 30 },
  { number: 104,nameAr: 'الهمزة',         nameEn: 'Al-Humazah',         ayahs: 9,   juz: 30 },
  { number: 105,nameAr: 'الفيل',          nameEn: 'Al-Fil',             ayahs: 5,   juz: 30 },
  { number: 106,nameAr: 'قريش',           nameEn: 'Quraysh',            ayahs: 4,   juz: 30 },
  { number: 107,nameAr: 'الماعون',        nameEn: "Al-Ma'un",           ayahs: 7,   juz: 30 },
  { number: 108,nameAr: 'الكوثر',         nameEn: 'Al-Kawthar',         ayahs: 3,   juz: 30 },
  { number: 109,nameAr: 'الكافرون',       nameEn: 'Al-Kafirun',         ayahs: 6,   juz: 30 },
  { number: 110,nameAr: 'النصر',          nameEn: 'An-Nasr',            ayahs: 3,   juz: 30 },
  { number: 111,nameAr: 'المسد',          nameEn: 'Al-Masad',           ayahs: 5,   juz: 30 },
  { number: 112,nameAr: 'الإخلاص',        nameEn: 'Al-Ikhlas',          ayahs: 4,   juz: 30 },
  { number: 113,nameAr: 'الفلق',          nameEn: 'Al-Falaq',           ayahs: 5,   juz: 30 },
  { number: 114,nameAr: 'الناس',          nameEn: 'An-Nas',             ayahs: 6,   juz: 30 },
];

export const getSurahName = (number, lang = 'ar') => {
  const surah = SURAHS.find(s => s.number === number);
  if (!surah) return '';
  return lang === 'ar' ? surah.nameAr : surah.nameEn;
};

export function countAyahsBetween(fromSurah, fromAyah, toSurah, toAyah) {
  if (fromSurah === toSurah) return Math.max(0, toAyah - fromAyah + 1);
  let count = 0;
  const fromS = SURAHS.find(s => s.number === fromSurah);
  if (fromS) count += fromS.ayahs - fromAyah + 1;
  for (let i = fromSurah + 1; i < toSurah; i++) {
    const s = SURAHS.find(x => x.number === i);
    if (s) count += s.ayahs;
  }
  count += toAyah;
  return Math.max(0, count);
}

// Precise ending boundaries for all 30 Juz (Surah, Ayah)
export const JUZ_BOUNDARIES = [
  { juz: 1,  surah: 2,   ayah: 141 },
  { juz: 2,  surah: 2,   ayah: 252 },
  { juz: 3,  surah: 3,   ayah: 92  },
  { juz: 4,  surah: 4,   ayah: 23  },
  { juz: 5,  surah: 4,   ayah: 147 },
  { juz: 6,  surah: 5,   ayah: 81  },
  { juz: 7,  surah: 6,   ayah: 110 },
  { juz: 8,  surah: 7,   ayah: 87  },
  { juz: 9,  surah: 8,   ayah: 40  },
  { juz: 10, surah: 9,   ayah: 92  },
  { juz: 11, surah: 11,  ayah: 5   },
  { juz: 12, surah: 12,  ayah: 52  },
  { juz: 13, surah: 14,  ayah: 52  },
  { juz: 14, surah: 16,  ayah: 128 },
  { juz: 15, surah: 18,  ayah: 74  },
  { juz: 16, surah: 20,  ayah: 135 },
  { juz: 17, surah: 22,  ayah: 78  },
  { juz: 18, surah: 25,  ayah: 20  },
  { juz: 19, surah: 27,  ayah: 55  },
  { juz: 20, surah: 29,  ayah: 45  },
  { juz: 21, surah: 33,  ayah: 30  },
  { juz: 22, surah: 36,  ayah: 27  },
  { juz: 23, surah: 39,  ayah: 31  },
  { juz: 24, surah: 41,  ayah: 46  },
  { juz: 25, surah: 45,  ayah: 37  },
  { juz: 26, surah: 51,  ayah: 30  },
  { juz: 27, surah: 57,  ayah: 29  },
  { juz: 28, surah: 66,  ayah: 12  },
  { juz: 29, surah: 77,  ayah: 50  },
  { juz: 30, surah: 114, ayah: 6   }
];

export function getCompletedJuz(currentSurah, currentAyah) {
  const completed = [];
  for (const b of JUZ_BOUNDARIES) {
    if (currentSurah > b.surah || (currentSurah === b.surah && currentAyah > b.ayah)) {
      completed.push(b.juz);
    } else {
      break; // Since boundaries are ordered, we can stop
    }
  }
  return completed;
}

// ── Quran division maps: Juz / Hizb / Thumn ─────────────────────────────────
// The Quran (Maghribi division) splits into 30 أجزاء → 60 أحزاب (2 per juz)
// → 480 أثمان (8 per hizb, i.e. 16 per juz). Juz boundaries are exact; hizb and
// thumn are computed by evenly subdividing each juz by ayah count.
export const TOTAL_AYAHS = 6236;

const SURAH_OFFSETS = (() => {
  const offsets = {};
  let cumulative = 0;
  for (const s of SURAHS) {
    offsets[s.number] = cumulative;
    cumulative += s.ayahs;
  }
  return offsets;
})();

// Convert a (surah, ayah) position to a 1-based global ayah index (1..6236).
export const toGlobalAyah = (surah, ayah) => {
  const offset = SURAH_OFFSETS[surah] ?? 0;
  return offset + Math.max(1, Number(ayah) || 1);
};

export const DIVISION_CONFIG = {
  juz:   { perJuz: 1,  total: 30  },
  hizb:  { perJuz: 2,  total: 60  },
  thumn: { perJuz: 16, total: 480 },
};

const buildDivisionEnds = (perJuz) => {
  const ends = [];
  let prevEnd = 0;
  for (let j = 0; j < JUZ_BOUNDARIES.length; j++) {
    const b = JUZ_BOUNDARIES[j];
    const juzEnd = toGlobalAyah(b.surah, b.ayah);
    const startG = prevEnd + 1;
    const span = juzEnd - startG + 1;
    for (let d = 1; d <= perJuz; d++) {
      const end = d === perJuz ? juzEnd : startG - 1 + Math.round((span * d) / perJuz);
      ends.push({ end, juz: j + 1 });
    }
    prevEnd = juzEnd;
  }
  return ends;
};

const _endsCache = {};
const getDivisionEnds = (type) => {
  if (!_endsCache[type]) {
    const cfg = DIVISION_CONFIG[type] || DIVISION_CONFIG.juz;
    _endsCache[type] = buildDivisionEnds(cfg.perJuz);
  }
  return _endsCache[type];
};

// Returns [{ n, juz, completed }] for a division type, given the student's
// current (next-to-memorize) position. A division is "completed" once the
// student has memorized past its final ayah.
export const getDivisionMap = (type, currentSurah = 1, currentAyah = 1) => {
  const globalCurrent = toGlobalAyah(currentSurah, currentAyah);
  return getDivisionEnds(type).map((e, i) => ({
    n: i + 1,
    juz: e.juz,
    completed: e.end < globalCurrent,
  }));
};

export const MATN_TYPES = [
  // المستوى الأول
  { key: 'bayquniyyah',       nameAr: 'نظم البيقونية',                nameEn: 'Al-Bayquniyyah',          total: 34 },
  { key: 'adab_tilawah',      nameAr: 'نظم آداب التلاوة',             nameEn: 'Adab At-Tilawah',         total: 100 },
  { key: 'jazariyyah',        nameAr: 'متن الجزرية',                  nameEn: 'Al-Jazariyyah',           total: 109 },
  { key: 'urjuzah_miiyyah',   nameAr: 'متن الأرجوزة الميئية',         nameEn: 'Al-Urjuzah Al-Miiyyah',   total: 100 },
  { key: 'arbaeen_nawawiyyah',nameAr: 'متن الأربعون النووية',         nameEn: 'Al-Arbaeen An-Nawawiyyah',total: 42 },
  { key: 'ajurrumiyyah',      nameAr: 'نظم الآجرومية',                nameEn: 'Al-Ajurrumiyyah',         total: 154 },

  // المستوى الثاني
  { key: 'ibn_ashir',         nameAr: 'متن ابن عاشر',                 nameEn: 'Ibn Ashir',               total: 314 },
  { key: 'ibn_abi_qaff',      nameAr: 'نظم ابن أبي قف',               nameEn: 'Ibn Abi Qaff',            total: 100 },
  { key: 'durar_lawami',      nameAr: 'نظم الدرر اللوامع',            nameEn: 'Ad-Durar Al-Lawami',      total: 274 },
  { key: 'umdat_ahkam',       nameAr: 'عمدة الأحكام',                 nameEn: 'Umdat Al-Ahkam',          total: 430 },
  { key: 'nasihat_hammad',    nameAr: 'نظم نصيحة حماد ابن آلمين',      nameEn: 'Nasihat Hammad',          total: 100 },
  { key: 'alfiyyat_ibn_malik',nameAr: 'ألفية ابن مالك',               nameEn: 'Alfiyyat Ibn Malik',      total: 1002 },

  // المستوى الثالث
  { key: 'lamiyyat_afal',     nameAr: 'لامية الأفعال',                nameEn: 'Lamiyyat Al-Afal',        total: 114 },
  { key: 'mutahharat_qulub',  nameAr: 'مطهرة القلوب',                 nameEn: 'Mutahharat Al-Qulub',     total: 100 },
  { key: 'shatibiyyah',       nameAr: 'ألفية الشاطبي',                nameEn: 'Ash-Shatibiyyah',         total: 1173 },
  { key: 'ashal_masalik',     nameAr: 'أسهل المسالك',                 nameEn: 'Ashal Al-Masalik',        total: 1000 },
  { key: 'murtaqa_wusul',     nameAr: 'مرتقى الوصول إلى علم الأصول',  nameEn: 'Murtaqa Al-Wusul',        total: 100 },
  { key: 'bulugh_maram',      nameAr: 'بلوغ المرام',                  nameEn: 'Bulugh Al-Maram',         total: 1596 },
  
  { key: 'other',             nameAr: 'أخرى',                         nameEn: 'Other',                   total: 100 }
];
