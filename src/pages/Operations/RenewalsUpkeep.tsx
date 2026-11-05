import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate, isValidBdMobile } from '../../utils/bd';
import { Empty, Field, Modal, PageHeader, Stat, Tabs, inputDate, money, run, todayStr, useToast, Notify } from './shared';

// Licence & certificate renewals, recurring building upkeep (tank cleaning, pumps, monsoon, dengue), and vendor tax IDs.
type Tab = 'renewals' | 'upkeep' | 'vendors';

const ITEM_TYPES: Record<string, [string, string]> = {
  LIFT_LICENSE: ['Lift licence (DIFE)', 'লিফট লাইসেন্স (কলকারখানা অধিদপ্তর)'], FIRE_LICENSE: ['Fire licence', 'ফায়ার লাইসেন্স'],
  TRADE_LICENSE: ['Trade licence (City Corporation)', 'ট্রেড লাইসেন্স (সিটি কর্পোরেশন)'], GENERATOR: ['Generator permit / service contract', 'জেনারেটর অনুমতি / সার্ভিস চুক্তি'],
  BOILER: ['Boiler certificate', 'বয়লার সনদ'], ELECTRICAL_SAFETY: ['Electrical safety / substation', 'বৈদ্যুতিক নিরাপত্তা / সাবস্টেশন'],
  INSURANCE: ['Building insurance', 'ভবন বীমা'], WASA: ['WASA connection', 'ওয়াসা সংযোগ'], GAS: ['Titas gas', 'তিতাস গ্যাস'],
  ENVIRONMENT: ['Environment clearance (DoE)', 'পরিবেশ ছাড়পত্র'], OTHER: ['Other', 'অন্যান্য'],
  // read-only sources
  FIRE_EQUIPMENT: ['Fire extinguisher refill', 'অগ্নিনির্বাপক রিফিল'], VENDOR_TRADE_LICENSE: ['Vendor trade licence', 'সরবরাহকারীর ট্রেড লাইসেন্স'],
};
const SOURCE: Record<string, [string, string, string]> = {
  RENEWAL: ['Register', 'রেজিস্টার', '/operations/renewals'], APPROVAL: ['Authority approval', 'কর্তৃপক্ষের অনুমোদন', '/apartment/compliance'],
  FIRE: ['Fire equipment', 'অগ্নি সরঞ্জাম', '/apartment/compliance'], VENDOR: ['Vendor', 'সরবরাহকারী', ''],
};
const STATE: Record<string, [string, string, string]> = {
  EXPIRED: ['Expired', 'মেয়াদোত্তীর্ণ', 'badge-danger'], DUE_SOON: ['Due soon', 'শীঘ্রই', 'badge-warning'], OK: ['Valid', 'বৈধ', 'badge-success'], ARCHIVED: ['Archived', 'আর্কাইভ', 'badge-gray'],
  OVERDUE: ['Overdue', 'বকেয়া', 'badge-danger'], UNSCHEDULED: ['Not scheduled', 'তারিখ নেই', 'badge-gray'], PAUSED: ['Paused', 'বন্ধ', 'badge-gray'],
};
export const UPKEEP_CATEGORIES: Record<string, [string, string, string]> = {
  WATER_TANK: ['Water tank', 'পানির ট্যাংক', 'fa-solid fa-droplet'], PUMP: ['Pump', 'পাম্প', 'fa-solid fa-gears'], MONSOON: ['Monsoon / drains', 'বর্ষা / ড্রেন', 'fa-solid fa-cloud-showers-heavy'],
  DENGUE: ['Dengue / Aedes', 'ডেঙ্গু / এডিস', 'fa-solid fa-mosquito'], GENERATOR: ['Generator', 'জেনারেটর', 'fa-solid fa-bolt'], LIFT: ['Lift', 'লিফট', 'fa-solid fa-elevator'],
  FIRE: ['Fire safety', 'অগ্নি নিরাপত্তা', 'fa-solid fa-fire-extinguisher'], ELECTRICAL: ['Electrical', 'বৈদ্যুতিক', 'fa-solid fa-plug'],
  PEST_CONTROL: ['Pest control', 'কীটনাশক', 'fa-solid fa-bug'], CLEANING: ['Cleaning', 'পরিচ্ছন্নতা', 'fa-solid fa-broom'], OTHER: ['Other', 'অন্যান্য', 'fa-solid fa-screwdriver-wrench'],
};
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

