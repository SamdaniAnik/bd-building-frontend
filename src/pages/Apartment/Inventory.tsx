import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate } from '../../utils/bd';
import { Empty, Field, Modal, PageHeader, Stat, Tabs, money, run, todayStr, useToast, Notify } from '../Operations/shared';

// Site store & material planning: what each work needs (Piling: 50 bags cement, 20 cft sand…), what is in the
// store, what has been issued to each work, and what to buy.
type Tab = 'plan' | 'stock' | 'buy' | 'ledger';

const TYPE: Record<string, [string, string, string, string]> = {
  OPENING: ['Opening stock', 'প্রারম্ভিক মজুদ', 'badge-gray', 'fa-solid fa-flag'],
  RECEIPT: ['Received', 'গৃহীত', 'badge-success', 'fa-solid fa-truck-ramp-box'],
  ISSUE: ['Issued to work', 'কাজে দেওয়া', 'badge-warning', 'fa-solid fa-person-digging'],
  RETURN: ['Returned', 'ফেরত', 'badge-info', 'fa-solid fa-rotate-left'],
  DAMAGE: ['Damaged / wasted', 'নষ্ট / অপচয়', 'badge-danger', 'fa-solid fa-heart-crack'],
  ADJUSTMENT: ['Count adjustment', 'গণনা সমন্বয়', 'badge-gray', 'fa-solid fa-scale-balanced'],
};
const STATE: Record<string, [string, string, string]> = {
  OK: ['In stock', 'মজুদ আছে', 'badge-success'], LOW: ['Low — reorder', 'কম — অর্ডার দিন', 'badge-warning'], SHORT: ['Short for works', 'কাজের জন্য কম', 'badge-danger'], OUT: ['Out of stock', 'শেষ', 'badge-danger'],
  READY: ['Ready in store', 'স্টোরে আছে', 'badge-success'], PARTIAL: ['Partly in store', 'আংশিক আছে', 'badge-warning'], NONE: ['Not in store', 'স্টোরে নেই', 'badge-danger'], DONE: ['Fully issued', 'সম্পূর্ণ দেওয়া', 'badge-gray'],
};
const qn = (n: any) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function Inventory() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('plan');
  const { show, node } = useToast();
  const [base, setBase] = useState<any>(null);
  const [move, setMove] = useState<any>(null);
  const [tick, setTick] = useState(0);
  const loadBase = () => api.get('/inventory/items').then(setBase).catch((e: any) => show(false, e.message));
  useEffect(() => { loadBase(); }, [tick]);
  const changed = () => setTick(x => x + 1);
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-warehouse" title={t('Inventory & Material Plan', 'মজুদ ও মালামাল পরিকল্পনা')}
        subtitle={t('Plan the materials each work needs, keep the site store ledger (received, issued, returned, damaged), and see what to buy.', 'প্রতিটি কাজের মালামাল পরিকল্পনা, সাইট স্টোরের হিসাব (গৃহীত, প্রদত্ত, ফেরত, নষ্ট) এবং কী কিনতে হবে।')}
        actions={<>
          <button className="btn btn-success" disabled={!base} onClick={() => setMove({ movement_type: 'RECEIPT' })}><i className="fa-solid fa-truck-ramp-box" /> {t('Receive', 'মাল গ্রহণ')}</button>
          <button className="btn btn-warning" disabled={!base} onClick={() => setMove({ movement_type: 'ISSUE' })}><i className="fa-solid fa-person-digging" /> {t('Issue to work', 'কাজে দিন')}</button>
        </>} />
      <div className="stats-grid">
        <Stat icon="fa-solid fa-boxes-stacked" value={base?.summary.items ?? '…'} label={t('Materials', 'মালামাল')} />
        <Stat icon="fa-solid fa-sack-dollar" value={base ? money(base.summary.value_bdt) : '…'} label={t('Stock value', 'মজুদের মূল্য')} tone="success" />
        <Stat icon="fa-solid fa-triangle-exclamation" value={base?.summary.short ?? '…'} label={t('Short or out', 'কম বা শেষ')} tone="danger" />
        <Stat icon="fa-solid fa-arrow-down-wide-short" value={base?.summary.low ?? '…'} label={t('Below reorder level', 'রি-অর্ডার লেভেলের নিচে')} tone="warning" />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'plan', label: t('Material plan by work', 'কাজভিত্তিক পরিকল্পনা'), icon: 'fa-solid fa-list-check' },
        { key: 'stock', label: t('Store stock', 'স্টোরের মজুদ'), icon: 'fa-solid fa-warehouse' },
        { key: 'buy', label: t('To buy', 'কিনতে হবে'), icon: 'fa-solid fa-cart-shopping' },
        { key: 'ledger', label: t('Movements', 'লেনদেন'), icon: 'fa-solid fa-book' },
      ]} />
      {base && tab === 'plan' && <PlanTab base={base} show={show} tick={tick} onMove={setMove} onChanged={changed} />}
      {base && tab === 'stock' && <StockTab base={base} show={show} onMove={setMove} onChanged={changed} />}
      {base && tab === 'buy' && <BuyTab show={show} tick={tick} onMove={setMove} />}
      {base && tab === 'ledger' && <LedgerTab base={base} show={show} tick={tick} onChanged={changed} />}
      {move && base && <MovementDialog init={move} base={base} show={show} onClose={() => setMove(null)} onSaved={() => { setMove(null); changed(); }} />}
    </div>
  );
}

