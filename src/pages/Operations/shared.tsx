import React, { useEffect, useId, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { formatBDT } from '../../utils/bd';

// Building operations pages: shared bits (toast, modal, flat picker, stat cards, formatters).

export const money = (n: any, decimals = 0) => formatBDT(Number(n) || 0, { decimals });

/** Local YYYY-MM-DD for <input type="date"> (API dates arrive as UTC ISO strings). */
export const inputDate = (d?: string | Date | null) => {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const todayStr = () => inputDate(new Date());
export const thisMonth = () => todayStr().slice(0, 7);
export const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const monthName = (m: string, bn = false) => {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric' });
};
export const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export type Notify = (ok: boolean, msg: string) => void;

export function useToast() {
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const show: Notify = (ok, msg) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 4500); };
  const node = toast && (
    <div role="status" style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '14px 22px', borderRadius: 10, background: toast.ok ? '#065f46' : '#991b1b', color: '#fff', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,.3)', maxWidth: 480 }}>
      <i className={toast.ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'} style={{ marginRight: 8 }} />{toast.msg}
    </div>
  );
  return { show, node };
}

/** Wraps an API call: shows the server message (or error) and returns the response, or null on failure. */
export async function run<T = any>(show: Notify, p: Promise<any>, okMsg?: string): Promise<T | null> {
  try { const r = await p; show(true, okMsg || r?.message || 'Done'); return r; }
  catch (e: any) { show(false, e?.message || 'Something went wrong'); return null; }
}

