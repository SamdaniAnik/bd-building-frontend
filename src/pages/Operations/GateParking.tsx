import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate, isValidBdMobile } from '../../utils/bd';
import { Empty, Field, Modal, PageHeader, Stat, Tabs, UnitSelect, dateTime, inputDate, money, run, todayStr, useToast, useUnits, Notify, Unit } from './shared';

type Tab = 'visitors' | 'parking' | 'notices';

const PURPOSES: Record<string, [string, string, string]> = {
  GUEST: ['Guest', 'অতিথি', 'fa-solid fa-user-group'], DELIVERY: ['Delivery / courier', 'ডেলিভারি / কুরিয়ার', 'fa-solid fa-box'],
  RIDE_SHARE: ['Ride share (Pathao / Uber)', 'রাইড শেয়ার (পাঠাও / উবার)', 'fa-solid fa-motorcycle'], SERVICE: ['Service / repair', 'সার্ভিস / মেরামত', 'fa-solid fa-screwdriver-wrench'],
  OFFICIAL: ['Official', 'দাপ্তরিক', 'fa-solid fa-briefcase'], DOMESTIC_HELP: ['Domestic help', 'গৃহকর্মী', 'fa-solid fa-broom'], OTHER: ['Other', 'অন্যান্য', 'fa-solid fa-circle-question'],
};
const SLOT_TYPES: Record<string, [string, string]> = { CAR: ['Car', 'গাড়ি'], MOTORBIKE: ['Motorbike', 'মোটরসাইকেল'], BICYCLE: ['Bicycle', 'সাইকেল'], VISITOR: ['Visitor', 'অতিথি'] };
const SLOT_STATUS: Record<string, [string, string, string]> = { FREE: ['Free', 'খালি', 'badge-success'], ALLOCATED: ['Allocated', 'বরাদ্দ', 'badge-primary'], RESERVED: ['Reserved', 'সংরক্ষিত', 'badge-info'], BLOCKED: ['Blocked', 'বন্ধ', 'badge-gray'] };
const CATEGORIES: Record<string, [string, string, string]> = {
  GENERAL: ['General', 'সাধারণ', 'badge-gray'], MEETING: ['Meeting', 'সভা', 'badge-primary'], MAINTENANCE: ['Maintenance', 'রক্ষণাবেক্ষণ', 'badge-info'],
  UTILITY_OUTAGE: ['Utility outage', 'বিদ্যুৎ/পানি/গ্যাস বন্ধ', 'badge-warning'], PAYMENT: ['Payment', 'পেমেন্ট', 'badge-success'],
  SECURITY: ['Security', 'নিরাপত্তা', 'badge-danger'], EMERGENCY: ['Emergency', 'জরুরি', 'badge-danger'],
};

export default function GateParking() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('visitors');
  const { show, node } = useToast();
  const units = useUnits();
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-torii-gate" title={t('Gate, Parking & Notices', 'গেট, পার্কিং ও নোটিশ')}
        subtitle={t('Guard-desk visitor log, parking slot allocation per flat, and a notice board that can be sent to residents by SMS.', 'গার্ড ডেস্কের ভিজিটর খাতা, ফ্ল্যাটভিত্তিক পার্কিং বরাদ্দ, এবং বাসিন্দাদের এসএমএসে পাঠানো যায় এমন নোটিশ বোর্ড।')} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'visitors', label: t('Visitor log', 'ভিজিটর খাতা'), icon: 'fa-solid fa-person-walking-arrow-right' },
        { key: 'parking', label: t('Parking', 'পার্কিং'), icon: 'fa-solid fa-square-parking' },
        { key: 'notices', label: t('Notice board', 'নোটিশ বোর্ড'), icon: 'fa-solid fa-bullhorn' },
      ]} />
      {tab === 'visitors' && <VisitorsTab show={show} units={units} />}
      {tab === 'parking' && <ParkingTab show={show} units={units} />}
      {tab === 'notices' && <NoticesTab show={show} />}
    </div>
  );
}

