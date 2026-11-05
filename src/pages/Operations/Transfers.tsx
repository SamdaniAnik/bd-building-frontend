import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate, isValidBdMobile, nidProblem } from '../../utils/bd';
import { Empty, Field, MethodSelect, Modal, PageHeader, Stat, Tabs, money, openReceipt, run, todayStr, useToast, Notify } from './shared';

// Flat & share transfer (ফ্ল্যাট / শেয়ার হস্তান্তর): application → clearance (অনাপত্তি সনদ) → ownership changed.

type Tab = 'transfers' | 'history';
export const TYPES: Record<string, [string, string, string, string]> = {
  SALE: ['Sale', 'বিক্রয়', 'fa-solid fa-handshake', 'The flat or a share is sold. Needs a registered sale deed (সাফ কবলা).'],
  GIFT: ['Gift (Heba)', 'হেবা (দান)', 'fa-solid fa-gift', 'Given to a relative by a registered gift deed (হেবা দলিল).'],
  INHERITANCE: ['Inheritance', 'উত্তরাধিকার', 'fa-solid fa-people-line', 'A deceased owner’s whole share passes to the heirs. Needs the succession certificate (ওয়ারিশ সনদ); enter each heir’s share as fixed by it.'],
  BOOKING: ['Booking transfer', 'বুকিং / বরাদ্দ হস্তান্তর', 'fa-solid fa-file-signature', 'An allotment sold on before the flat is registered. No deed yet — the developer’s transfer agreement.'],
  INTERNAL: ['Between co-owners', 'সহ-মালিকদের মধ্যে', 'fa-solid fa-right-left', 'Shares rearranged between people who already own this flat (e.g. correcting percentages).'],
};
const STATUS: Record<string, [string, string, string]> = {
  DRAFT: ['Application', 'আবেদন', 'badge-gray'], APPROVED: ['Cleared — awaiting deed', 'অনুমোদিত — দলিলের অপেক্ষায়', 'badge-info'],
  COMPLETED: ['Transferred', 'হস্তান্তরিত', 'badge-success'], CANCELLED: ['Cancelled', 'বাতিল', 'badge-gray'],
};
const pct = (n: any) => `${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
const openPrint = (id: number, doc: 'noc' | 'certificate') => window.open(`/print/transfer/${id}?doc=${doc}`, '_blank', 'noopener');

export default function Transfers() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('transfers');
  const { show, node } = useToast();
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-right-left" title={t('Flat & Share Transfer', 'ফ্ল্যাট ও শেয়ার হস্তান্তর')}
        subtitle={t('Sale, gift, inheritance or booking transfer of a whole flat or part of its ownership share — with dues clearance, transfer fee, clearance letter and the ownership history of every flat.', 'পুরো ফ্ল্যাট বা মালিকানার অংশ বিক্রয়, হেবা, উত্তরাধিকার বা বুকিং হস্তান্তর — বকেয়া যাচাই, হস্তান্তর ফি, অনাপত্তি সনদ ও প্রতিটি ফ্ল্যাটের মালিকানার ইতিহাসসহ।')} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'transfers', label: t('Transfers', 'হস্তান্তর'), icon: 'fa-solid fa-right-left' },
        { key: 'history', label: t('Ownership history', 'মালিকানার ইতিহাস'), icon: 'fa-solid fa-timeline' },
      ]} />
      {tab === 'transfers' ? <TransferList show={show} /> : <OwnershipHistory show={show} />}
    </div>
  );
}

// ── List ────────────────────────────────────────────────────────
function TransferList({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [lookup, setLookup] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<any>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const load = () => api.get('/ops/transfers', { params: { status: filter || undefined } }).then(setD).catch((e: any) => show(false, e.message));
  const loadLookup = () => api.get('/ops/transfers/lookup').then(setLookup).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, [filter]);
  useEffect(() => { loadLookup(); }, []);
  const s = d?.summary;
  const startNew = () => setForm({ id_units: null, transfer_type: 'SALE', application_date: todayStr(), consideration_bdt: '', from: [], to: [], transfer_fee_bdt: lookup?.default_fee_bdt || 0, fee_waived: false, move_instalments: true, move_rent_agreements: true, notes: '' });
  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-file-pen" value={s?.draft ?? '…'} label={t('Applications', 'আবেদন')} tone="info" />
        <Stat icon="fa-solid fa-stamp" value={s?.approved ?? '…'} label={t('Cleared, awaiting deed', 'অনুমোদিত, দলিলের অপেক্ষায়')} tone="warning" />
        <Stat icon="fa-solid fa-circle-check" value={s?.completed ?? '…'} label={t('Completed', 'সম্পন্ন')} tone="success" />
        <Stat icon="fa-solid fa-sack-dollar" value={s ? money(s.fees_bdt) : '…'} label={t('Transfer fees', 'হস্তান্তর ফি')} />
      </div>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <select className="form-select" style={{ width: 220 }} value={filter} onChange={e => setFilter(e.target.value)} aria-label={t('Status', 'অবস্থা')}>
            <option value="">{t('All transfers', 'সব হস্তান্তর')}</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}
          </select>
          <button className="btn btn-primary" disabled={!lookup} onClick={startNew}><i className="fa-solid fa-plus" /> {t('New transfer', 'নতুন হস্তান্তর')}</button>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('No.', 'নং')}</th><th>{t('Flat', 'ফ্ল্যাট')}</th><th>{t('Type', 'ধরন')}</th><th>{t('From', 'হস্তান্তরকারী')}</th><th>{t('To', 'গ্রহীতা')}</th><th>{t('Date', 'তারিখ')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={8} text={t('Loading…')} />}
            {d?.rows.length === 0 && <Empty cols={8} text={t('No transfers yet.', 'এখনো কোনো হস্তান্তর নেই।')} />}
            {d?.rows.map((r: any) => (
              <tr key={r.id_transfers}>
                <td className="fw-semibold" style={{ whiteSpace: 'nowrap' }}>{r.transfer_no}</td>
                <td>{r.unit_number}<div className="text-xs text-muted">{r.building_name}</div></td>
                <td className="text-sm"><i className={TYPES[r.transfer_type]?.[2]} /> {TYPES[r.transfer_type]?.[bn ? 1 : 0]}</td>
                <td className="text-sm">{r.from_names}</td>
                <td className="text-sm">{r.to_names}</td>
                <td className="text-sm">{fmtDate(r.effective_date || r.application_date)}</td>
                <td><span className={`badge ${STATUS[r.status]?.[2]}`}>{STATUS[r.status]?.[bn ? 1 : 0]}</span></td>
                <td><button className="btn btn-light btn-sm" onClick={() => setOpenId(r.id_transfers)}>{t('Open', 'খুলুন')} <i className="fa-solid fa-arrow-right" /></button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {form && lookup && <TransferForm initial={form} lookup={lookup} show={show} onClose={() => setForm(null)} onSaved={id => { setForm(null); load(); loadLookup(); setOpenId(id); }} />}
      {openId && <TransferDetail id={openId} show={show} onClose={() => { setOpenId(null); load(); loadLookup(); }}
        onEdit={tr => { setOpenId(null); setForm(toForm(tr)); }} />}
    </>
  );
}

// Detail → editable draft form.
const toForm = (tr: any) => ({
  id_transfers: tr.id_transfers, id_units: tr.id_units, transfer_type: tr.transfer_type, application_date: tr.application_date, consideration_bdt: Number(tr.consideration_bdt) || '',
  from: tr.from.map((p: any) => ({ id_owners: p.id_owners, percent: Number(p.percent) })),
  to: tr.to.map((p: any) => ({ mode: 'existing', id_owners: p.id_owners, percent: Number(p.percent), relation: p.relation || '' })),
  transfer_fee_bdt: Number(tr.transfer_fee_bdt) || 0, fee_waived: !!tr.fee_waived, move_instalments: !!tr.move_instalments, move_rent_agreements: !!tr.move_rent_agreements, notes: tr.notes || '',
  deed_no: tr.deed_no || '', deed_date: tr.deed_date || '', sub_registry_office: tr.sub_registry_office || '', succession_cert_no: tr.succession_cert_no || '', bank_release_ref: tr.bank_release_ref || '',
});

// ── Application form ────────────────────────────────────────────
const blankReceiver = () => ({ mode: 'new', id_owners: '', percent: '', relation: '', new_owner: { full_name: '', phone: '', nid_no: '', address: '' } });

function TransferForm({ initial, lookup, show, onClose, onSaved }: { initial: any; lookup: any; show: Notify; onClose: () => void; onSaved: (id: number) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [f, setF] = useState<any>(initial);
  const [dues, setDues] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const unit = lookup.units.find((u: any) => u.id_units === f.id_units);
  const owners: any[] = unit?.owners || [];
  const unitTotal = owners.reduce((s, o) => s + o.ownership_percentage, 0);
  const given = f.from.reduce((s: number, x: any) => s + (Number(x.percent) || 0), 0);
  const received = f.to.reduce((s: number, x: any) => s + (Number(x.percent) || 0), 0);
  const balanced = given > 0 && Math.abs(given - received) < 0.01;
  const wholeToOne = f.to.length === 1 && Math.abs(given - unitTotal) < 0.01;
  const sellerIds = f.from.map((x: any) => x.id_owners).join(',');

  useEffect(() => {
    if (!f.id_units) { setDues(null); return; }
    api.get(`/ops/transfers/dues/${f.id_units}`, { params: { from: sellerIds } }).then(setDues).catch(() => setDues(null));
  }, [f.id_units, sellerIds]);

  const pickUnit = (id: number) => {
    const u = lookup.units.find((x: any) => x.id_units === id);
    // Default: every current owner gives their whole share (a full flat transfer).
    setF((x: any) => ({ ...x, id_units: id, from: (u?.owners || []).map((o: any) => ({ id_owners: o.id_owners, percent: o.ownership_percentage })), to: x.to.length ? x.to : [blankReceiver()] }));
  };
  const setType = (type: string) => setF((x: any) => {
    const next = { ...x, transfer_type: type };
    if (type === 'INHERITANCE') next.from = x.from.slice(0, 1).map((p: any) => ({ ...p, percent: owners.find(o => o.id_owners === p.id_owners)?.ownership_percentage ?? p.percent }));
    if (type === 'INTERNAL') next.to = x.to.map((r: any) => ({ ...r, mode: 'existing' }));
    return next;
  });
  const toggleFrom = (o: any, on: boolean) => set('from', on ? (f.transfer_type === 'INHERITANCE' ? [{ id_owners: o.id_owners, percent: o.ownership_percentage }] : [...f.from, { id_owners: o.id_owners, percent: o.ownership_percentage }]) : f.from.filter((x: any) => x.id_owners !== o.id_owners));
  const setFromPct = (id: number, v: string) => set('from', f.from.map((x: any) => (x.id_owners === id ? { ...x, percent: v } : x)));
  const setTo = (i: number, patch: any) => set('to', f.to.map((r: any, j: number) => (j === i ? { ...r, ...patch } : r)));
  const setNew = (i: number, k: string, v: string) => setTo(i, { new_owner: { ...f.to[i].new_owner, [k]: v } });
  const splitEqually = () => { const n = f.to.length; if (!n) return; const each = Math.floor(given / n * 100) / 100; set('to', f.to.map((r: any, i: number) => ({ ...r, percent: i === n - 1 ? Math.round((given - each * (n - 1)) * 100) / 100 : each }))); };

  const toProblem = (r: any) => {
    if (r.mode === 'existing') return r.id_owners ? null : t('Choose the person', 'ব্যক্তি নির্বাচন করুন');
    if (!r.new_owner.full_name.trim()) return t('Name is required', 'নাম আবশ্যক');
    if (!isValidBdMobile(r.new_owner.phone)) return t('Mobile 01XXXXXXXXX', 'মোবাইল 01XXXXXXXXX');
    const nid = nidProblem(r.new_owner.nid_no); return nid ? (bn ? nid[1] : nid[0]) : null;
  };
  const ready = f.id_units && f.from.length && f.to.length && balanced && f.to.every((r: any) => !toProblem(r) && Number(r.percent) > 0);
  const save = async () => {
    setBusy(true);
    const body = { ...f, move_instalments: f.move_instalments && wholeToOne,
      to: f.to.map((r: any) => (r.mode === 'existing' ? { id_owners: r.id_owners, percent: r.percent, relation: r.relation } : { new_owner: r.new_owner, percent: r.percent, relation: r.relation })) };
    const r: any = await run(show, api.post('/ops/transfers', body));
    setBusy(false);
    if (r) onSaved(r.id);
  };
  const candidates = f.transfer_type === 'INTERNAL' ? lookup.owners.filter((o: any) => owners.some(x => x.id_owners === o.id_owners)) : lookup.owners;
  const groups = useMemo(() => lookup.units.reduce((g: any, u: any) => { (g[u.building_name || 'Other'] ||= []).push(u); return g; }, {}), [lookup]);

  return (
    <Modal wide title={f.id_transfers ? t('Edit transfer application', 'হস্তান্তর আবেদন সম্পাদনা') : t('New transfer application', 'নতুন হস্তান্তর আবেদন')} onClose={onClose}
      footer={<><span className={`badge ${balanced ? 'badge-success' : 'badge-warning'}`} style={{ marginRight: 'auto' }}>{t('Given', 'প্রদত্ত')} {pct(given)} · {t('received', 'গৃহীত')} {pct(received)}</span>
        <button className="btn btn-light" onClick={onClose}>{t('Cancel', 'বাতিল')}</button>
        <button className="btn btn-primary" disabled={!ready || busy} onClick={save}>{t('Save application', 'আবেদন সংরক্ষণ')}</button></>}>
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>{Object.entries(TYPES).map(([k, v]) => (
        <button key={k} type="button" className={`btn btn-sm ${f.transfer_type === k ? 'btn-primary' : 'btn-light'}`} aria-pressed={f.transfer_type === k} onClick={() => setType(k)}><i className={v[2]} /> {v[bn ? 1 : 0]}</button>
      ))}</div>
      <div className="alert alert-info mb-4 text-sm">{TYPES[f.transfer_type][3]}</div>

      <div className="form-row cols-3">
        <Field label={t('Flat', 'ফ্ল্যাট')} required><select className="form-select" value={f.id_units || ''} disabled={!!f.id_transfers} onChange={e => pickUnit(Number(e.target.value))}>
          <option value="" disabled>{t('— Choose flat —', '— ফ্ল্যাট নির্বাচন —')}</option>
          {Object.entries(groups).map(([g, list]: any) => <optgroup key={g} label={g}>{list.map((u: any) => <option key={u.id_units} value={u.id_units}>{u.unit_number}{u.owners.length ? ` — ${u.owners.map((o: any) => o.full_name).join(', ')}` : ` — ${t('no owner', 'মালিক নেই')}`}</option>)}</optgroup>)}
        </select></Field>
        <Field label={t('Application date', 'আবেদনের তারিখ')}><input type="date" className="form-control" max={todayStr()} value={f.application_date} onChange={e => set('application_date', e.target.value)} /></Field>
        {['SALE', 'BOOKING'].includes(f.transfer_type) && <Field label={t('Sale price (৳)', 'বিক্রয়মূল্য (৳)')}><input type="number" min={0} className="form-control" value={f.consideration_bdt} onChange={e => set('consideration_bdt', e.target.value)} /></Field>}
      </div>

      {unit && <>
        <div className="section-heading">{f.transfer_type === 'INHERITANCE' ? t('Deceased owner', 'মৃত মালিক') : t('Who transfers (from)', 'হস্তান্তরকারী')}</div>
        {owners.length === 0 && <div className="alert alert-warning">{t('This flat has no owner on record, so there is nothing to transfer.', 'এই ফ্ল্যাটে কোনো মালিক নেই।')}</div>}
        <table className="mb-4"><tbody>{owners.map(o => {
          const row = f.from.find((x: any) => x.id_owners === o.id_owners);
          return (
            <tr key={o.id_owners}>
              <td style={{ width: 36 }}><input type={f.transfer_type === 'INHERITANCE' ? 'radio' : 'checkbox'} name="from" aria-label={o.full_name} checked={!!row} onChange={e => toggleFrom(o, e.target.checked)} /></td>
              <td>{o.full_name}<div className="text-xs text-muted">{t('owns', 'মালিকানা')} {pct(o.ownership_percentage)}</div></td>
              <td style={{ width: 200 }}>{row && <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <input type="number" min={0.01} max={o.ownership_percentage} step="0.01" className="form-control" aria-label={t('Share given (%)', 'প্রদত্ত অংশ (%)')} disabled={f.transfer_type === 'INHERITANCE'} value={row.percent} onChange={e => setFromPct(o.id_owners, e.target.value)} /> %</div>}</td>
              <td className="text-xs text-muted">{row && (Number(row.percent) >= o.ownership_percentage ? t('whole share', 'সম্পূর্ণ অংশ') : t(`keeps ${pct(o.ownership_percentage - Number(row.percent))}`, `থাকবে ${pct(o.ownership_percentage - Number(row.percent))}`))}</td>
            </tr>
          );
        })}</tbody></table>

        <div className="flex-between"><div className="section-heading">{f.transfer_type === 'INHERITANCE' ? t('Heirs (to)', 'ওয়ারিশগণ') : t('Who receives (to)', 'গ্রহীতা')}</div>
          <div className="flex gap-2">{f.to.length > 1 && <button className="btn btn-light btn-sm" onClick={splitEqually}>{t('Split equally', 'সমান ভাগ')}</button>}
            <button className="btn btn-light btn-sm" onClick={() => set('to', [...f.to, f.transfer_type === 'INTERNAL' ? { ...blankReceiver(), mode: 'existing' } : blankReceiver()])}><i className="fa-solid fa-user-plus" /> {t('Add person', 'ব্যক্তি যোগ')}</button></div></div>
        {f.transfer_type === 'INHERITANCE' && <div className="form-text mb-1">{t('Enter each heir’s share exactly as the succession certificate / Faraiz calculation fixes it — the system does not calculate inheritance shares.', 'ওয়ারিশ সনদ / ফারায়েজ অনুযায়ী প্রত্যেক ওয়ারিশের অংশ লিখুন — সিস্টেম নিজে উত্তরাধিকারের অংশ হিসাব করে না।')}</div>}
        {f.to.map((r: any, i: number) => {
          const problem = toProblem(r);
          return (
            <div key={i} className="p-3 rounded mb-1" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
                {f.transfer_type !== 'INTERNAL' && <select className="form-select" style={{ width: 170 }} aria-label={t('Person', 'ব্যক্তি')} value={r.mode} onChange={e => setTo(i, { mode: e.target.value })}>
                  <option value="new">{t('New person', 'নতুন ব্যক্তি')}</option><option value="existing">{t('Already on file', 'আগে থেকে আছেন')}</option></select>}
                {r.mode === 'existing'
                  ? <select className="form-select" style={{ flex: 1, minWidth: 220 }} aria-label={t('Person', 'ব্যক্তি')} value={r.id_owners} onChange={e => setTo(i, { id_owners: Number(e.target.value) })}>
                    <option value="">{t('— Choose —', '— নির্বাচন —')}</option>
                    {candidates.filter((o: any) => !f.from.some((x: any) => x.id_owners === o.id_owners)).map((o: any) => <option key={o.id_owners} value={o.id_owners}>{o.full_name} · {o.phone}</option>)}</select>
                  : <>
                    <input className="form-control" style={{ flex: 2, minWidth: 180 }} placeholder={t('Full name (as on NID)', 'পূর্ণ নাম (এনআইডি অনুযায়ী)')} aria-label={t('Full name', 'পূর্ণ নাম')} value={r.new_owner.full_name} onChange={e => setNew(i, 'full_name', e.target.value)} />
                    <input className="form-control" style={{ width: 150 }} inputMode="tel" placeholder="01XXXXXXXXX" aria-label={t('Mobile', 'মোবাইল')} value={r.new_owner.phone} onChange={e => setNew(i, 'phone', e.target.value)} />
                    <input className="form-control" style={{ width: 170 }} inputMode="numeric" placeholder={t('NID no.', 'এনআইডি নং')} aria-label={t('NID no.', 'এনআইডি নং')} value={r.new_owner.nid_no} onChange={e => setNew(i, 'nid_no', e.target.value)} />
                  </>}
                {f.transfer_type === 'INHERITANCE' && <input className="form-control" style={{ width: 120 }} placeholder={t('Relation', 'সম্পর্ক')} aria-label={t('Relation', 'সম্পর্ক')} value={r.relation} onChange={e => setTo(i, { relation: e.target.value })} />}
                <div className="flex gap-2" style={{ alignItems: 'center' }}><input type="number" min={0.01} step="0.01" className="form-control" style={{ width: 100 }} aria-label={t('Share (%)', 'অংশ (%)')} value={r.percent} onChange={e => setTo(i, { percent: e.target.value })} /> %</div>
                <button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => set('to', f.to.filter((_: any, j: number) => j !== i))}><i className="fa-solid fa-xmark" /></button>
              </div>
              {r.mode === 'new' && <input className="form-control mt-1" placeholder={t('Address', 'ঠিকানা')} aria-label={t('Address', 'ঠিকানা')} value={r.new_owner.address} onChange={e => setNew(i, 'address', e.target.value)} />}
              {problem && <div className="text-xs text-warning mt-1">{problem}</div>}
            </div>
          );
        })}
        {!balanced && given > 0 && <div className="text-sm text-warning mt-1">{t(`Shares must balance: ${pct(given)} is given, ${pct(received)} is received.`, `অংশ মিলতে হবে: প্রদত্ত ${pct(given)}, গৃহীত ${pct(received)}।`)}</div>}

        {dues && <div className={`alert ${dues.blocking_total_bdt > 0 || dues.loans.length ? 'alert-warning' : 'alert-success'} mt-4`}>
          <div className="fw-semibold mb-1"><i className="fa-solid fa-scale-balanced" /> {t('Dues clearance check', 'বকেয়া যাচাই')}</div>
          {dues.items.length === 0 && dues.loans.length === 0 && <div className="text-sm">{t('Nothing outstanding on this flat.', 'এই ফ্ল্যাটে কোনো বকেয়া নেই।')}</div>}
          {dues.items.map((x: any, i: number) => <div key={i} className="text-sm flex-between"><span>{bn ? x.label_bn : x.label}{x.due_date ? ` · ${fmtDate(x.due_date)}` : ''}</span><span>{money(x.amount_bdt)}</span></div>)}
          {dues.loans.map((l: any) => <div key={l.id_loans} className="text-sm"><i className="fa-solid fa-building-columns" /> {t(`Mortgaged to ${l.bank_lender_name} — ${money(l.outstanding_amount)} outstanding. The bank's release letter is needed.`, `${l.bank_lender_name}-এর কাছে বন্ধক — বকেয়া ${money(l.outstanding_amount)}। ব্যাংকের অবমুক্তি পত্র লাগবে।`)}</div>)}
        </div>}
      </>}

      <div className="form-row cols-3 mt-4">
        <Field label={t('Transfer fee (৳)', 'হস্তান্তর ফি (৳)')}><input type="number" min={0} className="form-control" disabled={f.fee_waived} value={f.transfer_fee_bdt} onChange={e => set('transfer_fee_bdt', e.target.value)} /></Field>
        <div className="form-group" style={{ alignSelf: 'end' }}><label className="flex gap-2 text-sm"><input type="checkbox" checked={f.fee_waived} onChange={e => set('fee_waived', e.target.checked)} /> {t('Waive the fee', 'ফি মওকুফ')}</label></div>
      </div>
      <label className="flex gap-2 text-sm mb-1" title={wholeToOne ? '' : t('Only when one person takes over the whole flat', 'শুধু একজন পুরো ফ্ল্যাট নিলে')}>
        <input type="checkbox" disabled={!wholeToOne} checked={f.move_instalments && wholeToOne} onChange={e => set('move_instalments', e.target.checked)} />
        {t('Unpaid instalments move to the new owner', 'অপরিশোধিত কিস্তি নতুন মালিকের নামে যাবে')}{!wholeToOne && <span className="text-muted"> — {t('only when one person takes the whole flat', 'শুধু একজন পুরো ফ্ল্যাট নিলে')}</span>}</label>
      <label className="flex gap-2 text-sm mb-4"><input type="checkbox" checked={f.move_rent_agreements} onChange={e => set('move_rent_agreements', e.target.checked)} /> {t('Rent agreements name the new owner as landlord', 'ভাড়া চুক্তিতে নতুন মালিক বাড়িওয়ালা হবেন')}</label>
      <Field label={t('Notes', 'নোট')}><textarea className="form-control" rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} /></Field>
    </Modal>
  );
}

