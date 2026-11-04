import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';

// Master: late payment fine rules — one active rule per item (instalment, service charge, holding tax…).

const ITEMS: Record<string, [string, string]> = {
  INSTALLMENT: ['Flat instalment', 'ফ্ল্যাটের কিস্তি'],
  SERVICE_CHARGE: ['Service charge', 'সার্ভিস চার্জ'],
  HOLDING_TAX: ['Holding tax', 'হোল্ডিং ট্যাক্স'],
  UTILITY_BILL: ['Utility bill', 'ইউটিলিটি বিল'],
  OTHER: ['Other', 'অন্যান্য'],
};
const TYPES: Record<string, { en: string; bn: string; unit: '৳' | '%' }> = {
  FIXED: { en: 'Fixed amount (once)', bn: 'নির্দিষ্ট টাকা (একবার)', unit: '৳' },
  PERCENT: { en: '% of overdue (once)', bn: 'বকেয়ার % (একবার)', unit: '%' },
  PER_DAY_FIXED: { en: 'Taka per day late', bn: 'প্রতিদিন নির্দিষ্ট টাকা', unit: '৳' },
  PER_DAY_PERCENT: { en: '% of overdue per day', bn: 'প্রতিদিন বকেয়ার %', unit: '%' },
  PER_MONTH_PERCENT: { en: '% of overdue per month', bn: 'প্রতি মাসে বকেয়ার %', unit: '%' },
};
const blank = { item_type: 'INSTALLMENT', item_name_en: '', item_name_bn: '', fine_type: 'PER_MONTH_PERCENT', fine_amount: 2, grace_days: 7, count_from: 'DUE_DATE', max_fine_bdt: 0, is_active: true, notes: '' };

