import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLang, tr } from '../../i18n/LanguageContext';
import { formatBDT, fmtDate, isValidBdMobile } from '../../utils/bd';

type Tab = 'pending' | 'receipts' | 'new' | 'reminders' | 'fines' | 'sms' | 'online' | 'settings';
const openPrint = (id: number) => window.open(`/print/receipt/${id}`, '_blank', 'noopener');
const money = (n: any) => formatBDT(n, { decimals: 0 });

function useToast() {
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const show = (ok: boolean, msg: string) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 4500); };
  const node = toast && (
    <div role="status" style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '14px 22px', borderRadius: 10, background: toast.ok ? '#065f46' : '#991b1b', color: '#fff', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,.3)', maxWidth: 480 }}>
      <i className={toast.ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'} style={{ marginRight: 8 }} />{toast.msg}
    </div>
  );
  return { show, node };
}

const Empty = ({ cols, text }: { cols: number; text: string }) => <tr><td colSpan={cols} className="text-center text-muted" style={{ padding: 28 }}>{text}</td></tr>;

export default function CollectionsCenter() {
  const [tab, setTab] = useState<Tab>('pending');
  const [status, setStatus] = useState<any>(null);
  const { show, node } = useToast();

  const loadStatus = () => api.get('/collections/settings').then((r: any) => setStatus(r)).catch(() => {});
  useEffect(() => { loadStatus(); }, []);

  const { t } = useLang();
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'pending', label: t('Payments to receipt', 'রসিদ বাকি'), icon: 'fa-solid fa-hourglass-half' },
    { key: 'receipts', label: t('Receipts issued', 'ইস্যুকৃত রসিদ'), icon: 'fa-solid fa-receipt' },
    { key: 'new', label: t('New receipt / Mushak-6.3', 'নতুন রসিদ / মূসক-৬.৩'), icon: 'fa-solid fa-file-circle-plus' },
    { key: 'reminders', label: t('SMS due reminders', 'বকেয়া এসএমএস'), icon: 'fa-solid fa-bell' },
    { key: 'fines', label: t('Late fines', 'বিলম্ব জরিমানা'), icon: 'fa-solid fa-gavel' },
    { key: 'sms', label: t('SMS log & templates', 'এসএমএস লগ ও টেমপ্লেট'), icon: 'fa-solid fa-comment-sms' },
    { key: 'online', label: t('Online payments', 'অনলাইন পেমেন্ট'), icon: 'fa-solid fa-credit-card' },
    { key: 'settings', label: t('Settings', 'সেটিংস'), icon: 'fa-solid fa-gear' },
  ];

  const smsLive = status?.sms?.live;
  const gwMode = status?.gateway?.mode;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="fa-solid fa-file-invoice-dollar text-primary" /> {t('Receipts, SMS & Online Payments', 'রসিদ, এসএমএস ও অনলাইন পেমেন্ট')}</h1>
          <div className="text-sm text-muted">{t('Money receipts & Mushak-6.3 with amount in words, SMS reminders to owners, late fines, and SSLCommerz (bKash / Nagad / card) collections.', 'কথায় টাকাসহ মানি রিসিট ও মূসক-৬.৩, মালিকদের এসএমএস রিমাইন্ডার, বিলম্ব জরিমানা এবং SSLCommerz (বিকাশ / নগদ / কার্ড) আদায়।')}</div>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <span className={`badge ${smsLive ? 'badge-success' : 'badge-warning'}`} title={status?.sms?.missing?.length ? `Missing: ${status.sms.missing.join(', ')}` : ''}>
            <i className="fa-solid fa-comment-sms" /> SMS: {status ? (smsLive ? status.sms.provider : status.sms.provider === 'log' ? 'simulated (not sent)' : `${status.sms.provider} not configured`) : '…'}
          </span>
          <span className={`badge ${gwMode === 'SSLCOMMERZ' ? 'badge-success' : gwMode === 'MOCK' ? 'badge-warning' : 'badge-gray'}`}>
            <i className="fa-solid fa-credit-card" /> {tr("Online pay")}: {status ? (gwMode === 'SSLCOMMERZ' ? `SSLCommerz${status.gateway.sandbox ? ' (sandbox)' : ''}` : gwMode === 'MOCK' ? 'test mode' : 'off') : '…'}
          </span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map(t => <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}><i className={t.icon} /> {t.label}</button>)}
      </div>

      {tab === 'pending' && <PendingTab show={show} hasBin={!!status?.settings?.bin} />}
      {tab === 'receipts' && <ReceiptsTab show={show} />}
      {tab === 'new' && <NewReceiptTab show={show} hasBin={!!status?.settings?.bin} onIssued={() => setTab('receipts')} />}
      {tab === 'reminders' && <RemindersTab show={show} live={!!smsLive} />}
      {tab === 'fines' && <FinesTab show={show} />}
      {tab === 'sms' && <SmsTab show={show} />}
      {tab === 'online' && <OnlineTab />}
      {tab === 'settings' && <SettingsTab show={show} status={status} reload={loadStatus} />}
    </div>
  );
}

