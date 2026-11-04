import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate } from '../../utils/bd';
import { Empty, Field, Modal, PageHeader, PayDialog, Stat, Tabs, money, monthName, openReceipt, run, shiftMonth, thisMonth, useToast, Notify } from './shared';

type Tab = 'bills' | 'generate' | 'runs';

const BASIS: Record<string, [string, string]> = {
  FLAT_EQUAL: ['Same for every flat', 'প্রতি ফ্ল্যাটে সমান'],
  FIXED: ['Fixed per flat', 'প্রতি ফ্ল্যাটে নির্দিষ্ট'],
  SFT_PROPORTIONAL: ['Per sft of flat area', 'ফ্ল্যাটের প্রতি বর্গফুট'],
  METER_CONSUMPTION: ['From meter readings', 'মিটার রিডিং অনুযায়ী'],
  SHARED_EQUAL: ['Shared bill, split equally', 'যৌথ বিল, সমান ভাগ'],
  SHARED_SFT: ['Shared bill, split by area', 'যৌথ বিল, আয়তন অনুযায়ী'],
};
const STATUS_LABEL: Record<string, [string, string]> = {
  AVAILABLE: ['Available', 'খালি'], RESERVED: ['Reserved', 'সংরক্ষিত'], OWNED: ['Owned', 'মালিকানাধীন'],
  UNDER_CONSTRUCTION: ['Under construction', 'নির্মাণাধীন'], COMPLETED: ['Completed', 'সম্পন্ন'], HANDED_OVER: ['Handed over', 'হস্তান্তরিত'],
};

export default function ServiceBilling() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>('bills');
  const [summary, setSummary] = useState<any[]>([]);
  const { show, node } = useToast();
  const loadSummary = () => api.get('/ops/billing/summary').then((r: any) => setSummary(r.rows)).catch(() => {});
  useEffect(() => { loadSummary(); }, []);
  const latest = summary[0];
  const outstanding = summary.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-file-invoice-dollar" title={t('Service Charge Billing', 'সার্ভিস চার্জ বিলিং')}
        subtitle={t('Generate monthly bills for every flat from the service charge heads, split shared utility bills, and collect with money receipts.', 'সার্ভিস চার্জের খাত থেকে প্রতি ফ্ল্যাটের মাসিক বিল তৈরি, যৌথ ইউটিলিটি বিল ভাগ, এবং মানি রিসিটসহ আদায়।')} />
      <div className="stats-grid">
        <Stat icon="fa-solid fa-calendar" value={latest ? monthName(latest.billing_month, lang === 'bn') : '—'} label={t('Latest billing month', 'সর্বশেষ বিলের মাস')} tone="info" />
        <Stat icon="fa-solid fa-file-invoice" value={latest ? money(latest.billed) : '—'} label={t('Billed that month', 'সেই মাসে বিল')} />
        <Stat icon="fa-solid fa-hand-holding-dollar" value={latest ? `${latest.billed ? Math.round(latest.collected / latest.billed * 100) : 0}%` : '—'} label={t('Collected that month', 'সেই মাসে আদায়')} tone="success" />
        <Stat icon="fa-solid fa-triangle-exclamation" value={money(outstanding)} label={t('Outstanding (12 months)', 'বকেয়া (১২ মাস)')} tone="danger" />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'bills', label: t('Bills & collection', 'বিল ও আদায়'), icon: 'fa-solid fa-receipt' },
        { key: 'generate', label: t('Generate bills', 'বিল তৈরি'), icon: 'fa-solid fa-wand-magic-sparkles' },
        { key: 'runs', label: t('Billing history', 'বিলিং ইতিহাস'), icon: 'fa-solid fa-clock-rotate-left' },
      ]} />
      {tab === 'bills' && <BillsTab show={show} onChange={loadSummary} defaultMonth={latest?.billing_month} />}
      {tab === 'generate' && <GenerateTab show={show} onDone={() => { loadSummary(); setTab('bills'); }} />}
      {tab === 'runs' && <RunsTab show={show} onChange={loadSummary} />}
    </div>
  );
}

