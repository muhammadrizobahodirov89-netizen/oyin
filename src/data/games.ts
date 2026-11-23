export type AgeGroupId = '3-6' | '7-10' | '11-15' | '16-20' | '20+';

export interface AgeGroupMeta {
  id: AgeGroupId;
  label: string;
  audienceTitle: string;
  focusSummary: string;
  accentHex: string;
}

export interface GameEntry {
  id: string;
  title: string;
  ageGroup: AgeGroupId;
  genre: string;
  description: string;
  controlsHint: string;
  scoreUnit: string;
  coverImage?: string;
  artVariant:
    | 'balloons'
    | 'memory'
    | 'maze'
    | 'math'
    | 'space'
    | 'snake'
    | 'tile2048'
    | 'reflex'
    | 'cards'
    | 'wordsearch';
  featured?: boolean;
}

export const AGE_GROUPS: AgeGroupMeta[] = [
  {
    id: '3-6',
    label: '3–6 yosh',
    audienceTitle: 'Kichkintoylar dunyosi',
    focusSummary: 'Katta tugmalar, quvnoq ranglar, musiqiy tovushlar va ilk xotira mashqlari.',
    accentHex: '#F59E0B',
  },
  {
    id: '7-10',
    label: '7–10 yosh',
    audienceTitle: 'Boshlang‘ich maktab sarguzashtlari',
    focusSummary: 'Tezkor arifmetika, labirintdan chiqish va mantiqiy fikrlashni charxlovchi o‘yinlar.',
    accentHex: '#10B981',
  },
  {
    id: '11-15',
    label: '11–15 yosh',
    audienceTitle: 'O‘smirlar arkada arenasi',
    focusSummary: '60 kadrli kosmik jang, dinamik to‘siqlar va yuqori tezlikdagi reflekslar.',
    accentHex: '#2563EB',
  },
  {
    id: '16-20',
    label: '16–20 yosh',
    audienceTitle: 'Yoshlar taktika va tezlik ligasi',
    focusSummary: 'Strategik rejalashtirish, 2048 kombinatsiyalari va millisekundlik reaksiya sinovlari.',
    accentHex: '#EA580C',
  },
  {
    id: '20+',
    label: '20+ yosh',
    audienceTitle: 'Kattalar uchun klassik intellekt',
    focusSummary: 'Kozir karta dueli, katta harfli so‘z qidiruvi va xotirjam strategik tahlil.',
    accentHex: '#0F5132',
  },
];