type Show = { show: (ok: boolean, msg: string) => void };

// ── Payments without a receipt ───────────────────────────────
function PendingTab({ show, hasBin }: Show & { hasBin: boolean }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [docType, setDocType] = useState('MONEY_RECEIPT');
  const [vatRate, setVatRate] = useState('2');
  const [sendSms, setSendSms] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => api.get('/collections/unreceipted').then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { load(); }, []);

  const issue = async (row: any) => {
    const k = `${row.source_type}:${row.source_id}`;
    setBusy(k);
    try {
      const r: any = await api.post('/collections/receipts/from-source', { source_type: row.source_type, source_id: row.source_id, doc_type: docType, send_sms: sendSms, vat_rate: docType === 'MUSHAK_6_3' ? Number(vatRate) : 0 });
      show(true, r.message);
      openPrint(r.receipt.id_receipts);
      load();
    } catch (e: any) { show(false, e.message); } finally { setBusy(null); }
  };

  return (
    <>
      <div className="card mb-4"><div className="card-body flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'center', padding: '12px 20px' }}>
        <label className="flex gap-2 text-sm" style={{ alignItems: 'center' }}>{tr("Document")}
          <select className="form-select" style={{ width: 'auto' }} value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="MONEY_RECEIPT">{tr("Money receipt")}</option>
            <option value="MUSHAK_6_3" disabled={!hasBin}>{tr("Mushak-6.3 tax invoice")}{hasBin ? '' : ' (set BIN first)'}</option>
          </select>
        </label>
        {docType === 'MUSHAK_6_3' && <label className="flex gap-2 text-sm" style={{ alignItems: 'center' }}>{tr("VAT %")}<input type="number" step="0.5" min={0} className="form-control" style={{ width: 80 }} value={vatRate} onChange={e => setVatRate(e.target.value)} /></label>}
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)} /> {tr("Text the payer a \"payment received\" SMS")}</label>
      </div></div>
      <div className="card"><div className="table-wrapper"><table>
        <thead><tr><th>{tr("Date")}</th><th>{tr("From")}</th><th>{tr("Flat")}</th><th>{tr("For")}</th><th>{tr("Method / ref")}</th><th className="text-right">{tr("Amount")}</th><th /></tr></thead>
        <tbody>
          {rows === null && <Empty cols={7} text="Loading…" />}
          {rows?.length === 0 && <Empty cols={7} text="Every recorded payment already has a receipt." />}
          {rows?.map(r => (
            <tr key={`${r.source_type}:${r.source_id}`}>
              <td className="text-sm">{fmtDate(r.date)}</td>
              <td><div className="fw-semibold">{r.name}</div><div className="text-xs text-muted">{r.phone}</div></td>
              <td>{r.unit_number || '—'}</td>
              <td className="text-sm">{r.description}<div className="text-xs text-muted">{r.source_type === 'MFS' ? 'Mobile wallet' : 'Owner contribution'}</div></td>
              <td className="text-sm">{String(r.payment_method || '').replace(/_/g, ' ')}<div className="text-xs text-muted">{r.reference}</div></td>
              <td className="text-right bdt-amount">{money(r.amount)}</td>
              <td><button className="btn btn-primary btn-sm" disabled={busy !== null} onClick={() => issue(r)}>{busy === `${r.source_type}:${r.source_id}` ? 'Issuing…' : 'Issue & print'}</button></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}

// ── Issued receipts ──────────────────────────────────────────
function ReceiptsTab({ show }: Show) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const load = (query = q) => api.get('/collections/receipts', { params: { q: query || undefined } }).then((r: any) => setRows(r.rows)).catch((e: any) => show(false, e.message));
  useEffect(() => { load(''); }, []);

  const cancel = async (r: any) => {
    const reason = prompt(`Cancel ${r.receipt_no}? The number will not be reused.\nReason:`);
    if (!reason) return;
    try { const res: any = await api.post(`/collections/receipts/${r.id_receipts}/cancel`, { reason }); show(true, res.message); load(); } catch (e: any) { show(false, e.message); }
  };

  return (
    <div className="card">
      <div className="card-header">
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); load(); }}>
          <input className="form-control" style={{ width: 300 }} placeholder={tr("Search receipt no, name, flat, TrxID…")} value={q} onChange={e => setQ(e.target.value)} aria-label="Search receipts" />
          <button className="btn btn-light">{tr("Search")}</button>
        </form>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{tr("Receipt no")}</th><th>{tr("Type")}</th><th>{tr("Date")}</th><th>{tr("Received from")}</th><th>{tr("Flat")}</th><th>{tr("Method")}</th><th className="text-right">{tr("Total")}</th><th>{tr("Status")}</th><th /></tr></thead>
        <tbody>
          {rows === null && <Empty cols={9} text="Loading…" />}
          {rows?.length === 0 && <Empty cols={9} text="No receipts yet." />}
          {rows?.map(r => (
            <tr key={r.id_receipts} style={r.status === 'CANCELLED' ? { opacity: 0.55 } : undefined}>
              <td style={{ fontFamily: 'monospace' }}>{r.receipt_no}</td>
              <td><span className={`badge ${r.doc_type === 'MUSHAK_6_3' ? 'badge-info' : 'badge-gray'}`}>{r.doc_type === 'MUSHAK_6_3' ? 'Mushak-6.3' : 'Receipt'}</span></td>
              <td className="text-sm">{fmtDate(r.issue_datetime)}</td>
              <td>{r.received_from}</td><td>{r.unit_number || '—'}</td>
              <td className="text-sm">{String(r.payment_method || '').replace(/_/g, ' ')}</td>
              <td className="text-right bdt-amount">{money(r.total_bdt)}</td>
              <td><span className={`badge ${r.status === 'ISSUED' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-light btn-sm" onClick={() => openPrint(r.id_receipts)}><i className="fa-solid fa-print" /> {tr("Print")}</button>{' '}
                {r.status === 'ISSUED' && <button className="btn btn-light btn-sm" onClick={() => cancel(r)}>{tr("Cancel")}</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

// ── Manual receipt / Mushak-6.3 ──────────────────────────────
// Same rule as the server: VAT is charged on (value + SD).
const lineTotal = (it: any, vat: boolean) => {
  const value = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
  if (!vat) return value;
  const sd = value * (Number(it.sd_rate) || 0) / 100;
  return value + sd + (value + sd) * (Number(it.vat_rate) || 0) / 100;
};
function NewReceiptTab({ show, hasBin, onIssued }: Show & { hasBin: boolean; onIssued: () => void }) {
  const blankLine = { description: '', uom: '', qty: 1, unit_price: '', sd_rate: 0, vat_rate: 0 };
  const [form, setForm] = useState<any>({ doc_type: 'MONEY_RECEIPT', received_from: '', unit_number: '', phone: '', address: '', buyer_bin: '', payment_method: 'CASH', payment_ref: '', send_sms: true });
  const [items, setItems] = useState<any[]>([{ ...blankLine }]);
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [master, setMaster] = useState<any[]>([]);
  const { lang } = useLang();
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setItem = (i: number, k: string, v: any) => setItems(xs => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  useEffect(() => { api.get('/collections/receipt-items', { params: { active: 1 } }).then((r: any) => setMaster(r.rows)).catch(() => {}); }, []);
  // Picking a master item fills description, unit, default amount and VAT/SD (amount kept if master has none).
  const pickItem = (i: number, id: string) => {
    const m = master.find(x => String(x.id_receipt_items) === id);
    if (!m) return;
    const name = lang === 'bn' && m.item_name_bn ? m.item_name_bn : m.item_name_en;
    setItems(xs => xs.map((x, j) => (j === i ? {
      ...x, description: form.unit_number ? `${name} — Flat ${form.unit_number}` : name, uom: m.uom || x.uom,
      unit_price: Number(m.default_amount_bdt) > 0 ? Number(m.default_amount_bdt) : x.unit_price,
      vat_rate: Number(m.vat_rate), sd_rate: Number(m.sd_rate),
    } : x)));
  };
  const vat = form.doc_type === 'MUSHAK_6_3';

  useEffect(() => {
    const h = setTimeout(() => api.post('/collections/receipts/preview', { items, doc_type: form.doc_type }).then((r: any) => setPreview(r)).catch(() => {}), 250);
    return () => clearTimeout(h);
  }, [items, form.doc_type]);

  const phoneOk = !form.phone || isValidBdMobile(form.phone);
  const submit = async () => {
    setBusy(true);
    try {
      const r: any = await api.post('/collections/receipts', { ...form, items });
      show(true, r.message);
      openPrint(r.receipt.id_receipts);
      onIssued();
    } catch (e: any) { show(false, e.message); } finally { setBusy(false); }
  };

  return (
    <div className="card"><div className="card-body">
      <div className="form-row cols-3">
        <div className="form-group"><label className="form-label">{tr("Document")}</label>
          <select className="form-select" value={form.doc_type} onChange={e => set('doc_type', e.target.value)}>
            <option value="MONEY_RECEIPT">{tr("Money receipt")}</option>
            <option value="MUSHAK_6_3" disabled={!hasBin}>{tr("Mushak-6.3 tax invoice")}{hasBin ? '' : ' (set BIN in Settings)'}</option>
          </select></div>
        <div className="form-group"><label className="form-label required">{tr("Received from / buyer")}</label><input className="form-control" value={form.received_from} onChange={e => set('received_from', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">{tr("Flat")}</label><input className="form-control" value={form.unit_number} onChange={e => set('unit_number', e.target.value)} placeholder="A-201" /></div>
        <div className="form-group"><label className="form-label">{tr("Mobile")}</label><input className="form-control" style={phoneOk ? undefined : { borderColor: 'var(--danger)' }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />{!phoneOk && <div className="form-text text-danger">{tr("Not a valid BD mobile number")}</div>}</div>
        <div className="form-group"><label className="form-label">{tr("Address")}</label><input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} /></div>
        {vat ? <div className="form-group"><label className="form-label">{tr("Buyer BIN")}</label><input className="form-control" value={form.buyer_bin} onChange={e => set('buyer_bin', e.target.value)} /></div> : <div />}
        <div className="form-group"><label className="form-label">{tr("Payment method")}</label>
          <select className="form-select" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
            {['CASH', 'CHEQUE', 'PAY_ORDER', 'BANK_TRANSFER', 'BEFTN', 'RTGS', 'BKASH', 'NAGAD', 'ROCKET', 'CARD'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">{tr("Cheque / TrxID / reference")}</label><input className="form-control" value={form.payment_ref} onChange={e => set('payment_ref', e.target.value)} /></div>
        <div className="form-group" style={{ alignSelf: 'end' }}><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.send_sms} onChange={e => set('send_sms', e.target.checked)} /> {tr("Send \"payment received\" SMS")}</label></div>
      </div>

      <div className="section-heading">{tr("Line items")}</div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{tr("Description")}</th>{vat && <th>{tr("Unit")}</th>}<th style={{ width: 80 }}>{tr("Qty")}</th><th style={{ width: 140 }}>{tr("Unit price (৳)")}</th>{vat && <th style={{ width: 80 }}>SD %</th>}{vat && <th style={{ width: 80 }}>{tr("VAT %")}</th>}<th className="text-right">{tr("Total")}</th><th /></tr></thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>
                {master.length > 0 && (
                  <select className="form-select mb-1" style={{ padding: '4px 8px', fontSize: '0.8rem' }} value="" onChange={e => pickItem(i, e.target.value)} aria-label="Pick item from master">
                    <option value="">{lang === 'bn' ? '— মাস্টার থেকে খাত বাছুন —' : '— Pick item from master —'}</option>
                    {master.map(m => <option key={m.id_receipt_items} value={m.id_receipt_items}>{lang === 'bn' && m.item_name_bn ? m.item_name_bn : m.item_name_en}{Number(m.default_amount_bdt) > 0 ? ` · ৳${Number(m.default_amount_bdt).toLocaleString('en-IN')}` : ''}</option>)}
                  </select>
                )}
                <input className="form-control" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder={tr("e.g. 3rd instalment — Flat A-201")} aria-label="Description" />
              </td>
              {vat && <td><input className="form-control" value={it.uom} onChange={e => setItem(i, 'uom', e.target.value)} placeholder={tr("Sft / Service")} aria-label="Unit" /></td>}
              <td><input type="number" min={1} className="form-control" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} aria-label="Quantity" /></td>
              <td><input type="number" min={0} className="form-control" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} aria-label="Unit price" /></td>
              {vat && <td><input type="number" step="0.5" min={0} className="form-control" value={it.sd_rate} onChange={e => setItem(i, 'sd_rate', e.target.value)} aria-label="SD rate" /></td>}
              {vat && <td><input type="number" step="0.5" min={0} className="form-control" value={it.vat_rate} onChange={e => setItem(i, 'vat_rate', e.target.value)} aria-label="VAT rate" /></td>}
              <td className="text-right bdt-amount">{money(lineTotal(it, vat))}</td>
              <td>{items.length > 1 && <button className="btn btn-light btn-sm" aria-label="Remove line" onClick={() => setItems(xs => xs.filter((_, j) => j !== i))}><i className="fa-solid fa-xmark" /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <button className="btn btn-light btn-sm mt-2" onClick={() => setItems(xs => [...xs, { ...blankLine }])}><i className="fa-solid fa-plus" /> {tr("Add line")}</button>

      {preview && preview.total > 0 && (
        <div className="p-4 rounded mt-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="flex-between"><span className="text-muted">{vat ? `Value ${money(preview.subtotal)} + SD ${money(preview.sd)} + VAT ${money(preview.vat)}` : 'Total'}</span><span className="bdt-amount bdt-large">{money(preview.total)}</span></div>
          <div className="mt-2 fw-semibold">{preview.words_bn}</div>
          <div className="text-sm text-muted">{preview.words_en}</div>
        </div>
      )}
      <div className="mt-4"><button className="btn btn-success" disabled={busy || !phoneOk} onClick={submit}><i className="fa-solid fa-print" /> {busy ? 'Issuing…' : 'Issue & print'}</button></div>
    </div></div>
  );
}

// ── Due reminders ────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = { SCHEDULE: 'Instalment', SERVICE_CHARGE: 'Service charge', HOLDING_TAX_Q: 'Holding tax' };
function RemindersTab({ show, live }: Show & { live: boolean }) {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<any[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = (d = days) => { setRows(null); api.get('/collections/sms/due', { params: { days: d } }).then((r: any) => { setRows(r.rows); setSel(new Set(r.rows.filter((x: any) => !x.last_sent_at && x.valid_phone).map((x: any) => x.key))); }).catch((e: any) => { setRows([]); show(false, e.message); }); };
  useEffect(() => { load(); }, []);

  const toggle = (k: string) => setSel(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const segments = useMemo(() => (rows || []).filter(r => sel.has(r.key)).reduce((s, r) => s + Math.ceil([...r.message].length / 67), 0), [rows, sel]);

  const send = async () => {
    if (!sel.size) return;
    if (!confirm(`${live ? 'Send' : 'Simulate'} ${sel.size} SMS (about ${segments} message parts)?`)) return;
    setBusy(true);
    try { const r: any = await api.post('/collections/sms/send-due', { keys: [...sel], days }); show(true, r.message); load(); } catch (e: any) { show(false, e.message); } finally { setBusy(false); }
  };

  return (
    <>
      {!live && <div className="alert alert-warning mb-4"><i className="fa-solid fa-triangle-exclamation" /> {tr("No SMS gateway is configured, so messages are only logged as")} <strong>{tr("simulated")}</strong>{tr(". Set SMS_PROVIDER and its credentials on the server to send for real (see Settings).")}</div>}
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <label className="flex gap-2 text-sm" style={{ alignItems: 'center' }}>{tr("Due within")}
          <select className="form-select" style={{ width: 'auto' }} value={days} onChange={e => { setDays(Number(e.target.value)); load(Number(e.target.value)); }}>
            {[0, 3, 7, 15, 30, 60].map(d => <option key={d} value={d}>{d === 0 ? 'Overdue only' : `${d} days`}</option>)}
          </select>
          <span className="text-muted">{tr("(overdue items are always included)")}</span>
        </label>
        <button className="btn btn-primary" disabled={busy || !sel.size} onClick={send}><i className="fa-solid fa-paper-plane" /> {busy ? 'Sending…' : `${live ? 'Send' : 'Simulate'} ${sel.size} SMS`}</button>
      </div>
      <div className="card"><div className="table-wrapper"><table>
        <thead><tr><th style={{ width: 36 }}><input type="checkbox" aria-label="Select all" checked={!!rows?.length && sel.size === rows.filter(r => r.valid_phone).length} onChange={e => setSel(new Set(e.target.checked ? (rows || []).filter(r => r.valid_phone).map(r => r.key) : []))} /></th><th>{tr("Owner")}</th><th>{tr("Type")}</th><th>{tr("Due")}</th><th className="text-right">{tr("Amount")}</th><th className="text-right">{tr("Late fine")}</th><th>{tr("Message")}</th></tr></thead>
        <tbody>
          {rows === null && <Empty cols={7} text="Loading…" />}
          {rows?.length === 0 && <Empty cols={7} text="Nothing due in this window." />}
          {rows?.map(r => (
            <tr key={r.key}>
              <td><input type="checkbox" aria-label={`Select ${r.name}`} disabled={!r.valid_phone} checked={sel.has(r.key)} onChange={() => toggle(r.key)} /></td>
              <td><div className="fw-semibold">{r.name}</div><div className={`text-xs ${r.valid_phone ? 'text-muted' : 'text-danger'}`}>{r.phone || 'no phone'}{!r.valid_phone && ' · invalid'} · {r.unit}</div></td>
              <td className="text-sm">{TYPE_LABEL[r.related_type]}<div className="text-xs text-muted">{r.item}</div></td>
              <td className="text-sm">{fmtDate(r.due_date)}{r.overdue && <div><span className="badge badge-danger">{tr("Overdue")}</span></div>}</td>
              <td className="text-right bdt-amount">{money(r.amount)}</td>
              <td className="text-right">{r.fine > 0 ? <span className="text-danger">{money(r.fine)}</span> : r.fine_waived ? <span className="badge badge-success">{tr("Waived")}</span> : '—'}</td>
              <td className="text-sm" style={{ maxWidth: 460 }}>{r.message}{r.last_sent_at && <div className="text-xs text-warning">{tr("Already texted")} {fmtDate(r.last_sent_at)} — {tr("skipped unless re-selected")}</div>}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}

// ── Late fines: current fines on overdue items, waive / restore ─
const FINE_ITEM: Record<string, [string, string]> = { INSTALLMENT: ['Instalment', 'কিস্তি'], SERVICE_CHARGE: ['Service charge', 'সার্ভিস চার্জ'], HOLDING_TAX: ['Holding tax', 'হোল্ডিং ট্যাক্স'] };
function FinesTab({ show }: Show) {
  const { t, lang } = useLang();
  const [data, setData] = useState<any>(null);
  const load = () => api.get('/collections/late-fees').then((r: any) => setData(r)).catch((e: any) => { setData({ rows: [], waivers: [], total_fine: 0 }); show(false, e.message); });
  useEffect(() => { load(); }, []);

  const waive = async (r: any) => {
    const reason = prompt(t(`Waive the ৳${r.fine} fine on "${r.item}" for ${r.name}?\nReason:`, `${r.name}-এর "${r.item}" এর ৳${r.fine} জরিমানা মওকুফ করবেন?\nকারণ:`));
    if (!reason) return;
    try { const res: any = await api.post('/collections/late-fees/waive', { item_type: r.item_type, item_key: r.item_key, reason, fine: r.fine }); show(true, res.message); load(); } catch (e: any) { show(false, e.message); }
  };
  const restore = async (w: any) => {
    try { const res: any = await api.delete(`/collections/late-fees/waive/${w.item_type}/${encodeURIComponent(w.item_key)}`); show(true, res.message); load(); } catch (e: any) { show(false, e.message); }
  };

  return (
    <>
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="text-sm text-muted">{t('Fines are worked out daily from the rules in Universal Masters → Late Payment Fines. They are charged when the owner pays.', 'জরিমানা মাস্টার সেটআপ → বিলম্ব জরিমানার নিয়ম অনুযায়ী প্রতিদিন হিসাব হয় এবং পরিশোধের সময় আদায় হয়।')}</div>
        {data && <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>{t('Fines outstanding', 'মোট জরিমানা')}: {money(data.total_fine)}</span>}
      </div>
      <div className="card mb-4"><div className="table-wrapper"><table>
        <thead><tr><th>{t('Owner')}</th><th>{t('Item', 'খাত')}</th><th>{t('Due date')}</th><th className="text-center">{t('Days late')}</th><th className="text-right">{t('Overdue', 'বকেয়া')}</th><th className="text-right">{t('Late fine')}</th><th /></tr></thead>
        <tbody>
          {data === null && <Empty cols={7} text={t('Loading…')} />}
          {data?.rows.length === 0 && <Empty cols={7} text={t('Nothing is overdue.', 'কোনো বকেয়া নেই।')} />}
          {data?.rows.map((r: any) => (
            <tr key={`${r.item_type}:${r.item_key}`}>
              <td><div className="fw-semibold">{r.name}</div><div className="text-xs text-muted">{r.unit}</div></td>
              <td className="text-sm">{lang === 'bn' ? FINE_ITEM[r.item_type][1] : FINE_ITEM[r.item_type][0]}<div className="text-xs text-muted">{r.item}</div></td>
              <td className="text-sm">{fmtDate(r.due_date)}</td>
              <td className="text-center">{r.days_late}</td>
              <td className="text-right bdt-amount">{money(r.principal)}</td>
              <td className="text-right">{r.waived ? <span className="badge badge-success">{t('Waived')}</span> : r.fine > 0 ? <span className="text-danger fw-bold">{money(r.fine)}</span> : <span className="text-muted text-xs">{t('within grace / no rule', 'ছাড়ের মধ্যে / নিয়ম নেই')}</span>}</td>
              <td>{r.fine > 0 && !r.waived && <button className="btn btn-light btn-sm" onClick={() => waive(r)}>{t('Waive')}</button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      {data?.waivers.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title"><i className="fa-solid fa-hand-holding-heart" /> {t('Waivers', 'মওকুফের তালিকা')}</span></div>
          <div className="table-wrapper"><table>
            <thead><tr><th>{t('Item', 'খাত')}</th><th>{t('Reason')}</th><th className="text-right">{t('Fine at the time', 'তখনকার জরিমানা')}</th><th>{t('By', 'অনুমোদন')}</th><th>{t('Date')}</th><th /></tr></thead>
            <tbody>
              {data.waivers.map((w: any) => (
                <tr key={w.id_waivers}>
                  <td className="text-sm">{lang === 'bn' ? FINE_ITEM[w.item_type]?.[1] : FINE_ITEM[w.item_type]?.[0]} #{w.item_key}</td>
                  <td className="text-sm">{w.reason}</td>
                  <td className="text-right">{money(w.fine_at_waiver_bdt)}</td>
                  <td className="text-sm">{w.waived_by}</td>
                  <td className="text-sm">{fmtDate(w.created_at)}</td>
                  <td><button className="btn btn-light btn-sm" onClick={() => restore(w)}>{t('Undo', 'ফিরিয়ে নিন')}</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </>
  );
}

// ── SMS log, templates, one-off SMS ──────────────────────────
function SmsTab({ show }: Show) {
  const [outbox, setOutbox] = useState<any[] | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [one, setOne] = useState({ to: '', name: '', message: '' });
  const load = () => {
    api.get('/collections/sms/outbox').then((r: any) => setOutbox(r.rows)).catch((e: any) => show(false, e.message));
    api.get('/collections/sms/templates').then((r: any) => setTemplates(r.rows)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const saveTpl = async () => {
    try { const r: any = await api.put(`/collections/sms/templates/${edit.template_key}`, edit); show(true, r.message); setEdit(null); load(); } catch (e: any) { show(false, e.message); }
  };
  const sendOne = async () => {
    try { const r: any = await api.post('/collections/sms/send', one); show(true, r.message); setOne({ to: '', name: '', message: '' }); load(); } catch (e: any) { show(false, e.message); }
  };
  const len = [...one.message].length;
  const unicode = /[^\x00-\x7F]/.test(one.message);
  const parts = len === 0 ? 0 : unicode ? (len <= 70 ? 1 : Math.ceil(len / 67)) : (len <= 160 ? 1 : Math.ceil(len / 153));

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(320px,1fr) minmax(320px,1.4fr)', alignItems: 'start' }}>
      <div>
        <div className="card mb-4">
          <div className="card-header"><span className="card-title"><i className="fa-solid fa-paper-plane" /> {tr("Send one SMS")}</span></div>
          <div className="card-body">
            <div className="form-row cols-2">
              <div className="form-group"><label className="form-label required">{tr("Mobile")}</label><input className="form-control" value={one.to} onChange={e => setOne({ ...one, to: e.target.value })} placeholder="01XXXXXXXXX" /></div>
              <div className="form-group"><label className="form-label">{tr("Name")}</label><input className="form-control" value={one.name} onChange={e => setOne({ ...one, name: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label required">{tr("Message")}</label><textarea className="form-control" rows={3} value={one.message} onChange={e => setOne({ ...one, message: e.target.value })} />
              <div className="form-text">{len} {tr("characters")} · {unicode ? 'Bangla/Unicode (70 per part)' : 'English (160 per part)'} · {parts} {tr("part")}{parts === 1 ? '' : 's'}</div></div>
            <button className="btn btn-primary" disabled={!isValidBdMobile(one.to) || !one.message.trim()} onClick={sendOne}>{tr("Send")}</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title"><i className="fa-solid fa-pen-to-square" /> {tr("Templates")}</span></div>
          <div className="card-body">
            <div className="form-text mb-3">{tr("Placeholders")}: {'{{name}} {{unit}} {{item}} {{amount}} {{fine_note}} {{due_date}} {{receipt_no}} {{org}}'}</div>
            {templates.map(t => (
              <div key={t.template_key} className="mb-4">
                <div className="flex-between"><strong>{t.name}</strong>{!t.is_active && <span className="badge badge-gray">{tr("off")}</span>}<button className="btn btn-light btn-sm" onClick={() => setEdit({ ...t, is_active: !!t.is_active })}>{tr("Edit")}</button></div>
                <div className="text-sm mt-1">{t.body_bn}</div>
                <div className="text-xs text-muted">{t.body_en}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title"><i className="fa-solid fa-list" /> {tr("SMS log")}</span><button className="btn btn-light btn-sm" onClick={load} aria-label="Refresh"><i className="fa-solid fa-rotate" /></button></div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{tr("Time")}</th><th>{tr("To")}</th><th>{tr("Message")}</th><th>{tr("Parts")}</th><th>{tr("Status")}</th></tr></thead>
          <tbody>
            {outbox === null && <Empty cols={5} text="Loading…" />}
            {outbox?.length === 0 && <Empty cols={5} text="No SMS sent yet." />}
            {outbox?.map(m => (
              <tr key={m.id_sms}>
                <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>{new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="text-sm">{m.recipient_name}<div className="text-xs text-muted">{m.to_number}</div></td>
                <td className="text-sm" style={{ maxWidth: 380 }}>{m.message}</td>
                <td className="text-center">{m.segments}</td>
                <td><span className={`badge ${m.status === 'SENT' ? 'badge-success' : m.status === 'SIMULATED' ? 'badge-warning' : 'badge-danger'}`} title={m.provider_response || ''}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {edit && (
        <div className="modal-overlay" onClick={() => setEdit(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><strong>{edit.name}</strong><button className="btn btn-light btn-sm" onClick={() => setEdit(null)} aria-label="Close"><i className="fa-solid fa-xmark" /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">{tr("Bangla")}</label><textarea className="form-control" rows={3} value={edit.body_bn} onChange={e => setEdit({ ...edit, body_bn: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">{tr("English")}</label><textarea className="form-control" rows={3} value={edit.body_en} onChange={e => setEdit({ ...edit, body_en: e.target.value })} /></div>
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={edit.is_active} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} /> {tr("Active")}</label>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setEdit(null)}>{tr("Cancel")}</button><button className="btn btn-primary" onClick={saveTpl}>{tr("Save")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Online payments log ──────────────────────────────────────
function OnlineTab() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { api.get('/collections/online-payments').then((r: any) => setRows(r.rows)).catch(() => setRows([])); }, []);
  const badge: Record<string, string> = { PAID: 'badge-success', INITIATED: 'badge-gray', FAILED: 'badge-danger', CANCELLED: 'badge-gray', AMOUNT_MISMATCH: 'badge-danger' };
  return (
    <div className="card"><div className="table-wrapper"><table>
      <thead><tr><th>{tr("Started")}</th><th>{tr("Owner")}</th><th>{tr("For")}</th><th>{tr("Gateway / channel")}</th><th>Tran ID</th><th className="text-right">{tr("Amount")}</th><th>{tr("Status")}</th><th>{tr("Receipt")}</th></tr></thead>
      <tbody>
        {rows === null && <Empty cols={8} text="Loading…" />}
        {rows?.length === 0 && <Empty cols={8} text="No online payments yet. Owners pay from their portal." />}
        {rows?.map(p => (
          <tr key={p.id_online_payments}>
            <td className="text-sm">{fmtDate(p.created_at)}</td>
            <td>{p.owner_name}</td>
            <td className="text-sm">{p.purpose}</td>
            <td className="text-sm">{p.gateway === 'MOCK' ? 'Test mode' : 'SSLCommerz'}<div className="text-xs text-muted">{p.card_type || ''}</div></td>
            <td className="text-xs" style={{ fontFamily: 'monospace' }}>{p.tran_id}{p.bank_tran_id && <div className="text-muted">{p.bank_tran_id}</div>}</td>
            <td className="text-right bdt-amount">{money(p.amount_bdt)}</td>
            <td><span className={`badge ${badge[p.status] || 'badge-gray'}`}>{p.status.replace('_', ' ')}</span></td>
            <td>{p.id_receipts ? <button className="btn btn-light btn-sm" onClick={() => openPrint(p.id_receipts)}>{p.receipt_no}</button> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table></div></div>
  );
}

// ── Settings ─────────────────────────────────────────────────
function SettingsTab({ show, status, reload }: Show & { status: any; reload: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<any>(status?.settings || null);
  useEffect(() => { if (status?.settings) setForm(status.settings); }, [status]);
  if (!form) return <div className="text-muted">{tr("Loading…")}</div>;
  const admin = user?.role === 'admin';
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { try { const r: any = await api.put('/collections/settings', form); show(true, r.message); reload(); } catch (e: any) { show(false, e.message); } };
  const F = (k: string, label: string, hint?: string) => (
    <div className="form-group"><label className="form-label">{label}</label><input className="form-control" disabled={!admin} value={form[k] ?? ''} onChange={e => set(k, e.target.value)} />{hint && <div className="form-text">{hint}</div>}</div>
  );
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(320px,1.3fr) minmax(300px,1fr)', alignItems: 'start' }}>
      <div className="card"><div className="card-header"><span className="card-title">{tr("Organisation (printed on receipts)")}</span></div><div className="card-body">
        {!admin && <div className="alert alert-info mb-3">{tr("Only an admin can change these.")}</div>}
        <div className="form-row cols-2">
          {F('company_name_bn', 'Company name (Bangla)')}{F('company_name_en', 'Company name (English)')}
          {F('address', 'Address')}{F('phone', 'Phone')}{F('email', 'Email')}
          {F('bin', 'VAT BIN', 'Required for Mushak-6.3')}{F('tin', 'e-TIN')}
          {F('sms_signature', 'SMS signature', 'Appended to every SMS — keep it short')}
          <div className="form-group"><label className="form-label">{tr("SMS language")}</label>
            <select className="form-select" disabled={!admin} value={form.sms_language} onChange={e => set('sms_language', e.target.value)}><option value="bn">বাংলা (70 chars / {tr("part")})</option><option value="en">{tr("English (160 chars / part)")}</option></select></div>
          <div className="form-group" style={{ alignSelf: 'end' }}><label className="flex gap-2 text-sm"><input type="checkbox" disabled={!admin} checked={form.sms_auto_payment_received !== 'false'} onChange={e => set('sms_auto_payment_received', e.target.checked ? 'true' : 'false')} /> {tr("Auto-SMS owners when an online payment succeeds")}</label></div>
        </div>
        {F('receipt_footer', 'Receipt footer')}
        {admin && <button className="btn btn-primary" onClick={save}>{tr("Save settings")}</button>}
      </div></div>
      <div>
        <div className="card mb-4"><div className="card-header"><span className="card-title"><i className="fa-solid fa-comment-sms" /> {tr("SMS gateway")}</span></div><div className="card-body text-sm">
          <p>{tr("Status:")} <strong>{status?.sms?.live ? `live via ${status.sms.provider}` : status?.sms?.provider === 'log' ? 'simulated — nothing is sent' : `${status?.sms?.provider}: missing ${status?.sms?.missing?.join(', ')}`}</strong></p>
          <p className="text-muted">{tr("Set on the server (.env), then restart:")}</p>
          <pre style={{ background: '#f1f5f9', padding: 10, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>{`# BulkSMSBD
SMS_PROVIDER=bulksmsbd
SMS_API_KEY=...
SMS_SENDER_ID=...

# or SSL Wireless
SMS_PROVIDER=sslwireless
SMS_API_TOKEN=...
SMS_SID=...`}</pre>
        </div></div>
        <div className="card"><div className="card-header"><span className="card-title"><i className="fa-solid fa-credit-card" /> SSLCommerz</span></div><div className="card-body text-sm">
          <p>{tr("Status:")} <strong>{status?.gateway?.mode === 'SSLCOMMERZ' ? `configured (${status.gateway.sandbox ? 'sandbox' : 'LIVE'})` : status?.gateway?.mode === 'MOCK' ? 'test mode — no real money' : 'not configured'}</strong></p>
          <pre style={{ background: '#f1f5f9', padding: 10, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>{`SSLCZ_STORE_ID=...
SSLCZ_STORE_PASSWD=...
SSLCZ_SANDBOX=true   # false for live
PUBLIC_API_URL=https://api.your-domain.com
FRONTEND_URL=https://app.your-domain.com`}</pre>
          <p className="text-muted">PUBLIC_API_URL must be reachable from the internet so SSLCommerz can call back (IPN).</p>
        </div></div>
      </div>
    </div>
  );
}