// ── Detail & workflow ───────────────────────────────────────────
function TransferDetail({ id, show, onClose, onEdit }: { id: number; show: Notify; onClose: () => void; onEdit: (tr: any) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [step, setStep] = useState<null | 'fee' | 'approve' | 'complete' | 'cancel'>(null);
  const [f, setF] = useState<any>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const load = () => api.get(`/ops/transfers/${id}`).then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, [id]);
  if (!d) return null;
  const tr = d.transfer;
  const dues = d.dues;
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const open = (s: any, init: any = {}) => { setF(init); setStep(s); };
  const post = async (path: string, body: any) => {
    const r: any = await run(show, api.post(`/ops/transfers/${id}/${path}`, body));
    if (r) { setStep(null); setWarnings(r.warnings || []); load(); }
  };
  const del = async () => { if (confirm(t('Delete this draft?', 'খসড়াটি মুছবেন?')) && await run(show, api.delete(`/ops/transfers/${id}`))) onClose(); };
  const feeDue = !tr.fee_waived && Number(tr.transfer_fee_bdt) > 0;
  const blocking = dues?.blocking_total_bdt > 0;
  const deedNeeded = ['SALE', 'GIFT'].includes(tr.transfer_type);

  return (
    <Modal wide title={<>{tr.transfer_no} · {tr.unit?.unit_number} <span className={`badge ${STATUS[tr.status]?.[2]}`}>{STATUS[tr.status]?.[bn ? 1 : 0]}</span></>} onClose={onClose}
      footer={<div className="flex gap-2" style={{ flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
        {tr.status === 'DRAFT' && <button className="btn btn-light" onClick={() => onEdit(tr)}><i className="fa-solid fa-pen" /> {t('Edit', 'সম্পাদনা')}</button>}
        {tr.status === 'DRAFT' && !tr.id_receipts && <button className="btn btn-light" onClick={del}><i className="fa-solid fa-trash" /></button>}
        {['DRAFT', 'APPROVED'].includes(tr.status) && <button className="btn btn-light" onClick={() => open('cancel', { reason: '' })}>{t('Cancel transfer', 'বাতিল')}</button>}
        {['DRAFT', 'APPROVED'].includes(tr.status) && feeDue && !tr.id_receipts && <button className="btn btn-warning" onClick={() => open('fee', { payment_method: 'CASH', payment_ref: '', paid_by: tr.to[0]?.id_owners, send_sms: false })}><i className="fa-solid fa-receipt" /> {t('Receive fee', 'ফি গ্রহণ')} {money(tr.transfer_fee_bdt)}</button>}
        {tr.status === 'DRAFT' && <button className="btn btn-primary" onClick={() => open('approve', { dues_override_reason: '', bank_release_ref: tr.bank_release_ref || '', succession_cert_no: tr.succession_cert_no || '' })}><i className="fa-solid fa-stamp" /> {t('Approve & clear', 'অনুমোদন')}</button>}
        {['APPROVED', 'COMPLETED'].includes(tr.status) && <button className="btn btn-light" onClick={() => openPrint(tr.id_transfers, 'noc')}><i className="fa-solid fa-print" /> {t('Clearance letter', 'অনাপত্তি সনদ')}</button>}
        {tr.status === 'APPROVED' && <button className="btn btn-success" onClick={() => open('complete', { deed_no: tr.deed_no || '', deed_date: tr.deed_date || '', sub_registry_office: tr.sub_registry_office || '', deed_value_bdt: tr.deed_value_bdt || '', effective_date: tr.deed_date || todayStr(), send_sms: true })}><i className="fa-solid fa-circle-check" /> {t('Complete transfer', 'হস্তান্তর সম্পন্ন')}</button>}
        {tr.status === 'COMPLETED' && <button className="btn btn-primary" onClick={() => openPrint(tr.id_transfers, 'certificate')}><i className="fa-solid fa-certificate" /> {t('Transfer certificate', 'হস্তান্তর সনদ')}</button>}
      </div>}>
      {warnings.map((w, i) => <div key={i} className="alert alert-warning mb-1"><i className="fa-solid fa-triangle-exclamation" /> {w}</div>)}
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className="text-sm"><i className={TYPES[tr.transfer_type]?.[2]} /> <strong>{TYPES[tr.transfer_type]?.[bn ? 1 : 0]}</strong> · {tr.unit?.building_name} · {t('applied', 'আবেদন')} {fmtDate(tr.application_date)}</div>
          {Number(tr.consideration_bdt) > 0 && <div className="text-sm">{t('Sale price', 'বিক্রয়মূল্য')}: <strong>{money(tr.consideration_bdt)}</strong></div>}
          <table className="mt-4"><thead><tr><th>{t('Party', 'পক্ষ')}</th><th className="text-right">{t('Share', 'অংশ')}</th>{tr.status === 'COMPLETED' && <th className="text-right">{t('Before → after', 'আগে → পরে')}</th>}</tr></thead><tbody>
            {[...tr.from, ...tr.to].map((p: any) => (
              <tr key={p.id}>
                <td><span className={`badge ${p.side === 'FROM' ? 'badge-warning' : 'badge-success'}`}>{p.side === 'FROM' ? t('From', 'হস্তান্তরকারী') : t('To', 'গ্রহীতা')}</span> {p.full_name}{p.relation ? ` (${p.relation})` : ''}
                  <div className="text-xs text-muted">{[p.phone, p.identification_reference && `NID ${p.identification_reference}`].filter(Boolean).join(' · ')}</div></td>
                <td className="text-right fw-semibold">{p.side === 'FROM' ? '−' : '+'}{pct(p.percent)}</td>
                {tr.status === 'COMPLETED' && <td className="text-right text-sm">{pct(p.before_percent)} → {pct(p.after_percent)}</td>}
              </tr>
            ))}
          </tbody></table>
          {tr.status !== 'COMPLETED' && <div className="text-xs text-muted mt-1">{t('Current owners', 'বর্তমান মালিক')}: {d.current_owners.map((o: any) => `${o.full_name} ${pct(o.ownership_percentage)}`).join(', ')}</div>}
        </div>
        <div>
          <div className="section-heading">{t('Clearance', 'ছাড়পত্র')}</div>
          <div className="text-sm mb-1">{t('Transfer fee', 'হস্তান্তর ফি')}: {tr.fee_waived ? <span className="badge badge-gray">{t('Waived', 'মওকুফ')}</span> : !feeDue ? '—'
            : d.receipt ? <><span className="badge badge-success">{money(d.receipt.total_bdt)} {t('received', 'গৃহীত')}</span> <button className="btn btn-light btn-sm" onClick={() => openReceipt(d.receipt.id_receipts)}>{d.receipt.receipt_no}</button></>
              : <span className="badge badge-warning">{money(tr.transfer_fee_bdt)} {t('not received', 'বাকি')}</span>}</div>
          {dues && <>
            <div className="text-sm">{tr.status === 'DRAFT' ? t('Outstanding now', 'বর্তমান বকেয়া') : t(`Outstanding at approval (${fmtDate(dues.checked_on)})`, `অনুমোদনের সময় বকেয়া (${fmtDate(dues.checked_on)})`)}: <strong>{money(dues.blocking_total_bdt)}</strong></div>
            {dues.items.map((x: any, i: number) => <div key={i} className="text-xs flex-between"><span>{bn ? x.label_bn : x.label}</span><span>{money(x.amount_bdt)}</span></div>)}
            {dues.loans?.map((l: any) => <div key={l.id_loans} className="text-xs text-warning"><i className="fa-solid fa-building-columns" /> {l.bank_lender_name}: {money(l.outstanding_amount)}</div>)}
          </>}
          {tr.dues_override_reason && <div className="text-xs mt-1"><strong>{t('Approved with dues', 'বকেয়াসহ অনুমোদিত')}:</strong> {tr.dues_override_reason}</div>}
          {tr.bank_release_ref && <div className="text-xs">{t('Bank release', 'ব্যাংক অবমুক্তি')}: {tr.bank_release_ref}</div>}
          {tr.succession_cert_no && <div className="text-xs">{t('Succession certificate', 'ওয়ারিশ সনদ')}: {tr.succession_cert_no}</div>}
          {tr.approved_by && <div className="text-xs text-muted">{t('Approved by', 'অনুমোদনকারী')} {tr.approved_by} · {fmtDate(tr.approved_at)}</div>}
          {(tr.deed_no || tr.status === 'COMPLETED') && <>
            <div className="section-heading mt-4">{t('Registration', 'রেজিস্ট্রেশন')}</div>
            <div className="text-sm">{t('Deed', 'দলিল')} {tr.deed_no || '—'} · {fmtDate(tr.deed_date)}{tr.sub_registry_office ? ` · ${tr.sub_registry_office}` : ''}</div>
            {tr.status === 'COMPLETED' && <div className="text-sm">{t('Effective', 'কার্যকর')} <strong>{fmtDate(tr.effective_date)}</strong> · {tr.completed_by}</div>}
          </>}
          {tr.cancel_reason && <div className="alert alert-info mt-4 text-sm">{t('Cancelled', 'বাতিল')}: {tr.cancel_reason}</div>}
        </div>
      </div>

      {step === 'fee' && <div className="card mt-4"><div className="card-body">
        <div className="form-row cols-3">
          <Field label={t('Paid by', 'পরিশোধকারী')}><select className="form-select" value={f.paid_by} onChange={e => set('paid_by', Number(e.target.value))}>{[...tr.to, ...tr.from].map((p: any) => <option key={p.id} value={p.id_owners}>{p.full_name}</option>)}</select></Field>
          <Field label={t('Method', 'মাধ্যম')}><MethodSelect value={f.payment_method} onChange={v => set('payment_method', v)} /></Field>
          <Field label={t('Transaction / cheque no.', 'ট্রানজেকশন / চেক নং')}><input className="form-control" value={f.payment_ref} onChange={e => set('payment_ref', e.target.value)} /></Field>
        </div>
        <label className="flex gap-2 text-sm mb-1"><input type="checkbox" checked={f.send_sms} onChange={e => set('send_sms', e.target.checked)} /> {t('Send "payment received" SMS', '"পেমেন্ট গৃহীত" এসএমএস')}</label>
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}><button className="btn btn-light" onClick={() => setStep(null)}>{t('Back', 'ফিরে যান')}</button><button className="btn btn-warning" onClick={() => post('fee', f)}>{t('Issue money receipt', 'মানি রিসিট দিন')}</button></div>
      </div></div>}

      {step === 'approve' && <div className="card mt-4"><div className="card-body">
        {blocking && <Field label={t('Reason to approve with dues outstanding', 'বকেয়াসহ অনুমোদনের কারণ')} required hint={t('e.g. "Buyer takes over the holding tax", or collect the dues first', 'যেমন: "ক্রেতা হোল্ডিং ট্যাক্স পরিশোধ করবেন"; নয়তো আগে বকেয়া আদায় করুন')}>
          <input className="form-control" value={f.dues_override_reason} onChange={e => set('dues_override_reason', e.target.value)} /></Field>}
        {dues?.loans?.length > 0 && <Field label={t('Bank release / NOC reference', 'ব্যাংক অবমুক্তি / এনওসি নং')} required><input className="form-control" value={f.bank_release_ref} onChange={e => set('bank_release_ref', e.target.value)} /></Field>}
        {tr.transfer_type === 'INHERITANCE' && <Field label={t('Succession certificate no. (ওয়ারিশ সনদ)', 'ওয়ারিশ সনদ নং')} required><input className="form-control" value={f.succession_cert_no} onChange={e => set('succession_cert_no', e.target.value)} /></Field>}
        <div className="text-sm text-muted mb-1">{t('Approving issues the clearance letter (অনাপত্তি সনদ) and records the dues as they stand today. The ownership register changes only when the transfer is completed.', 'অনুমোদনে অনাপত্তি সনদ দেওয়া হয় এবং আজকের বকেয়া রেকর্ড হয়। হস্তান্তর সম্পন্ন হলেই মালিকানা পরিবর্তন হবে।')}</div>
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}><button className="btn btn-light" onClick={() => setStep(null)}>{t('Back', 'ফিরে যান')}</button><button className="btn btn-primary" onClick={() => post('approve', f)}><i className="fa-solid fa-stamp" /> {t('Approve', 'অনুমোদন')}</button></div>
      </div></div>}

      {step === 'complete' && <div className="card mt-4"><div className="card-body">
        <div className="form-row cols-3">
          <Field label={t('Deed no.', 'দলিল নং')} required={deedNeeded}><input className="form-control" value={f.deed_no} onChange={e => set('deed_no', e.target.value)} /></Field>
          <Field label={t('Deed date', 'দলিলের তারিখ')} required={deedNeeded}><input type="date" className="form-control" max={todayStr()} value={f.deed_date} onChange={e => setF((x: any) => ({ ...x, deed_date: e.target.value, effective_date: e.target.value || x.effective_date }))} /></Field>
          <Field label={t('Sub-registry office', 'সাব-রেজিস্ট্রি অফিস')}><input className="form-control" value={f.sub_registry_office} onChange={e => set('sub_registry_office', e.target.value)} /></Field>
          <Field label={t('Deed value (৳)', 'দলিলমূল্য (৳)')}><input type="number" min={0} className="form-control" value={f.deed_value_bdt} onChange={e => set('deed_value_bdt', e.target.value)} /></Field>
          <Field label={t('Ownership changes on', 'মালিকানা পরিবর্তনের তারিখ')}><input type="date" className="form-control" max={todayStr()} value={f.effective_date} onChange={e => set('effective_date', e.target.value)} /></Field>
        </div>
        <label className="flex gap-2 text-sm mb-1"><input type="checkbox" checked={f.send_sms} onChange={e => set('send_sms', e.target.checked)} /> {t('Text both sides that the transfer is done', 'উভয় পক্ষকে এসএমএস পাঠান')}</label>
        <div className="alert alert-warning text-sm">{t('This changes the ownership register. It cannot be undone — a mistake needs a new transfer back.', 'এতে মালিকানা রেজিস্টার পরিবর্তন হবে। ফেরানো যাবে না — ভুল হলে নতুন হস্তান্তর করতে হবে।')}</div>
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}><button className="btn btn-light" onClick={() => setStep(null)}>{t('Back', 'ফিরে যান')}</button><button className="btn btn-success" disabled={deedNeeded && (!f.deed_no || !f.deed_date)} onClick={() => post('complete', f)}><i className="fa-solid fa-circle-check" /> {t('Complete transfer', 'হস্তান্তর সম্পন্ন')}</button></div>
      </div></div>}

      {step === 'cancel' && <div className="card mt-4"><div className="card-body">
        <Field label={t('Reason', 'কারণ')} required><input className="form-control" value={f.reason} onChange={e => set('reason', e.target.value)} /></Field>
        {tr.id_receipts && <div className="text-sm text-warning mb-1">{t('A transfer fee was received — refund it separately if needed.', 'হস্তান্তর ফি নেওয়া হয়েছে — প্রয়োজনে আলাদাভাবে ফেরত দিন।')}</div>}
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}><button className="btn btn-light" onClick={() => setStep(null)}>{t('Back', 'ফিরে যান')}</button><button className="btn btn-danger" disabled={!f.reason.trim()} onClick={() => post('cancel', f)}>{t('Cancel transfer', 'বাতিল করুন')}</button></div>
      </div></div>}
    </Modal>
  );
}

