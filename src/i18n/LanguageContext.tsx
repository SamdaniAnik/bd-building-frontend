import React, { createContext, useContext, useEffect, useState } from 'react';
import { toBanglaDigits } from '../utils/bd';
import PAGES_BN from './bn.json';

export type Lang = 'en' | 'bn';
const STORAGE_KEY = 'bd_bms_lang';

// Shared English → Bangla dictionary for labels used across the app.
// Pages can also pass the Bangla text inline: t('Save', 'সংরক্ষণ').
const DICT: Record<string, string> = {
  // Navigation
  'Executive & Core': 'নির্বাহী ও মূল',
  'Executive Dashboard': 'নির্বাহী ড্যাশবোর্ড',
  'Flats & Units (A–F)': 'ফ্ল্যাট ও ইউনিট (A–F)',
  'Flat Owners & Shares': 'ফ্ল্যাট মালিক ও শেয়ার',
  'Universal Masters (13 Systems)': 'মাস্টার সেটআপ (১৩টি)',
  'Shopno Bilash (108 Shares)': 'স্বপ্ন বিলাস (১০৮ শেয়ার)',
  'BD Compliance (Land, JVA, RAJUK)': 'বিডি কমপ্লায়েন্স (জমি, JVA, রাজউক)',
  'BD Toolkit (Deed, bKash, VAT, Holding)': 'বিডি টুলকিট (দলিল, বিকাশ, ভ্যাট, হোল্ডিং)',
  'Receipts, SMS & Online Pay': 'রসিদ, এসএমএস ও অনলাইন পেমেন্ট',
  'Engineering & Drawings': 'প্রকৌশল ও নকশা',
  'Works & Allocations': 'কাজ ও বণ্টন',
  'Blueprints & Revisions': 'নকশা ও সংশোধন',
  'BOQ & Materials': 'বিওকিউ ও নির্মাণসামগ্রী',
  'Contractors & Site Operations': 'ঠিকাদার ও সাইট কার্যক্রম',
  'Contractors & Billing': 'ঠিকাদার ও বিল',
  'Site Manager & Labour': 'সাইট ম্যানেজার ও শ্রমিক',
  'Vendors & Invoices': 'সরবরাহকারী ও ইনভয়েস',
  'Financial Engine & Forecasting': 'আর্থিক ব্যবস্থাপনা ও পূর্বাভাস',
  'Cash Flow Forecast': 'নগদ প্রবাহ পূর্বাভাস',
  'Cost / SFT Analytics': 'প্রতি বর্গফুট খরচ বিশ্লেষণ',
  'Room-Level Costing': 'কক্ষভিত্তিক খরচ',
  'Payments & Loans': 'পেমেন্ট ও ঋণ',
  '2 Lifts & Common Area': 'লিফট ও কমন এরিয়া',
  'Financial Reports': 'আর্থিক প্রতিবেদন',
  'Governance & Handover': 'পরিচালনা ও হস্তান্তর',
  'Committee Decisions': 'কমিটির সিদ্ধান্ত',
  'Post-Handover Maintenance': 'হস্তান্তর-পরবর্তী রক্ষণাবেক্ষণ',
  'My Flat Owner Portal': 'আমার ফ্ল্যাট পোর্টাল',
  'Approvals & Audit Log': 'অনুমোদন ও অডিট লগ',
  'Building Operations': 'ভবন পরিচালনা',
  'Tenants & Rent': 'ভাড়াটিয়া ও ভাড়া',
  'Service Charge Billing': 'সার্ভিস চার্জ বিলিং',
  'Building Staff & Payroll': 'ভবনের কর্মী ও বেতন',
  'Gate, Parking & Notices': 'গেট, পার্কিং ও নোটিশ',
  'Account': 'অ্যাকাউন্ট',
  'Logout': 'লগআউট',
  'My Flat': 'আমার ফ্ল্যাট',
  'Language': 'ভাষা',
  // Common words
  'Save': 'সংরক্ষণ', 'Cancel': 'বাতিল', 'Close': 'বন্ধ', 'Delete': 'মুছুন', 'Edit': 'সম্পাদনা', 'Add': 'যোগ করুন',
  'Search': 'খুঁজুন', 'Loading…': 'লোড হচ্ছে…', 'Status': 'অবস্থা', 'Amount': 'টাকা', 'Date': 'তারিখ', 'Total': 'মোট',
  'Flat': 'ফ্ল্যাট', 'Owner': 'মালিক', 'Due date': 'নির্ধারিত তারিখ', 'Paid': 'পরিশোধিত', 'Remaining': 'বাকি',
  'Overdue': 'মেয়াদোত্তীর্ণ', 'Active': 'সক্রিয়', 'Inactive': 'নিষ্ক্রিয়', 'Print': 'প্রিন্ট', 'Reason': 'কারণ',
  'Late fine': 'বিলম্ব জরিমানা', 'Waive': 'মওকুফ', 'Waived': 'মওকুফকৃত', 'Days late': 'বিলম্বের দিন',
};

// Page text (generated dictionary) + the shared labels above.
const ALL_BN: Record<string, string> = { ...(PAGES_BN as Record<string, string>), ...DICT };

// Module-level copy of the active language so tr() works in any component without a hook.
// Each page calls useLang() so it re-renders (keeping its state) when the language changes,
// which re-runs every tr() call in that page and its child components.
let currentLang: Lang = 'en';
export const tr = (en: string): string => (currentLang === 'bn' ? ALL_BN[en] ?? en : en);

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** t('English') looks up the dictionary; t('English', 'বাংলা') uses the given Bangla. */
  t: (en: string, bn?: string) => string;
  /** Digits in the active language (১২৩ in Bangla mode). */
  n: (v: string | number) => string;
}

const LanguageContext = createContext<LangCtx>({ lang: 'en', setLang: () => {}, t: en => en, n: v => String(v) });
export const useLang = () => useContext(LanguageContext);

const initial = (): Lang => {
  let l: Lang = 'en';
  try { l = localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en'; } catch { /* storage blocked */ }
  currentLang = l;
  return l;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(initial);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => {
    currentLang = l;
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode — keep in memory only */ }
  };
  const t = (en: string, bn?: string) => (lang === 'bn' ? (bn ?? ALL_BN[en] ?? en) : en);
  const n = (v: string | number) => (lang === 'bn' ? toBanglaDigits(v) : String(v));
  return <LanguageContext.Provider value={{ lang, setLang, t, n }}>{children}</LanguageContext.Provider>;
};

export function LanguageSelect({ compact, dark }: { compact?: boolean; dark?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: dark ? '#fff' : 'var(--gray-700)' }}>
      <i className="fa-solid fa-language" aria-hidden />
      {!compact && <span>{lang === 'bn' ? 'ভাষা' : 'Language'}</span>}
      <select
        aria-label="Language / ভাষা"
        value={lang}
        onChange={e => setLang(e.target.value as Lang)}
        className="form-select"
        style={{ width: 'auto', padding: '5px 28px 5px 10px', fontSize: '0.82rem' }}
      >
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
      </select>
    </label>
  );
}
