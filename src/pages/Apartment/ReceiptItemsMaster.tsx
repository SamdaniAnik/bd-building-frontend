import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';

// Master: collection items (particulars) with default amount and VAT/SD rates, picked on receipts & Mushak-6.3.

export const RI_CATEGORIES: Record<string, [string, string]> = {
  FLAT_SALE: ['Flat sale', 'ফ্ল্যাট বিক্রয়'],
  INSTALLMENT: ['Instalment', 'কিস্তি'],
  SERVICE_CHARGE: ['Service charge', 'সার্ভিস চার্জ'],
  UTILITY: ['Utility', 'ইউটিলিটি'],
  PARKING: ['Parking', 'পার্কিং'],
  TRANSFER_FEE: ['Transfer fee', 'হস্তান্তর ফি'],
  PENALTY: ['Fine / penalty', 'জরিমানা'],
  OTHER: ['Other', 'অন্যান্য'],
};
const blank = { item_code: '', item_name_en: '', item_name_bn: '', category: 'OTHER', uom: '', default_amount_bdt: 0, vat_rate: 0, sd_rate: 0, is_active: true, sort_order: 0 };

export default function ReceiptItemsMaster({ notify }: { notify: (type: 'success' | 'error', msg: string) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [rows, setRows] = useState<any[] | null>(null);
  const [form, setForm] = useState<any>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const load = () => api.get('/collections/receipt-items').then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); notify('error', e.message); });
  useEffect(() => { load(); }, []);

  const save = async () => {
    try { const r: any = await api.post('/collections/receipt-items', form); notify('success', r.message); setForm(null); load(); }
    catch (e: any) { notify('error', e.message); }
  };
  const remove = async (r: any) => {
    if (!confirm(t(`Delete "${r.item_name_en}"?`, `"${r.item_name_bn || r.item_name_en}" মুছবেন?`))) return;
    try { const res: any = await api.delete(`/collections/receipt-items/${r.id_receipt_items}`); notify('success', res.message); load(); }
    catch (e: any) { notify('error', e.message); }
  };

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <div className="card-title"><i className="fa-solid fa-list-check text-primary" /> {t('Receipt Items', 'রসিদের খাতসমূহ')}</div>
          <div className="text-xs text-muted">{t('Items and default amounts offered when issuing a money receipt or Mushak-6.3. Leave the amount at 0 to type it each time.', 'মানি রিসিট বা মূসক-৬.৩ ইস্যুর সময় বাছাইয়ের খাত ও ডিফল্ট টাকা। প্রতিবার টাকা লিখতে চাইলে ০ রাখুন।')}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...blank })}><i className="fa-solid fa-plus" /> {t('Add item', 'খাত যোগ')}</button>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr>
          <th>{t('Code', 'কোড')}</th><th>{t('Item', 'খাত')}</th><th>{t('Category', 'ধরন')}</th><th>{t('Unit', 'একক')}</th>
          <th className="text-right">{t('Default amount', 'ডিফল্ট টাকা')}</th><th className="text-right">VAT %</th><th className="text-right">SD %</th><th>{t('Status')}</th><th />
        </tr></thead>
        <tbody>
          {rows === null && <tr><td colSpan={9} className="text-center text-muted">{t('Loading…')}</td></tr>}
          {rows?.length === 0 && <tr><td colSpan={9} className="text-center text-muted">{t('No items yet.', 'এখনো কোনো খাত নেই।')}</td></tr>}
          {rows?.map(r => (
            <tr key={r.id_receipt_items} style={r.is_active ? undefined : { opacity: 0.55 }}>
              <td className="text-xs" style={{ fontFamily: 'monospace' }}>{r.item_code}</td>
              <td className="fw-semibold">{bn && r.item_name_bn ? r.item_name_bn : r.item_name_en}<div className="text-xs text-muted">{bn ? r.item_name_en : r.item_name_bn}</div></td>
              <td className="text-sm">{(RI_CATEGORIES[r.category] || RI_CATEGORIES.OTHER)[bn ? 1 : 0]}</td>
              <td className="text-sm">{r.uom || '—'}</td>
              <td className="text-right">{Number(r.default_amount_bdt) > 0 ? `৳${Number(r.default_amount_bdt).toLocaleString('en-IN')}` : <span className="text-muted text-xs">{t('enter each time', 'প্রতিবার লিখুন')}</span>}</td>
              <td className="text-right">{Number(r.vat_rate)}</td>
              <td className="text-right">{Number(r.sd_rate)}</td>
              <td><span className={`badge ${r.is_active ? 'badge-success' : 'badge-gray'}`}>{r.is_active ? t('Active') : t('Inactive')}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-light btn-sm" onClick={() => setForm({ ...r, is_active: !!r.is_active, item_name_bn: r.item_name_bn || '' })}>{t('Edit')}</button>{' '}
                <button className="btn btn-light btn-sm" aria-label="Delete item" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><strong>{form.id_receipt_items ? t('Edit receipt item', 'খাত সম্পাদনা') : t('New receipt item', 'নতুন খাত')}</strong>
              <button className="btn btn-light btn-sm" aria-label="Close" onClick={() => setForm(null)}><i className="fa-solid fa-xmark" /></button></div>
            <div className="modal-body">
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label required">{t('Name (English)', 'নাম (ইংরেজি)')}</label><input className="form-control" value={form.item_name_en} onChange={e => set('item_name_en', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">{t('Name (Bangla)', 'নাম (বাংলা)')}</label><input className="form-control" value={form.item_name_bn} onChange={e => set('item_name_bn', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">{t('Code', 'কোড')}</label><input className="form-control" disabled={!!form.id_receipt_items} value={form.item_code} onChange={e => set('item_code', e.target.value)} placeholder={t('auto', 'স্বয়ংক্রিয়')} /></div>
                <div className="form-group"><label className="form-label">{t('Category', 'ধরন')}</label>
                  <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {Object.entries(RI_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">{t('Default amount (৳)', 'ডিফল্ট টাকা (৳)')}</label><input type="number" min={0} className="form-control" value={form.default_amount_bdt} onChange={e => set('default_amount_bdt', e.target.value)} />
                  <div className="form-text">{t('0 = type the amount on each receipt', '০ = প্রতিটি রসিদে টাকা লিখুন')}</div></div>
                <div className="form-group"><label className="form-label">{t('Unit', 'একক')}</label><input className="form-control" value={form.uom} onChange={e => set('uom', e.target.value)} placeholder="Month / Sft / Slot" /></div>
                <div className="form-group"><label className="form-label">{t('VAT % (Mushak-6.3)', 'ভ্যাট % (মূসক-৬.৩)')}</label><input type="number" min={0} max={100} step={0.5} className="form-control" value={form.vat_rate} onChange={e => set('vat_rate', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">{t('SD % (Mushak-6.3)', 'সম্পূরক শুল্ক %')}</label><input type="number" min={0} max={100} step={0.5} className="form-control" value={form.sd_rate} onChange={e => set('sd_rate', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">{t('Sort order', 'ক্রম')}</label><input type="number" className="form-control" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} /></div>
                <div className="form-group" style={{ alignSelf: 'end' }}><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /> {t('Active')}</label></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={save}>{t('Save')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