export function Modal({ title, onClose, children, footer, wide }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" style={wide ? { maxWidth: 980 } : undefined} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><strong>{title}</strong>
          <button className="btn btn-light btn-sm" aria-label="Close" onClick={onClose}><i className="fa-solid fa-xmark" /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactElement<{ id?: string }> }) {
  const auto = useId();
  const id = children.props.id || auto;
  const child = React.cloneElement(children, { id });
  return (
    <div className="form-group">
      <label htmlFor={id} className={`form-label${required ? ' required' : ''}`}>{label}</label>
      {child}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}

export function Stat({ icon, value, label, tone = 'primary' }: { icon: string; value: React.ReactNode; label: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-icon"><i className={icon} /></div>
      <div className="stat-value" style={{ fontSize: '1.35rem' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export const Empty = ({ cols, text }: { cols: number; text: string }) => <tr><td colSpan={cols} className="text-center text-muted" style={{ padding: 28 }}>{text}</td></tr>;

export type Unit = { id_units: number; label: string; unit_number: string; building_name: string | null; status: string; area_sqft: string; owner_name: string | null };

let unitsCache: Promise<Unit[]> | null = null;
export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  useEffect(() => {
    unitsCache ||= api.get('/ops/units').then((r: any) => r.rows as Unit[]).catch(() => { unitsCache = null; return []; });
    unitsCache.then(setUnits);
  }, []);
  return units;
}

export function UnitSelect({ value, onChange, units, allowEmpty, emptyLabel }: { value: any; onChange: (id: number | null) => void; units: Unit[]; allowEmpty?: boolean; emptyLabel?: string }) {
  const { t } = useLang();
  const groups = units.reduce<Record<string, Unit[]>>((g, u) => { (g[u.building_name || t('Other', 'অন্যান্য')] ||= []).push(u); return g; }, {});
  return (
    <select className="form-select" value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="" disabled={!allowEmpty}>{emptyLabel || t('— Choose flat —', '— ফ্ল্যাট নির্বাচন —')}</option>
      {Object.entries(groups).map(([g, list]) => (
        <optgroup key={g} label={g}>
          {list.map(u => <option key={u.id_units} value={u.id_units}>{u.unit_number}{u.owner_name ? ` — ${u.owner_name}` : ''}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export const PAY_METHODS: [string, string, string][] = [
  ['CASH', 'Cash', 'নগদ'], ['BKASH', 'bKash', 'বিকাশ'], ['NAGAD', 'Nagad', 'নগদ (মোবাইল)'], ['ROCKET', 'Rocket', 'রকেট'],
  ['UPAY', 'Upay', 'উপায়'], ['BANK', 'Bank transfer', 'ব্যাংক ট্রান্সফার'], ['CHEQUE', 'Cheque', 'চেক'], ['CARD', 'Card', 'কার্ড'],
];
export function MethodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lang } = useLang();
  return <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>{PAY_METHODS.map(([k, en, bn]) => <option key={k} value={k}>{lang === 'bn' ? bn : en}</option>)}</select>;
}

export function PageHeader({ icon, title, subtitle, actions }: { icon: string; title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title"><i className={`${icon} text-primary`} /> {title}</h1>
        <div className="text-sm text-muted">{subtitle}</div>
      </div>
      {actions && <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string; icon: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(x => <button key={x.key} role="tab" aria-selected={value === x.key} className={`tab-btn${value === x.key ? ' active' : ''}`} onClick={() => onChange(x.key)}><i className={x.icon} /> {x.label}</button>)}
    </div>
  );
}

/** Payment dialog shared by rent and service charge collection. */
export function PayDialog({ title, due, fine, onClose, onSubmit, receiptDefault = true }: {
  title: string; due: number; fine?: number; onClose: () => void; receiptDefault?: boolean;
  onSubmit: (body: any) => Promise<boolean>;
}) {
  const { t } = useLang();
  const [f, setF] = useState({ amount_bdt: String(due), fine_bdt: String(fine || 0), paid_on: todayStr(), payment_method: 'CASH', reference: '', issue_receipt: receiptDefault, send_sms: false });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => { setBusy(true); const ok = await onSubmit(f); setBusy(false); if (ok) onClose(); };
  const total = (Number(f.amount_bdt) || 0) + (fine !== undefined ? Number(f.fine_bdt) || 0 : 0);
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-success" disabled={busy || total <= 0} onClick={submit}><i className="fa-solid fa-check" /> {t('Record payment', 'পেমেন্ট সংরক্ষণ')} · {money(total)}</button>
    </>}>
      <div className="alert alert-info mb-4">{t('Still due', 'বাকি')}: <strong>{money(due, 2)}</strong>{fine ? <> · {t('Late fine', 'বিলম্ব জরিমানা')}: <strong>{money(fine)}</strong></> : null}</div>
      <div className="form-row cols-2">
        <Field label={t('Amount received (৳)', 'প্রাপ্ত টাকা (৳)')} required><input type="number" min={0} max={due} className="form-control" value={f.amount_bdt} onChange={e => set('amount_bdt', e.target.value)} /></Field>
        {fine !== undefined && <Field label={t('Late fine collected (৳)', 'আদায়কৃত জরিমানা (৳)')} hint={t('Set to 0 to skip the fine', 'জরিমানা না নিলে ০ দিন')}><input type="number" min={0} className="form-control" value={f.fine_bdt} onChange={e => set('fine_bdt', e.target.value)} /></Field>}
        <Field label={t('Paid on', 'পরিশোধের তারিখ')}><input type="date" className="form-control" value={f.paid_on} max={todayStr()} onChange={e => set('paid_on', e.target.value)} /></Field>
        <Field label={t('Method', 'মাধ্যম')}><MethodSelect value={f.payment_method} onChange={v => set('payment_method', v)} /></Field>
        <Field label={t('Transaction ID / cheque no.', 'ট্রানজেকশন আইডি / চেক নং')}><input className="form-control" value={f.reference} onChange={e => set('reference', e.target.value)} /></Field>
      </div>
      <label className="flex gap-2 text-sm mb-1"><input type="checkbox" checked={f.issue_receipt} onChange={e => set('issue_receipt', e.target.checked)} /> {t('Issue a numbered money receipt', 'নম্বরযুক্ত মানি রিসিট দিন')}</label>
      {f.issue_receipt && <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.send_sms} onChange={e => set('send_sms', e.target.checked)} /> {t('Send "payment received" SMS', '"পেমেন্ট গৃহীত" এসএমএস পাঠান')}</label>}
    </Modal>
  );
}

export const openReceipt = (id: number) => window.open(`/print/receipt/${id}`, '_blank', 'noopener');