function BillsTab({ show, onChange, defaultMonth }: { show: Notify; onChange: () => void; defaultMonth?: string }) {
  const { t, lang } = useLang();
  const [month, setMonth] = useState(defaultMonth || thisMonth());
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[] | null>(null);
  const [pay, setPay] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  useEffect(() => { if (defaultMonth) setMonth(defaultMonth); }, [defaultMonth]);

  const load = () => api.get('/ops/billing/bills', { params: { month: month || undefined, status: status || undefined, q: q || undefined } }).then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { const h = setTimeout(load, 200); return () => clearTimeout(h); }, [month, status, q]);
  const refresh = () => { load(); onChange(); };
  const open = async (id: number) => { try { setDetail(await api.get(`/ops/billing/bills/${id}`)); } catch (e: any) { show(false, e.message); } };
  const markOverdue = async () => { if (await run(show, api.post('/ops/billing/refresh-overdue'))) refresh(); };
  const sum = (k: string) => (rows || []).reduce((s, r) => s + Number(r[k] || 0), 0);

  return (
    <div className="card">
      <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-light btn-sm" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month || thisMonth(), -1))}><i className="fa-solid fa-chevron-left" /></button>
          <input type="month" className="form-control" style={{ width: 170 }} value={month} onChange={e => setMonth(e.target.value)} aria-label="Month" />
          <button className="btn btn-light btn-sm" aria-label="Next month" onClick={() => setMonth(shiftMonth(month || thisMonth(), 1))}><i className="fa-solid fa-chevron-right" /></button>
          <select className="form-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status filter">
            <option value="">{t('All', 'সব')}</option><option value="DUE">{t('Not paid', 'অপরিশোধিত')}</option><option value="OVERDUE">{t('Overdue')}</option><option value="PAID">{t('Paid')}</option>
          </select>
          <input className="form-control" style={{ width: 150 }} placeholder={t('Flat no.', 'ফ্ল্যাট নং')} value={q} onChange={e => setQ(e.target.value)} aria-label="Search flat" />
        </div>
        <button className="btn btn-light btn-sm" onClick={markOverdue}><i className="fa-solid fa-clock" /> {t('Mark past-due bills overdue', 'মেয়াদোত্তীর্ণ বিল চিহ্নিত করুন')}</button>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr>
          <th>{t('Flat')}</th><th>{t('Owner')}</th><th>{t('Month', 'মাস')}</th><th>{t('Due date')}</th>
          <th className="text-right">{t('Bill', 'বিল')}</th><th className="text-right">{t('Paid')}</th><th className="text-right">{t('Late fine')}</th><th>{t('Status')}</th><th />
        </tr></thead>
        <tbody>
          {rows === null && <Empty cols={9} text={t('Loading…')} />}
          {rows?.length === 0 && <Empty cols={9} text={t('No bills for this month. Use "Generate bills" to create them.', 'এই মাসের বিল নেই। "বিল তৈরি" ট্যাব থেকে তৈরি করুন।')} />}
          {rows?.map(r => (
            <tr key={r.id_service_charges}>
              <td><button className="btn btn-light btn-sm" style={{ fontWeight: 700 }} onClick={() => open(r.id_service_charges)}>{r.unit_number}</button><div className="text-xs text-muted">{r.building_name}</div></td>
              <td>{r.owner_name || '—'}<div className="text-xs text-muted">{r.owner_phone}</div></td>
              <td>{monthName(r.billing_month, lang === 'bn')}</td>
              <td>{fmtDate(r.due_date)}{r.days_late > 0 && r.status !== 'PAID' && <div className="text-xs text-danger">{r.days_late} {t('days late', 'দিন দেরি')}</div>}</td>
              <td className="text-right">{money(r.monthly_fee)}</td>
              <td className="text-right">{money(r.amount_paid)}</td>
              <td className="text-right">{r.fine_bdt > 0 ? <span className="text-danger">{money(r.fine_bdt)}</span> : r.fine_waived ? <span className="text-xs text-muted">{t('Waived')}</span> : '—'}</td>
              <td><span className={`badge ${r.status === 'PAID' ? 'badge-success' : r.status === 'OVERDUE' || r.days_late > 0 ? 'badge-danger' : Number(r.amount_paid) > 0 ? 'badge-info' : 'badge-warning'}`}>
                {r.status === 'PAID' ? t('Paid') : r.status === 'OVERDUE' || r.days_late > 0 ? t('Overdue') : Number(r.amount_paid) > 0 ? t('Part-paid', 'আংশিক') : t('Unpaid', 'অপরিশোধিত')}</span></td>
              <td>{r.status !== 'PAID' && <button className="btn btn-success btn-sm" onClick={() => setPay(r)}>{t('Collect', 'আদায়')}</button>}</td>
            </tr>
          ))}
        </tbody>
        {rows && rows.length > 0 && <tfoot><tr className="fw-bold"><td colSpan={4} className="text-right">{t('Total')} · {rows.length} {t('bills', 'বিল')}</td><td className="text-right">{money(sum('monthly_fee'))}</td><td className="text-right">{money(sum('amount_paid'))}</td><td className="text-right">{money(sum('fine_bdt'))}</td><td colSpan={2} /></tr></tfoot>}
      </table></div>
      <div className="text-xs text-muted p-3">{t('Late fines follow the Service Charge rule in Masters → Late Fee Rules. Owners also see these bills in their portal and can pay online.', 'বিলম্ব জরিমানা মাস্টার → বিলম্ব জরিমানার নিয়ম অনুযায়ী। মালিকরা পোর্টালে এই বিল দেখে অনলাইনে পরিশোধ করতে পারেন।')}</div>

      {pay && <PayDialog title={`${t('Collect service charge', 'সার্ভিস চার্জ আদায়')} · ${pay.unit_number} · ${monthName(pay.billing_month, lang === 'bn')}`} due={pay.due_bdt} fine={pay.fine_bdt}
        onClose={() => setPay(null)} onSubmit={async body => {
          const r: any = await run(show, api.post(`/ops/billing/bills/${pay.id_service_charges}/pay`, body));
          if (r) { refresh(); if (r.id_receipts) openReceipt(r.id_receipts); }
          return !!r;
        }} />}

      {detail && (
        <Modal title={<>{t('Bill', 'বিল')} · {detail.bill.unit_number} · {monthName(detail.bill.billing_month, lang === 'bn')}</>} onClose={() => setDetail(null)}>
          <div className="text-sm mb-4">{t('Owner')}: <strong>{detail.owner?.full_name || '—'}</strong> · {detail.bill.building_name} · {Number(detail.bill.area_sqft).toLocaleString('en-IN')} sft · {t('Due')} {fmtDate(detail.bill.due_date)}</div>
          <div className="table-wrapper"><table>
            <thead><tr><th>{t('Head', 'খাত')}</th><th>{t('Basis', 'ভিত্তি')}</th><th className="text-right">{t('Amount')}</th></tr></thead>
            <tbody>
              {detail.lines.length === 0 && <Empty cols={3} text={t('This bill was entered by hand and has no breakdown.', 'এই বিলটি হাতে লেখা, বিস্তারিত নেই।')} />}
              {detail.lines.map((l: any) => (
                <tr key={l.id_lines}><td>{l.description}</td>
                  <td className="text-xs">{BASIS[l.basis]?.[lang === 'bn' ? 1 : 0] || l.basis}{l.quantity != null && Number(l.quantity) > 0 ? ` · ${Number(l.quantity).toLocaleString('en-IN')}${l.basis?.includes('SFT') ? ' sft' : ''}` : ''}{l.rate_bdt != null && l.basis === 'SFT_PROPORTIONAL' ? ` × ৳${Number(l.rate_bdt)}` : ''}</td>
                  <td className="text-right">{money(l.amount_bdt, 2)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr className="fw-bold"><td colSpan={2} className="text-right">{t('Total')}</td><td className="text-right">{money(detail.bill.monthly_fee, 2)}</td></tr></tfoot>
          </table></div>
          <div className="section-heading mt-4 mb-1">{t('Payments', 'পরিশোধ')}</div>
          {detail.payments.length === 0 ? <div className="text-sm text-muted">{t('No payments yet.', 'এখনো পরিশোধ হয়নি।')}</div> : (
            <div className="table-wrapper"><table><tbody>{detail.payments.map((p: any) => (
              <tr key={p.id_sc_payments}><td>{fmtDate(p.paid_on)}</td><td>{p.payment_method}{p.reference ? ` · ${p.reference}` : ''}</td>
                <td className="text-right">{money(p.amount_bdt, 2)}{Number(p.fine_bdt) > 0 && <div className="text-xs text-danger">+ {money(p.fine_bdt)} {t('fine', 'জরিমানা')}</div>}</td>
                <td>{p.id_receipts ? <button className="btn btn-light btn-sm" onClick={() => openReceipt(p.id_receipts)}><i className="fa-solid fa-receipt" /> {p.receipt_no}</button> : '—'}</td></tr>
            ))}</tbody></table></div>
          )}
        </Modal>
      )}
    </div>
  );
}

type Shared = { description: string; total_bdt: string; split: 'EQUAL' | 'SFT' };

function GenerateTab({ show, onDone }: { show: Notify; onDone: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [setup, setSetup] = useState<any>(null);
  const next = shiftMonth(thisMonth(), 0);
  const [month, setMonth] = useState(next);
  const [due, setDue] = useState(`${next}-10`);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [heads, setHeads] = useState<Record<number, { include: boolean; rate: string }>>({});
  const [shared, setShared] = useState<Shared[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/ops/billing/setup').then((r: any) => {
      setSetup(r); setStatuses(r.default_statuses);
      setHeads(Object.fromEntries(r.heads.map((h: any) => [h.id_charge_heads, { include: true, rate: String(Number(h.default_rate_bdt)) }])));
    }).catch((e: any) => show(false, e.message));
  }, []);
  useEffect(() => { setDue(d => (d.slice(0, 7) === month ? d : `${month}-10`)); setPreview(null); }, [month]);
  useEffect(() => { setPreview(null); }, [statuses, heads, shared, due]);

  const body = () => ({ billing_month: month, due_date: due, unit_statuses: statuses,
    heads: Object.entries(heads).map(([id, h]) => ({ id_charge_heads: Number(id), include: h.include, rate: h.rate })),
    shared_costs: shared.filter(s => s.description && Number(s.total_bdt) > 0) });
  const doPreview = async () => { setBusy(true); try { setPreview(await api.post('/ops/billing/preview', body())); } catch (e: any) { show(false, e.message); } setBusy(false); };
  const generate = async () => {
    if (!confirm(t(`Create ${preview.bill_count} bills for ${monthName(month)} totalling ${money(preview.total_bdt)}?`, `${monthName(month, true)}-এর ${preview.bill_count}টি বিল (মোট ${money(preview.total_bdt)}) তৈরি করবেন?`))) return;
    setBusy(true); const r = await run(show, api.post('/ops/billing/generate', body())); setBusy(false);
    if (r) onDone();
  };
  const count = (s: string) => Number(setup?.unit_status_counts?.find((c: any) => c.status === s)?.n || 0);
  if (!setup) return <div className="card"><div className="card-body text-muted">{t('Loading…')}</div></div>;

  return (
    <div className="grid grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card"><div className="card-body">
        <div className="form-row cols-2">
          <Field label={t('Billing month', 'বিলের মাস')} required><input type="month" className="form-control" value={month} onChange={e => setMonth(e.target.value)} /></Field>
          <Field label={t('Pay by', 'পরিশোধের শেষ তারিখ')} required><input type="date" className="form-control" value={due} onChange={e => setDue(e.target.value)} /></Field>
        </div>
        <div className="form-group"><div className="form-label">{t('Bill flats with status', 'যে অবস্থার ফ্ল্যাটে বিল হবে')}</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {setup.all_statuses.map((s: string) => (
              <label key={s} className="flex gap-2 text-sm" style={{ border: '1px solid var(--gray-200)', borderRadius: 6, padding: '4px 8px' }}>
                <input type="checkbox" checked={statuses.includes(s)} onChange={e => setStatuses(e.target.checked ? [...statuses, s] : statuses.filter(x => x !== s))} />
                {STATUS_LABEL[s]?.[bn ? 1 : 0] || s} <span className="text-muted">({count(s)})</span>
              </label>
            ))}
          </div>
          <div className="form-text">{t('Society common shares are never billed.', 'সমিতির কমন শেয়ারে বিল হয় না।')}</div>
        </div>

        <div className="section-heading mb-1">{t('Service charge heads', 'সার্ভিস চার্জের খাত')}</div>
        <div className="table-wrapper mb-4"><table>
          <thead><tr><th /><th>{t('Head', 'খাত')}</th><th>{t('Basis', 'ভিত্তি')}</th><th className="text-right">{t('Rate (৳)', 'হার (৳)')}</th></tr></thead>
          <tbody>{setup.heads.map((h: any) => {
            const v = heads[h.id_charge_heads] || { include: true, rate: '' };
            return (
              <tr key={h.id_charge_heads} style={v.include ? undefined : { opacity: 0.5 }}>
                <td><input type="checkbox" aria-label={`Include ${h.head_name_en}`} checked={v.include} onChange={e => setHeads({ ...heads, [h.id_charge_heads]: { ...v, include: e.target.checked } })} /></td>
                <td>{bn ? h.head_name_bn : h.head_name_en}</td>
                <td className="text-xs">{BASIS[h.calculation_basis]?.[bn ? 1 : 0]}</td>
                <td className="text-right">{h.calculation_basis === 'METER_CONSUMPTION' ? <span className="text-xs text-muted">{t('meter', 'মিটার')}</span> :
                  <input type="number" min={0} step={h.calculation_basis === 'SFT_PROPORTIONAL' ? 0.01 : 1} className="form-control" style={{ width: 100, marginLeft: 'auto' }} aria-label={`Rate for ${h.head_name_en}`}
                    value={v.rate} disabled={!v.include} onChange={e => setHeads({ ...heads, [h.id_charge_heads]: { ...v, rate: e.target.value } })} />}</td>
              </tr>
            );
          })}</tbody>
        </table></div>

        <div className="flex-between mb-1"><div className="section-heading">{t("This month's shared bills", 'এই মাসের যৌথ বিল')}</div>
          <button className="btn btn-light btn-sm" onClick={() => setShared([...shared, { description: '', total_bdt: '', split: 'EQUAL' }])}><i className="fa-solid fa-plus" /> {t('Add bill', 'বিল যোগ')}</button></div>
        <div className="text-xs text-muted mb-1">{t('E.g. DESCO common-area meter, generator diesel, WASA pump bill — the total is divided across the billed flats.', 'যেমন: ডেসকো কমন মিটার, জেনারেটরের ডিজেল, ওয়াসা পাম্প — মোট টাকা বিলকৃত ফ্ল্যাটগুলোতে ভাগ হবে।')}</div>
        {shared.map((s, i) => (
          <div key={i} className="flex gap-2 mb-1" style={{ alignItems: 'center' }}>
            <input className="form-control" placeholder={t('Description', 'বিবরণ')} aria-label="Shared bill description" value={s.description} onChange={e => setShared(shared.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
            <input type="number" min={0} className="form-control" style={{ width: 120 }} placeholder="৳" aria-label="Shared bill total" value={s.total_bdt} onChange={e => setShared(shared.map((x, j) => j === i ? { ...x, total_bdt: e.target.value } : x))} />
            <select className="form-select" style={{ width: 130 }} aria-label="Split method" value={s.split} onChange={e => setShared(shared.map((x, j) => j === i ? { ...x, split: e.target.value as any } : x))}>
              <option value="EQUAL">{t('Equally', 'সমান ভাগে')}</option><option value="SFT">{t('By area', 'আয়তন অনুযায়ী')}</option>
            </select>
            <button className="btn btn-light btn-sm" aria-label="Remove shared bill" onClick={() => setShared(shared.filter((_, j) => j !== i))}><i className="fa-solid fa-xmark" /></button>
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <button className="btn btn-outline" disabled={busy || !statuses.length} onClick={doPreview}><i className="fa-solid fa-eye" /> {t('Preview bills', 'বিল দেখুন')}</button>
          <button className="btn btn-primary" disabled={busy || !preview || preview.already_generated} onClick={generate}><i className="fa-solid fa-wand-magic-sparkles" /> {t('Generate bills', 'বিল তৈরি')}</button>
        </div>
      </div></div>

      <div className="card"><div className="card-body">
        {!preview ? <div className="text-muted text-sm">{t('Set up the month and press "Preview bills" to see what every flat will be charged before anything is saved.', 'মাস ঠিক করে "বিল দেখুন" চাপুন — কিছু সংরক্ষণের আগে প্রতি ফ্ল্যাটের বিল দেখা যাবে।')}</div> : <>
          {preview.already_generated && <div className="alert alert-danger mb-4">{t('Bills for this month already exist. Delete that run under Billing history to regenerate.', 'এই মাসের বিল ইতিমধ্যে আছে। আবার তৈরি করতে বিলিং ইতিহাস থেকে আগেরটি মুছুন।')}</div>}
          {preview.warnings.map((w: string) => <div key={w} className="alert alert-warning mb-1">{w}</div>)}
          <div className="grid grid-3 mb-4" style={{ gap: 10 }}>
            <Stat icon="fa-solid fa-door-open" value={preview.bill_count} label={t('Bills', 'বিল')} />
            <Stat icon="fa-solid fa-sack-dollar" value={money(preview.total_bdt)} label={t('Total', 'মোট')} tone="success" />
            <Stat icon="fa-solid fa-scale-balanced" value={money(preview.bill_count ? preview.total_bdt / preview.bill_count : 0)} label={t('Average per flat', 'গড় প্রতি ফ্ল্যাট')} tone="info" />
          </div>
          <div className="table-wrapper" style={{ maxHeight: 460, overflowY: 'auto' }}><table>
            <thead><tr><th>{t('Flat')}</th><th className="text-right">sft</th><th className="text-right">{t('Bill', 'বিল')}</th></tr></thead>
            <tbody>{preview.bills.map((b: any) => (
              <tr key={b.id_units} title={b.lines.map((l: any) => `${l.description}: ৳${l.amount_bdt}`).join('\n')}>
                <td>{b.unit_number} <span className="text-xs text-muted">{b.building_name}</span></td>
                <td className="text-right">{Number(b.area_sqft).toLocaleString('en-IN')}</td>
                <td className="text-right fw-semibold">{money(b.total_bdt, 2)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </>}
      </div></div>
    </div>
  );
}

function RunsTab({ show, onChange }: { show: Notify; onChange: () => void }) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => api.get('/ops/billing/runs').then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { load(); }, []);
  const remove = async (r: any) => {
    if (!confirm(t(`Delete all ${r.bill_count} bills for ${monthName(r.billing_month)}?`, `${monthName(r.billing_month, true)}-এর ${r.bill_count}টি বিল মুছবেন?`))) return;
    if (await run(show, api.delete(`/ops/billing/runs/${r.id_runs}`))) { load(); onChange(); }
  };
  return (
    <div className="card"><div className="table-wrapper"><table>
      <thead><tr><th>{t('Month', 'মাস')}</th><th>{t('Due date')}</th><th className="text-right">{t('Bills', 'বিল')}</th><th className="text-right">{t('Billed', 'বিলকৃত')}</th><th className="text-right">{t('Collected', 'আদায়')}</th><th>{t('Generated by', 'তৈরি করেছেন')}</th><th /></tr></thead>
      <tbody>
        {rows === null && <Empty cols={7} text={t('Loading…')} />}
        {rows?.length === 0 && <Empty cols={7} text={t('No billing runs yet.', 'এখনো কোনো বিলিং হয়নি।')} />}
        {rows?.map(r => (
          <tr key={r.id_runs}>
            <td className="fw-semibold">{monthName(r.billing_month, lang === 'bn')}</td><td>{fmtDate(r.due_date)}</td>
            <td className="text-right">{r.bill_count} <span className="text-xs text-muted">({Number(r.paid_count)} {t('paid', 'পরিশোধিত')})</span></td>
            <td className="text-right">{money(r.total_bdt)}</td><td className="text-right">{money(r.collected_bdt)}</td>
            <td>{r.generated_by}<div className="text-xs text-muted">{fmtDate(r.created_at)}</div></td>
            <td>{Number(r.collected_bdt) === 0 && <button className="btn btn-light btn-sm" aria-label="Delete run" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>}</td>
          </tr>
        ))}
      </tbody>
    </table></div></div>
  );
}