export const GAMES: GameEntry[] = [
  // 3-6 yosh
  {
    id: 'rangli-sharlar',
    title: 'Rangli Sharlar',
    ageGroup: '3-6',
    genre: 'Ranglar va diqqat',
    description: 'Osmonga ko‘tarilayotgan sharlardan so‘ralgan rangni topib yoring va quvnoq kuylar chaling.',
    controlsHint: 'Sichqoncha yoki barmoq bilan bosing',
    scoreUnit: 'ball',
    coverImage: '/src/assets/images/cover_kids_balloons_1795430235061.jpg',
    artVariant: 'balloons',
    featured: true,
  },
  {
    id: 'hayvonlar-xotirasi',
    title: 'Hayvonlar Xotirasi',
    ageGroup: '3-6',
    genre: 'Xotira va juftlik',
    description: 'Kartochkalar ortida yashiringan sher, tulki, fil va boyo‘g‘li juftliklarini toping.',
    controlsHint: 'Kartalarni ketma-ket oching',
    scoreUnit: 'ball',
    artVariant: 'memory',
  },

  // 7-10 yosh
  {
    id: 'xazina-labirinti',
    title: 'Xazina Labirinti',
    ageGroup: '7-10',
    genre: 'Sarguzasht va mantiq',
    description: 'Qadimiy ibodatxona yo‘laklaridan barcha zumradlarni yig‘ing, qo‘ng‘izlardan qoching va darvozaga yeting.',
    controlsHint: 'Strelkalar, WASD yoki ekran tugmalari',
    scoreUnit: 'ball',
    coverImage: '/src/assets/images/cover_school_maze_1795430234161.jpg',
    artVariant: 'maze',
    featured: true,
  },
  {
    id: 'tezkor-hisob',
    title: 'Tezkor Hisob',
    ageGroup: '7-10',
    genre: 'Matematik mudofaa',
    description: 'Osmon meteoritlaridagi misollarni yechib, shahar qalqonini himoya qiling.',
    controlsHint: 'To‘g‘ri javob tugmasini bosing',
    scoreUnit: 'ball',
    artVariant: 'math',
  },

  // 11-15 yosh
  {
    id: 'koinot-qalqoni',
    title: 'Koinot Qalqoni',
    ageGroup: '11-15',
    genre: 'Kosmik arkada',
    description: 'Yulduz kemasini boshqaring, asteroid to‘lqinlarini parchalang va qo‘sh lazer kuchaytirgichlarini yig‘ing.',
    controlsHint: 'Sichqoncha, sensor yoki strelkalar',
    scoreUnit: 'ball',
    coverImage: '/src/assets/images/cover_teen_space_1795430234961.jpg',
    artVariant: 'space',
    featured: true,
  },
  {
    id: 'neon-iloncha',
    title: 'Turbo Iloncha',
    ageGroup: '11-15',
    genre: 'Klassik arkada',
    description: 'Vaqtli oltin mevalarni tuting, to‘siq devorlardan aylanib o‘ting va maksimal uzunlikka erishing.',
    controlsHint: 'Strelkalar, WASD yoki svayp',
    scoreUnit: 'ball',
    artVariant: 'snake',
  },

  // 16-20 yosh
  {
    id: 'taktik-2048',
    title: 'Taktik 2048',
    ageGroup: '16-20',
    genre: 'Sonli strategiya',
    description: 'Bir xil sonli bloklarni birlashtirib 2048 gacha chiqing. 3 ta qadamni orqaga qaytarish imkoniyati mavjud.',
    controlsHint: 'Strelkalar, WASD yoki surish',
    scoreUnit: 'ochko',
    coverImage: '/src/assets/images/cover_youth_tactical_1795430234477.jpg',
    artVariant: 'tile2048',
    featured: true,
  },
  {
    id: 'reaksiya-ritm',
    title: 'Reaksiya Poligoni',
    ageGroup: '16-20',
    genre: 'Tezkor reaksiya',
    description: 'Yashil nishonlarni millisekundlarda bosing, qizil tuzoqlarga tegmang va aniq seriyalar yarating.',
    controlsHint: 'Nishon paydo bo‘lishi bilan bosing',
    scoreUnit: 'ball',
    artVariant: 'reflex',
  },

  // 20+ yosh
  {
    id: 'oltin-kozir',
    title: 'Oltin Kozir',
    ageGroup: '20+',
    genre: 'Karta o‘yini (Botga qarshi)',
    description: 'Mahogany stol ustida aqlli raqibga qarshi klassik kozir o‘yini. Mast va kozir ustunligini hisoblab g‘alaba qozoning.',
    controlsHint: 'Yaroqli kartani tanlab bosing',
    scoreUnit: 'ochko',
    coverImage: '/src/assets/images/cover_adult_cards_1795430235821.jpg',
    artVariant: 'cards',
    featured: true,
  },
  {
    id: 'soz-qidiruvi',
    title: 'Katta So‘z Qidiruvi',
    ageGroup: '20+',
    genre: 'So‘z va tafakkur',
    description: 'Katta harfli jadvaldan o‘zbekcha so‘zlarni toping. Shoshilinch taymerlarsiz, 4 bosqichli yordam tizimi bilan.',
    controlsHint: 'Harflar ustidan bosing yoki torting',
    scoreUnit: 'ball',
    artVariant: 'wordsearch',
  },
];

export function getAgeGroupMeta(id: AgeGroupId): AgeGroupMeta {
  return AGE_GROUPS.find((g) => g.id === id) ?? AGE_GROUPS[0];
}