export default function LateFeeMaster({ notify }: { notify: (type: 'success' | 'error', msg: string) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [rows, setRows] = useState<any[] | null>(null);
  const [form, setForm] = useState<any>(null);
  const [sample, setSample] = useState({ outstanding: 100000, days_late: 45 });
  const [preview, setPreview] = useState<any>(null);

  const load = () => api.get('/collections/late-fee-rules').then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); notify('error', e.message); });
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!form) return;
    const h = setTimeout(() => api.post('/collections/late-fee-rules/preview', { ...form, ...sample }).then((r: any) => setPreview(r)).catch(() => {}), 250);
    return () => clearTimeout(h);
  }, [form, sample]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => {
    try { const r: any = await api.post('/collections/late-fee-rules', form); notify('success', r.message); setForm(null); load(); }
    catch (e: any) { notify('error', e.message); }
  };
  const remove = async (r: any) => {
    if (!confirm(t(`Delete rule "${r.item_name_en}"?`, `"${r.item_name_bn || r.item_name_en}" নিয়মটি মুছবেন?`))) return;
    try { const res: any = await api.delete(`/collections/late-fee-rules/${r.id_late_fee_rules}`); notify('success', res.message); load(); }
    catch (e: any) { notify('error', e.message); }
  };
  const describe = (r: any) => {
    const ty = TYPES[r.fine_type];
    const amt = ty.unit === '%' ? `${Number(r.fine_amount)}%` : `৳${Number(r.fine_amount).toLocaleString('en-IN')}`;
    return `${amt} · ${bn ? ty.bn : ty.en}`;
  };

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <div className="card-title"><i className="fa-solid fa-gavel text-danger" /> {t('Late Payment Fine Rules', 'বিলম্ব জরিমানার নিয়ম')}</div>
          <div className="text-xs text-muted">{t('Applied automatically to overdue items in the owner portal, online payments and SMS reminders. One active rule per item.', 'মালিক পোর্টাল, অনলাইন পেমেন্ট ও এসএমএস রিমাইন্ডারে স্বয়ংক্রিয়ভাবে প্রযোজ্য। প্রতিটি খাতে একটি সক্রিয় নিয়ম।')}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...blank })}><i className="fa-solid fa-plus" /> {t('Add rule', 'নিয়ম যোগ')}</button>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr>
          <th>{t('Applies to', 'প্রযোজ্য খাত')}</th><th>{t('Name', 'নাম')}</th><th>{t('Fine', 'জরিমানা')}</th>
          <th className="text-center">{t('Grace days', 'ছাড়ের দিন')}</th><th className="text-right">{t('Maximum', 'সর্বোচ্চ')}</th><th>{t('Status', 'অবস্থা')}</th><th />
        </tr></thead>
        <tbody>
          {rows === null && <tr><td colSpan={7} className="text-center text-muted">{t('Loading…')}</td></tr>}
          {rows?.length === 0 && <tr><td colSpan={7} className="text-center text-muted">{t('No fine rules yet.', 'এখনো কোনো নিয়ম নেই।')}</td></tr>}
          {rows?.map(r => (
            <tr key={r.id_late_fee_rules} style={r.is_active ? undefined : { opacity: 0.6 }}>
              <td className="fw-semibold">{bn ? ITEMS[r.item_type][1] : ITEMS[r.item_type][0]}</td>
              <td>{bn && r.item_name_bn ? r.item_name_bn : r.item_name_en}{r.notes && <div className="text-xs text-muted">{r.notes}</div>}</td>
              <td>{describe(r)}{r.count_from === 'AFTER_GRACE' && <div className="text-xs text-muted">{t('counted after grace period', 'ছাড়ের পর থেকে গণনা')}</div>}</td>
              <td className="text-center">{r.grace_days}</td>
              <td className="text-right">{Number(r.max_fine_bdt) > 0 ? `৳${Number(r.max_fine_bdt).toLocaleString('en-IN')}` : t('No cap', 'সীমা নেই')}</td>
              <td><span className={`badge ${r.is_active ? 'badge-success' : 'badge-gray'}`}>{r.is_active ? t('Active') : t('Inactive')}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-light btn-sm" onClick={() => setForm({ ...r, is_active: !!r.is_active, notes: r.notes || '', item_name_bn: r.item_name_bn || '' })}>{t('Edit')}</button>{' '}
                <button className="btn btn-light btn-sm" aria-label="Delete rule" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><strong>{form.id_late_fee_rules ? t('Edit fine rule', 'জরিমানার নিয়ম সম্পাদনা') : t('New fine rule', 'নতুন জরিমানার নিয়ম')}</strong>
              <button className="btn btn-light btn-sm" aria-label="Close" onClick={() => setForm(null)}><i className="fa-solid fa-xmark" /></button></div>
            <div className="modal-body">
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label required">{t('Applies to', 'প্রযোজ্য খাত')}</label>
                  <select className="form-select" value={form.item_type} onChange={e => set('item_type', e.target.value)}>
                    {Object.entries(ITEMS).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label required">{t('Fine type', 'জরিমানার ধরন')}</label>
                  <select className="form-select" value={form.fine_type} onChange={e => set('fine_type', e.target.value)}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{bn ? v.bn : v.en}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label required">{t('Name (English)', 'নাম (ইংরেজি)')}</label><input className="form-control" value={form.item_name_en} onChange={e => set('item_name_en', e.target.value)} placeholder="Instalment delay charge" /></div>
                <div className="form-group"><label className="form-label">{t('Name (Bangla)', 'নাম (বাংলা)')}</label><input className="form-control" value={form.item_name_bn} onChange={e => set('item_name_bn', e.target.value)} placeholder="কিস্তি বিলম্ব জরিমানা" /></div>
                <div className="form-group"><label className="form-label required">{t('Fine amount', 'জরিমানার পরিমাণ')} ({TYPES[form.fine_type].unit})</label>
                  <input type="number" min={0} step={TYPES[form.fine_type].unit === '%' ? 0.1 : 1} className="form-control" value={form.fine_amount} onChange={e => set('fine_amount', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">{t('Grace days', 'ছাড়ের দিন')}</label><input type="number" min={0} className="form-control" value={form.grace_days} onChange={e => set('grace_days', e.target.value)} />
                  <div className="form-text">{t('No fine if paid within this many days after the due date', 'নির্ধারিত তারিখের পর এত দিনের মধ্যে দিলে জরিমানা নেই')}</div></div>
                <div className="form-group"><label className="form-label">{t('Count late days from', 'বিলম্ব গণনা শুরু')}</label>
                  <select className="form-select" value={form.count_from} onChange={e => set('count_from', e.target.value)}>
                    <option value="DUE_DATE">{t('Due date', 'নির্ধারিত তারিখ থেকে')}</option>
                    <option value="AFTER_GRACE">{t('End of grace period', 'ছাড়ের সময় শেষে')}</option>
                  </select></div>
                <div className="form-group"><label className="form-label">{t('Maximum fine (৳)', 'সর্বোচ্চ জরিমানা (৳)')}</label><input type="number" min={0} className="form-control" value={form.max_fine_bdt} onChange={e => set('max_fine_bdt', e.target.value)} />
                  <div className="form-text">{t('0 = no cap', '০ = কোনো সীমা নেই')}</div></div>
              </div>
              <div className="form-group"><label className="form-label">{t('Notes', 'মন্তব্য')}</label><input className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
              <label className="flex gap-2 text-sm mb-4"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /> {t('Active (switches off any other active rule for this item)', 'সক্রিয় (এই খাতের অন্য সক্রিয় নিয়ম বন্ধ হবে)')}</label>

              <div className="p-3 rounded" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="text-sm fw-semibold mb-2"><i className="fa-solid fa-calculator" /> {t('Try it', 'হিসাব করে দেখুন')}</div>
                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="text-sm">{t('Overdue', 'বকেয়া')} ৳</span>
                  <input type="number" min={0} className="form-control" style={{ width: 130 }} value={sample.outstanding} onChange={e => setSample({ ...sample, outstanding: Number(e.target.value) })} aria-label="Sample overdue amount" />
                  <span className="text-sm">{t('paid', 'পরিশোধ')}</span>
                  <input type="number" min={0} className="form-control" style={{ width: 80 }} value={sample.days_late} onChange={e => setSample({ ...sample, days_late: Number(e.target.value) })} aria-label="Sample days late" />
                  <span className="text-sm">{t('days late →', 'দিন দেরিতে →')}</span>
                  <strong className="text-danger" style={{ fontSize: '1.1rem' }}>{t('fine', 'জরিমানা')} ৳{(preview?.fine ?? 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={save}>{t('Save')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