// ── Material plan per work ──────────────────────────────────────
function PlanTab({ base, show, tick, onMove, onChanged }: { base: any; show: Notify; tick: number; onMove: (m: any) => void; onChanged: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [works, setWorks] = useState<any[]>([]);
  const [workId, setWorkId] = useState<number | null>(null);
  const [d, setD] = useState<any>(null);
  const [line, setLine] = useState<any>(null);
  const [copy, setCopy] = useState<any>(null);
  useEffect(() => { api.get('/inventory/works').then((r: any) => { setWorks(r.rows); if (!workId) setWorkId(r.rows.find((w: any) => w.status !== 'COMPLETED')?.id_works || r.rows[0]?.id_works || null); }).catch((e: any) => show(false, e.message)); }, [tick]);
  const load = () => workId && api.get(`/inventory/works/${workId}`).then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { setD(null); load(); }, [workId, tick]);
  const saveLine = async () => { if (await run(show, api.post(`/inventory/works/${workId}/requirements`, line))) { setLine(null); onChanged(); } };
  const removeLine = async (r: any) => { if (confirm(t(`Remove ${r.material_name} from the plan?`, `${r.material_name} পরিকল্পনা থেকে সরাবেন?`)) && await run(show, api.delete(`/inventory/works/${workId}/requirements/${r.id_materials}`))) onChanged(); };
  const issueAll = async () => { if (confirm(t('Issue everything still needed by this work, as far as the store has it?', 'এই কাজে বাকি সব মালামাল স্টোরে যতটুকু আছে দিয়ে দেবেন?')) && await run(show, api.post(`/inventory/works/${workId}/issue-all`, {}))) onChanged(); };
  const doCopy = async () => { if (await run(show, api.post(`/inventory/works/${workId}/copy-from/${copy.source}`, { factor: copy.factor }))) { setCopy(null); onChanged(); } };
  const work = d?.work;
  const closed = work && ['COMPLETED', 'CANCELLED'].includes(work.status);
  const mat = (id: any) => base.rows.find((m: any) => m.id_materials === Number(id));

  return (
    <>
      <div className="card mb-4"><div className="card-body">
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 280 }}><Field label={t('Work', 'কাজ')}><select className="form-select" value={workId || ''} onChange={e => setWorkId(Number(e.target.value))}>
            {['IN_PROGRESS', 'COMPLETED'].map(s => <optgroup key={s} label={s === 'IN_PROGRESS' ? t('Open works', 'চলমান কাজ') : t('Completed', 'সম্পন্ন')}>
              {works.filter(w => (s === 'COMPLETED' ? w.status === 'COMPLETED' : w.status !== 'COMPLETED')).map(w => <option key={w.id_works} value={w.id_works}>{w.work_name}{w.plan_lines ? ` · ${w.plan_lines} ${t('items', 'আইটেম')}` : ''}</option>)}
            </optgroup>)}
          </select></Field></div>
          {workId && !closed && <div className="form-group flex gap-2">
            <button className="btn btn-primary" onClick={() => setLine({ id_materials: '', required_qty: '', notes: '' })}><i className="fa-solid fa-plus" /> {t('Add material', 'মালামাল যোগ')}</button>
            <button className="btn btn-light" onClick={() => setCopy({ source: '', factor: 1 })}><i className="fa-solid fa-copy" /> {t('Copy from another work', 'অন্য কাজ থেকে কপি')}</button>
            {d?.rows.some((r: any) => r.remaining > 0 && r.on_hand > 0) && <button className="btn btn-warning" onClick={issueAll}><i className="fa-solid fa-person-digging" /> {t('Issue all available', 'যা আছে সব দিন')}</button>}
          </div>}
        </div>
      </div></div>

      {d && <>
        <div className="stats-grid">
          <Stat icon="fa-solid fa-list" value={`${d.summary.ready}/${d.summary.lines}`} label={t('Items ready or done', 'প্রস্তুত বা সম্পন্ন আইটেম')} tone="info" />
          <Stat icon="fa-solid fa-coins" value={money(d.summary.issued_cost_bdt)} label={t('Material cost issued so far', 'এ পর্যন্ত প্রদত্ত মালামালের খরচ')} tone="success" />
          <Stat icon="fa-solid fa-hourglass-half" value={money(d.summary.remaining_cost_bdt)} label={t('Still to issue (at current rates)', 'বাকি (বর্তমান দরে)')} tone="warning" />
        </div>
        <div className="card">
          <div className="table-wrapper"><table>
            <thead><tr><th>{t('Material', 'মালামাল')}</th><th className="text-right">{t('Needed', 'প্রয়োজন')}</th><th className="text-right">{t('Issued', 'দেওয়া হয়েছে')}</th><th className="text-right">{t('Still to issue', 'বাকি')}</th><th className="text-right">{t('In store', 'স্টোরে')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
            <tbody>
              {d.rows.length === 0 && <Empty cols={7} text={t('No materials planned for this work yet. Add what it needs — e.g. 50 bags cement, 20 cft sand.', 'এই কাজের জন্য এখনো কোনো মালামাল পরিকল্পনা নেই। যা লাগবে যোগ করুন — যেমন ৫০ ব্যাগ সিমেন্ট, ২০ সিএফটি বালু।')} />}
              {d.rows.map((r: any) => (
                <tr key={r.id_requirements}>
                  <td><div className="fw-semibold">{r.material_name}</div>{r.notes && <div className="text-xs text-muted">{r.notes}</div>}</td>
                  <td className="text-right">{qn(r.required_qty)} {r.unit}</td>
                  <td className="text-right">{qn(r.issued_qty)}{r.over_issued > 0 && <div className="text-xs text-warning">+{qn(r.over_issued)} {t('over plan', 'বেশি')}</div>}
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginTop: 4 }}><div style={{ height: 6, borderRadius: 3, width: `${Math.min(100, r.issued_qty / r.required_qty * 100)}%`, background: r.over_issued > 0 ? '#d97706' : '#16a34a' }} /></div></td>
                  <td className="text-right fw-bold">{qn(r.remaining)}</td>
                  <td className="text-right">{qn(r.on_hand)}</td>
                  <td><span className={`badge ${STATE[r.state][2]}`}>{STATE[r.state][bn ? 1 : 0]}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {!closed && r.remaining > 0 && r.on_hand > 0 && <button className="btn btn-warning btn-sm" onClick={() => onMove({ movement_type: 'ISSUE', id_materials: r.id_materials, id_works: workId, qty: Math.min(r.remaining, r.on_hand) })}>{t('Issue', 'দিন')}</button>}{' '}
                    {r.issued_qty > 0 && <button className="btn btn-light btn-sm" title={t('Return unused material to the store', 'অব্যবহৃত মাল ফেরত')} onClick={() => onMove({ movement_type: 'RETURN', id_materials: r.id_materials, id_works: workId })}><i className="fa-solid fa-rotate-left" /></button>}{' '}
                    {!closed && <button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => setLine({ id_materials: r.id_materials, required_qty: r.required_qty, notes: r.notes || '', editing: true })}><i className="fa-solid fa-pen" /></button>}{' '}
                    {!closed && <button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => removeLine(r)}><i className="fa-solid fa-xmark" /></button>}
                  </td>
                </tr>
              ))}
              {d.unplanned.map((u: any) => (
                <tr key={`u${u.id_materials}`} style={{ background: '#fffbeb' }}>
                  <td>{u.material_name}<div className="text-xs text-warning">{t('Issued but not in the plan', 'পরিকল্পনায় নেই কিন্তু দেওয়া হয়েছে')}</div></td>
                  <td className="text-right">—</td><td className="text-right">{qn(u.issued_qty)} {u.unit}</td><td colSpan={4} />
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        {closed && <div className="form-text mt-1">{t('This work is completed — its plan is read-only. Unused material can still be returned to the store.', 'কাজটি সম্পন্ন — পরিকল্পনা পরিবর্তন করা যাবে না। অব্যবহৃত মাল ফেরত দেওয়া যাবে।')}</div>}
      </>}

      {line && (
        <Modal title={line.editing ? t('Change planned quantity', 'পরিকল্পিত পরিমাণ পরিবর্তন') : t('Add material to the plan', 'পরিকল্পনায় মালামাল যোগ')} onClose={() => setLine(null)}
          footer={<><button className="btn btn-light" onClick={() => setLine(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!line.id_materials || !(Number(line.required_qty) > 0)} onClick={saveLine}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Material', 'মালামাল')} required><select className="form-select" disabled={line.editing} value={line.id_materials} onChange={e => setLine({ ...line, id_materials: Number(e.target.value) })}>
              <option value="">{t('— Choose —', '— নির্বাচন —')}</option>{base.rows.filter((m: any) => m.is_active).map((m: any) => <option key={m.id_materials} value={m.id_materials}>{m.material_name} ({m.unit})</option>)}</select></Field>
            <Field label={t('Quantity needed', 'প্রয়োজনীয় পরিমাণ')} required hint={line.id_materials ? `${mat(line.id_materials)?.unit} · ${t('in store', 'স্টোরে')} ${qn(mat(line.id_materials)?.on_hand)}` : undefined}>
              <input type="number" min={0} step="any" className="form-control" value={line.required_qty} onChange={e => setLine({ ...line, required_qty: e.target.value })} /></Field>
          </div>
          <Field label={t('Note (spec, brand, where used)', 'নোট (স্পেক, ব্র্যান্ড, কোথায় লাগবে)')}><input className="form-control" value={line.notes} onChange={e => setLine({ ...line, notes: e.target.value })} /></Field>
          <div className="form-text">{t('Material not in the list? Add it on the Store stock tab.', 'তালিকায় নেই? স্টোরের মজুদ ট্যাবে যোগ করুন।')}</div>
        </Modal>
      )}
      {copy && (
        <Modal title={t('Copy material plan', 'পরিকল্পনা কপি')} onClose={() => setCopy(null)}
          footer={<><button className="btn btn-light" onClick={() => setCopy(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!copy.source} onClick={doCopy}>{t('Copy', 'কপি')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Copy from', 'যেখান থেকে')}><select className="form-select" value={copy.source} onChange={e => setCopy({ ...copy, source: e.target.value })}>
              <option value="">{t('— Choose work —', '— কাজ নির্বাচন —')}</option>{works.filter(w => w.plan_lines && w.id_works !== workId).map(w => <option key={w.id_works} value={w.id_works}>{w.work_name} ({w.plan_lines})</option>)}</select></Field>
            <Field label={t('Scale quantities ×', 'পরিমাণ গুণ ×')} hint={t('e.g. 1.5 for a building half as big again', 'যেমন দেড় গুণ বড় ভবনের জন্য ১.৫')}><input type="number" min={0.01} step="0.01" className="form-control" value={copy.factor} onChange={e => setCopy({ ...copy, factor: e.target.value })} /></Field>
          </div>
          <div className="form-text">{t('Lines already in this plan are overwritten for the same material.', 'একই মালামাল থাকলে পরিমাণ বদলে যাবে।')}</div>
        </Modal>
      )}
    </>
  );
}

// ── Store stock ─────────────────────────────────────────────────
function StockTab({ base, show, onMove, onChanged }: { base: any; show: Notify; onMove: (m: any) => void; onChanged: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [form, setForm] = useState<any>(null);
  const [q, setQ] = useState('');
  const [ledger, setLedger] = useState<any>(null);
  const save = async () => { if (await run(show, api.post('/inventory/items', form))) { setForm(null); onChanged(); } };
  const openLedger = async (m: any) => { try { setLedger(await api.get(`/inventory/items/${m.id_materials}/ledger`)); } catch (e: any) { show(false, e.message); } };
  const rows = base.rows.filter((m: any) => !q || `${m.material_name} ${m.item_code || ''} ${m.category || ''}`.toLowerCase().includes(q.toLowerCase()));
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input className="form-control" style={{ width: 260 }} placeholder={t('Search material', 'মালামাল খুঁজুন')} aria-label={t('Search material', 'মালামাল খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setForm({ material_name: '', item_code: '', category: '', unit: '', current_rate: '', reorder_level: '', supplier: '' })}><i className="fa-solid fa-plus" /> {t('New material', 'নতুন মালামাল')}</button>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Material', 'মালামাল')}</th><th className="text-right">{t('In store', 'স্টোরে')}</th><th className="text-right">{t('Needed by open works', 'চলমান কাজে লাগবে')}</th><th className="text-right">{t('Reorder at', 'রি-অর্ডার')}</th><th className="text-right">{t('Avg cost / value', 'গড় দর / মূল্য')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
          <tbody>
            {rows.map((m: any) => (
              <tr key={m.id_materials} style={m.is_active ? undefined : { opacity: 0.5 }}>
                <td><div className="fw-semibold">{m.material_name}</div><div className="text-xs text-muted">{[m.item_code, m.category, m.supplier].filter(Boolean).join(' · ')}</div></td>
                <td className="text-right fw-bold">{qn(m.on_hand)} {m.unit}</td>
                <td className="text-right">{m.needed_by_open_works ? qn(m.needed_by_open_works) : '—'}{m.shortfall > 0 && <div className="text-xs text-warning">{t('short', 'কম')} {qn(m.shortfall)}</div>}</td>
                <td className="text-right">{Number(m.reorder_level) ? qn(m.reorder_level) : '—'}</td>
                <td className="text-right">{money(m.avg_cost, 2)}<div className="text-xs text-muted">{money(m.value_bdt)}</div></td>
                <td><span className={`badge ${STATE[m.state][2]}`}>{STATE[m.state][bn ? 1 : 0]}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-success btn-sm" title={t('Receive', 'গ্রহণ')} aria-label={t('Receive', 'গ্রহণ')} onClick={() => onMove({ movement_type: 'RECEIPT', id_materials: m.id_materials, unit_cost: m.current_rate })}><i className="fa-solid fa-truck-ramp-box" /></button>{' '}
                  <button className="btn btn-light btn-sm" title={t('Damaged / wasted', 'নষ্ট')} aria-label={t('Damaged / wasted', 'নষ্ট')} onClick={() => onMove({ movement_type: 'DAMAGE', id_materials: m.id_materials })}><i className="fa-solid fa-heart-crack" /></button>{' '}
                  <button className="btn btn-light btn-sm" title={t('Stock count', 'গণনা')} aria-label={t('Stock count', 'গণনা')} onClick={() => onMove({ movement_type: 'ADJUSTMENT', id_materials: m.id_materials, counted_qty: m.on_hand })}><i className="fa-solid fa-scale-balanced" /></button>{' '}
                  <button className="btn btn-light btn-sm" title={t('Ledger', 'খতিয়ান')} aria-label={t('Ledger', 'খতিয়ান')} onClick={() => openLedger(m)}><i className="fa-solid fa-book" /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => setForm({ ...m, current_rate: Number(m.current_rate), reorder_level: Number(m.reorder_level) })}><i className="fa-solid fa-pen" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {form && (
        <Modal title={form.id_materials ? t('Edit material', 'মালামাল সম্পাদনা') : t('New material', 'নতুন মালামাল')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.material_name || !form.unit} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Name', 'নাম')} required><input className="form-control" placeholder={t('e.g. Shah Cement PCC 50 kg', 'যেমন: শাহ সিমেন্ট পিসিসি ৫০ কেজি')} value={form.material_name} onChange={e => set('material_name', e.target.value)} /></Field>
            <Field label={t('Unit', 'একক')} required hint={t('bag, cft, ton, kg, pcs, sft, coil…', 'ব্যাগ, সিএফটি, টন, কেজি, পিস, এসএফটি…')}><input className="form-control" list="inv-units" value={form.unit} onChange={e => set('unit', e.target.value)} /></Field>
            <Field label={t('Code', 'কোড')}><input className="form-control" value={form.item_code || ''} onChange={e => set('item_code', e.target.value)} /></Field>
            <Field label={t('Category', 'বিভাগ')}><input className="form-control" list="inv-cats" value={form.category || ''} onChange={e => set('category', e.target.value)} /></Field>
            <Field label={t('Current rate per unit (৳)', 'বর্তমান দর প্রতি একক (৳)')}><input type="number" min={0} step="any" className="form-control" value={form.current_rate} onChange={e => set('current_rate', e.target.value)} /></Field>
            <Field label={t('Reorder when stock falls to', 'মজুদ এর নিচে নামলে অর্ডার')}><input type="number" min={0} step="any" className="form-control" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} /></Field>
            <Field label={t('Usual supplier', 'সাধারণ সরবরাহকারী')}><input className="form-control" value={form.supplier || ''} onChange={e => set('supplier', e.target.value)} /></Field>
            {form.id_materials && <div className="form-group" style={{ alignSelf: 'end' }}><label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.is_active} onChange={e => set('is_active', e.target.checked)} /> {t('In use', 'ব্যবহারে আছে')}</label></div>}
          </div>
          <datalist id="inv-units">{['Bag', 'CFT', 'Ton', 'Kg', 'Pcs', 'SFT', 'RFT', 'Coil', 'Litre', 'Drum', 'Truck', 'Set'].map(u => <option key={u} value={u} />)}</datalist>
          <datalist id="inv-cats">{['Cement', 'Steel / rod', 'Sand', 'Stone chips', 'Bricks', 'Tiles', 'Paint', 'Electrical', 'Plumbing', 'Hardware'].map(u => <option key={u} value={u} />)}</datalist>
        </Modal>
      )}

      {ledger && (
        <Modal wide title={`${t('Ledger', 'খতিয়ান')} — ${ledger.material.material_name}`} onClose={() => setLedger(null)}>
          <div className="text-sm mb-1">{t('In store', 'স্টোরে')}: <strong>{qn(ledger.on_hand)} {ledger.material.unit}</strong> · {t('average cost', 'গড় দর')} {money(ledger.avg_cost, 2)}</div>
          <LedgerTable rows={ledger.rows} unit={ledger.material.unit} showBalance />
        </Modal>
      )}
    </>
  );
}

function LedgerTable({ rows, unit, showBalance, onDelete }: { rows: any[]; unit?: string; showBalance?: boolean; onDelete?: (r: any) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  return (
    <div className="table-wrapper"><table>
      <thead><tr><th>{t('Date', 'তারিখ')}</th><th>{t('Movement', 'লেনদেন')}</th>{!unit && <th>{t('Material', 'মালামাল')}</th>}<th>{t('Work / supplier', 'কাজ / সরবরাহকারী')}</th><th className="text-right">{t('Qty', 'পরিমাণ')}</th>{showBalance && <th className="text-right">{t('Balance', 'স্থিতি')}</th>}<th>{t('Ref / note', 'রেফ / নোট')}</th>{onDelete && <th />}</tr></thead>
      <tbody>
        {rows.length === 0 && <Empty cols={8} text={t('No movements.', 'কোনো লেনদেন নেই।')} />}
        {rows.map(r => (
          <tr key={r.id_movements}>
            <td className="text-sm">{fmtDate(r.movement_date)}</td>
            <td><span className={`badge ${TYPE[r.movement_type][2]}`}><i className={TYPE[r.movement_type][3]} /> {TYPE[r.movement_type][bn ? 1 : 0]}</span></td>
            {!unit && <td className="text-sm">{r.material_name}</td>}
            <td className="text-sm">{r.work_name || r.vendor_name || '—'}{r.person && <div className="text-xs text-muted">{r.person}</div>}</td>
            <td className={`text-right fw-semibold ${r.qty < 0 ? 'text-warning' : ''}`}>{r.qty > 0 ? '+' : ''}{qn(r.qty)} {unit || r.unit}{r.unit_cost != null && <div className="text-xs text-muted">@ {money(r.unit_cost, 2)}</div>}</td>
            {showBalance && <td className="text-right">{qn(r.balance)}</td>}
            <td className="text-xs">{[r.reference, r.notes].filter(Boolean).join(' · ')}<div className="text-muted">{r.recorded_by}</div></td>
            {onDelete && <td><button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => onDelete(r)}><i className="fa-solid fa-trash" /></button></td>}
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

// ── To buy ──────────────────────────────────────────────────────
function BuyTab({ show, tick, onMove }: { show: Notify; tick: number; onMove: (m: any) => void }) {
  const { t } = useLang();
  const [buffer, setBuffer] = useState(true);
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/inventory/shortages', { params: { buffer: buffer ? 1 : 0 } }).then(setD).catch((e: any) => show(false, e.message)); }, [buffer, tick]);
  return (
    <div className="card">
      <div className="card-header flex-between no-print" style={{ flexWrap: 'wrap', gap: 10 }}>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={buffer} onChange={e => setBuffer(e.target.checked)} /> {t('Also top up to the reorder level', 'রি-অর্ডার লেভেল পর্যন্ত পূরণ')}</label>
        <button className="btn btn-light" onClick={() => window.print()}><i className="fa-solid fa-print" /> {t('Print purchase list', 'ক্রয় তালিকা প্রিন্ট')}</button>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{t('Material', 'মালামাল')}</th><th className="text-right">{t('Open works need', 'চলমান কাজে লাগবে')}</th><th className="text-right">{t('In store', 'স্টোরে')}</th><th className="text-right">{t('Buy', 'কিনুন')}</th><th className="text-right">{t('Est. cost', 'আনুমানিক খরচ')}</th><th>{t('For', 'যার জন্য')}</th><th className="no-print" /></tr></thead>
        <tbody>
          {!d && <Empty cols={7} text={t('Loading…')} />}
          {d?.rows.length === 0 && <Empty cols={7} text={t('The store has everything the open works still need.', 'চলমান কাজের যা লাগবে সব স্টোরে আছে।')} />}
          {d?.rows.map((r: any) => (
            <tr key={r.id_materials}>
              <td><div className="fw-semibold">{r.material_name}</div>{r.supplier && <div className="text-xs text-muted">{r.supplier}</div>}</td>
              <td className="text-right">{qn(r.needed)} {r.unit}</td>
              <td className="text-right">{qn(r.on_hand)}</td>
              <td className="text-right fw-bold">{qn(r.to_buy)} {r.unit}</td>
              <td className="text-right">{money(r.est_cost_bdt)}<div className="text-xs text-muted">@ {money(r.rate, 2)}</div></td>
              <td className="text-xs">{r.works.map((w: any) => `${w.work_name} (${qn(w.remaining)})`).join(', ') || t('reorder level', 'রি-অর্ডার লেভেল')}</td>
              <td className="no-print"><button className="btn btn-success btn-sm" onClick={() => onMove({ movement_type: 'RECEIPT', id_materials: r.id_materials, qty: r.to_buy, unit_cost: r.rate })}>{t('Received', 'পেয়েছি')}</button></td>
            </tr>
          ))}
        </tbody>
        {d?.rows.length > 0 && <tfoot><tr><td colSpan={4}>{t('Total', 'মোট')}</td><td className="text-right">{money(d.total_bdt)}</td><td colSpan={2} /></tr></tfoot>}
      </table></div>
    </div>
  );
}

// ── Movements ───────────────────────────────────────────────────
function LedgerTab({ base, show, tick, onChanged }: { base: any; show: Notify; tick: number; onChanged: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [f, setF] = useState({ material: '', work: '', type: '', from: '', to: '' });
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { api.get('/inventory/movements', { params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }).then((r: any) => setRows(r.rows)).catch((e: any) => show(false, e.message)); }, [f, tick]);
  const del = async (r: any) => { if (confirm(t('Remove this movement? Stock and average cost are recalculated.', 'লেনদেনটি মুছবেন? মজুদ ও গড় দর আবার হিসাব হবে।')) && await run(show, api.delete(`/inventory/movements/${r.id_movements}`))) onChanged(); };
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  return (
    <div className="card">
      <div className="card-header flex gap-2" style={{ flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 220 }} aria-label={t('Material', 'মালামাল')} value={f.material} onChange={e => set('material', e.target.value)}><option value="">{t('All materials', 'সব মালামাল')}</option>{base.rows.map((m: any) => <option key={m.id_materials} value={m.id_materials}>{m.material_name}</option>)}</select>
        <select className="form-select" style={{ width: 220 }} aria-label={t('Work', 'কাজ')} value={f.work} onChange={e => set('work', e.target.value)}><option value="">{t('All works', 'সব কাজ')}</option>{base.works.map((w: any) => <option key={w.id_works} value={w.id_works}>{w.work_name}</option>)}</select>
        <select className="form-select" style={{ width: 170 }} aria-label={t('Type', 'ধরন')} value={f.type} onChange={e => set('type', e.target.value)}><option value="">{t('All types', 'সব ধরন')}</option>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select>
        <input type="date" className="form-control" style={{ width: 150 }} aria-label={t('From', 'থেকে')} value={f.from} onChange={e => set('from', e.target.value)} />
        <input type="date" className="form-control" style={{ width: 150 }} aria-label={t('To', 'পর্যন্ত')} value={f.to} onChange={e => set('to', e.target.value)} />
      </div>
      {rows ? <LedgerTable rows={rows} onDelete={del} /> : <div className="card-body text-muted">{t('Loading…')}</div>}
    </div>
  );
}

// ── Receive / issue / return / damage / count ───────────────────
function MovementDialog({ init, base, show, onClose, onSaved }: { init: any; base: any; show: Notify; onClose: () => void; onSaved: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [f, setF] = useState<any>({ movement_date: todayStr(), qty: '', unit_cost: '', reference: '', person: '', notes: '', id_vendors: '', id_works: '', id_materials: '', counted_qty: '', ...init });
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const m = base.rows.find((x: any) => x.id_materials === Number(f.id_materials));
  const type = f.movement_type;
  const save = async () => {
    setBusy(true);
    try { const r: any = await api.post('/inventory/movements', f); show(true, r.message); onSaved(); }
    catch (e: any) { show(false, e.message); if (e.over_issue) setOver(true); }
    setBusy(false);
  };
  const openWorks = base.works.filter((w: any) => (type === 'RETURN' ? true : w.status !== 'COMPLETED'));
  return (
    <Modal title={<><i className={TYPE[type][3]} /> {TYPE[type][bn ? 1 : 0]}</>} onClose={onClose}
      footer={<><button className="btn btn-light" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={busy || !f.id_materials || (type === 'ADJUSTMENT' ? f.counted_qty === '' : !(Number(f.qty) > 0))} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
      <div className="form-row cols-2">
        <Field label={t('Material', 'মালামাল')} required><select className="form-select" value={f.id_materials} onChange={e => set('id_materials', Number(e.target.value))}>
          <option value="">{t('— Choose —', '— নির্বাচন —')}</option>{base.rows.filter((x: any) => x.is_active).map((x: any) => <option key={x.id_materials} value={x.id_materials}>{x.material_name} · {qn(x.on_hand)} {x.unit}</option>)}</select></Field>
        <Field label={t('Date', 'তারিখ')}><input type="date" className="form-control" max={todayStr()} value={f.movement_date} onChange={e => set('movement_date', e.target.value)} /></Field>
        {['ISSUE', 'RETURN'].includes(type) && <Field label={t('Work', 'কাজ')} required><select className="form-select" value={f.id_works} onChange={e => set('id_works', Number(e.target.value))}>
          <option value="">{t('— Choose work —', '— কাজ নির্বাচন —')}</option>{openWorks.map((w: any) => <option key={w.id_works} value={w.id_works}>{w.work_name}</option>)}</select></Field>}
        {type === 'ADJUSTMENT'
          ? <Field label={t('Counted in the store', 'স্টোরে গণনায় পাওয়া')} required hint={m ? `${t('Books say', 'খাতায় আছে')} ${qn(m.on_hand)} ${m.unit}` : undefined}><input type="number" min={0} step="any" className="form-control" value={f.counted_qty} onChange={e => set('counted_qty', e.target.value)} /></Field>
          : <Field label={`${t('Quantity', 'পরিমাণ')}${m ? ` (${m.unit})` : ''}`} required hint={m && ['ISSUE', 'DAMAGE'].includes(type) ? `${t('In store', 'স্টোরে')} ${qn(m.on_hand)}` : undefined}><input type="number" min={0} step="any" className="form-control" value={f.qty} onChange={e => set('qty', e.target.value)} /></Field>}
        {type === 'RECEIPT' && <>
          <Field label={t('Rate per unit (৳)', 'একক দর (৳)')} hint={m ? `${t('Last', 'সর্বশেষ')} ${money(m.current_rate, 2)}` : undefined}><input type="number" min={0} step="any" className="form-control" value={f.unit_cost} onChange={e => set('unit_cost', e.target.value)} /></Field>
          <Field label={t('Supplier', 'সরবরাহকারী')}><select className="form-select" value={f.id_vendors} onChange={e => set('id_vendors', e.target.value)}><option value="">—</option>{base.vendors.map((v: any) => <option key={v.id_vendors} value={v.id_vendors}>{v.company_name}</option>)}</select></Field>
        </>}
        <Field label={type === 'RECEIPT' ? t('Challan / memo no.', 'চালান / মেমো নং') : t('Requisition / slip no.', 'রিকুইজিশন / স্লিপ নং')}><input className="form-control" value={f.reference} onChange={e => set('reference', e.target.value)} /></Field>
        <Field label={type === 'RECEIPT' ? t('Received by', 'গ্রহণকারী') : t('Given to / taken by', 'যাকে দেওয়া হলো')}><input className="form-control" placeholder={type === 'ISSUE' ? t('Contractor, site engineer, mistri…', 'ঠিকাদার, সাইট ইঞ্জিনিয়ার, মিস্ত্রি…') : ''} value={f.person} onChange={e => set('person', e.target.value)} /></Field>
      </div>
      <Field label={t('Note', 'নোট')} required={['DAMAGE', 'ADJUSTMENT'].includes(type)}><input className="form-control" placeholder={type === 'DAMAGE' ? t('e.g. 3 bags hardened after rain', 'যেমন: বৃষ্টিতে ৩ ব্যাগ জমে গেছে') : ''} value={f.notes} onChange={e => set('notes', e.target.value)} /></Field>
      {over && <Field label={t('Reason for issuing more than planned', 'পরিকল্পনার বেশি দেওয়ার কারণ')} required><input className="form-control" autoFocus value={f.over_issue_reason || ''} onChange={e => set('over_issue_reason', e.target.value)} /></Field>}
    </Modal>
  );
}