const Badge = ({ state, bn }: { state: string; bn: boolean }) => <span className={`badge ${STATE[state]?.[2] || 'badge-gray'}`}>{STATE[state]?.[bn ? 1 : 0] || state}</span>;
const daysText = (left: number | null, bn: boolean) => left === null ? '—' : left < 0 ? (bn ? `${-left} দিন আগে` : `${-left} days ago`) : left === 0 ? (bn ? 'আজ' : 'today') : (bn ? `${left} দিন বাকি` : `in ${left} days`);

export default function RenewalsUpkeep() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('renewals');
  const { show, node } = useToast();
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-calendar-check" title={t('Renewals & Upkeep', 'নবায়ন ও রক্ষণাবেক্ষণ')}
        subtitle={t('Every licence and certificate with an expiry date in one list, the recurring upkeep schedule (water tanks, pumps, monsoon drains, Aedes checks), and vendor tax IDs.', 'মেয়াদযুক্ত সব লাইসেন্স ও সনদ এক তালিকায়, নিয়মিত রক্ষণাবেক্ষণের সময়সূচি (পানির ট্যাংক, পাম্প, বর্ষার ড্রেন, এডিস পরীক্ষা) এবং সরবরাহকারীদের কর শনাক্তকরণ নম্বর।')} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'renewals', label: t('Licence renewals', 'লাইসেন্স নবায়ন'), icon: 'fa-solid fa-id-card' },
        { key: 'upkeep', label: t('Upkeep schedule', 'রক্ষণাবেক্ষণ সূচি'), icon: 'fa-solid fa-screwdriver-wrench' },
        { key: 'vendors', label: t('Vendor TIN / BIN', 'সরবরাহকারীর TIN / BIN'), icon: 'fa-solid fa-receipt' },
      ]} />
      {tab === 'renewals' && <RenewalsTab show={show} />}
      {tab === 'upkeep' && <UpkeepTab show={show} />}
      {tab === 'vendors' && <VendorTaxTab show={show} />}
    </div>
  );
}

// ── Renewals ────────────────────────────────────────────────────
const blankRenewal = { item_type: 'TRADE_LICENSE', title: '', authority: '', reference_no: '', issue_date: '', expiry_date: '', remind_days: 30, renewal_fee_bdt: '', responsible_name: '', responsible_phone: '', notes: '' };

function RenewalsTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [renew, setRenew] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [archived, setArchived] = useState(false);
  const load = () => api.get('/ops/compliance/renewals', { params: { archived: archived ? 1 : undefined } }).then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, [archived]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await run(show, api.post('/ops/compliance/renewals', form))) { setForm(null); load(); } };
  const saveRenew = async () => { if (await run(show, api.post(`/ops/compliance/renewals/${renew.source_id}/renew`, renew))) { setRenew(null); load(); } };
  const archive = async (r: any, on: boolean) => { if (await run(show, api.post(`/ops/compliance/renewals/${r.source_id}/archive`, { archive: on }))) load(); };
  const remove = async (r: any) => { if (confirm(t(`Delete "${r.title}"?`, `"${r.title}" মুছবেন?`)) && await run(show, api.delete(`/ops/compliance/renewals/${r.source_id}`))) load(); };
  const remindNow = async () => { await run(show, api.post('/ops/compliance/renewals/remind-now')); };
  const edit = (r: any) => setForm({ ...blankRenewal, ...r, id_renewals: r.source_id, issue_date: inputDate(r.issue_date), expiry_date: inputDate(r.expiry_date), renewal_fee_bdt: r.renewal_fee_bdt || '' });
  const rows = (d?.rows || []).filter((r: any) => !filter || r.state === filter);
  const s = d?.summary;
  const phoneBad = form?.responsible_phone && !isValidBdMobile(form.responsible_phone);

  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-circle-xmark" value={s?.expired ?? '…'} label={t('Expired', 'মেয়াদোত্তীর্ণ')} tone="danger" />
        <Stat icon="fa-solid fa-hourglass-half" value={s?.due_soon ?? '…'} label={t('Due soon', 'শীঘ্রই নবায়ন')} tone="warning" />
        <Stat icon="fa-solid fa-circle-check" value={s?.ok ?? '…'} label={t('Valid', 'বৈধ')} tone="success" />
        <Stat icon="fa-solid fa-sack-dollar" value={s ? money(s.fees_due_90d_bdt) : '…'} label={t('Renewal fees, next 90 days', 'আগামী ৯০ দিনের নবায়ন ফি')} tone="info" />
      </div>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-select" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)} aria-label={t('Status filter', 'অবস্থা')}>
              <option value="">{t('All items', 'সব')}</option>{['EXPIRED', 'DUE_SOON', 'OK'].map(k => <option key={k} value={k}>{STATE[k][bn ? 1 : 0]}</option>)}
            </select>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)} /> {t('Show archived', 'আর্কাইভসহ')}</label>
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-light" onClick={remindNow} title={t('Uses the mobile set on the Automation page when an item has no responsible person', 'দায়িত্বপ্রাপ্ত না থাকলে অটোমেশন পেজের মোবাইল ব্যবহার হয়')}><i className="fa-solid fa-comment-sms" /> {t('Send due reminders now', 'এখনই রিমাইন্ডার পাঠান')}</button>
            <button className="btn btn-primary" onClick={() => setForm({ ...blankRenewal })}><i className="fa-solid fa-plus" /> {t('Add licence / certificate', 'লাইসেন্স / সনদ যোগ')}</button>
          </div>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Item', 'বিষয়')}</th><th>{t('Reference', 'রেফারেন্স')}</th><th>{t('Expires', 'মেয়াদ শেষ')}</th><th>{t('Status', 'অবস্থা')}</th><th>{t('Responsible', 'দায়িত্বপ্রাপ্ত')}</th><th className="text-right">{t('Fee', 'ফি')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={7} text={t('Loading…')} />}
            {d && rows.length === 0 && <Empty cols={7} text={t('Nothing here. Add your trade licence, lift licence, fire licence and insurance so you are reminded before they lapse.', 'কিছু নেই। ট্রেড লাইসেন্স, লিফট লাইসেন্স, ফায়ার লাইসেন্স ও বীমা যোগ করুন — মেয়াদ শেষের আগে মনে করিয়ে দেওয়া হবে।')} />}
            {rows.map((r: any) => (
              <tr key={`${r.source}-${r.source_id}`}>
                <td><div className="fw-semibold">{r.title}</div>
                  <div className="text-xs text-muted">{ITEM_TYPES[r.item_type]?.[bn ? 1 : 0] || r.item_type}{r.authority && r.source === 'RENEWAL' ? ` · ${r.authority}` : ''}
                    {r.source !== 'RENEWAL' && <> · {SOURCE[r.source][2] ? <Link to={SOURCE[r.source][2]}>{SOURCE[r.source][bn ? 1 : 0]}</Link> : SOURCE[r.source][bn ? 1 : 0]}</>}</div></td>
                <td className="text-sm">{r.reference_no || '—'}</td>
                <td>{fmtDate(r.expiry_date)}<div className="text-xs text-muted">{daysText(r.days_left, bn)}</div></td>
                <td><Badge state={r.state} bn={bn} /></td>
                <td className="text-sm">{r.responsible_name || '—'}{r.responsible_phone && <div className="text-xs text-muted">{r.responsible_phone}</div>}</td>
                <td className="text-right">{r.renewal_fee_bdt ? money(r.renewal_fee_bdt) : '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.editable && <>
                  {r.status === 'ACTIVE' && <button className="btn btn-success btn-sm" onClick={() => setRenew({ source_id: r.source_id, title: r.title, expiry_date: '', issue_date: todayStr(), reference_no: r.reference_no || '', fee_paid_bdt: r.renewal_fee_bdt || '' })}><i className="fa-solid fa-rotate" /> {t('Renewed', 'নবায়িত')}</button>}{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => edit(r)}><i className="fa-solid fa-pen" /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={r.status === 'ACTIVE' ? t('Archive', 'আর্কাইভ') : t('Restore', 'ফেরত')} title={r.status === 'ACTIVE' ? t('Archive — stop reminders', 'আর্কাইভ — রিমাইন্ডার বন্ধ') : t('Restore', 'ফেরত')} onClick={() => archive(r, r.status === 'ACTIVE')}><i className={r.status === 'ACTIVE' ? 'fa-solid fa-box-archive' : 'fa-solid fa-box-open'} /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Delete', 'মুছুন')} onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
                </>}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <div className="form-text mt-3">{t('RAJUK / Fire NOC approvals and extinguisher refill dates come from the Compliance hub; vendor trade licences from the Vendor TIN / BIN tab. Daily SMS reminders: Operations → Automation → "Licence & certificate renewal reminders".', 'রাজউক / ফায়ার এনওসি ও অগ্নিনির্বাপকের তথ্য কমপ্লায়েন্স হাব থেকে আসে। দৈনিক এসএমএস রিমাইন্ডার চালু করুন: অপারেশনস → অটোমেশন।')}</div>

      {form && (
        <Modal title={form.id_renewals ? t('Edit licence / certificate', 'লাইসেন্স / সনদ সম্পাদনা') : t('Add licence / certificate', 'লাইসেন্স / সনদ যোগ')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.title || !form.expiry_date || !!phoneBad} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Type', 'ধরন')}><select className="form-select" value={form.item_type} onChange={e => set('item_type', e.target.value)}>
              {Object.entries(ITEM_TYPES).filter(([k]) => !['FIRE_EQUIPMENT', 'VENDOR_TRADE_LICENSE'].includes(k)).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select></Field>
            <Field label={t('Title', 'শিরোনাম')} required><input className="form-control" placeholder={t('e.g. Lift 1 operating licence', 'যেমন: লিফট ১ পরিচালনা লাইসেন্স')} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
            <Field label={t('Issuing authority', 'প্রদানকারী কর্তৃপক্ষ')}><input className="form-control" placeholder="DNCC, DIFE, FSCD…" value={form.authority || ''} onChange={e => set('authority', e.target.value)} /></Field>
            <Field label={t('Licence / certificate no.', 'লাইসেন্স / সনদ নং')}><input className="form-control" value={form.reference_no || ''} onChange={e => set('reference_no', e.target.value)} /></Field>
            <Field label={t('Issued on', 'প্রদানের তারিখ')}><input type="date" className="form-control" value={form.issue_date || ''} onChange={e => set('issue_date', e.target.value)} /></Field>
            <Field label={t('Expires on', 'মেয়াদ শেষ')} required><input type="date" className="form-control" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></Field>
            <Field label={t('First reminder (days before)', 'প্রথম রিমাইন্ডার (কত দিন আগে)')} hint={t('Then 15, 7, 1 and 0 days before, and weekly once lapsed', 'তারপর ১৫, ৭, ১ ও ০ দিন আগে, মেয়াদ শেষে সাপ্তাহিক')}><input type="number" min={0} max={180} className="form-control" value={form.remind_days} onChange={e => set('remind_days', e.target.value)} /></Field>
            <Field label={t('Renewal fee (৳)', 'নবায়ন ফি (৳)')}><input type="number" min={0} className="form-control" value={form.renewal_fee_bdt} onChange={e => set('renewal_fee_bdt', e.target.value)} /></Field>
            <Field label={t('Responsible person', 'দায়িত্বপ্রাপ্ত ব্যক্তি')}><input className="form-control" value={form.responsible_name || ''} onChange={e => set('responsible_name', e.target.value)} /></Field>
            <Field label={t('Their mobile (gets the SMS)', 'তার মোবাইল (এসএমএস যাবে)')} hint={phoneBad ? t('Use 01XXXXXXXXX', '01XXXXXXXXX লিখুন') : undefined}><input className="form-control" inputMode="tel" value={form.responsible_phone || ''} onChange={e => set('responsible_phone', e.target.value)} /></Field>
          </div>
          <Field label={t('Notes', 'নোট')}><textarea className="form-control" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></Field>
        </Modal>
      )}

      {renew && (
        <Modal title={`${t('Record renewal', 'নবায়ন লিখুন')} — ${renew.title}`} onClose={() => setRenew(null)}
          footer={<><button className="btn btn-light" onClick={() => setRenew(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-success" disabled={!renew.expiry_date} onClick={saveRenew}>{t('Save renewal', 'নবায়ন সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('New expiry date', 'নতুন মেয়াদ শেষ')} required><input type="date" className="form-control" value={renew.expiry_date} onChange={e => setRenew({ ...renew, expiry_date: e.target.value })} /></Field>
            <Field label={t('Renewed on', 'নবায়নের তারিখ')}><input type="date" className="form-control" max={todayStr()} value={renew.issue_date} onChange={e => setRenew({ ...renew, issue_date: e.target.value })} /></Field>
            <Field label={t('New licence no. (if changed)', 'নতুন নম্বর (পরিবর্তন হলে)')}><input className="form-control" value={renew.reference_no} onChange={e => setRenew({ ...renew, reference_no: e.target.value })} /></Field>
            <Field label={t('Fee paid (৳)', 'পরিশোধিত ফি (৳)')}><input type="number" min={0} className="form-control" value={renew.fee_paid_bdt} onChange={e => setRenew({ ...renew, fee_paid_bdt: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Upkeep ──────────────────────────────────────────────────────
function UpkeepTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [done, setDone] = useState<any>(null);
  const [logs, setLogs] = useState<any>(null);
  const load = () => api.get('/ops/upkeep/tasks').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await run(show, api.post('/ops/upkeep/tasks', form))) { setForm(null); load(); } };
  const saveDone = async () => { if (await run(show, api.post(`/ops/upkeep/tasks/${done.id_upkeep_tasks}/done`, done))) { setDone(null); load(); } };
  const toggle = async (r: any) => { if (await run(show, api.post('/ops/upkeep/tasks', { ...r, next_due_on: inputDate(r.next_due_on), is_active: !r.is_active }), r.is_active ? t('Paused', 'বন্ধ করা হয়েছে') : t('Resumed', 'চালু করা হয়েছে'))) load(); };
  const remove = async (r: any) => { if (confirm(t(`Delete "${r.title_en}" and its history?`, `"${r.title_bn || r.title_en}" ও এর ইতিহাস মুছবেন?`)) && await run(show, api.delete(`/ops/upkeep/tasks/${r.id_upkeep_tasks}`))) load(); };
  const openLogs = async (r: any) => { try { const x: any = await api.get(`/ops/upkeep/tasks/${r.id_upkeep_tasks}/logs`); setLogs({ task: r, rows: x.rows }); } catch (e: any) { show(false, e.message); } };
  const s = d?.summary;
  const name = (r: any) => (bn && r.title_bn ? r.title_bn : r.title_en);
  const freq = (r: any) => r.season_month ? (bn ? `প্রতি বছর ${MONTHS_BN[r.season_month - 1]}` : `Every year in ${MONTHS_EN[r.season_month - 1]}`)
    : r.frequency_days % 30 === 0 && r.frequency_days >= 30 ? (bn ? `প্রতি ${r.frequency_days / 30} মাসে` : `Every ${r.frequency_days / 30} month(s)`) : (bn ? `প্রতি ${r.frequency_days} দিনে` : `Every ${r.frequency_days} days`);

  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-triangle-exclamation" value={s?.overdue ?? '…'} label={t('Overdue', 'বকেয়া')} tone="danger" />
        <Stat icon="fa-solid fa-hourglass-half" value={s?.due_soon ?? '…'} label={t('Due within 7 days', '৭ দিনের মধ্যে')} tone="warning" />
        <Stat icon="fa-solid fa-calendar-plus" value={s?.unscheduled ?? '…'} label={t('Need a first date', 'তারিখ দিতে হবে')} tone="info" />
        <Stat icon="fa-solid fa-sack-dollar" value={s ? money(s.spent_this_year_bdt) : '…'} label={t('Spent this year', 'এ বছরের খরচ')} tone="primary" />
      </div>
      {s?.unscheduled > 0 && <div className="alert alert-info mb-4">{t('Tasks marked "Not scheduled" have no due date yet. Click ✓ Done if it was done recently (the next date is worked out), or edit the task to set its next due date.', '"তারিখ নেই" কাজগুলোর এখনো নির্ধারিত তারিখ নেই। সম্প্রতি করা হলে ✓ সম্পন্ন চাপুন, নয়তো সম্পাদনা করে পরবর্তী তারিখ দিন।')}</div>}
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="text-sm text-muted">{t('SMS reminders to the assigned staff: Operations → Automation → "Building upkeep reminders".', 'দায়িত্বপ্রাপ্ত কর্মীকে এসএমএস: অপারেশনস → অটোমেশন → "ভবন রক্ষণাবেক্ষণের রিমাইন্ডার"।')}</div>
          <button className="btn btn-primary" onClick={() => setForm({ title_en: '', title_bn: '', category: 'OTHER', frequency_days: 90, season_month: '', next_due_on: '', id_staff: '', vendor_name: '', est_cost_bdt: '', notes: '' })}><i className="fa-solid fa-plus" /> {t('Add task', 'কাজ যোগ')}</button>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Task', 'কাজ')}</th><th>{t('How often', 'কত দিন পরপর')}</th><th>{t('Last done', 'সর্বশেষ')}</th><th>{t('Next due', 'পরবর্তী')}</th><th>{t('Assigned to', 'দায়িত্বে')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={6} text={t('Loading…')} />}
            {d?.rows.map((r: any) => (
              <tr key={r.id_upkeep_tasks} style={r.is_active ? undefined : { opacity: 0.55 }}>
                <td><div className="fw-semibold"><i className={UPKEEP_CATEGORIES[r.category]?.[2]} /> {name(r)}</div><div className="text-xs text-muted">{UPKEEP_CATEGORIES[r.category]?.[bn ? 1 : 0]}{r.vendor_name ? ` · ${r.vendor_name}` : ''}{Number(r.est_cost_bdt) ? ` · ~${money(r.est_cost_bdt)}` : ''}</div></td>
                <td className="text-sm">{freq(r)}</td>
                <td className="text-sm">{r.last_done_on ? fmtDate(r.last_done_on) : '—'}</td>
                <td>{r.next_due_on ? fmtDate(r.next_due_on) : '—'} <div><Badge state={r.state} bn={bn} /> <span className="text-xs text-muted">{r.state !== 'UNSCHEDULED' && r.state !== 'PAUSED' ? daysText(r.days_left, bn) : ''}</span></div></td>
                <td className="text-sm">{r.staff_name || r.vendor_name || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-success btn-sm" onClick={() => setDone({ id_upkeep_tasks: r.id_upkeep_tasks, title: name(r), done_on: todayStr(), done_by: r.staff_name || r.vendor_name || '', cost_bdt: r.est_cost_bdt && Number(r.est_cost_bdt) ? r.est_cost_bdt : '', notes: '' })}><i className="fa-solid fa-check" /> {t('Done', 'সম্পন্ন')}</button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('History', 'ইতিহাস')} title={t('History', 'ইতিহাস')} onClick={() => openLogs(r)}><i className="fa-solid fa-clock-rotate-left" /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => setForm({ ...r, next_due_on: inputDate(r.next_due_on), season_month: r.season_month || '', id_staff: r.id_staff || '', est_cost_bdt: Number(r.est_cost_bdt) || '' })}><i className="fa-solid fa-pen" /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={r.is_active ? t('Pause', 'বন্ধ') : t('Resume', 'চালু')} title={r.is_active ? t('Pause', 'বন্ধ') : t('Resume', 'চালু')} onClick={() => toggle(r)}><i className={r.is_active ? 'fa-solid fa-pause' : 'fa-solid fa-play'} /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Delete', 'মুছুন')} onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <div className="form-text mt-3">{t('Starting frequencies are common practice in Dhaka buildings (tanks every 6 months, Aedes checks weekly, drains before the monsoon). Change them to suit your building. Waterlogging and roof leaks can be reported on the Resident Helpdesk.', 'শুরুর সময়সূচি ঢাকার ভবনে প্রচলিত চর্চা অনুযায়ী (ট্যাংক ৬ মাসে, এডিস পরীক্ষা সাপ্তাহিক, বর্ষার আগে ড্রেন)। আপনার ভবন অনুযায়ী বদলান। জলাবদ্ধতা ও ছাদ চুইয়ে পানি পড়া হেল্পডেস্কে জানানো যায়।')}</div>

      {form && (
        <Modal title={form.id_upkeep_tasks ? t('Edit task', 'কাজ সম্পাদনা') : t('Add upkeep task', 'রক্ষণাবেক্ষণের কাজ যোগ')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.title_en} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Task (English)', 'কাজ (ইংরেজি)')} required><input className="form-control" value={form.title_en} onChange={e => set('title_en', e.target.value)} /></Field>
            <Field label={t('Task (Bangla)', 'কাজ (বাংলা)')}><input className="form-control" value={form.title_bn || ''} onChange={e => set('title_bn', e.target.value)} /></Field>
            <Field label={t('Category', 'বিভাগ')}><select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>{Object.entries(UPKEEP_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select></Field>
            <Field label={t('Repeat', 'পুনরাবৃত্তি')}><select className="form-select" value={form.season_month ? 'SEASON' : 'DAYS'} onChange={e => set('season_month', e.target.value === 'SEASON' ? 4 : '')}>
              <option value="DAYS">{t('Every N days', 'প্রতি N দিনে')}</option><option value="SEASON">{t('Once a year, in a fixed month', 'বছরে একবার, নির্দিষ্ট মাসে')}</option></select></Field>
            {form.season_month
              ? <Field label={t('Month', 'মাস')} hint={t('Due on the 15th of this month', 'এই মাসের ১৫ তারিখে')}><select className="form-select" value={form.season_month} onChange={e => set('season_month', Number(e.target.value))}>{MONTHS_EN.map((m, i) => <option key={m} value={i + 1}>{bn ? MONTHS_BN[i] : m}</option>)}</select></Field>
              : <Field label={t('Every (days)', 'কত দিন পরপর')} hint={t('7 = weekly, 30 = monthly, 90 = quarterly, 180 = 6 months', '৭ = সাপ্তাহিক, ৩০ = মাসিক, ৯০ = ত্রৈমাসিক, ১৮০ = ৬ মাস')}><input type="number" min={1} className="form-control" value={form.frequency_days} onChange={e => set('frequency_days', e.target.value)} /></Field>}
            <Field label={t('Next due on', 'পরবর্তী তারিখ')} hint={t('Moves forward automatically each time you mark it done', 'সম্পন্ন চাপলে নিজে থেকে এগোবে')}><input type="date" className="form-control" value={form.next_due_on || ''} onChange={e => set('next_due_on', e.target.value)} /></Field>
            <Field label={t('Assigned staff (gets the SMS)', 'দায়িত্বপ্রাপ্ত কর্মী (এসএমএস যাবে)')}><select className="form-select" value={form.id_staff || ''} onChange={e => set('id_staff', e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('— Nobody —', '— কেউ না —')}</option>{(d?.staff || []).map((s: any) => <option key={s.id_staff} value={s.id_staff}>{s.full_name} ({s.role.toLowerCase()})</option>)}</select></Field>
            <Field label={t('Outside vendor', 'বাইরের প্রতিষ্ঠান')}><input className="form-control" value={form.vendor_name || ''} onChange={e => set('vendor_name', e.target.value)} /></Field>
            <Field label={t('Usual cost (৳)', 'সাধারণ খরচ (৳)')}><input type="number" min={0} className="form-control" value={form.est_cost_bdt} onChange={e => set('est_cost_bdt', e.target.value)} /></Field>
          </div>
          <Field label={t('Notes / checklist', 'নোট / চেকলিস্ট')}><textarea className="form-control" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></Field>
        </Modal>
      )}

      {done && (
        <Modal title={`${t('Mark done', 'সম্পন্ন লিখুন')} — ${done.title}`} onClose={() => setDone(null)}
          footer={<><button className="btn btn-light" onClick={() => setDone(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-success" onClick={saveDone}><i className="fa-solid fa-check" /> {t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Done on', 'সম্পন্নের তারিখ')}><input type="date" className="form-control" max={todayStr()} value={done.done_on} onChange={e => setDone({ ...done, done_on: e.target.value })} /></Field>
            <Field label={t('Done by', 'যিনি করেছেন')}><input className="form-control" value={done.done_by} onChange={e => setDone({ ...done, done_by: e.target.value })} /></Field>
            <Field label={t('Cost (৳)', 'খরচ (৳)')} hint={t('Shows in the yearly statement', 'বার্ষিক বিবরণীতে দেখাবে')}><input type="number" min={0} className="form-control" value={done.cost_bdt} onChange={e => setDone({ ...done, cost_bdt: e.target.value })} /></Field>
          </div>
          <Field label={t('Notes', 'নোট')}><textarea className="form-control" rows={2} value={done.notes} onChange={e => setDone({ ...done, notes: e.target.value })} /></Field>
        </Modal>
      )}

      {logs && (
        <Modal title={`${t('History', 'ইতিহাস')} — ${name(logs.task)}`} onClose={() => setLogs(null)}>
          <div className="table-wrapper"><table>
            <thead><tr><th>{t('Date', 'তারিখ')}</th><th>{t('Done by', 'যিনি করেছেন')}</th><th className="text-right">{t('Cost', 'খরচ')}</th><th>{t('Notes', 'নোট')}</th></tr></thead>
            <tbody>
              {logs.rows.length === 0 && <Empty cols={4} text={t('Not done yet.', 'এখনো করা হয়নি।')} />}
              {logs.rows.map((l: any) => <tr key={l.id_upkeep_logs}><td>{fmtDate(l.done_on)}</td><td>{l.done_by || '—'}</td><td className="text-right">{money(l.cost_bdt)}</td><td className="text-sm">{l.notes || ''}</td></tr>)}
            </tbody>
          </table></div>
        </Modal>
      )}
    </>
  );
}

// ── Vendor tax IDs ──────────────────────────────────────────────
const digits = (v: string) => String(v || '').replace(/[\s-]/g, '');
export const tinBad = (v: string) => !!digits(v) && !/^\d{12}$/.test(digits(v));
export const binBad = (v: string) => !!digits(v) && !/^(\d{9}|\d{13})$/.test(digits(v));

function VendorTaxTab({ show }: { show: Notify }) {
  const { t } = useLang();
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const load = () => api.get('/ops/compliance/vendor-tax').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const save = async () => { if (await run(show, api.put(`/ops/compliance/vendor-tax/${form.id_vendors}`, form))) { setForm(null); load(); } };
  const rows = (d?.rows || []).filter((v: any) => !onlyMissing || v.missing_tin || v.missing_bin || v.license_expired);
  const s = d?.summary;
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-handshake" value={s?.vendors ?? '…'} label={t('Active vendors', 'সক্রিয় সরবরাহকারী')} />
        <Stat icon="fa-solid fa-id-badge" value={s?.missing_tin ?? '…'} label={t('No e-TIN on file', 'e-TIN নেই')} tone="danger" />
        <Stat icon="fa-solid fa-file-invoice" value={s?.missing_bin ?? '…'} label={t('No VAT BIN on file', 'BIN নেই')} tone="warning" />
        <Stat icon="fa-solid fa-store-slash" value={s?.license_expired ?? '…'} label={t('Trade licence expired', 'ট্রেড লাইসেন্স মেয়াদোত্তীর্ণ')} tone="info" />
      </div>
      {d && <div className="alert alert-warning mb-4">{t(`Vendors with no e-TIN on file are charged ${d.no_tin_uplift_percent}% more source tax (TDS) on the TDS / VDS register. Check the rate against the current Finance Act; change it in Receipts, SMS & Online Pay → settings.`, `e-TIN না থাকলে TDS / VDS রেজিস্টারে উৎসে কর ${d.no_tin_uplift_percent}% বেশি কাটা হয়। চলতি অর্থ আইনের সাথে হার মিলিয়ে নিন; সেটিংসে বদলানো যায়।`)}</div>}
      <div className="card">
        <div className="card-header flex-between"><label className="flex gap-2 text-sm"><input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} /> {t('Only vendors with something missing', 'শুধু যাদের তথ্য অসম্পূর্ণ')}</label></div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Vendor', 'সরবরাহকারী')}</th><th>e-TIN</th><th>BIN</th><th>{t('Trade licence', 'ট্রেড লাইসেন্স')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={5} text={t('Loading…')} />}
            {d && rows.length === 0 && <Empty cols={5} text={t('All vendors have their tax IDs on file.', 'সব সরবরাহকারীর তথ্য আছে।')} />}
            {rows.map((v: any) => (
              <tr key={v.id_vendors} style={v.status === 'ACTIVE' ? undefined : { opacity: 0.55 }}>
                <td><div className="fw-semibold">{v.company_name}</div><div className="text-xs text-muted">{[v.contact_person, v.phone].filter(Boolean).join(' · ')}</div></td>
                <td>{v.tin_no || <span className="badge badge-danger">{t('Missing', 'নেই')}</span>}</td>
                <td>{v.bin_no || <span className="badge badge-warning">{t('Missing', 'নেই')}</span>}</td>
                <td className="text-sm">{v.trade_license_no || '—'}{v.trade_license_expiry && <div className={`text-xs ${v.license_expired ? 'text-warning' : 'text-muted'}`}>{v.license_expired ? t('Expired', 'মেয়াদোত্তীর্ণ') : t('Valid until', 'মেয়াদ')} {fmtDate(v.trade_license_expiry)}</div>}</td>
                <td><button className="btn btn-light btn-sm" onClick={() => setForm({ id_vendors: v.id_vendors, company_name: v.company_name, tin_no: v.tin_no || '', bin_no: v.bin_no || '', trade_license_no: v.trade_license_no || '', trade_license_expiry: inputDate(v.trade_license_expiry) })}><i className="fa-solid fa-pen" /> {t('Edit', 'সম্পাদনা')}</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {form && (
        <Modal title={`${t('Tax IDs', 'কর শনাক্তকরণ')} — ${form.company_name}`} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={tinBad(form.tin_no) || binBad(form.bin_no)} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label="e-TIN" hint={tinBad(form.tin_no) ? t('e-TIN is 12 digits', 'e-TIN ১২ সংখ্যার') : t('12 digits, from the vendor’s TIN certificate', '১২ সংখ্যা, টিআইএন সনদ থেকে')}><input className="form-control" inputMode="numeric" value={form.tin_no} onChange={e => set('tin_no', e.target.value)} /></Field>
            <Field label={t('VAT BIN', 'ভ্যাট BIN')} hint={binBad(form.bin_no) ? t('BIN is 9 digits (or 13 with the branch code)', 'BIN ৯ সংখ্যার (শাখাসহ ১৩)') : '000123456-0101'}><input className="form-control" value={form.bin_no} onChange={e => set('bin_no', e.target.value)} /></Field>
            <Field label={t('Trade licence no.', 'ট্রেড লাইসেন্স নং')}><input className="form-control" value={form.trade_license_no} onChange={e => set('trade_license_no', e.target.value)} /></Field>
            <Field label={t('Trade licence valid until', 'ট্রেড লাইসেন্সের মেয়াদ')} hint={t('Listed on the Licence renewals tab', 'লাইসেন্স নবায়ন তালিকায় দেখাবে')}><input type="date" className="form-control" value={form.trade_license_expiry} onChange={e => set('trade_license_expiry', e.target.value)} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}