const blankVisitor = { visitor_name: '', phone: '', purpose: 'GUEST', id_units: null as number | null, host_name: '', company: '', vehicle_no: '', people_count: 1, id_card_no: '', notes: '' };

function VisitorsTab({ show, units }: { show: Notify; units: Unit[] }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [f, setF] = useState({ ...blankVisitor });
  const [view, setView] = useState<'inside' | 'today' | 'all'>('inside');
  const [q, setQ] = useState('');
  const [d, setD] = useState<any>(null);
  const set = (k: string, v: any) => setF(x => ({ ...x, [k]: v }));
  const load = () => api.get('/ops/gate/visitors', { params: { inside: view === 'inside' ? 1 : undefined, date: view === 'today' ? todayStr() : undefined, q: q || undefined } })
    .then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { const h = setTimeout(load, 200); return () => clearTimeout(h); }, [view, q]);
  const checkIn = async () => { if (await run(show, api.post('/ops/gate/visitors', f))) { setF({ ...blankVisitor }); load(); } };
  const checkOut = async (id: number) => { if (await run(show, api.post(`/ops/gate/visitors/${id}/checkout`))) load(); };
  const phoneBad = f.phone && !isValidBdMobile(f.phone);

  return (
    <div className="grid ops-split">
      <div className="card"><div className="card-header"><div className="card-title"><i className="fa-solid fa-right-to-bracket text-success" /> {t('Check in', 'প্রবেশ')}</div></div>
        <div className="card-body">
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>{Object.entries(PURPOSES).map(([k, [en, bnL, icon]]) => (
            <button key={k} type="button" className={`btn btn-sm ${f.purpose === k ? 'btn-primary' : 'btn-light'}`} aria-pressed={f.purpose === k} onClick={() => set('purpose', k)}><i className={icon} /> {bn ? bnL : en}</button>
          ))}</div>
          <Field label={t('Visitor name', 'আগন্তুকের নাম')} required><input className="form-control" value={f.visitor_name} onChange={e => set('visitor_name', e.target.value)} /></Field>
          <Field label={t('Mobile', 'মোবাইল')} hint={phoneBad ? t('Use 01XXXXXXXXX', '01XXXXXXXXX লিখুন') : undefined}><input className="form-control" inputMode="tel" value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label={t('Visiting flat', 'যে ফ্ল্যাটে যাবেন')}><UnitSelect units={units} allowEmpty emptyLabel={t('— Common area / office —', '— কমন এরিয়া / অফিস —')} value={f.id_units} onChange={v => set('id_units', v)} /></Field>
          <div className="form-row cols-2">
            <Field label={t('Approved by (resident)', 'অনুমতি দিয়েছেন (বাসিন্দা)')}><input className="form-control" value={f.host_name} onChange={e => set('host_name', e.target.value)} /></Field>
            <Field label={t('People', 'জন')}><input type="number" min={1} className="form-control" value={f.people_count} onChange={e => set('people_count', e.target.value)} /></Field>
            {['DELIVERY', 'SERVICE', 'RIDE_SHARE', 'OFFICIAL'].includes(f.purpose) && <Field label={t('Company', 'প্রতিষ্ঠান')}><input className="form-control" placeholder="Foodpanda, Pathao, DESCO…" value={f.company} onChange={e => set('company', e.target.value)} /></Field>}
            <Field label={t('Vehicle no.', 'গাড়ির নম্বর')}><input className="form-control" placeholder="DHAKA METRO-GA 12-3456" value={f.vehicle_no} onChange={e => set('vehicle_no', e.target.value)} /></Field>
            <Field label={t('ID card no.', 'পরিচয়পত্র নং')}><input className="form-control" value={f.id_card_no} onChange={e => set('id_card_no', e.target.value)} /></Field>
          </div>
          <button className="btn btn-success" style={{ width: '100%' }} disabled={!f.visitor_name || !!phoneBad} onClick={checkIn}><i className="fa-solid fa-right-to-bracket" /> {t('Check in now', 'এখন প্রবেশ করান')}</button>
        </div></div>

      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="pill-tabs flex gap-2">
            {([['inside', t('Inside now', 'এখন ভেতরে'), d?.inside_now], ['today', t('Today', 'আজ'), d?.today], ['all', t('All', 'সব'), null]] as const).map(([k, label, n]) => (
              <button key={k} className={`btn btn-sm ${view === k ? 'btn-primary' : 'btn-light'}`} onClick={() => setView(k)}>{label}{n != null ? ` (${n})` : ''}</button>
            ))}
          </div>
          <input className="form-control" style={{ width: 220 }} placeholder={t('Search name, phone, vehicle, flat', 'নাম, ফোন, গাড়ি, ফ্ল্যাট')} value={q} onChange={e => setQ(e.target.value)} aria-label="Search visitors" />
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Visitor', 'আগন্তুক')}</th><th>{t('Purpose', 'উদ্দেশ্য')}</th><th>{t('Flat')}</th><th>{t('In', 'প্রবেশ')}</th><th>{t('Out', 'প্রস্থান')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={6} text={t('Loading…')} />}
            {d?.rows.length === 0 && <Empty cols={6} text={view === 'inside' ? t('Nobody is inside right now.', 'এখন কেউ ভেতরে নেই।') : t('No visitors.', 'কোনো আগন্তুক নেই।')} />}
            {d?.rows.map((r: any) => (
              <tr key={r.id_visitors}>
                <td><div className="fw-semibold">{r.visitor_name}{r.people_count > 1 ? ` +${r.people_count - 1}` : ''}</div><div className="text-xs text-muted">{[r.phone, r.company, r.vehicle_no].filter(Boolean).join(' · ')}</div></td>
                <td><i className={PURPOSES[r.purpose]?.[2]} /> {PURPOSES[r.purpose]?.[bn ? 1 : 0]}</td>
                <td>{r.unit_number || '—'}{r.host_name && <div className="text-xs text-muted">{t('ok by', 'অনুমতি')} {r.host_name}</div>}</td>
                <td>{dateTime(r.check_in)}<div className="text-xs text-muted">{r.guard_name}</div></td>
                <td>{r.check_out ? dateTime(r.check_out) : <span className="badge badge-warning">{t('Inside', 'ভেতরে')}</span>}</td>
                <td>{!r.check_out && <button className="btn btn-light btn-sm" onClick={() => checkOut(r.id_visitors)}><i className="fa-solid fa-right-from-bracket" /> {t('Check out', 'প্রস্থান')}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function ParkingTab({ show, units }: { show: Notify; units: Unit[] }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [bulk, setBulk] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const load = () => api.get('/ops/gate/parking').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const save = async () => { if (await run(show, api.post('/ops/gate/parking', form))) { setForm(null); load(); } };
  const saveBulk = async () => { if (await run(show, api.post('/ops/gate/parking/bulk', bulk))) { setBulk(null); load(); } };
  const remove = async (r: any) => { if (confirm(t(`Delete slot ${r.slot_code}?`, `${r.slot_code} স্লট মুছবেন?`)) && await run(show, api.delete(`/ops/gate/parking/${r.id_parking_slots}`))) load(); };
  const free = async (r: any) => { if (await run(show, api.post('/ops/gate/parking', { ...r, status: 'FREE' }), t('Slot freed', 'স্লট খালি করা হয়েছে'))) load(); };
  const rows = (d?.rows || []).filter((r: any) => !filter || r.status === filter);
  const s = d?.summary;

  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-square-parking" value={s?.total ?? '…'} label={t('Slots', 'স্লট')} />
        <Stat icon="fa-solid fa-car" value={s?.allocated ?? '…'} label={t('Allocated', 'বরাদ্দ')} tone="info" />
        <Stat icon="fa-solid fa-circle-check" value={s?.free ?? '…'} label={t('Free', 'খালি')} tone="success" />
        <Stat icon="fa-solid fa-sack-dollar" value={s ? money(s.monthly_fee_bdt) : '…'} label={t('Monthly parking fees', 'মাসিক পার্কিং ফি')} tone="warning" />
      </div>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <select className="form-select" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)} aria-label="Status filter">
            <option value="">{t('All slots', 'সব স্লট')}</option>{Object.entries(SLOT_STATUS).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}
          </select>
          <div className="flex gap-2">
            <button className="btn btn-light btn-sm" onClick={() => setBulk({ prefix: 'B1-', from: 1, to: 20, location: 'Basement-1', slot_type: 'CAR', monthly_fee_bdt: 0 })}><i className="fa-solid fa-layer-group" /> {t('Add many', 'একসাথে যোগ')}</button>
            <button className="btn btn-primary btn-sm" onClick={() => setForm({ slot_code: '', location: '', slot_type: 'CAR', id_units: null, vehicle_no: '', vehicle_model: '', monthly_fee_bdt: 0, status: 'FREE', notes: '' })}><i className="fa-solid fa-plus" /> {t('Add slot', 'স্লট যোগ')}</button>
          </div>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Slot', 'স্লট')}</th><th>{t('Location', 'অবস্থান')}</th><th>{t('Type', 'ধরন')}</th><th>{t('Flat')}</th><th>{t('Vehicle', 'যানবাহন')}</th><th className="text-right">{t('Fee / month', 'মাসিক ফি')}</th><th>{t('Status')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={8} text={t('Loading…')} />}
            {d && rows.length === 0 && <Empty cols={8} text={d.rows.length ? t('No slots match.', 'মেলে এমন স্লট নেই।') : t('No parking slots yet. Use "Add many" to create a numbered range.', 'এখনো পার্কিং স্লট নেই। "একসাথে যোগ" দিয়ে তৈরি করুন।')} />}
            {rows.map((r: any) => (
              <tr key={r.id_parking_slots}>
                <td className="fw-bold">{r.slot_code}</td><td>{r.location || '—'}</td><td>{SLOT_TYPES[r.slot_type]?.[bn ? 1 : 0]}</td>
                <td>{r.unit_number ? <>{r.unit_number}<div className="text-xs text-muted">{r.owner_name}</div></> : '—'}</td>
                <td>{r.vehicle_no || '—'}{r.vehicle_model && <div className="text-xs text-muted">{r.vehicle_model}</div>}</td>
                <td className="text-right">{Number(r.monthly_fee_bdt) > 0 ? money(r.monthly_fee_bdt) : '—'}</td>
                <td><span className={`badge ${SLOT_STATUS[r.status][2]}`}>{SLOT_STATUS[r.status][bn ? 1 : 0]}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-light btn-sm" onClick={() => setForm({ ...r, id_units: r.id_units || null, vehicle_no: r.vehicle_no || '', vehicle_model: r.vehicle_model || '', location: r.location || '', notes: r.notes || '', status: r.status === 'FREE' ? 'ALLOCATED' : r.status })}>{r.status === 'FREE' ? t('Allocate', 'বরাদ্দ') : t('Edit')}</button>{' '}
                  {r.status === 'ALLOCATED' && <><button className="btn btn-light btn-sm" onClick={() => free(r)}>{t('Free', 'খালি')}</button>{' '}</>}
                  <button className="btn btn-light btn-sm" aria-label="Delete slot" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {form && (
        <Modal title={form.id_parking_slots ? `${t('Slot', 'স্লট')} ${form.slot_code}` : t('New parking slot', 'নতুন পার্কিং স্লট')} onClose={() => setForm(null)} footer={<>
          <button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel')}</button>
          <button className="btn btn-primary" disabled={!form.slot_code || (form.status === 'ALLOCATED' && !form.id_units)} onClick={save}>{t('Save')}</button>
        </>}>
          <div className="form-row cols-2">
            <Field label={t('Slot code', 'স্লট কোড')} required><input className="form-control" value={form.slot_code} onChange={e => setForm({ ...form, slot_code: e.target.value })} /></Field>
            <Field label={t('Location', 'অবস্থান')}><input className="form-control" placeholder="Basement-1" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label={t('Type', 'ধরন')}><select className="form-select" value={form.slot_type} onChange={e => setForm({ ...form, slot_type: e.target.value })}>{Object.entries(SLOT_TYPES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}</select></Field>
            <Field label={t('Status')}><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(SLOT_STATUS).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}</select></Field>
            {form.status !== 'FREE' && form.status !== 'BLOCKED' && <>
              <Field label={t('Flat')} required={form.status === 'ALLOCATED'}><UnitSelect units={units} allowEmpty value={form.id_units} onChange={v => setForm({ ...form, id_units: v })} /></Field>
              <Field label={t('Vehicle no.', 'গাড়ির নম্বর')}><input className="form-control" placeholder="DHAKA METRO-GA 12-3456" value={form.vehicle_no} onChange={e => setForm({ ...form, vehicle_no: e.target.value })} /></Field>
              <Field label={t('Vehicle model', 'মডেল')}><input className="form-control" placeholder="Toyota Axio, white" value={form.vehicle_model} onChange={e => setForm({ ...form, vehicle_model: e.target.value })} /></Field>
            </>}
            <Field label={t('Monthly fee (৳)', 'মাসিক ফি (৳)')}><input type="number" min={0} className="form-control" value={form.monthly_fee_bdt} onChange={e => setForm({ ...form, monthly_fee_bdt: e.target.value })} /></Field>
          </div>
          <Field label={t('Notes', 'মন্তব্য')}><input className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        </Modal>
      )}
      {bulk && (
        <Modal title={t('Add a range of slots', 'একসাথে অনেক স্লট যোগ')} onClose={() => setBulk(null)} footer={<>
          <button className="btn btn-light" onClick={() => setBulk(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={saveBulk}>{t('Add', 'যোগ করুন')}</button>
        </>}>
          <div className="form-row cols-3">
            <Field label={t('Code prefix', 'কোডের শুরু')}><input className="form-control" value={bulk.prefix} onChange={e => setBulk({ ...bulk, prefix: e.target.value })} /></Field>
            <Field label={t('From', 'থেকে')}><input type="number" min={0} className="form-control" value={bulk.from} onChange={e => setBulk({ ...bulk, from: e.target.value })} /></Field>
            <Field label={t('To', 'পর্যন্ত')}><input type="number" min={0} className="form-control" value={bulk.to} onChange={e => setBulk({ ...bulk, to: e.target.value })} /></Field>
            <Field label={t('Location', 'অবস্থান')}><input className="form-control" value={bulk.location} onChange={e => setBulk({ ...bulk, location: e.target.value })} /></Field>
            <Field label={t('Type', 'ধরন')}><select className="form-select" value={bulk.slot_type} onChange={e => setBulk({ ...bulk, slot_type: e.target.value })}>{Object.entries(SLOT_TYPES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}</select></Field>
            <Field label={t('Monthly fee (৳)', 'মাসিক ফি (৳)')}><input type="number" min={0} className="form-control" value={bulk.monthly_fee_bdt} onChange={e => setBulk({ ...bulk, monthly_fee_bdt: e.target.value })} /></Field>
          </div>
          <div className="text-sm text-muted">{t('Example', 'উদাহরণ')}: {String(bulk.prefix).toUpperCase()}{String(bulk.from).padStart(String(bulk.to).length, '0')} … {String(bulk.prefix).toUpperCase()}{bulk.to}</div>
        </Modal>
      )}
    </>
  );
}

const blankNotice = { title_en: '', title_bn: '', body_en: '', body_bn: '', category: 'GENERAL', publish_date: todayStr(), expiry_date: '', is_pinned: false };

function NoticesTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [rows, setRows] = useState<any[] | null>(null);
  const [form, setForm] = useState<any>(null);
  const [cast, setCast] = useState<any>(null);
  const load = () => api.get('/ops/gate/notices').then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { load(); }, []);
  const save = async () => { if (await run(show, api.post('/ops/gate/notices', form))) { setForm(null); load(); } };
  const remove = async (r: any) => { if (confirm(t('Delete this notice?', 'এই নোটিশ মুছবেন?')) && await run(show, api.delete(`/ops/gate/notices/${r.id_notices}`))) load(); };
  const countRecipients = async (c: any) => {
    try { const r: any = await api.post(`/ops/gate/notices/${c.notice.id_notices}/recipients`, { audience: c.audience }); setCast({ ...c, count: r.count }); }
    catch (e: any) { show(false, e.message); }
  };
  const openCast = (n: any) => countRecipients({ notice: n, audience: 'OWNERS', language: 'bn', count: null });
  const broadcast = async () => {
    if (!confirm(t(`Send this notice by SMS to ${cast.count} numbers?`, `${cast.count}টি নম্বরে এসএমএস পাঠাবেন?`))) return;
    setCast({ ...cast, busy: true });
    if (await run(show, api.post(`/ops/gate/notices/${cast.notice.id_notices}/broadcast`, { audience: cast.audience, language: cast.language }))) { setCast(null); load(); }
    else setCast({ ...cast, busy: false });
  };
  const live = (r: any) => inputDate(r.publish_date) <= todayStr() && (!r.expiry_date || inputDate(r.expiry_date) >= todayStr());
  const smsText = (n: any, l: string) => `${l === 'bn' && n.title_bn ? n.title_bn : n.title_en}: ${(l === 'bn' && n.body_bn ? n.body_bn : n.body_en).replace(/\s+/g, ' ')}`;

  return (
    <div className="card">
      <div className="card-header flex-between"><div className="text-sm text-muted">{t('Live notices also appear in every owner’s portal.', 'চলমান নোটিশ প্রতিটি মালিকের পোর্টালেও দেখা যায়।')}</div>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...blankNotice, publish_date: todayStr() })}><i className="fa-solid fa-plus" /> {t('New notice', 'নতুন নোটিশ')}</button></div>
      <div className="card-body">
        {rows === null && <div className="text-muted">{t('Loading…')}</div>}
        {rows?.length === 0 && <div className="empty-state text-muted">{t('No notices yet.', 'এখনো কোনো নোটিশ নেই।')}</div>}
        {rows?.map(r => (
          <div key={r.id_notices} className="p-3 rounded mb-4" style={{ border: '1px solid var(--gray-200)', opacity: live(r) ? 1 : 0.6, borderLeft: r.is_pinned ? '4px solid var(--primary)' : undefined }}>
            <div className="flex-between" style={{ gap: 10, flexWrap: 'wrap' }}>
              <div>
                <span className={`badge ${CATEGORIES[r.category][2]}`}>{CATEGORIES[r.category][bn ? 1 : 0]}</span>{' '}
                {r.is_pinned && <span className="badge badge-primary"><i className="fa-solid fa-thumbtack" /> {t('Pinned', 'পিন করা')}</span>}{' '}
                {!live(r) && <span className="badge badge-gray">{inputDate(r.publish_date) > todayStr() ? t('Scheduled', 'নির্ধারিত') : t('Expired', 'মেয়াদ শেষ')}</span>}
                <div className="fw-bold mt-1" style={{ fontSize: '1rem' }}>{bn && r.title_bn ? r.title_bn : r.title_en}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-light btn-sm" onClick={() => openCast(r)}><i className="fa-solid fa-comment-sms" /> {t('Send SMS', 'এসএমএস পাঠান')}</button>
                <button className="btn btn-light btn-sm" onClick={() => setForm({ ...r, title_bn: r.title_bn || '', body_bn: r.body_bn || '', publish_date: inputDate(r.publish_date), expiry_date: inputDate(r.expiry_date), is_pinned: !!r.is_pinned })}>{t('Edit')}</button>
                <button className="btn btn-light btn-sm" aria-label="Delete notice" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
              </div>
            </div>
            <div className="text-sm mt-1" style={{ whiteSpace: 'pre-wrap' }}>{bn && r.body_bn ? r.body_bn : r.body_en}</div>
            <div className="text-xs text-muted mt-1">{fmtDate(r.publish_date)}{r.expiry_date ? ` → ${fmtDate(r.expiry_date)}` : ''} · {r.created_by}{r.sms_sent ? ` · ${t('SMS sent to', 'এসএমএস পাঠানো হয়েছে')} ${r.sms_sent}${r.sms_failed ? ` (${r.sms_failed} ${t('failed', 'ব্যর্থ')})` : ''}` : ''}</div>
          </div>
        ))}
      </div>
      {form && (
        <Modal title={form.id_notices ? t('Edit notice', 'নোটিশ সম্পাদনা') : t('New notice', 'নতুন নোটিশ')} onClose={() => setForm(null)} footer={<>
          <button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel')}</button>
          <button className="btn btn-primary" disabled={!form.title_en || !form.body_en} onClick={save}>{form.id_notices ? t('Save') : t('Publish', 'প্রকাশ')}</button>
        </>}>
          <div className="form-row cols-3">
            <Field label={t('Category', 'বিভাগ')}><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}</select></Field>
            <Field label={t('Show from', 'প্রকাশের তারিখ')}><input type="date" className="form-control" value={form.publish_date} onChange={e => setForm({ ...form, publish_date: e.target.value })} /></Field>
            <Field label={t('Show until', 'যতদিন দেখাবে')} hint={t('Optional', 'ঐচ্ছিক')}><input type="date" className="form-control" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></Field>
          </div>
          <div className="form-row cols-2">
            <Field label={t('Title (English)', 'শিরোনাম (ইংরেজি)')} required><input className="form-control" value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} /></Field>
            <Field label={t('Title (Bangla)', 'শিরোনাম (বাংলা)')}><input className="form-control" value={form.title_bn} onChange={e => setForm({ ...form, title_bn: e.target.value })} /></Field>
            <Field label={t('Message (English)', 'বার্তা (ইংরেজি)')} required><textarea className="form-control" rows={5} value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} /></Field>
            <Field label={t('Message (Bangla)', 'বার্তা (বাংলা)')}><textarea className="form-control" rows={5} value={form.body_bn} onChange={e => setForm({ ...form, body_bn: e.target.value })} /></Field>
          </div>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} /> {t('Pin to the top', 'উপরে পিন করুন')}</label>
        </Modal>
      )}
      {cast && (
        <Modal title={t('Send notice by SMS', 'নোটিশ এসএমএসে পাঠান')} onClose={() => setCast(null)} footer={<>
          <button className="btn btn-light" onClick={() => setCast(null)}>{t('Cancel')}</button>
          <button className="btn btn-primary" disabled={!cast.count || cast.busy} onClick={broadcast}><i className="fa-solid fa-paper-plane" /> {t('Send to', 'পাঠান')} {cast.count ?? '…'}</button>
        </>}>
          <div className="form-row cols-2">
            <Field label={t('Send to', 'যাদের পাঠাবেন')}><select className="form-select" value={cast.audience} onChange={e => countRecipients({ ...cast, audience: e.target.value, count: null })}>
              <option value="OWNERS">{t('Flat owners', 'ফ্ল্যাট মালিক')}</option><option value="TENANTS">{t('Tenants', 'ভাড়াটিয়া')}</option><option value="ALL">{t('Owners and tenants', 'মালিক ও ভাড়াটিয়া')}</option>
            </select></Field>
            <Field label={t('Language', 'ভাষা')}><select className="form-select" value={cast.language} onChange={e => setCast({ ...cast, language: e.target.value })}>
              <option value="bn">বাংলা</option><option value="en">English</option></select></Field>
          </div>
          <div className="p-3 rounded text-sm mb-1" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>{smsText(cast.notice, cast.language)}</div>
          <div className="text-xs text-muted">{t('One SMS per mobile number, duplicates removed. Bangla SMS fits 70 characters per part, so long notices cost several parts each.', 'প্রতি নম্বরে একটি এসএমএস, একই নম্বর বাদ। বাংলা এসএমএসে প্রতি অংশে ৭০ অক্ষর, তাই বড় নোটিশে একাধিক অংশ লাগে।')}</div>
        </Modal>
      )}
    </div>
  );
}
