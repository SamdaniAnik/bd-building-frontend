// Labels for the resident helpdesk, shared by the staff Helpdesk page and the owner portal.
// [English, Bangla, icon or badge class]

export const CATEGORIES: Record<string, [string, string, string]> = {
  LIFT: ['Lift', 'লিফট', 'fa-solid fa-elevator'],
  GENERATOR: ['Generator', 'জেনারেটর', 'fa-solid fa-bolt'],
  WATER_LEAKAGE: ['Water / plumbing', 'পানি / প্লাম্বিং', 'fa-solid fa-faucet-drip'],
  ELECTRICAL: ['Electrical', 'বিদ্যুৎ', 'fa-solid fa-plug'],
  GAS: ['Gas line', 'গ্যাস লাইন', 'fa-solid fa-fire-flame-simple'],
  SECURITY: ['Security', 'নিরাপত্তা', 'fa-solid fa-shield-halved'],
  CLEANING: ['Cleaning / garbage', 'পরিষ্কার / ময়লা', 'fa-solid fa-broom'],
  PEST_CONTROL: ['Pest control', 'পোকামাকড় দমন', 'fa-solid fa-bug'],
  PARKING: ['Parking', 'পার্কিং', 'fa-solid fa-square-parking'],
  NOISE: ['Noise / neighbour', 'শব্দ / প্রতিবেশী', 'fa-solid fa-volume-high'],
  INTERCOM_CCTV: ['Intercom / CCTV', 'ইন্টারকম / সিসিটিভি', 'fa-solid fa-video'],
  COMMON_AREA: ['Common area', 'কমন এরিয়া', 'fa-solid fa-building'],
  OTHER: ['Other', 'অন্যান্য', 'fa-solid fa-circle-question'],
};

export const PRIORITIES: Record<string, [string, string, string]> = {
  EMERGENCY: ['Emergency', 'জরুরি', 'badge-danger'],
  HIGH: ['High', 'উচ্চ', 'badge-warning'],
  MEDIUM: ['Medium', 'মাঝারি', 'badge-info'],
  LOW: ['Low', 'নিম্ন', 'badge-gray'],
};

export const STATUSES: Record<string, [string, string, string]> = {
  OPEN: ['Open', 'খোলা', 'badge-danger'],
  ASSIGNED: ['Assigned', 'দায়িত্বপ্রাপ্ত', 'badge-primary'],
  IN_PROGRESS: ['In progress', 'কাজ চলছে', 'badge-info'],
  ON_HOLD: ['On hold', 'স্থগিত', 'badge-warning'],
  RESOLVED: ['Resolved', 'সমাধান হয়েছে', 'badge-success'],
  CLOSED: ['Closed', 'বন্ধ', 'badge-gray'],
};

export const SOURCES: Record<string, [string, string]> = {
  PORTAL: ['Owner portal', 'মালিক পোর্টাল'], STAFF: ['Staff', 'কর্মী'], PHONE: ['Phone call', 'ফোন কল'], WALK_IN: ['Walk-in', 'সরাসরি'],
};

export const ACTIVE = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'];
export const ticketNo = (id: number) => `HD-${String(id).padStart(5, '0')}`;

/** "Due in 3h", "5h late", "Due in 2d" — the fix-by deadline relative to now. */
export function dueText(dueBy: string | null | undefined, status: string, bn: boolean): { text: string; late: boolean } | null {
  if (!dueBy || !ACTIVE.includes(status)) return null;
  const ms = new Date(dueBy).getTime() - Date.now();
  const h = Math.abs(ms) / 3600000;
  const span = h < 1 ? (bn ? `${Math.max(1, Math.round(h * 60))} মিনিট` : `${Math.max(1, Math.round(h * 60))}m`)
    : h < 48 ? (bn ? `${Math.round(h)} ঘণ্টা` : `${Math.round(h)}h`) : (bn ? `${Math.round(h / 24)} দিন` : `${Math.round(h / 24)}d`);
  return ms < 0 ? { text: bn ? `${span} দেরি` : `${span} late`, late: true } : { text: bn ? `${span} বাকি` : `Due in ${span}`, late: false };
}

export const hoursLabel = (h: number, bn: boolean) => (h < 48 ? (bn ? `${h} ঘণ্টা` : `${h} hours`) : (bn ? `${h / 24} দিন` : `${h / 24} days`));
