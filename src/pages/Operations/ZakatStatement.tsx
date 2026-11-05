import React, { useEffect, useState } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate } from '../../utils/bd';
import { Field, money } from './shared';

// Zakat helper for a flat owner. The system supplies what it knows (rent received, tenant deposits held, dues
// owed); the owner adds their own savings and picks the nisab. Zakat = 2.5% of net zakatable wealth when that
// is at or above the nisab. A home the owner lives in and a flat held for rent are not themselves counted.
export type ZakatData = {
  owner: { full_name: string }; from: string; to: string;
  flats: { unit_number: string; building_name: string | null; ownership_percentage: number }[];
  rent: { by_flat: { unit_number: string; amount_bdt: number }[]; total_bdt: number };
  deposits: { rows: { unit_number: string; tenant: string; amount_bdt: number }[]; total_bdt: number };
  dues: { rows: { unit_number: string; item: string; due_date: string; amount_bdt: number }[]; total_bdt: number };
};

const RATE = 0.025;
const n = (v: any) => Number(v) || 0;

export default function ZakatStatement({ data }: { data: ZakatData }) {
  const { t } = useLang();
  const [f, setF] = useState({ cash: '', rent_held: '', gold: '', silver: '', business: '', receivable: '', dues: '', deposits: '', other_debts: '', nisab: '' });
  // Prefill the system figures whenever another owner / period is loaded.
  useEffect(() => { setF(x => ({ ...x, rent_held: String(data.rent.total_bdt || ''), dues: String(data.dues.total_bdt || ''), deposits: String(data.deposits.total_bdt || '') })); }, [data]);
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const assets = n(f.cash) + n(f.rent_held) + n(f.gold) + n(f.silver) + n(f.business) + n(f.receivable);
  const debts = n(f.dues) + n(f.deposits) + n(f.other_debts);
  const net = Math.max(0, assets - debts);
  const nisab = n(f.nisab);
  const due = nisab > 0 && net >= nisab ? Math.round(net * RATE) : 0;
  const num = (k: keyof typeof f, label: string, hint?: string) => (
    <Field label={label} hint={hint}><input type="number" min={0} className="form-control" value={f[k]} onChange={e => set(k, e.target.value)} /></Field>
  );

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="card-header"><div className="card-title"><i className="fa-solid fa-building text-primary" /> {t('From the building records', 'ভবনের হিসাব থেকে')} · {fmtDate(data.from)} – {fmtDate(data.to)}</div></div>
        <div className="card-body">
          <div className="text-sm mb-4"><strong>{data.owner.full_name}</strong> — {data.flats.length ? data.flats.map(x => `${x.unit_number}${x.ownership_percentage < 100 ? ` (${x.ownership_percentage}%)` : ''}`).join(', ') : t('no flats', 'কোনো ফ্ল্যাট নেই')}</div>
          <div className="section-heading">{t('Rent received', 'প্রাপ্ত ভাড়া')}</div>
          {data.rent.by_flat.length === 0 ? <div className="text-sm text-muted mb-4">{t('No rent recorded in this period.', 'এই সময়ে কোনো ভাড়া নেই।')}</div> : (
            <table className="mb-4"><tbody>{data.rent.by_flat.map(r => <tr key={r.unit_number}><td>{r.unit_number}</td><td className="text-right">{money(r.amount_bdt)}</td></tr>)}
              <tr><td className="fw-bold">{t('Total', 'মোট')}</td><td className="text-right fw-bold">{money(data.rent.total_bdt)}</td></tr></tbody></table>)}
          <div className="section-heading">{t('Tenant security deposits you hold (owed back)', 'ভাড়াটিয়ার জামানত (ফেরতযোগ্য)')}</div>
          {data.deposits.rows.length === 0 ? <div className="text-sm text-muted mb-4">{t('None.', 'নেই।')}</div> : (
            <table className="mb-4"><tbody>{data.deposits.rows.map((r, i) => <tr key={i}><td>{r.unit_number} · {r.tenant}</td><td className="text-right">{money(r.amount_bdt)}</td></tr>)}</tbody></table>)}
          <div className="section-heading">{t('Dues you owe the building', 'ভবনের কাছে আপনার বকেয়া')}</div>
          {data.dues.rows.length === 0 ? <div className="text-sm text-muted">{t('Nothing due.', 'কোনো বকেয়া নেই।')}</div> : (
            <table><tbody>{data.dues.rows.map((r, i) => <tr key={i}><td>{r.unit_number} · {r.item}<div className="text-xs text-muted">{fmtDate(r.due_date)}</div></td><td className="text-right">{money(r.amount_bdt)}</td></tr>)}
              <tr><td className="fw-bold">{t('Total', 'মোট')}</td><td className="text-right fw-bold">{money(data.dues.total_bdt)}</td></tr></tbody></table>)}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><i className="fa-solid fa-hand-holding-heart text-primary" /> {t('Zakat calculator', 'যাকাত হিসাব')}</div></div>
        <div className="card-body">
          <div className="section-heading">{t('What you own today', 'আজ আপনার যা আছে')}</div>
          <div className="form-row cols-2">
            {num('cash', t('Cash & bank balances (৳)', 'নগদ ও ব্যাংক ব্যালেন্স (৳)'), t('Savings, FDR, DPS, mobile wallets', 'সঞ্চয়, এফডিআর, ডিপিএস, মোবাইল ওয়ালেট'))}
            {num('rent_held', t('Rent income still held (৳)', 'হাতে থাকা ভাড়ার টাকা (৳)'), t('Filled from the records — lower it by what you have spent, and skip it if it is already in your bank balance', 'হিসাব থেকে বসানো — খরচ হয়ে থাকলে কমান; ব্যাংক ব্যালেন্সে ধরা থাকলে শূন্য করুন'))}
            {num('gold', t('Gold, market value (৳)', 'স্বর্ণ, বাজারমূল্য (৳)'))}
            {num('silver', t('Silver, market value (৳)', 'রূপা, বাজারমূল্য (৳)'))}
            {num('business', t('Shares, business stock (৳)', 'শেয়ার, ব্যবসার পণ্য (৳)'))}
            {num('receivable', t('Money others owe you (৳)', 'অন্যের কাছে পাওনা (৳)'), t('Only what you expect to get back', 'যা ফেরত পাওয়ার আশা আছে'))}
          </div>
          <div className="section-heading">{t('What you owe now', 'এখন আপনার যা দেনা')}</div>
          <div className="form-row cols-2">
            {num('dues', t('Building dues (৳)', 'ভবনের বকেয়া (৳)'))}
            {num('deposits', t('Tenant deposits to return (৳)', 'ফেরতযোগ্য জামানত (৳)'))}
            {num('other_debts', t('Other debts due now (৳)', 'অন্যান্য দেনা (৳)'), t('Loan instalments due now, unpaid bills', 'এখন পরিশোধযোগ্য কিস্তি, বিল'))}
            {num('nisab', t('Nisab (৳)', 'নিসাব (৳)'), t('Value of 52.5 tola (612.36 g) silver or 7.5 tola (87.48 g) gold at today’s BAJUS price', 'আজকের বাজুস দরে ৫২.৫ ভরি (৬১২.৩৬ গ্রাম) রূপা বা ৭.৫ ভরি (৮৭.৪৮ গ্রাম) স্বর্ণের মূল্য'))}
          </div>
          <table className="mb-4"><tbody>
            <tr><td>{t('Total assets', 'মোট সম্পদ')}</td><td className="text-right">{money(assets)}</td></tr>
            <tr><td>{t('Less: debts', 'বাদ: দেনা')}</td><td className="text-right">− {money(debts)}</td></tr>
            <tr><td className="fw-bold">{t('Net zakatable wealth', 'যাকাতযোগ্য নিট সম্পদ')}</td><td className="text-right fw-bold">{money(net)}</td></tr>
          </tbody></table>
          {nisab <= 0 ? <div className="alert alert-info">{t('Enter the nisab to see whether zakat is due.', 'যাকাত ফরজ কি না দেখতে নিসাব লিখুন।')}</div>
            : due > 0 ? <div className="alert alert-success" style={{ fontSize: '1.1rem' }}>{t('Zakat due (2.5%)', 'প্রদেয় যাকাত (২.৫%)')}: <strong>{money(due)}</strong></div>
              : <div className="alert alert-info">{t('Net wealth is below the nisab — zakat is not due.', 'নিট সম্পদ নিসাবের কম — যাকাত ফরজ নয়।')}</div>}
          <div className="form-text">{t('A guide only. The flat you live in and a flat you rent out are not counted — only savings from the rent are. Rules differ between scholars (e.g. which nisab to use, how to treat long-term loans); ask a scholar you trust for your own case.', 'শুধু নির্দেশিকা। নিজের বসবাসের ও ভাড়া দেওয়া ফ্ল্যাট গণনায় আসে না — শুধু ভাড়ার সঞ্চিত টাকা আসে। আলেমদের মধ্যে মতভেদ আছে (যেমন কোন নিসাব, দীর্ঘমেয়াদি ঋণ); নিজের ক্ষেত্রে আস্থাভাজন আলেমের পরামর্শ নিন।')}</div>
        </div>
      </div>
    </div>
  );
}
