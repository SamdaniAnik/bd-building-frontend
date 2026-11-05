import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fiscalYearOf, fmtDate, formatBDT, formatBDTShort, isValidBdMobile, toBanglaDigits, toBongabdo, nowLocalInput, todayISO } from '../../utils/bd';

type TabKey = 'registration' | 'mfs' | 'withholding' | 'rates' | 'calendar' | 'holding';
type Toast = { type: 'success' | 'error'; message: string } | null;

const today = todayISO;
const num = (v: any) => Number(v) || 0;

const MFS_COLORS: Record<string, string> = { BKASH: '#e2136e', NAGAD: '#ec6a1d', ROCKET: '#8c3494', UPAY: '#0a4d9c', TAP: '#0f766e' };
const ZONES = [
  { v: 'ZONE_A_DHAKA_CTG', en: 'Dhaka / Chattogram metro (RAJUK, CDA)', bn: 'ঢাকা / চট্টগ্রাম মহানগর' },
  { v: 'ZONE_B_OTHER_CITY', en: 'Other City Corporation / Pourashava', bn: 'অন্যান্য সিটি কর্পোরেশন / পৌরসভা' },
  { v: 'ZONE_C_OTHER', en: 'Other areas', bn: 'অন্যান্য এলাকা' },
];
const CATEGORY_LABEL: Record<string, string> = {
  CONSTRUCTION_CONTRACT: 'Construction contract', SUPPLY_OF_GOODS: 'Supply of goods', PROFESSIONAL_SERVICE: 'Professional service',
  TRANSPORT: 'Transport', RENT: 'Rent', OTHER: 'Other',
};
const EVENT_LABEL: Record<string, string> = {
  PUBLIC_HOLIDAY: 'Public holiday', RELIGIOUS_FESTIVAL: 'Religious festival', HARTAL_BLOCKADE: 'Hartal / blockade',
  WEATHER_MONSOON: 'Weather / monsoon', SITE_SHUTDOWN: 'Site shutdown', OTHER: 'Other',
};

// ── Small shared UI pieces ────────────────────────────────────
function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <strong>{title}</strong>
          <button className="btn btn-light btn-sm" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
      {children}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}

