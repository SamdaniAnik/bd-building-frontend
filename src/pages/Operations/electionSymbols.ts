// Ballot symbols (প্রতীক). Keys must match the server list (bd-building-management/utils/electionSymbols.js).
// Neutral everyday objects only — national party symbols are left out on purpose.
export const SYMBOLS: Record<string, { icon: string; en: string; bn: string; color: string }> = {
  UMBRELLA: { icon: 'fa-solid fa-umbrella', en: 'Umbrella', bn: 'ছাতা', color: '#1d4ed8' },
  KEY: { icon: 'fa-solid fa-key', en: 'Key', bn: 'চাবি', color: '#b45309' },
  CLOCK: { icon: 'fa-solid fa-clock', en: 'Clock', bn: 'ঘড়ি', color: '#334155' },
  BOOK: { icon: 'fa-solid fa-book-open', en: 'Book', bn: 'বই', color: '#7c3aed' },
  TREE: { icon: 'fa-solid fa-tree', en: 'Tree', bn: 'গাছ', color: '#15803d' },
  FISH: { icon: 'fa-solid fa-fish', en: 'Fish', bn: 'মাছ', color: '#0e7490' },
  SUN: { icon: 'fa-solid fa-sun', en: 'Sun', bn: 'সূর্য', color: '#d97706' },
  STAR: { icon: 'fa-solid fa-star', en: 'Star', bn: 'তারা', color: '#ca8a04' },
  FOOTBALL: { icon: 'fa-solid fa-futbol', en: 'Football', bn: 'ফুটবল', color: '#111827' },
  PEN: { icon: 'fa-solid fa-pen-nib', en: 'Pen', bn: 'কলম', color: '#1e40af' },
  BULB: { icon: 'fa-solid fa-lightbulb', en: 'Light bulb', bn: 'বাল্ব', color: '#eab308' },
  BICYCLE: { icon: 'fa-solid fa-bicycle', en: 'Bicycle', bn: 'বাইসাইকেল', color: '#be123c' },
  BELL: { icon: 'fa-solid fa-bell', en: 'Bell', bn: 'ঘণ্টা', color: '#a16207' },
  LEAF: { icon: 'fa-solid fa-leaf', en: 'Leaf', bn: 'পাতা', color: '#16a34a' },
  FEATHER: { icon: 'fa-solid fa-feather', en: 'Feather', bn: 'পালক', color: '#0891b2' },
  ANCHOR: { icon: 'fa-solid fa-anchor', en: 'Anchor', bn: 'নোঙর', color: '#1e3a8a' },
  APPLE: { icon: 'fa-solid fa-apple-whole', en: 'Apple', bn: 'আপেল', color: '#dc2626' },
  LEMON: { icon: 'fa-solid fa-lemon', en: 'Lemon', bn: 'লেবু', color: '#65a30d' },
  HOUSE: { icon: 'fa-solid fa-house', en: 'House', bn: 'ঘর', color: '#9a3412' },
  DOVE: { icon: 'fa-solid fa-dove', en: 'Pigeon', bn: 'কবুতর', color: '#475569' },
  MOBILE: { icon: 'fa-solid fa-mobile-screen', en: 'Mobile phone', bn: 'মোবাইল ফোন', color: '#0f172a' },
  CUP: { icon: 'fa-solid fa-mug-hot', en: 'Cup', bn: 'কাপ', color: '#92400e' },
  MOON: { icon: 'fa-solid fa-moon', en: 'Moon', bn: 'চাঁদ', color: '#4338ca' },
  HEART: { icon: 'fa-solid fa-heart', en: 'Heart', bn: 'হৃদয়', color: '#e11d48' },
};

export const POSITION_LABELS: Record<string, [string, string]> = {
  PRESIDENT: ['President', 'সভাপতি'], VICE_PRESIDENT: ['Vice president', 'সহ-সভাপতি'], GENERAL_SECRETARY: ['General secretary', 'সাধারণ সম্পাদক'],
  JOINT_SECRETARY: ['Joint secretary', 'যুগ্ম সম্পাদক'], TREASURER: ['Treasurer', 'কোষাধ্যক্ষ'], MEMBER: ['Executive member', 'কার্যনির্বাহী সদস্য'],
};
