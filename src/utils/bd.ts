// Bangladesh formatting helpers: lakh/crore grouping, Bangla numerals,
// Bongabdo (revised Bangla calendar, 2019) and the July–June fiscal year.

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBanglaDigits = (v: string | number): string =>
  String(v).replace(/\d/g, d => BN_DIGITS[Number(d)]);

/** 12345678.5 → "1,23,45,678.50" (South Asian digit grouping) */
export function groupBD(n: number | string, decimals = 0): string {
  const num = Number(n) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** "৳1,23,45,678" — optionally in Bangla digits */
export function formatBDT(n: number | string, opts: { bangla?: boolean; decimals?: number } = {}): string {
  const s = `৳${groupBD(n, opts.decimals ?? 0)}`;
  return opts.bangla ? toBanglaDigits(s) : s;
}

/** Compact: ৳1.25 Cr / ৳45.60 Lakh / ৳12,500 */
export function formatBDTShort(n: number | string, bangla = false): string {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  let s: string;
  if (abs >= 1e7) s = `৳${(num / 1e7).toFixed(2)} ${bangla ? 'কোটি' : 'Cr'}`;
  else if (abs >= 1e5) s = `৳${(num / 1e5).toFixed(2)} ${bangla ? 'লাখ' : 'Lakh'}`;
  else s = `৳${groupBD(num)}`;
  return bangla ? toBanglaDigits(s) : s;
}

/** Bangladesh fiscal year (1 July – 30 June), e.g. "2026-27" */
export function fiscalYearOf(d: Date | string = new Date()): string {
  const x = new Date(d);
  const start = x.getMonth() >= 6 ? x.getFullYear() : x.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

const BN_MONTHS = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'];
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Revised Bangla calendar (Bangla Academy, 2019): 1 Boishakh = 14 April;
 * Boishakh–Ashwin 31 days, Kartik–Magh and Chaitra 30, Falgun 29 (30 in a Gregorian leap year).
 */
export function toBongabdo(input: Date | string = new Date()): { day: number; month: number; monthName: string; year: number; text: string } {
  const src = new Date(input);
  const d = new Date(src.getFullYear(), src.getMonth(), src.getDate());
  let gy = d.getFullYear();
  if (d < new Date(gy, 3, 14)) gy -= 1;
  const start = new Date(gy, 3, 14);
  let dayIdx = Math.round((d.getTime() - start.getTime()) / 86400000);
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap(gy + 1) ? 30 : 29, 30];
  let m = 0;
  while (m < 11 && dayIdx >= lengths[m]) { dayIdx -= lengths[m]; m++; }
  const year = gy - 593;
  const day = dayIdx + 1;
  return { day, month: m + 1, monthName: BN_MONTHS[m], year, text: `${toBanglaDigits(day)} ${BN_MONTHS[m]} ${toBanglaDigits(year)} বঙ্গাব্দ` };
}

/** "04 Nov 2026" */
export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const isValidBdMobile = (v: string) => /^01[3-9]\d{8}$/.test(String(v || '').replace(/[\s-]/g, '').replace(/^\+?88/, ''));