function Kpi({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: React.ReactNode; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.45rem', fontWeight: 800, color, margin: '2px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

function Sparkline({ points }: { points: { rate: number }[] }) {
  if (points.length < 2) return null;
  const vals = points.map(p => p.rate);
  const min = Math.min(...vals), max = Math.max(...vals);
  const w = 120, h = 32;
  const d = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${max === min ? h / 2 : h - ((v - min) / (max - min)) * (h - 4) - 2}`).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={d} fill="none" stroke={up ? '#dc2626' : '#059669'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    VERIFIED: 'badge-success', PAID: 'badge-success', CERTIFICATE_ISSUED: 'badge-success', REGISTERED: 'badge-success', MUTATION_DONE: 'badge-success',
    PENDING_VERIFY: 'badge-warning', PARTIAL: 'badge-warning', DEPOSITED_TREASURY: 'badge-info', PAY_ORDER_READY: 'badge-info',
    REJECTED: 'badge-danger', OVERDUE: 'badge-danger', DEDUCTED: 'badge-danger', UNPAID: 'badge-gray', ESTIMATE: 'badge-gray',
  };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s.replace(/_/g, ' ')}</span>;
};

// ── Page ──────────────────────────────────────────────────────
export default function BangladeshToolkit() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Follows the app-wide language selector
  const { lang, setLang } = useLang();
  const bn = lang === 'bn';
  const setBn = (v: boolean) => setLang(v ? 'bn' : 'en');
  const [tab, setTab] = useState<TabKey>('registration');
  const [toast, setToast] = useState<Toast>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r: any = await api.get('/bd-local/overview');
      setData(r);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || 'Could not reach the API');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Shared POST/PATCH helper: toast + reload on success, returns true when it worked
  const send = async (method: 'post' | 'patch' | 'delete', url: string, body?: any) => {
    try {
      const r: any = method === 'delete' ? await api.delete(url) : await api[method](url, body);
      notify('success', r?.message || 'Saved');
      await load();
      return true;
    } catch (e: any) {
      notify('error', e?.message || 'Request failed');
      return false;
    }
  };

  const t = (en: string, bnText: string) => (bn ? bnText : en);
  const money = (n: any) => formatBDT(n, { bangla: bn });
  const short = (n: any) => formatBDTShort(n, bn);
  const bongabdo = toBongabdo(new Date());

  if (loading && !data) {
    return <div className="loader-overlay"><div className="loader-spinner"><div className="spinner" style={{ margin: '0 auto 8px' }} />{t('Loading Bangladesh toolkit…', 'লোড হচ্ছে…')}</div></div>;
  }
  if (loadError && !data) {
    return (
      <div className="alert alert-danger" style={{ margin: 24 }}>
        <i className="fa-solid fa-triangle-exclamation" />
        <div>Couldn't load the Bangladesh toolkit: {loadError}. Check that the API is running and migration 014 has been applied, then <button className="btn btn-sm btn-light" onClick={load}>retry</button>.</div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const tabs: { key: TabKey; en: string; bn: string; icon: string; badge: string }[] = [
    { key: 'registration', en: 'Flat Registration Cost', bn: 'ফ্ল্যাট রেজিস্ট্রেশন খরচ', icon: 'fa-solid fa-file-signature', badge: String(data.registrations.length) },
    { key: 'mfs', en: 'bKash / Nagad / Rocket', bn: 'বিকাশ / নগদ / রকেট', icon: 'fa-solid fa-mobile-screen', badge: m.mfsPendingCount ? `${m.mfsPendingCount} pending` : String(data.mfs.length) },
    { key: 'withholding', en: 'TDS / VDS (Mushak 6.6)', bn: 'উৎসে কর ও ভ্যাট কর্তন', icon: 'fa-solid fa-landmark', badge: `FY ${data.fiscal_year}` },
    { key: 'rates', en: 'Material Market Rates', bn: 'নির্মাণসামগ্রীর বাজারদর', icon: 'fa-solid fa-chart-line', badge: String(data.marketRates.length) },
    { key: 'calendar', en: 'Holidays & Hartal Calendar', bn: 'ছুটি ও হরতাল ক্যালেন্ডার', icon: 'fa-solid fa-calendar-days', badge: `${m.lostWorkingDaysYear} days lost` },
    { key: 'holding', en: 'Holding Tax', bn: 'হোল্ডিং ট্যাক্স', icon: 'fa-solid fa-house-flag', badge: short(m.holdingDueBdt) + ' due' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
      {toast && (
        <div role="status" style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '14px 22px', borderRadius: 10, background: toast.type === 'success' ? '#065f46' : '#991b1b', color: '#fff', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,.3)', maxWidth: 460 }}>
          <i className={toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'} style={{ marginRight: 8 }} />{toast.message}
        </div>
      )}

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg,#064e3b,#047857 55%,#b91c1c 140%)', color: '#fff', borderRadius: 16, padding: '22px 26px', marginBottom: 20 }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '0 0 6px' }}>{t('Bangladesh Operations Toolkit', 'বাংলাদেশ অপারেশনস টুলকিট')}</h1>
            <p style={{ margin: 0, opacity: 0.9, maxWidth: 820, fontSize: '0.9rem' }}>
              {t('Deed registration costs, mobile-wallet collections, NBR source tax & VDS, Dhaka material prices, holiday & hartal impact, and City Corporation holding tax.',
                'দলিল রেজিস্ট্রেশন খরচ, মোবাইল ব্যাংকিং আদায়, উৎসে কর ও ভ্যাট কর্তন, নির্মাণসামগ্রীর বাজারদর, ছুটি ও হরতালের প্রভাব এবং হোল্ডিং ট্যাক্স।')}
            </p>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20 }}><i className="fa-regular fa-calendar" /> {fmtDate(new Date())}</span>
              <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20 }}>{bongabdo.text}</span>
              <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20 }}>{t('Fiscal year', 'অর্থবছর')} {bn ? toBanglaDigits(data.fiscal_year) : data.fiscal_year}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn" style={{ background: '#fff', color: '#064e3b' }} onClick={() => setBn(!bn)}><i className="fa-solid fa-language" /> {bn ? 'English' : 'বাংলা'}</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,.22)', color: '#fff' }} onClick={load} title="Refresh" aria-label="Refresh"><i className={`fa-solid fa-rotate${loading ? ' fa-spin' : ''}`} /></button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
        <Kpi color="#4f46e5" label={t('Registration costs in pipeline', 'রেজিস্ট্রেশন খরচ (চলমান)')} value={short(m.registrationPipelineBdt)} sub={`${m.registrationCount} ${t('estimates', 'হিসাব')}`} />
        <Kpi color="#e2136e" label={t('Verified MFS collections', 'যাচাইকৃত মোবাইল আদায়')} value={short(m.mfsVerifiedBdt)} sub={`${m.mfsPendingCount} ${t('awaiting verification', 'যাচাই বাকি')}`} />
        <Kpi color="#b45309" label={`TDS + VDS · FY ${data.fiscal_year}`} value={short(num(m.tdsFyBdt) + num(m.vdsFyBdt))} sub={`${m.withholdingNotDeposited} ${t('not yet deposited to treasury', 'ট্রেজারিতে জমা বাকি')}`} />
        <Kpi color="#dc2626" label={t(`Working days lost · ${m.calendarYear}`, `হারানো কর্মদিবস · ${m.calendarYear}`)} value={bn ? toBanglaDigits(m.lostWorkingDaysYear) : m.lostWorkingDaysYear} sub={`${m.lostWorkingDaysToDate} ${t('so far, Fridays excluded', 'এ পর্যন্ত, শুক্রবার বাদে')}`} />
        <Kpi color="#0f766e" label={t('Holding tax due', 'হোল্ডিং ট্যাক্স বকেয়া')} value={short(m.holdingDueBdt)} sub={`${short(m.holdingPaidBdt)} ${t('paid', 'পরিশোধিত')}`} />
      </div>

      <div className="tabs" role="tablist">
        {tabs.map(x => (
          <button key={x.key} role="tab" aria-selected={tab === x.key} className={`tab-btn${tab === x.key ? ' active' : ''}`} onClick={() => setTab(x.key)}>
            <i className={x.icon} /> {bn ? x.bn : x.en}
            <span className="badge badge-gray" style={{ marginLeft: 4 }}>{x.badge}</span>
          </button>
        ))}
      </div>

      {tab === 'registration' && <RegistrationTab data={data} bn={bn} t={t} money={money} send={send} />}
      {tab === 'mfs' && <MfsTab data={data} t={t} money={money} send={send} />}
      {tab === 'withholding' && <WithholdingTab data={data} t={t} money={money} send={send} />}
      {tab === 'rates' && <RatesTab data={data} bn={bn} t={t} money={money} send={send} />}
      {tab === 'calendar' && <CalendarTab data={data} bn={bn} t={t} money={money} send={send} />}
      {tab === 'holding' && <HoldingTab data={data} t={t} money={money} send={send} />}
    </div>
  );
}

type TabProps = {
  data: any; bn?: boolean;
  t: (en: string, bn: string) => string;
  money: (n: any) => string;
  send: (method: 'post' | 'patch' | 'delete', url: string, body?: any) => Promise<boolean>;
};

// ─────────────────────────────────────────────────────────────
// 1. Flat registration cost calculator
// ─────────────────────────────────────────────────────────────
function RegistrationTab({ data, bn, t, money, send }: TabProps) {
  const blank = { unit_number: '', buyer_name: '', buyer_nid: '', buyer_tin: '', flat_area_sft: 1350, deed_value_bdt: 8500000, mouza_rate_value_bdt: '', location_zone: 'ZONE_A_DHAKA_CTG', is_city_corporation: true, include_vat: true, sub_registry_office: 'Uttara Sub-Registry Office', planned_registration_date: '', remarks: '' };
  const [form, setForm] = useState<any>(blank);
  const [calc, setCalc] = useState<any>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // Live preview from the server so the UI and saved records use the same formula
  useEffect(() => {
    if (!(num(form.deed_value_bdt) > 0 && num(form.flat_area_sft) > 0)) { setCalc(null); return; }
    const h = setTimeout(async () => {
      try {
        const r: any = await api.post('/bd-local/registration', { ...form, preview: true });
        setCalc(r.calculation); setCalcError(null);
      } catch (e: any) { setCalcError(e?.message || 'Calculation failed'); }
    }, 300);
    return () => clearTimeout(h);
  }, [form.deed_value_bdt, form.flat_area_sft, form.mouza_rate_value_bdt, form.location_zone, form.is_city_corporation, form.include_vat]);

  const save = async () => { if (await send('post', '/bd-local/registration', form)) setForm(blank); };

  const updateStatus = (r: any, status: string) =>
    send('post', '/bd-local/registration', { ...r, status, rates: r.rates_json, planned_registration_date: r.planned_registration_date ? String(r.planned_registration_date).slice(0, 10) : null });

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(320px,1fr) minmax(320px,1fr)', alignItems: 'start' }}>
      <div className="card">
        <div className="card-header"><span className="card-title"><i className="fa-solid fa-calculator" /> {t('Deed registration cost calculator', 'দলিল রেজিস্ট্রেশন খরচ হিসাব')}</span></div>
        <div className="card-body">
          <div className="form-row cols-2">
            <Field label={t('Flat / unit no.', 'ফ্ল্যাট নং')}><input className="form-control" value={form.unit_number} onChange={e => set('unit_number', e.target.value)} placeholder="A-201" /></Field>
            <Field label={t('Buyer name', 'ক্রেতার নাম')} required><input className="form-control" value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} /></Field>
            <Field label={t('Buyer NID', 'ক্রেতার এনআইডি')}><input className="form-control" value={form.buyer_nid} onChange={e => set('buyer_nid', e.target.value)} /></Field>
            <Field label={t('Buyer e-TIN', 'ক্রেতার ই-টিন')}><input className="form-control" value={form.buyer_tin} onChange={e => set('buyer_tin', e.target.value)} /></Field>
            <Field label={t('Flat area (sft)', 'আয়তন (বর্গফুট)')} required hint={t('Sets the VAT slab', 'ভ্যাটের হার নির্ধারণ করে')}><input type="number" min={1} className="form-control" value={form.flat_area_sft} onChange={e => set('flat_area_sft', e.target.value)} /></Field>
            <Field label={t('Deed value (৳)', 'দলিল মূল্য (৳)')} required hint={formatBDTShort(form.deed_value_bdt, bn)}><input type="number" min={1} className="form-control" value={form.deed_value_bdt} onChange={e => set('deed_value_bdt', e.target.value)} /></Field>
            <Field label={t('Govt. mouza value (৳)', 'সরকারি মৌজা মূল্য (৳)')} hint={t('Duties use whichever is higher', 'যেটি বেশি সেটির উপর শুল্ক')}><input type="number" min={0} className="form-control" value={form.mouza_rate_value_bdt} onChange={e => set('mouza_rate_value_bdt', e.target.value)} /></Field>
            <Field label={t('Location (Sec. 53H zone)', 'এলাকা (৫৩এইচ জোন)')}>
              <select className="form-select" value={form.location_zone} onChange={e => set('location_zone', e.target.value)}>
                {ZONES.map(z => <option key={z.v} value={z.v}>{bn ? z.bn : z.en}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_city_corporation} onChange={e => set('is_city_corporation', e.target.checked)} /> {t('City Corporation / Cantonment area', 'সিটি কর্পোরেশন / ক্যান্টনমেন্ট এলাকা')}</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.include_vat} onChange={e => set('include_vat', e.target.checked)} /> {t('Include VAT on flat price', 'ফ্ল্যাটের ভ্যাট যোগ করুন')}</label>
          </div>
          <div className="form-row cols-2">
            <Field label={t('Sub-registry office', 'সাব-রেজিস্ট্রি অফিস')}><input className="form-control" value={form.sub_registry_office} onChange={e => set('sub_registry_office', e.target.value)} /></Field>
            <Field label={t('Planned registration date', 'রেজিস্ট্রেশনের তারিখ')}><input type="date" className="form-control" value={form.planned_registration_date} onChange={e => set('planned_registration_date', e.target.value)} /></Field>
          </div>
          <button className="btn btn-success" onClick={save}><i className="fa-solid fa-floppy-disk" /> {t('Save estimate', 'হিসাব সংরক্ষণ')}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title"><i className="fa-solid fa-receipt" /> {t('Cost breakdown', 'খরচের বিবরণ')}</span></div>
        <div className="card-body">
          {calcError && <div className="alert alert-danger mb-3">{calcError}</div>}
          {!calc ? <div className="text-muted text-sm">{t('Enter area and deed value to see the breakdown.', 'আয়তন ও মূল্য দিন।')}</div> : (
            <>
              <table>
                <thead><tr><th>{t('Head', 'খাত')}</th><th className="text-right">%</th><th className="text-right">{t('Amount', 'টাকা')}</th></tr></thead>
                <tbody>
                  {calc.lines.map((l: any) => (
                    <tr key={l.key}><td>{bn ? l.label_bn : l.label_en}</td><td className="text-right">{l.percent ?? '—'}</td><td className="text-right bdt-amount">{money(l.amount)}</td></tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td>{t('Total registration cost', 'মোট রেজিস্ট্রেশন খরচ')}</td><td className="text-right">{calc.effective_percent}%</td><td className="text-right">{money(calc.total_cost_bdt)}</td></tr>
                </tfoot>
              </table>
              <div className="flex-between mt-4 p-3 rounded" style={{ background: '#ecfdf5' }}>
                <span className="fw-semibold">{t('Flat price + registration', 'ফ্ল্যাটের মূল্য + রেজিস্ট্রেশন')}</span>
                <span className="bdt-amount bdt-large text-success">{money(calc.grand_total_with_price_bdt)}</span>
              </div>
              <div className="form-text mt-3">
                {t('Assessed on ', 'নির্ধারিত মূল্য: ')}{money(calc.assessable_value_bdt)}. {t('Rates are defaults from recent Finance Acts — confirm with the sub-registry office / NBR for the current fiscal year before issuing pay orders.', 'হারসমূহ ডিফল্ট — পে-অর্ডার করার আগে চলতি অর্থবছরের হার যাচাই করুন।')}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header"><span className="card-title"><i className="fa-solid fa-list-check" /> {t('Saved estimates', 'সংরক্ষিত হিসাব')}</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{t('Unit', 'ফ্ল্যাট')}</th><th>{t('Buyer', 'ক্রেতা')}</th><th className="text-right">sft</th><th className="text-right">{t('Deed value', 'দলিল মূল্য')}</th><th className="text-right">{t('Registration cost', 'রেজিস্ট্রেশন খরচ')}</th><th>{t('Office', 'অফিস')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
            <tbody>
              {data.registrations.length === 0 && <tr><td colSpan={8} className="text-center text-muted">{t('No estimates saved yet.', 'কোনো হিসাব নেই।')}</td></tr>}
              {data.registrations.map((r: any) => (
                <tr key={r.id_reg_estimates}>
                  <td className="fw-bold">{r.unit_number || '—'}</td>
                  <td>{r.buyer_name}</td>
                  <td className="text-right">{num(r.flat_area_sft)}</td>
                  <td className="text-right bdt-amount">{money(r.deed_value_bdt)}</td>
                  <td className="text-right bdt-amount text-primary">{money(r.total_cost_bdt)}</td>
                  <td className="text-sm">{r.sub_registry_office || '—'}</td>
                  <td>
                    <select className="form-select" style={{ padding: '4px 8px', width: 'auto' }} value={r.status} onChange={e => updateStatus(r, e.target.value)}>
                      {['ESTIMATE', 'PAY_ORDER_READY', 'REGISTERED', 'MUTATION_DONE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td><button className="btn btn-light btn-sm" title="Delete" aria-label="Delete estimate" onClick={() => confirm('Delete this estimate?') && send('delete', `/bd-local/registration/${r.id_reg_estimates}`)}><i className="fa-solid fa-trash" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. MFS register
// ─────────────────────────────────────────────────────────────
function MfsTab({ data, t, money, send }: TabProps) {
  const blank = { provider: 'BKASH', trx_id: '', direction: 'RECEIVED', purpose: 'INSTALLMENT', counterparty_name: '', counterparty_wallet: '', our_wallet: '', unit_number: '', amount_bdt: '', fee_bdt: 0, trx_datetime: nowLocalInput(), reference_voucher_no: '', remarks: '' };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);
  const [filter, setFilter] = useState('ALL');
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const walletOk = !form.counterparty_wallet || isValidBdMobile(form.counterparty_wallet);

  const rows = data.mfs.filter((x: any) => filter === 'ALL' || x.status === filter || x.provider === filter);
  const byProvider = useMemo(() => {
    const out: Record<string, number> = {};
    data.mfs.filter((x: any) => x.status === 'VERIFIED' && x.direction === 'RECEIVED').forEach((x: any) => { out[x.provider] = (out[x.provider] || 0) + num(x.net_amount_bdt); });
    return out;
  }, [data.mfs]);

  const save = async () => { if (await send('post', '/bd-local/mfs', form)) { setOpen(false); setForm(blank); } };

  return (
    <>
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {Object.keys(MFS_COLORS).filter(p => byProvider[p]).map(p => (
            <span key={p} style={{ background: MFS_COLORS[p], color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem' }}>{p} · {money(byProvider[p])}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter">
            <option value="ALL">{t('All transactions', 'সব লেনদেন')}</option>
            <option value="PENDING_VERIFY">{t('Pending verification', 'যাচাই বাকি')}</option>
            <option value="VERIFIED">{t('Verified', 'যাচাইকৃত')}</option>
            <option value="REJECTED">{t('Rejected', 'বাতিল')}</option>
            {Object.keys(MFS_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fa-solid fa-plus" /> {t('Record transaction', 'লেনদেন যোগ করুন')}</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{t('Provider', 'মাধ্যম')}</th><th>TrxID</th><th>{t('Date & time', 'সময়')}</th><th>{t('From / to', 'প্রেরক / প্রাপক')}</th><th>{t('Purpose', 'উদ্দেশ্য')}</th><th className="text-right">{t('Amount', 'টাকা')}</th><th className="text-right">{t('Fee', 'চার্জ')}</th><th className="text-right">{t('Net', 'নিট')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="text-center text-muted">{t('No transactions match this filter.', 'কোনো লেনদেন নেই।')}</td></tr>}
              {rows.map((x: any) => (
                <tr key={x.id_mfs}>
                  <td><span style={{ color: MFS_COLORS[x.provider], fontWeight: 800 }}>{x.provider}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{x.trx_id}</td>
                  <td className="text-sm">{new Date(x.trx_datetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><div className="fw-semibold">{x.counterparty_name}</div><div className="text-xs text-muted">{x.counterparty_wallet}{x.unit_number ? ` · ${x.unit_number}` : ''}</div></td>
                  <td className="text-sm"><i className={`fa-solid ${x.direction === 'RECEIVED' ? 'fa-arrow-down text-success' : 'fa-arrow-up text-danger'}`} /> {x.purpose.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="text-right bdt-amount">{money(x.amount_bdt)}</td>
                  <td className="text-right text-muted">{num(x.fee_bdt) ? money(x.fee_bdt) : '—'}</td>
                  <td className="text-right bdt-amount">{money(x.net_amount_bdt)}</td>
                  <td>{statusBadge(x.status)}{x.verified_by && x.status !== 'PENDING_VERIFY' && <div className="text-xs text-muted">{x.verified_by}</div>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {x.status === 'PENDING_VERIFY' ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => send('patch', `/bd-local/mfs/${x.id_mfs}/verify`, { status: 'VERIFIED' })}>{t('Verify', 'যাচাই')}</button>{' '}
                        <button className="btn btn-light btn-sm" onClick={() => send('patch', `/bd-local/mfs/${x.id_mfs}/verify`, { status: 'REJECTED' })}>{t('Reject', 'বাতিল')}</button>
                      </>
                    ) : (
                      <button className="btn btn-light btn-sm" onClick={() => send('patch', `/bd-local/mfs/${x.id_mfs}/verify`, { status: 'PENDING_VERIFY' })}>{t('Reopen', 'পুনরায় খুলুন')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={t('Record mobile wallet transaction', 'মোবাইল লেনদেন যোগ করুন')} onClose={() => setOpen(false)}
          footer={<><button className="btn btn-light" onClick={() => setOpen(false)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!walletOk} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-3">
            <Field label={t('Provider', 'মাধ্যম')}><select className="form-select" value={form.provider} onChange={e => set('provider', e.target.value)}>{Object.keys(MFS_COLORS).map(p => <option key={p}>{p}</option>)}</select></Field>
            <Field label="TrxID" required hint={t('Checked for duplicates', 'ডুপ্লিকেট যাচাই হবে')}><input className="form-control" value={form.trx_id} onChange={e => set('trx_id', e.target.value.toUpperCase())} placeholder="8N7A6D5K3F" /></Field>
            <Field label={t('Direction', 'ধরন')}><select className="form-select" value={form.direction} onChange={e => set('direction', e.target.value)}><option value="RECEIVED">Received</option><option value="SENT">Sent</option></select></Field>
            <Field label={t('Name', 'নাম')} required><input className="form-control" value={form.counterparty_name} onChange={e => set('counterparty_name', e.target.value)} /></Field>
            <Field label={t('Wallet number', 'ওয়ালেট নম্বর')} required hint={walletOk ? '01XXXXXXXXX' : t('Not a valid BD mobile number', 'সঠিক মোবাইল নম্বর নয়')}>
              <input className="form-control" style={walletOk ? undefined : { borderColor: 'var(--danger)' }} value={form.counterparty_wallet} onChange={e => set('counterparty_wallet', e.target.value)} placeholder="01711XXXXXX" />
            </Field>
            <Field label={t('Unit', 'ফ্ল্যাট')}><input className="form-control" value={form.unit_number} onChange={e => set('unit_number', e.target.value)} /></Field>
            <Field label={t('Purpose', 'উদ্দেশ্য')}><select className="form-select" value={form.purpose} onChange={e => set('purpose', e.target.value)}>{['INSTALLMENT', 'SERVICE_CHARGE', 'UTILITY_BILL', 'VENDOR_PAYMENT', 'LABOUR_WAGE', 'OTHER'].map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}</select></Field>
            <Field label={t('Amount (৳)', 'টাকা (৳)')} required><input type="number" min={1} className="form-control" value={form.amount_bdt} onChange={e => set('amount_bdt', e.target.value)} /></Field>
            <Field label={t('Charge / fee (৳)', 'চার্জ (৳)')}><input type="number" min={0} className="form-control" value={form.fee_bdt} onChange={e => set('fee_bdt', e.target.value)} /></Field>
            <Field label={t('Date & time', 'তারিখ ও সময়')}><input type="datetime-local" className="form-control" value={form.trx_datetime} onChange={e => set('trx_datetime', e.target.value)} /></Field>
            <Field label={t('Our wallet', 'আমাদের ওয়ালেট')}><input className="form-control" value={form.our_wallet} onChange={e => set('our_wallet', e.target.value)} /></Field>
            <Field label={t('Money receipt / voucher', 'মানি রিসিট')}><input className="form-control" value={form.reference_voucher_no} onChange={e => set('reference_voucher_no', e.target.value)} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. TDS / VDS withholding
// ─────────────────────────────────────────────────────────────
function WithholdingTab({ data, t, money, send }: TabProps) {
  const defaults = data.defaults.withholding;
  const blank = { id_vendors: '', vendor_name: '', vendor_bin: '', vendor_tin: '', bill_no: '', bill_date: today(), service_category: 'SUPPLY_OF_GOODS', gross_amount_bdt: '', tds_rate_percent: defaults.SUPPLY_OF_GOODS.tds, vds_rate_percent: defaults.SUPPLY_OF_GOODS.vds, apply_no_tin_uplift: true, remarks: '' };
  // Vendors with their saved TIN / BIN, and the extra TDS % charged when there is no TIN (Collections → settings).
  const [vendors, setVendors] = useState<any[]>([]);
  const [upliftPct, setUpliftPct] = useState(0);
  useEffect(() => { api.get('/ops/compliance/vendor-tax').then((r: any) => { setVendors(r.rows.filter((v: any) => v.status === 'ACTIVE')); setUpliftPct(r.no_tin_uplift_percent); }).catch(() => {}); }, []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);
  const [deposit, setDeposit] = useState<any>(null);
  const [fy, setFy] = useState<string>(data.fiscal_year);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setCategory = (c: string) => setForm((f: any) => ({ ...f, service_category: c, tds_rate_percent: defaults[c].tds, vds_rate_percent: defaults[c].vds }));

  const pickVendor = (id: string) => {
    const v = vendors.find(x => String(x.id_vendors) === id);
    setForm((f: any) => ({ ...f, id_vendors: id, vendor_name: v ? v.company_name : f.vendor_name, vendor_tin: v?.tin_no || '', vendor_bin: v?.bin_no || '' }));
  };
  const noTin = !String(form.vendor_tin || '').trim();
  const uplift = noTin && form.apply_no_tin_uplift ? upliftPct : 0;
  const tdsRate = Math.round(num(form.tds_rate_percent) * (1 + uplift / 100) * 100) / 100;
  const gross = num(form.gross_amount_bdt);
  const tds = Math.round(gross * tdsRate) / 100;
  const vds = Math.round(gross * num(form.vds_rate_percent)) / 100;

  const years: string[] = Array.from(new Set<string>([data.fiscal_year, ...data.withholding.map((w: any) => w.fiscal_year)])).sort().reverse();
  const rows = data.withholding.filter((w: any) => w.fiscal_year === fy);
  const tot = (f: string) => rows.reduce((s: number, w: any) => s + num(w[f]), 0);

  const save = async () => { if (await send('post', '/bd-local/withholding', form)) { setOpen(false); setForm(blank); } };
  const saveDeposit = async () => { if (await send('patch', `/bd-local/withholding/${deposit.id_withholding}/deposit`, deposit)) setDeposit(null); };

  return (
    <>
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <label className="text-sm fw-semibold" htmlFor="fy">{t('Fiscal year (Jul–Jun)', 'অর্থবছর (জুলাই–জুন)')}</label>
          <select id="fy" className="form-select" style={{ width: 'auto' }} value={fy} onChange={e => setFy(e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fa-solid fa-plus" /> {t('Add vendor bill', 'বিল যোগ করুন')}</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{t('Vendor', 'সরবরাহকারী')}</th><th>{t('Bill', 'বিল')}</th><th>{t('Category', 'খাত')}</th><th className="text-right">{t('Gross', 'মোট')}</th><th className="text-right">TDS</th><th className="text-right">VDS</th><th className="text-right">{t('Net payable', 'নিট প্রদেয়')}</th><th>{t('Challan / Mushak 6.6', 'চালান / মূসক ৬.৬')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="text-center text-muted">{t('No bills in this fiscal year.', 'এই অর্থবছরে কোনো বিল নেই।')}</td></tr>}
              {rows.map((w: any) => (
                <tr key={w.id_withholding}>
                  <td><div className="fw-semibold">{w.vendor_name}</div><div className="text-xs text-muted">BIN {w.vendor_bin || '—'}</div></td>
                  <td className="text-sm">{w.bill_no || '—'}<div className="text-xs text-muted">{fmtDate(w.bill_date)}</div></td>
                  <td className="text-sm">{CATEGORY_LABEL[w.service_category]}</td>
                  <td className="text-right bdt-amount">{money(w.gross_amount_bdt)}</td>
                  <td className="text-right">{money(w.tds_amount_bdt)}<div className="text-xs text-muted">{num(w.tds_rate_percent)}%{w.no_tin_uplift ? <> · <span className="badge badge-warning">{t('no TIN', 'TIN নেই')}</span></> : null}</div></td>
                  <td className="text-right">{money(w.vds_amount_bdt)}<div className="text-xs text-muted">{num(w.vds_rate_percent)}%</div></td>
                  <td className="text-right bdt-amount text-success">{money(w.net_payable_bdt)}</td>
                  <td className="text-xs">{w.tds_challan_no || w.vds_challan_no ? <>{w.tds_challan_no} / {w.vds_challan_no}<div className="text-muted">{w.mushak_6_6_no || t('6.6 pending', '৬.৬ বাকি')}</div></> : '—'}</td>
                  <td>{statusBadge(w.status)}</td>
                  <td>{w.status !== 'CERTIFICATE_ISSUED' && <button className="btn btn-light btn-sm" onClick={() => setDeposit({ id_withholding: w.id_withholding, tds_challan_no: w.tds_challan_no || '', vds_challan_no: w.vds_challan_no || '', challan_date: today(), mushak_6_6_no: w.mushak_6_6_no || '' })}>{t('Deposit', 'জমা')}</button>}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && <tfoot><tr><td colSpan={3}>{t('Total', 'মোট')} · FY {fy}</td><td className="text-right">{money(tot('gross_amount_bdt'))}</td><td className="text-right">{money(tot('tds_amount_bdt'))}</td><td className="text-right">{money(tot('vds_amount_bdt'))}</td><td className="text-right">{money(tot('net_payable_bdt'))}</td><td colSpan={3} /></tr></tfoot>}
          </table>
        </div>
      </div>
      <div className="form-text mt-3">{t('Default rates per category are a starting point; NBR rates are slab-based and change each Finance Act — override them per bill.', 'ডিফল্ট হার পরিবর্তনযোগ্য — প্রতিটি বিলে চলতি হার যাচাই করুন।')}</div>

      {open && (
        <Modal title={t('Vendor bill — source tax & VDS', 'বিল — উৎসে কর ও ভ্যাট কর্তন')} onClose={() => setOpen(false)}
          footer={<><button className="btn btn-light" onClick={() => setOpen(false)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-3">
            <Field label={t('Pick a saved vendor', 'সংরক্ষিত সরবরাহকারী')} hint={t('Fills in its TIN / BIN; IDs you type are saved back to the vendor', 'TIN / BIN নিজে বসবে; নতুন লিখলে সরবরাহকারীর তথ্যে সংরক্ষিত হবে')}>
              <select className="form-select" value={form.id_vendors} onChange={e => pickVendor(e.target.value)}><option value="">{t('— Other / not listed —', '— অন্যান্য —')}</option>{vendors.map(v => <option key={v.id_vendors} value={v.id_vendors}>{v.company_name}{v.tin_no ? '' : ' (no TIN)'}</option>)}</select></Field>
            <Field label={t('Vendor', 'সরবরাহকারী')} required><input className="form-control" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} /></Field>
            <Field label="BIN"><input className="form-control" value={form.vendor_bin} onChange={e => set('vendor_bin', e.target.value)} placeholder="000123456-0101" /></Field>
            <Field label="e-TIN"><input className="form-control" value={form.vendor_tin} onChange={e => set('vendor_tin', e.target.value)} /></Field>
            <Field label={t('Bill no.', 'বিল নং')}><input className="form-control" value={form.bill_no} onChange={e => set('bill_no', e.target.value)} /></Field>
            <Field label={t('Bill date', 'বিলের তারিখ')} hint={`FY ${fiscalYearOf(form.bill_date || new Date())}`}><input type="date" className="form-control" value={form.bill_date} onChange={e => set('bill_date', e.target.value)} /></Field>
            <Field label={t('Category', 'খাত')}><select className="form-select" value={form.service_category} onChange={e => setCategory(e.target.value)}>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t('Gross bill (৳)', 'মোট বিল (৳)')} required><input type="number" min={1} className="form-control" value={form.gross_amount_bdt} onChange={e => set('gross_amount_bdt', e.target.value)} /></Field>
            <Field label="TDS %" hint={uplift ? t(`${tdsRate}% after the no-TIN increase`, `TIN না থাকায় ${tdsRate}%`) : undefined}><input type="number" step="0.5" min={0} className="form-control" value={form.tds_rate_percent} onChange={e => set('tds_rate_percent', e.target.value)} /></Field>
            <Field label="VDS %"><input type="number" step="0.5" min={0} className="form-control" value={form.vds_rate_percent} onChange={e => set('vds_rate_percent', e.target.value)} /></Field>
          </div>
          {noTin && upliftPct > 0 && (
            <div className="alert alert-warning mb-4">
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.apply_no_tin_uplift} onChange={e => set('apply_no_tin_uplift', e.target.checked)} />
                {t(`No e-TIN entered — deduct ${upliftPct}% more source tax. Untick only if the vendor has shown a valid return / exemption.`, `e-TIN নেই — উৎসে কর ${upliftPct}% বেশি কাটুন। সরবরাহকারী বৈধ রিটার্ন / অব্যাহতি দেখালে টিক তুলে দিন।`)}</label>
            </div>
          )}
          {gross > 0 && (
            <div className="grid grid-3 p-3 rounded" style={{ background: '#f8fafc' }}>
              <div><div className="text-xs text-muted">TDS</div><div className="fw-bold">{money(tds)}</div></div>
              <div><div className="text-xs text-muted">VDS</div><div className="fw-bold">{money(vds)}</div></div>
              <div><div className="text-xs text-muted">{t('Pay vendor', 'সরবরাহকারীকে প্রদেয়')}</div><div className="fw-bold text-success">{money(gross - tds - vds)}</div></div>
            </div>
          )}
        </Modal>
      )}

      {deposit && (
        <Modal title={t('Treasury challan & Mushak 6.6', 'ট্রেজারি চালান ও মূসক ৬.৬')} onClose={() => setDeposit(null)}
          footer={<><button className="btn btn-light" onClick={() => setDeposit(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={saveDeposit}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('TDS challan no.', 'আয়কর চালান নং')}><input className="form-control" value={deposit.tds_challan_no} onChange={e => setDeposit({ ...deposit, tds_challan_no: e.target.value })} /></Field>
            <Field label={t('VDS challan no.', 'ভ্যাট চালান নং')}><input className="form-control" value={deposit.vds_challan_no} onChange={e => setDeposit({ ...deposit, vds_challan_no: e.target.value })} /></Field>
            <Field label={t('Challan date', 'চালানের তারিখ')}><input type="date" className="form-control" value={deposit.challan_date} onChange={e => setDeposit({ ...deposit, challan_date: e.target.value })} /></Field>
            <Field label={t('Mushak 6.6 certificate no.', 'মূসক ৬.৬ নং')} hint={t('Leave blank if not issued yet', 'ইস্যু না হলে খালি রাখুন')}><input className="form-control" value={deposit.mushak_6_6_no} onChange={e => setDeposit({ ...deposit, mushak_6_6_no: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Material market rates
// ─────────────────────────────────────────────────────────────
function RatesTab({ data, bn, t, money, send }: TabProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ material_key: '', material_name_en: '', material_name_bn: '', brand: '', uom: '', rate_bdt: '', market_location: 'Dhaka', rate_date: today(), source: '' });
  const [qty, setQty] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const startAdd = (m?: any) => {
    setForm(m ? { material_key: m.material_key, material_name_en: m.material_name_en, material_name_bn: m.material_name_bn || '', brand: m.brand || '', uom: m.uom, rate_bdt: '', market_location: m.market_location, rate_date: today(), source: '' }
      : { material_key: '', material_name_en: '', material_name_bn: '', brand: '', uom: '', rate_bdt: '', market_location: 'Dhaka', rate_date: today(), source: '' });
    setOpen(true);
  };
  const save = async () => { if (await send('post', '/bd-local/market-rates', form)) setOpen(false); };
  const estimate = data.marketRates.reduce((s: number, m: any) => s + num(qty[m.material_key]) * num(m.rate_bdt), 0);

  return (
    <>
      <div className="flex-between mb-4">
        <div className="text-sm text-muted">{t('Latest quote per material, with change from the previous entry. Red means prices rose.', 'প্রতিটি সামগ্রীর সর্বশেষ দর। লাল = দাম বেড়েছে।')}</div>
        <button className="btn btn-primary" onClick={() => startAdd()}><i className="fa-solid fa-plus" /> {t('New material', 'নতুন সামগ্রী')}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {data.marketRates.map((m: any) => {
          const ch = num(m.change_percent);
          return (
            <div key={m.material_key} className="card" style={{ marginBottom: 0 }}>
              <div className="card-body" style={{ padding: 16 }}>
                <div className="flex-between">
                  <div>
                    <div className="fw-bold">{bn && m.material_name_bn ? m.material_name_bn : m.material_name_en}</div>
                    <div className="text-xs text-muted">{m.brand || '—'} · {t('per', 'প্রতি')} {m.uom}</div>
                  </div>
                  <Sparkline points={m.history} />
                </div>
                <div className="flex-between mt-3" style={{ alignItems: 'flex-end' }}>
                  <div>
                    <div className="bdt-amount" style={{ fontSize: '1.3rem' }}>{money(m.rate_bdt)}</div>
                    <div className="text-xs text-muted">{fmtDate(m.rate_date)} · {m.market_location}</div>
                  </div>
                  <span className={`badge ${ch > 0 ? 'badge-danger' : ch < 0 ? 'badge-success' : 'badge-gray'}`}>
                    <i className={`fa-solid ${ch > 0 ? 'fa-arrow-trend-up' : ch < 0 ? 'fa-arrow-trend-down' : 'fa-minus'}`} /> {ch > 0 ? '+' : ''}{ch}%
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <input type="number" min={0} className="form-control" style={{ padding: '5px 8px' }} placeholder={`${t('Qty', 'পরিমাণ')} (${m.uom})`} value={qty[m.material_key] || ''} onChange={e => setQty({ ...qty, [m.material_key]: e.target.value })} aria-label={`Quantity of ${m.material_name_en}`} />
                  <button className="btn btn-light btn-sm" onClick={() => startAdd(m)} title={t('Add new rate', 'নতুন দর')}><i className="fa-solid fa-pen" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {estimate > 0 && (
        <div className="flex-between mt-4 p-4 rounded" style={{ background: '#eef2ff' }}>
          <span className="fw-semibold">{t('Purchase estimate at today’s rates', 'বর্তমান দরে আনুমানিক ক্রয়মূল্য')}</span>
          <span className="bdt-amount bdt-large text-primary">{money(estimate)} <span className="text-sm text-muted">({formatBDTShort(estimate, bn)})</span></span>
        </div>
      )}

      {open && (
        <Modal title={t('Record market rate', 'বাজারদর যোগ করুন')} onClose={() => setOpen(false)}
          footer={<><button className="btn btn-light" onClick={() => setOpen(false)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Material code', 'কোড')} required hint="e.g. ROD_72G, CEMENT_PCC"><input className="form-control" value={form.material_key} onChange={e => set('material_key', e.target.value.toUpperCase().replace(/\s+/g, '_'))} /></Field>
            <Field label={t('Unit', 'একক')} required hint="Ton, Bag (50kg), 1000 pcs, CFT"><input className="form-control" value={form.uom} onChange={e => set('uom', e.target.value)} /></Field>
            <Field label={t('Name (English)', 'নাম (ইংরেজি)')} required><input className="form-control" value={form.material_name_en} onChange={e => set('material_name_en', e.target.value)} /></Field>
            <Field label={t('Name (Bangla)', 'নাম (বাংলা)')}><input className="form-control" value={form.material_name_bn} onChange={e => set('material_name_bn', e.target.value)} /></Field>
            <Field label={t('Brand', 'ব্র্যান্ড')}><input className="form-control" value={form.brand} onChange={e => set('brand', e.target.value)} /></Field>
            <Field label={t('Rate (৳)', 'দর (৳)')} required><input type="number" min={1} className="form-control" value={form.rate_bdt} onChange={e => set('rate_bdt', e.target.value)} /></Field>
            <Field label={t('Market', 'বাজার')}><input className="form-control" value={form.market_location} onChange={e => set('market_location', e.target.value)} /></Field>
            <Field label={t('Rate date', 'তারিখ')}><input type="date" className="form-control" value={form.rate_date} onChange={e => set('rate_date', e.target.value)} /></Field>
          </div>
          <Field label={t('Source', 'উৎস')}><input className="form-control" value={form.source} onChange={e => set('source', e.target.value)} placeholder="Dealer quote, TCB, site purchase…" /></Field>
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Work calendar
// ─────────────────────────────────────────────────────────────
function CalendarTab({ data, bn, t, money, send }: TabProps) {
  const m = data.metrics;
  const blank = { title_en: '', title_bn: '', start_date: today(), end_date: today(), event_type: 'HARTAL_BLOCKADE', work_impact: 'FULL_STOP', festival_bonus_due: false, bonus_amount_per_worker_bdt: 0, notes: '', applies_all_projects: false };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await send('post', '/bd-local/calendar', form)) { setOpen(false); setForm(blank); } };
  const todayStr = today();
  const impactColor: Record<string, string> = { FULL_STOP: '#dc2626', PARTIAL: '#d97706', NONE: '#64748b' };

  return (
    <>
      <div className="grid grid-3 mb-4">
        <Kpi color="#dc2626" label={t(`Working days lost in ${m.calendarYear}`, `${m.calendarYear} সালে হারানো কর্মদিবস`)} value={m.lostWorkingDaysYear} sub={t('Full stop = 1 day, partial = ½ day; Fridays not counted', 'পূর্ণ বন্ধ = ১ দিন, আংশিক = ½ দিন')} />
        <Kpi color="#0f766e" label={t('Next festival bonus', 'পরবর্তী উৎসব ভাতা')} value={m.nextFestivalBonus ? money(m.nextFestivalBonus.total) : '—'}
          sub={m.nextFestivalBonus ? `${m.nextFestivalBonus.title} · ${fmtDate(m.nextFestivalBonus.date)} · ${m.activeWorkers} ${t('workers', 'শ্রমিক')} × ${money(m.nextFestivalBonus.per_worker)}` : t('No upcoming bonus event', 'কোনো আসন্ন উৎসব নেই')} />
        <Kpi color="#4f46e5" label={t('Today', 'আজ')} value={<span style={{ fontSize: '1.1rem' }}>{toBongabdo(new Date()).text}</span>} sub={fmtDate(new Date())} />
      </div>
      <div className="flex-between mb-3">
        <div className="text-sm text-muted">{t('Lunar holidays (Eid, Ashura, Miladunnabi) are approximate — update once the government notifies the dates.', 'চাঁদ দেখার উপর নির্ভরশীল ছুটির তারিখ সরকারি ঘোষণার পর হালনাগাদ করুন।')}</div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fa-solid fa-plus" /> {t('Add event', 'ইভেন্ট যোগ')}</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{t('Dates', 'তারিখ')}</th><th>{t('Bangla date', 'বাংলা তারিখ')}</th><th>{t('Event', 'ইভেন্ট')}</th><th>{t('Type', 'ধরন')}</th><th>{t('Site impact', 'প্রভাব')}</th><th>{t('Bonus', 'ভাতা')}</th><th /></tr></thead>
            <tbody>
              {data.calendar.map((e: any) => {
                const past = String(e.end_date).slice(0, 10) < todayStr;
                return (
                  <tr key={e.id_calendar} style={past ? { opacity: 0.6 } : undefined}>
                    <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.start_date)}{String(e.end_date).slice(0, 10) !== String(e.start_date).slice(0, 10) && <> – {fmtDate(e.end_date)}</>}</td>
                    <td className="text-sm">{toBongabdo(e.start_date).text}</td>
                    <td><div className="fw-semibold">{bn && e.title_bn ? e.title_bn : e.title_en}</div>{e.notes && <div className="text-xs text-muted">{e.notes}</div>}</td>
                    <td className="text-sm">{EVENT_LABEL[e.event_type]}</td>
                    <td><span style={{ color: impactColor[e.work_impact], fontWeight: 700, fontSize: '0.8rem' }}>{e.work_impact.replace('_', ' ')}</span></td>
                    <td className="text-sm">{e.festival_bonus_due ? money(e.bonus_amount_per_worker_bdt) + t('/worker', '/জন') : '—'}</td>
                    <td><button className="btn btn-light btn-sm" aria-label="Delete event" onClick={() => confirm(`Remove "${e.title_en}"?`) && send('delete', `/bd-local/calendar/${e.id_calendar}`)}><i className="fa-solid fa-trash" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={t('Add calendar event', 'ক্যালেন্ডার ইভেন্ট যোগ')} onClose={() => setOpen(false)}
          footer={<><button className="btn btn-light" onClick={() => setOpen(false)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Title (English)', 'শিরোনাম (ইংরেজি)')} required><input className="form-control" value={form.title_en} onChange={e => set('title_en', e.target.value)} placeholder="Hartal called by …" /></Field>
            <Field label={t('Title (Bangla)', 'শিরোনাম (বাংলা)')}><input className="form-control" value={form.title_bn} onChange={e => set('title_bn', e.target.value)} /></Field>
            <Field label={t('Start', 'শুরু')} required hint={toBongabdo(form.start_date || new Date()).text}><input type="date" className="form-control" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
            <Field label={t('End', 'শেষ')}><input type="date" className="form-control" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} /></Field>
            <Field label={t('Type', 'ধরন')}><select className="form-select" value={form.event_type} onChange={e => set('event_type', e.target.value)}>{Object.entries(EVENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t('Site impact', 'প্রভাব')}><select className="form-select" value={form.work_impact} onChange={e => set('work_impact', e.target.value)}><option value="FULL_STOP">Full stop</option><option value="PARTIAL">Partial (½ day)</option><option value="NONE">None</option></select></Field>
          </div>
          <div className="flex gap-4 mb-3" style={{ flexWrap: 'wrap' }}>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.festival_bonus_due} onChange={e => set('festival_bonus_due', e.target.checked)} /> {t('Festival bonus due to workers', 'শ্রমিকদের উৎসব ভাতা প্রযোজ্য')}</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.applies_all_projects} onChange={e => set('applies_all_projects', e.target.checked)} /> {t('Applies to all projects', 'সব প্রকল্পে প্রযোজ্য')}</label>
          </div>
          {form.festival_bonus_due && <Field label={t('Bonus per worker (৳)', 'জনপ্রতি ভাতা (৳)')}><input type="number" min={0} className="form-control" value={form.bonus_amount_per_worker_bdt} onChange={e => set('bonus_amount_per_worker_bdt', e.target.value)} /></Field>}
          <Field label={t('Notes', 'মন্তব্য')}><textarea className="form-control" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. Holding tax
// ─────────────────────────────────────────────────────────────
function HoldingTab({ data, t, money, send }: TabProps) {
  const blank = { unit_number: '', owner_name: '', authority: 'DNCC', holding_no: '', ward_no: '', fiscal_year: data.fiscal_year, annual_valuation_bdt: '', tax_rate_percent: 12, rebate_percent: 0, remarks: '' };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await send('post', '/bd-local/holding-tax', form)) { setOpen(false); setForm(blank); } };
  const annual = num(form.annual_valuation_bdt) * num(form.tax_rate_percent) / 100 * (1 - num(form.rebate_percent) / 100);

  const toggleQuarter = (h: any, q: any) => {
    if (q.paid) {
      if (confirm(`Mark Q${q.q} of ${h.unit_number} as unpaid?`)) send('patch', `/bd-local/holding-tax/${h.id_holding_tax}/quarter`, { q: q.q, paid: false });
      return;
    }
    const receipt = prompt(`Receipt no. for ${h.unit_number} Q${q.q} (${money(q.amount)})`, '');
    if (receipt !== null) send('patch', `/bd-local/holding-tax/${h.id_holding_tax}/quarter`, { q: q.q, paid: true, receipt });
  };

  return (
    <>
      <div className="flex-between mb-4">
        <div className="text-sm text-muted">{t('Payable quarterly to the City Corporation. Click a quarter to record or undo a payment.', 'ত্রৈমাসিক কিস্তি — পরিশোধ রেকর্ড করতে কিস্তিতে ক্লিক করুন।')}</div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fa-solid fa-plus" /> {t('Add holding', 'হোল্ডিং যোগ')}</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{t('Unit', 'ফ্ল্যাট')}</th><th>{t('Owner', 'মালিক')}</th><th>{t('Holding no.', 'হোল্ডিং নং')}</th><th>FY</th><th className="text-right">{t('Annual valuation', 'বার্ষিক মূল্যায়ন')}</th><th className="text-right">{t('Annual tax', 'বার্ষিক কর')}</th><th>{t('Quarters', 'কিস্তি')}</th><th className="text-right">{t('Due', 'বকেয়া')}</th><th>{t('Status', 'অবস্থা')}</th></tr></thead>
            <tbody>
              {data.holding.length === 0 && <tr><td colSpan={9} className="text-center text-muted">{t('No holdings recorded.', 'কোনো হোল্ডিং নেই।')}</td></tr>}
              {data.holding.map((h: any) => (
                <tr key={h.id_holding_tax}>
                  <td className="fw-bold">{h.unit_number}</td>
                  <td>{h.owner_name}</td>
                  <td className="text-sm">{h.authority} · {h.holding_no}{h.ward_no && <div className="text-xs text-muted">Ward {h.ward_no}</div>}</td>
                  <td className="text-sm">{h.fiscal_year}</td>
                  <td className="text-right">{money(h.annual_valuation_bdt)}</td>
                  <td className="text-right bdt-amount">{money(h.annual_tax_bdt)}<div className="text-xs text-muted">{num(h.tax_rate_percent)}%{num(h.rebate_percent) ? ` − ${num(h.rebate_percent)}%` : ''}</div></td>
                  <td>
                    <div className="flex gap-2">
                      {(h.quarters_json || []).map((q: any) => (
                        <button key={q.q} onClick={() => toggleQuarter(h, q)} title={`${money(q.amount)}${q.receipt ? ` · ${q.receipt}` : ''}`}
                          style={{ border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700, background: q.paid ? '#dcfce7' : '#f1f5f9', color: q.paid ? '#166534' : '#64748b' }}>
                          Q{q.q}{q.paid && ' ✓'}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className={`text-right bdt-amount${num(h.due_bdt) > 0 ? ' text-danger' : ''}`}>{money(h.due_bdt)}</td>
                  <td>{statusBadge(h.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={t('Add holding tax record', 'হোল্ডিং ট্যাক্স যোগ')} onClose={() => setOpen(false)}
          footer={<><button className="btn btn-light" onClick={() => setOpen(false)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-3">
            <Field label={t('Unit', 'ফ্ল্যাট')} required><input className="form-control" value={form.unit_number} onChange={e => set('unit_number', e.target.value)} /></Field>
            <Field label={t('Owner', 'মালিক')} required><input className="form-control" value={form.owner_name} onChange={e => set('owner_name', e.target.value)} /></Field>
            <Field label={t('Authority', 'কর্তৃপক্ষ')}>
              <select className="form-select" value={form.authority} onChange={e => set('authority', e.target.value)}>
                {[['DNCC', 'Dhaka North City Corp.'], ['DSCC', 'Dhaka South City Corp.'], ['CCC', 'Chattogram City Corp.'], ['GCC', 'Gazipur City Corp.'], ['NCC', 'Narayanganj City Corp.'], ['KCC', 'Khulna City Corp.'], ['RCC', 'Rajshahi City Corp.'], ['SCC', 'Sylhet City Corp.'], ['POURASHAVA', 'Pourashava'], ['OTHER', 'Other']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label={t('Holding no.', 'হোল্ডিং নং')} required><input className="form-control" value={form.holding_no} onChange={e => set('holding_no', e.target.value)} /></Field>
            <Field label={t('Ward', 'ওয়ার্ড')}><input className="form-control" value={form.ward_no} onChange={e => set('ward_no', e.target.value)} /></Field>
            <Field label={t('Fiscal year', 'অর্থবছর')}><input className="form-control" value={form.fiscal_year} onChange={e => set('fiscal_year', e.target.value)} placeholder="2026-27" /></Field>
            <Field label={t('Annual valuation (৳)', 'বার্ষিক মূল্যায়ন (৳)')} required hint={t('Assessed annual rental value', 'নির্ধারিত বার্ষিক ভাড়ামূল্য')}><input type="number" min={1} className="form-control" value={form.annual_valuation_bdt} onChange={e => set('annual_valuation_bdt', e.target.value)} /></Field>
            <Field label={t('Combined rate %', 'মোট হার %')} hint={t('Holding + conservancy + lighting', 'হোল্ডিং + পরিচ্ছন্নতা + আলো')}><input type="number" step="0.5" min={0} className="form-control" value={form.tax_rate_percent} onChange={e => set('tax_rate_percent', e.target.value)} /></Field>
            <Field label={t('Rebate %', 'রেয়াত %')}><input type="number" step="0.5" min={0} max={100} className="form-control" value={form.rebate_percent} onChange={e => set('rebate_percent', e.target.value)} /></Field>
          </div>
          {annual > 0 && <div className="alert alert-info"><i className="fa-solid fa-circle-info" /> {t('Annual tax', 'বার্ষিক কর')} {money(Math.round(annual * 100) / 100)} · {t('per quarter', 'প্রতি কিস্তি')} {money(Math.round(annual / 4 * 100) / 100)}</div>}
        </Modal>
      )}
    </>
  );
}