// ── Ownership history (chain of title) ─────────────────────────
function OwnershipHistory({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [units, setUnits] = useState<any[]>([]);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/ops/transfers/lookup').then((r: any) => setUnits(r.units)).catch((e: any) => show(false, e.message)); }, []);
  useEffect(() => { if (unitId) { setD(null); api.get(`/ops/transfers/history/${unitId}`).then(setD).catch((e: any) => show(false, e.message)); } }, [unitId]);
  return (
    <>
      <div className="card mb-4"><div className="card-body"><div className="form-row cols-3">
        <Field label={t('Flat', 'ফ্ল্যাট')}><select className="form-select" value={unitId || ''} onChange={e => setUnitId(Number(e.target.value) || null)}>
          <option value="">{t('— Choose flat —', '— ফ্ল্যাট নির্বাচন —')}</option>{units.map(u => <option key={u.id_units} value={u.id_units}>{u.building_name ? `${u.building_name} · ` : ''}{u.unit_number}</option>)}</select></Field>
      </div></div></div>
      {d && <div className="card"><div className="card-body">
        <div className="section-heading">{t('Owners now', 'বর্তমান মালিক')}</div>
        <div className="mb-4">{d.current_owners.length ? d.current_owners.map((o: any) => <span key={o.id_owners} className="badge badge-primary" style={{ marginRight: 6 }}>{o.full_name} · {pct(o.ownership_percentage)}</span>) : <span className="text-muted">{t('No owner on record', 'কোনো মালিক নেই')}</span>}</div>
        <div className="section-heading">{t('Transfers, oldest first', 'হস্তান্তর, পুরোনো থেকে নতুন')}</div>
        {d.rows.length === 0 && <div className="text-muted text-sm">{t('No completed transfers — the owners are the original allottees.', 'কোনো সম্পন্ন হস্তান্তর নেই — বর্তমান মালিকরাই মূল বরাদ্দপ্রাপ্ত।')}</div>}
        <ol style={{ paddingLeft: 20 }}>{d.rows.map((tr: any) => (
          <li key={tr.id_transfers} className="mb-4">
            <div className="fw-semibold">{fmtDate(tr.effective_date)} · {TYPES[tr.transfer_type]?.[bn ? 1 : 0]} · {tr.transfer_no}{tr.deed_no ? ` · ${t('deed', 'দলিল')} ${tr.deed_no}` : ''}</div>
            <div className="text-sm">{tr.from.map((p: any) => `${p.full_name} (${pct(p.before_percent)} → ${pct(p.after_percent)})`).join(', ')}
              <i className="fa-solid fa-arrow-right" style={{ margin: '0 8px' }} />{tr.to.map((p: any) => `${p.full_name}${p.relation ? ` [${p.relation}]` : ''} (${pct(p.before_percent)} → ${pct(p.after_percent)})`).join(', ')}</div>
          </li>
        ))}</ol>
      </div></div>}
    </>
  );
}
