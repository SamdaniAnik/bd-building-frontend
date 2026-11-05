import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate, isValidBdMobile, nidProblem } from '../../utils/bd';
import { Empty, Field, Modal, PageHeader, PayDialog, Stat, Tabs, UnitSelect, inputDate, money, monthName, openReceipt, run, shiftMonth, thisMonth, todayStr, useToast, useUnits, Notify, Unit } from './shared';

type Tab = 'tenants' | 'rent';
type Person = Record<string, string>;

const blankTenant = {
  id_units: null as number | null, full_name: '', father_name: '', date_of_birth: '', marital_status: '', permanent_address: '', occupation: '', workplace_address: '',
  religion: '', education: '', phone: '', email: '', nid_no: '', passport_no: '', emergency_name: '', emergency_relation: '', emergency_phone: '', emergency_address: '',
  family_members: [] as Person[], domestic_helpers: [] as Person[], drivers: [] as Person[],
  prev_landlord_name: '', prev_landlord_phone: '', prev_address: '', reason_for_leaving_prev: '', move_in_date: todayStr(),
  police_form_submitted: false, police_form_date: '', police_station: '', notes: '',
};

export default function TenantsRent() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('tenants');
  const [summary, setSummary] = useState<any>(null);
  const { show, node } = useToast();
  const units = useUnits();
  const loadSummary = () => api.get('/ops/tenants/summary').then((r: any) => setSummary(r)).catch(() => {});
  useEffect(() => { loadSummary(); }, []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-house-user" title={t('Tenants & Rent', 'ভাড়াটিয়া ও ভাড়া')}
        subtitle={t('Tenant records with the DMP tenant information form, rent agreements, monthly rent invoices and collection.', 'ডিএমপি ভাড়াটিয়া তথ্য ফরমসহ ভাড়াটিয়ার রেকর্ড, ভাড়া চুক্তি, মাসিক ভাড়ার বিল ও আদায়।')} />
      <div className="stats-grid">
        <Stat icon="fa-solid fa-users" value={summary?.active_tenants ?? '…'} label={t('Active tenants', 'বর্তমান ভাড়াটিয়া')} />
        <Stat icon="fa-solid fa-door-closed" value={summary?.occupied_units ?? '…'} label={t('Rented flats', 'ভাড়া দেওয়া ফ্ল্যাট')} tone="info" />
        <Stat icon="fa-solid fa-sack-dollar" value={summary ? money(summary.rent_roll_bdt) : '…'} label={t('Monthly rent roll', 'মাসিক ভাড়া')} tone="success" />
        <Stat icon="fa-solid fa-hourglass-half" value={summary ? money(summary.outstanding_bdt) : '…'} label={t('Rent outstanding', 'বকেয়া ভাড়া')} tone="danger" />
        <Stat icon="fa-solid fa-building-shield" value={summary?.police_forms_pending ?? '…'} label={t('Police forms pending', 'থানায় ফরম জমা বাকি')} tone="warning" />
      </div>
      {summary?.expiring_agreements?.length > 0 && (
        <div className="alert alert-warning mb-4"><i className="fa-solid fa-calendar-xmark" /> {t('Agreements ending within 60 days', '৬০ দিনের মধ্যে চুক্তি শেষ')}: {summary.expiring_agreements.map((a: any) => `${a.full_name} (${fmtDate(a.end_date)})`).join(', ')}</div>
      )}
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'tenants', label: t('Tenants', 'ভাড়াটিয়া'), icon: 'fa-solid fa-id-card' },
        { key: 'rent', label: t('Rent invoices', 'ভাড়ার বিল'), icon: 'fa-solid fa-file-invoice' },
      ]} />
      {tab === 'tenants' && <TenantsTab show={show} units={units} onChange={loadSummary} />}
      {tab === 'rent' && <RentTab show={show} units={units} onChange={loadSummary} />}
    </div>
  );
}

function TenantsTab({ show, units, onChange }: { show: Notify; units: Unit[]; onChange: () => void }) {
  const { t } = useLang();
  const [rows, setRows] = useState<any[] | null>(null);
  const [status, setStatus] = useState('ACTIVE');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>(null);
  const [agreement, setAgreement] = useState<any>(null);
  const unitLabel = (id: number) => units.find(u => u.id_units === id)?.label || `#${id}`;

  const load = () => api.get('/ops/tenants', { params: { status: status || undefined, q: q || undefined } }).then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [status, q]);
  const refresh = () => { load(); onChange(); };

  const edit = async (id: number) => {
    try {
      const r: any = await api.get(`/ops/tenants/${id}`);
      const x = r.tenant;
      const clean: any = { ...blankTenant };
      for (const k of Object.keys(blankTenant)) clean[k] = x[k] ?? (blankTenant as any)[k];
      for (const k of ['date_of_birth', 'move_in_date', 'police_form_date']) clean[k] = inputDate(x[k]);
      setForm({ ...clean, id_tenants: x.id_tenants, police_form_submitted: !!x.police_form_submitted });
    } catch (e: any) { show(false, e.message); }
  };
  const newAgreement = (r: any) => setAgreement({ id_tenants: r.id_tenants, id_units: r.id_units, tenant_name: r.full_name, start_date: todayStr(), end_date: '', monthly_rent_bdt: '', other_monthly_bdt: 0, other_monthly_label: '', advance_deposit_bdt: 0, due_day: 5, annual_increase_percent: 0, notice_period_months: 2, notes: '' });
  const moveOut = async (r: any) => {
    const d = prompt(t(`Move-out date for ${r.full_name} (YYYY-MM-DD)`, `${r.full_name}-এর বাসা ছাড়ার তারিখ (YYYY-MM-DD)`), todayStr());
    if (!d) return;
    if (await run(show, api.post(`/ops/tenants/${r.id_tenants}/move-out`, { move_out_date: d }))) refresh();
  };
  const remove = async (r: any) => {
    if (!confirm(t(`Delete ${r.full_name}? This cannot be undone.`, `${r.full_name}-কে মুছবেন? এটি ফেরানো যাবে না।`))) return;
    if (await run(show, api.delete(`/ops/tenants/${r.id_tenants}`))) refresh();
  };

  return (
    <div className="card">
      <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <input className="form-control" style={{ width: 240 }} placeholder={t('Search name, phone, NID', 'নাম, ফোন, এনআইডি খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} aria-label="Search tenants" />
          <select className="form-select" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status filter">
            <option value="ACTIVE">{t('Living here', 'বর্তমান')}</option><option value="LEFT">{t('Moved out', 'চলে গেছেন')}</option><option value="">{t('All', 'সব')}</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...blankTenant, move_in_date: todayStr() })}><i className="fa-solid fa-user-plus" /> {t('Add tenant', 'ভাড়াটিয়া যোগ')}</button>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr>
          <th>{t('Tenant', 'ভাড়াটিয়া')}</th><th>{t('Flat')}</th><th>{t('Since', 'থেকে')}</th><th className="text-right">{t('Rent / month', 'মাসিক ভাড়া')}</th>
          <th className="text-right">{t('Due', 'বকেয়া')}</th><th>{t('Police form', 'থানা ফরম')}</th><th />
        </tr></thead>
        <tbody>
          {rows === null && <Empty cols={7} text={t('Loading…')} />}
          {rows?.length === 0 && <Empty cols={7} text={t('No tenants yet. Add the first one with "Add tenant".', 'এখনো কোনো ভাড়াটিয়া নেই। "ভাড়াটিয়া যোগ" দিয়ে শুরু করুন।')} />}
          {rows?.map(r => (
            <tr key={r.id_tenants} style={r.status === 'LEFT' ? { opacity: 0.6 } : undefined}>
              <td><div className="fw-semibold">{r.full_name}</div><div className="text-xs text-muted">{r.phone}{r.occupation ? ` · ${r.occupation}` : ''}{r.family_count ? ` · ${t('family', 'পরিবার')} ${r.family_count}` : ''}</div></td>
              <td>{unitLabel(r.id_units)}</td>
              <td>{fmtDate(r.move_in_date)}{r.status === 'LEFT' && <div className="text-xs text-muted">{t('left', 'চলে গেছেন')} {fmtDate(r.move_out_date)}</div>}</td>
              <td className="text-right">{r.agreement ? <>{money(r.agreement.monthly_rent_bdt)}{r.agreement.other_monthly_bdt > 0 && <div className="text-xs text-muted">+ {money(r.agreement.other_monthly_bdt)}</div>}</> :
                r.status === 'ACTIVE' ? <button className="btn btn-outline btn-sm" onClick={() => newAgreement(r)}>{t('Add agreement', 'চুক্তি যোগ')}</button> : '—'}</td>
              <td className="text-right">{r.due_bdt > 0 ? <span className="text-danger fw-semibold">{money(r.due_bdt)}<div className="text-xs">{r.due_months} {t('month(s)', 'মাস')}</div></span> : <span className="text-muted">—</span>}</td>
              <td>{r.police_form_submitted ? <span className="badge badge-success">{t('Submitted', 'জমা')} {r.police_form_date ? fmtDate(r.police_form_date) : ''}</span> : <span className="badge badge-warning">{t('Pending', 'বাকি')}</span>}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-light btn-sm" title={t('Print DMP tenant form', 'ডিএমপি ফরম প্রিন্ট')} aria-label="Print tenant form" onClick={() => window.open(`/print/tenant-form/${r.id_tenants}`, '_blank', 'noopener')}><i className="fa-solid fa-print" /></button>{' '}
                <button className="btn btn-light btn-sm" onClick={() => edit(r.id_tenants)}>{t('Edit')}</button>{' '}
                {r.status === 'ACTIVE' && r.agreement && <><button className="btn btn-light btn-sm" title={t('New / renewed agreement', 'নতুন / নবায়িত চুক্তি')} aria-label="Renew agreement" onClick={() => newAgreement(r)}><i className="fa-solid fa-file-signature" /></button>{' '}</>}
                {r.status === 'ACTIVE' && <><button className="btn btn-light btn-sm" title={t('Move out', 'বাসা ছাড়া')} aria-label="Move out" onClick={() => moveOut(r)}><i className="fa-solid fa-person-walking-luggage" /></button>{' '}</>}
                <button className="btn btn-light btn-sm" aria-label="Delete tenant" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {form && <TenantForm show={show} units={units} initial={form} onClose={() => setForm(null)} onSaved={(id, isNew) => {
        setForm(null); refresh();
        if (isNew) { const fresh = { id_tenants: id, id_units: form.id_units, full_name: form.full_name }; newAgreement(fresh); }
      }} />}
      {agreement && <AgreementForm show={show} initial={agreement} onClose={() => setAgreement(null)} onSaved={() => { setAgreement(null); refresh(); }} />}
    </div>
  );
}

function PeopleEditor({ title, list, cols, onChange }: { title: string; list: Person[]; cols: [string, string, string?][]; onChange: (l: Person[]) => void }) {
  const { t } = useLang();
  const set = (i: number, k: string, v: string) => onChange(list.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  return (
    <div className="mb-4">
      <div className="flex-between mb-1"><strong className="text-sm">{title}</strong>
        <button type="button" className="btn btn-light btn-sm" onClick={() => onChange([...list, {}])}><i className="fa-solid fa-plus" /> {t('Add row', 'সারি যোগ')}</button></div>
      {list.length === 0 ? <div className="text-xs text-muted">{t('None', 'নেই')}</div> : (
        <div className="table-wrapper"><table>
          <thead><tr>{cols.map(([k, label]) => <th key={k}>{label}</th>)}<th /></tr></thead>
          <tbody>{list.map((p, i) => (
            <tr key={i}>{cols.map(([k, label, w]) => <td key={k}><input className="form-control" style={w ? { width: w } : undefined} aria-label={label} value={p[k] || ''} onChange={e => set(i, k, e.target.value)} /></td>)}
              <td><button type="button" className="btn btn-light btn-sm" aria-label="Remove row" onClick={() => onChange(list.filter((_, j) => j !== i))}><i className="fa-solid fa-xmark" /></button></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

function TenantForm({ show, units, initial, onClose, onSaved }: { show: Notify; units: Unit[]; initial: any; onClose: () => void; onSaved: (id: number, isNew: boolean) => void }) {
  const { t } = useLang();
  const [f, setF] = useState<any>(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const inp = (k: string, props: any = {}) => <input className="form-control" value={f[k] ?? ''} onChange={e => set(k, e.target.value)} {...props} />;
  const phoneBad = f.phone && !isValidBdMobile(f.phone);
  const nidBad = nidProblem(f.nid_no, f.date_of_birth);
  const save = async () => {
    setBusy(true);
    const r: any = await run(show, api.post('/ops/tenants', f));
    setBusy(false);
    if (r) onSaved(r.id, !f.id_tenants);
  };
  const helperCols: [string, string, string?][] = [['name', t('Name', 'নাম')], ['nid_no', t('NID', 'এনআইডি'), '150px'], ['phone', t('Mobile', 'মোবাইল'), '140px'], ['permanent_address', t('Permanent address', 'স্থায়ী ঠিকানা')]];
  return (
    <Modal wide title={f.id_tenants ? t('Edit tenant', 'ভাড়াটিয়া সম্পাদনা') : t('New tenant', 'নতুন ভাড়াটিয়া')} onClose={onClose} footer={<>
      <span className="text-xs text-muted" style={{ marginRight: 'auto' }}>{t('Fields follow the DMP tenant information form (ভাড়াটিয়া নিবন্ধন ফরম).', 'ঘরগুলো ডিএমপি ভাড়াটিয়া নিবন্ধন ফরম অনুযায়ী।')}</span>
      <button className="btn btn-light" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-primary" disabled={busy || !f.full_name || !f.id_units || !f.phone || phoneBad || !!nidBad} onClick={save}>{t('Save')}</button>
    </>}>
      <div className="section-heading mb-1">{t('Flat & tenant', 'ফ্ল্যাট ও ভাড়াটিয়া')}</div>
      <div className="form-row cols-3">
        <Field label={t('Flat')} required><UnitSelect units={units} value={f.id_units} onChange={v => set('id_units', v)} /></Field>
        <Field label={t('Full name', 'পূর্ণ নাম')} required>{inp('full_name')}</Field>
        <Field label={t("Father's name", 'পিতার নাম')}>{inp('father_name')}</Field>
        <Field label={t('Date of birth', 'জন্ম তারিখ')}>{inp('date_of_birth', { type: 'date' })}</Field>
        <Field label={t('Marital status', 'বৈবাহিক অবস্থা')}>
          <select className="form-select" value={f.marital_status || ''} onChange={e => set('marital_status', e.target.value)}>
            <option value="">—</option><option value="SINGLE">{t('Single', 'অবিবাহিত')}</option><option value="MARRIED">{t('Married', 'বিবাহিত')}</option>
            <option value="WIDOWED">{t('Widowed', 'বিধবা/বিপত্নীক')}</option><option value="DIVORCED">{t('Divorced', 'তালাকপ্রাপ্ত')}</option>
          </select></Field>
        <Field label={t('Religion', 'ধর্ম')}>{inp('religion')}</Field>
        <Field label={t('Occupation', 'পেশা')}>{inp('occupation')}</Field>
        <Field label={t('Workplace / organisation address', 'প্রতিষ্ঠান ও কর্মস্থলের ঠিকানা')}>{inp('workplace_address')}</Field>
        <Field label={t('Education', 'শিক্ষাগত যোগ্যতা')}>{inp('education')}</Field>
        <Field label={t('Mobile', 'মোবাইল')} required hint={phoneBad ? t('Use 01XXXXXXXXX', '01XXXXXXXXX লিখুন') : undefined}>{inp('phone', { inputMode: 'tel', placeholder: '01XXXXXXXXX' })}</Field>
        <Field label={t('Email', 'ই-মেইল')}>{inp('email', { type: 'email' })}</Field>
        <Field label={t('NID number', 'জাতীয় পরিচয়পত্র নম্বর')} hint={nidBad ? t(nidBad[0], nidBad[1]) : t('10, 13 or 17 digits', '১০, ১৩ বা ১৭ অঙ্ক')}>{inp('nid_no', { inputMode: 'numeric', 'aria-invalid': !!nidBad || undefined })}</Field>
        <Field label={t('Passport no. (if any)', 'পাসপোর্ট নম্বর (যদি থাকে)')}>{inp('passport_no')}</Field>
        <Field label={t('Move-in date', 'বর্তমান বাসায় বসবাসের তারিখ')}>{inp('move_in_date', { type: 'date' })}</Field>
      </div>
      <Field label={t('Permanent address', 'স্থায়ী ঠিকানা')}><textarea className="form-control" rows={2} value={f.permanent_address || ''} onChange={e => set('permanent_address', e.target.value)} /></Field>

      <div className="section-heading mb-1 mt-4">{t('Emergency contact', 'জরুরি যোগাযোগ')}</div>
      <div className="form-row cols-4">
        <Field label={t('Name', 'নাম')}>{inp('emergency_name')}</Field>
        <Field label={t('Relation', 'সম্পর্ক')}>{inp('emergency_relation')}</Field>
        <Field label={t('Mobile', 'মোবাইল')}>{inp('emergency_phone', { inputMode: 'tel' })}</Field>
        <Field label={t('Address', 'ঠিকানা')}>{inp('emergency_address')}</Field>
      </div>

      <div className="mt-4">
        <PeopleEditor title={t('Family members / co-residents', 'পরিবার / সঙ্গে বসবাসকারীদের বিবরণ')} list={f.family_members} onChange={l => set('family_members', l)}
          cols={[['name', t('Name', 'নাম')], ['age', t('Age', 'বয়স'), '70px'], ['relation', t('Relation', 'সম্পর্ক'), '120px'], ['occupation', t('Occupation', 'পেশা')], ['phone', t('Mobile', 'মোবাইল'), '140px']]} />
        <PeopleEditor title={t('Domestic help', 'গৃহকর্মী')} list={f.domestic_helpers} onChange={l => set('domestic_helpers', l)} cols={helperCols} />
        <PeopleEditor title={t('Driver', 'ড্রাইভার')} list={f.drivers} onChange={l => set('drivers', l)} cols={helperCols} />
      </div>

      <div className="section-heading mb-1">{t('Previous residence', 'পূর্ববর্তী বাসা')}</div>
      <div className="form-row cols-2">
        <Field label={t("Previous landlord's name", 'পূর্ববর্তী বাড়িওয়ালার নাম')}>{inp('prev_landlord_name')}</Field>
        <Field label={t("Previous landlord's mobile", 'পূর্ববর্তী বাড়িওয়ালার মোবাইল')}>{inp('prev_landlord_phone', { inputMode: 'tel' })}</Field>
        <Field label={t('Previous address', 'পূর্ববর্তী ঠিকানা')}>{inp('prev_address')}</Field>
        <Field label={t('Reason for leaving', 'পূর্ববর্তী বাসা ছাড়ার কারণ')}>{inp('reason_for_leaving_prev')}</Field>
      </div>

      <div className="section-heading mb-1 mt-4">{t('Police station submission', 'থানায় জমা')}</div>
      <div className="form-row cols-3">
        <Field label={t('Police station (thana)', 'থানা')}>{inp('police_station', { placeholder: 'Uttara West' })}</Field>
        <Field label={t('Submitted on', 'জমার তারিখ')}>{inp('police_form_date', { type: 'date', disabled: !f.police_form_submitted })}</Field>
        <div className="form-group" style={{ alignSelf: 'end' }}><label className="flex gap-2 text-sm"><input type="checkbox" checked={!!f.police_form_submitted} onChange={e => set('police_form_submitted', e.target.checked)} /> {t('Form submitted to the thana', 'ফরম থানায় জমা হয়েছে')}</label></div>
      </div>
      <Field label={t('Notes', 'মন্তব্য')}>{inp('notes')}</Field>

      <div className="section-heading mb-1 mt-4">{t('ID documents', 'পরিচয়পত্রের ছবি')}</div>
      {f.id_tenants ? <TenantDocuments id={f.id_tenants} show={show} />
        : <div className="text-sm text-muted">{t('Save the tenant first, then reopen to upload the NID photos.', 'আগে ভাড়াটিয়া সংরক্ষণ করুন, তারপর খুলে এনআইডির ছবি দিন।')}</div>}
    </Modal>
  );
}

// NID front / back and a photo, resized in the browser so each stays well under the 1.5 MB server limit.
const DOC_SLOTS: [string, string, string][] = [['NID_FRONT', 'NID — front', 'এনআইডি — সামনে'], ['NID_BACK', 'NID — back', 'এনআইডি — পেছনে'], ['PHOTO', 'Passport-size photo', 'পাসপোর্ট সাইজ ছবি']];

function shrinkImage(file: File, maxSide = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      if (file.size > 1.4 * 1024 * 1024) return reject(new Error('PDF is larger than 1.4 MB'));
      const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(file); return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Not an image file')); };
    img.src = url;
  });
}

function TenantDocuments({ id, show }: { id: number; show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [docs, setDocs] = useState<any[]>([]);
  const [busy, setBusy] = useState('');
  const load = () => api.get(`/ops/tenants/${id}/documents`).then((r: any) => setDocs(r.rows)).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, [id]);
  const upload = async (type: string, file?: File | null) => {
    if (!file) return;
    setBusy(type);
    try { const data = await shrinkImage(file); if (await run(show, api.post(`/ops/tenants/${id}/documents`, { doc_type: type, data }))) load(); }
    catch (e: any) { show(false, e.message); }
    setBusy('');
  };
  const view = async (docId: number) => {
    const w = window.open('', '_blank'); // open before the request so the popup isn't blocked
    try {
      const r: any = await api.get(`/ops/tenants/documents/${docId}`);
      const blob = await (await fetch(r.doc.data)).blob();
      if (w) w.location.href = URL.createObjectURL(blob);
    } catch (e: any) { w?.close(); show(false, e.message); }
  };
  const remove = async (docId: number) => { if (confirm(t('Delete this document?', 'এই ছবি মুছবেন?')) && await run(show, api.delete(`/ops/tenants/documents/${docId}`))) load(); };
  return (
    <div className="form-row cols-3">
      {DOC_SLOTS.map(([type, en, bnL]) => {
        const d = docs.find(x => x.doc_type === type);
        return (
          <div key={type} className="p-3 rounded" style={{ border: '1px dashed #cbd5e1' }}>
            <div className="fw-semibold text-sm mb-1">{bn ? bnL : en}</div>
            {d ? <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-success"><i className="fa-solid fa-check" /> {t('Uploaded', 'আপলোড হয়েছে')}</span>
              <button type="button" className="btn btn-light btn-sm" onClick={() => view(d.id_tenant_documents)}>{t('View', 'দেখুন')}</button>
              <button type="button" className="btn btn-light btn-sm" aria-label={t('Delete', 'মুছুন')} onClick={() => remove(d.id_tenant_documents)}><i className="fa-solid fa-trash" /></button>
            </div> : <div className="text-xs text-muted mb-1">{t('Not uploaded', 'আপলোড হয়নি')}</div>}
            <label className="btn btn-light btn-sm mt-1" style={{ cursor: 'pointer' }}>
              <i className={busy === type ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-upload'} /> {d ? t('Replace', 'বদলান') : t('Upload', 'আপলোড')}
              <input type="file" accept="image/*,application/pdf" capture="environment" hidden disabled={!!busy} onChange={e => { upload(type, e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
        );
      })}
    </div>
  );
}

function AgreementForm({ show, initial, onClose, onSaved }: { show: Notify; initial: any; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [f, setF] = useState<any>(initial);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const inp = (k: string, props: any = {}) => <input className="form-control" value={f[k] ?? ''} onChange={e => set(k, e.target.value)} {...props} />;
  const save = async () => { if (await run(show, api.post('/ops/tenants/agreements', f))) onSaved(); };
  return (
    <Modal title={<>{t('Rent agreement', 'ভাড়া চুক্তি')} · {f.tenant_name}</>} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-primary" disabled={!(Number(f.monthly_rent_bdt) > 0) || !f.start_date} onClick={save}>{t('Save')}</button>
    </>}>
      <div className="text-xs text-muted mb-4">{t('Saving a new agreement ends the tenant’s current one from its start date.', 'নতুন চুক্তি সংরক্ষণ করলে শুরুর তারিখ থেকে আগের চুক্তি শেষ হবে।')}</div>
      <div className="form-row cols-2">
        <Field label={t('Start date', 'শুরুর তারিখ')} required>{inp('start_date', { type: 'date' })}</Field>
        <Field label={t('End date', 'শেষের তারিখ')} hint={t('Leave blank for a rolling agreement', 'চলমান চুক্তির জন্য ফাঁকা রাখুন')}>{inp('end_date', { type: 'date' })}</Field>
        <Field label={t('Monthly rent (৳)', 'মাসিক ভাড়া (৳)')} required>{inp('monthly_rent_bdt', { type: 'number', min: 0 })}</Field>
        <Field label={t('Advance / security deposit (৳)', 'অগ্রিম / জামানত (৳)')}>{inp('advance_deposit_bdt', { type: 'number', min: 0 })}</Field>
        <Field label={t('Other monthly charges (৳)', 'অন্যান্য মাসিক চার্জ (৳)')} hint={t('Gas, water, service charge collected with rent', 'ভাড়ার সঙ্গে নেওয়া গ্যাস, পানি, সার্ভিস চার্জ')}>{inp('other_monthly_bdt', { type: 'number', min: 0 })}</Field>
        <Field label={t('What the other charges are', 'অন্যান্য চার্জের বিবরণ')}>{inp('other_monthly_label', { placeholder: 'Gas, water & service charge' })}</Field>
        <Field label={t('Rent due on day', 'প্রতি মাসের যে তারিখে ভাড়া দিতে হবে')}>{inp('due_day', { type: 'number', min: 1, max: 31 })}</Field>
        <Field label={t('Yearly increase (%)', 'বার্ষিক বৃদ্ধি (%)')} hint={t('Applied on each agreement anniversary', 'প্রতি চুক্তি-বার্ষিকীতে প্রযোজ্য')}>{inp('annual_increase_percent', { type: 'number', min: 0, step: 0.5 })}</Field>
        <Field label={t('Notice period (months)', 'নোটিশ সময় (মাস)')}>{inp('notice_period_months', { type: 'number', min: 0 })}</Field>
      </div>
      <Field label={t('Notes', 'মন্তব্য')}>{inp('notes')}</Field>
    </Modal>
  );
}

function RentTab({ show, units, onChange }: { show: Notify; units: Unit[]; onChange: () => void }) {
  const { t, lang } = useLang();
  const [month, setMonth] = useState(thisMonth());
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<any[] | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [pay, setPay] = useState<any>(null);
  const unitLabel = (id: number) => units.find(u => u.id_units === id)?.label || `#${id}`;

  const load = () => { setSel(new Set()); api.get('/ops/tenants/invoices', { params: { month: month || undefined, status: status || undefined } }).then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); }); };
  useEffect(() => { load(); }, [month, status]);
  const refresh = () => { load(); onChange(); };

  const generate = async () => { if (await run(show, api.post('/ops/tenants/invoices/generate', { billing_month: month }))) refresh(); };
  const remind = async () => { if (await run(show, api.post('/ops/tenants/invoices/remind', { ids: [...sel] }))) setSel(new Set()); };
  const remove = async (r: any) => { if (confirm(t('Delete this unpaid invoice?', 'এই অপরিশোধিত বিলটি মুছবেন?')) && await run(show, api.delete(`/ops/tenants/invoices/${r.id_rent_invoices}`))) refresh(); };
  const unpaid = rows?.filter(r => r.status !== 'PAID') || [];
  const total = (k: string) => (rows || []).reduce((s, r) => s + Number(r[k] || 0), 0);

  return (
    <div className="card">
      <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-light btn-sm" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month || thisMonth(), -1))}><i className="fa-solid fa-chevron-left" /></button>
          <input type="month" className="form-control" style={{ width: 170 }} value={month} onChange={e => setMonth(e.target.value)} aria-label="Month" />
          <button className="btn btn-light btn-sm" aria-label="Next month" onClick={() => setMonth(shiftMonth(month || thisMonth(), 1))}><i className="fa-solid fa-chevron-right" /></button>
          <select className="form-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status filter">
            <option value="">{t('All', 'সব')}</option><option value="DUE">{t('Unpaid / part-paid', 'বকেয়া')}</option><option value="PAID">{t('Paid')}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-light btn-sm" disabled={!sel.size} onClick={remind}><i className="fa-solid fa-comment-sms" /> {t('SMS reminder', 'এসএমএস রিমাইন্ডার')} {sel.size ? `(${sel.size})` : ''}</button>
          <button className="btn btn-primary btn-sm" disabled={!month} onClick={generate}><i className="fa-solid fa-wand-magic-sparkles" /> {t(`Generate ${monthName(month)} invoices`, `${monthName(month, true)}-এর বিল তৈরি`)}</button>
        </div>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr>
          <th style={{ width: 30 }}><input type="checkbox" aria-label="Select all unpaid" checked={unpaid.length > 0 && sel.size === unpaid.length} onChange={e => setSel(e.target.checked ? new Set(unpaid.map(r => r.id_rent_invoices)) : new Set())} /></th>
          <th>{t('Month', 'মাস')}</th><th>{t('Tenant', 'ভাড়াটিয়া')}</th><th>{t('Flat')}</th><th>{t('Due date')}</th>
          <th className="text-right">{t('Rent', 'ভাড়া')}</th><th className="text-right">{t('Other', 'অন্যান্য')}</th><th className="text-right">{t('Paid')}</th><th>{t('Status')}</th><th />
        </tr></thead>
        <tbody>
          {rows === null && <Empty cols={10} text={t('Loading…')} />}
          {rows?.length === 0 && <Empty cols={10} text={t('No invoices for this month yet. Use "Generate" to create them from active agreements.', 'এই মাসের বিল নেই। চলমান চুক্তি থেকে তৈরি করতে "বিল তৈরি" চাপুন।')} />}
          {rows?.map(r => {
            const due = Number(r.total_bdt) - Number(r.amount_paid);
            const overdue = r.status !== 'PAID' && inputDate(r.due_date) < todayStr();
            return (
              <tr key={r.id_rent_invoices}>
                <td>{r.status !== 'PAID' && <input type="checkbox" aria-label={`Select ${r.tenant_name}`} checked={sel.has(r.id_rent_invoices)} onChange={e => { const s = new Set(sel); e.target.checked ? s.add(r.id_rent_invoices) : s.delete(r.id_rent_invoices); setSel(s); }} />}</td>
                <td>{monthName(r.billing_month, lang === 'bn')}</td>
                <td><div className="fw-semibold">{r.tenant_name}</div><div className="text-xs text-muted">{r.tenant_phone}</div></td>
                <td>{unitLabel(r.id_units)}</td>
                <td className={overdue ? 'text-danger fw-semibold' : ''}>{fmtDate(r.due_date)}</td>
                <td className="text-right">{money(r.rent_bdt)}</td>
                <td className="text-right">{Number(r.other_bdt) > 0 ? money(r.other_bdt) : '—'}</td>
                <td className="text-right">{money(r.amount_paid)}</td>
                <td><span className={`badge ${r.status === 'PAID' ? 'badge-success' : overdue ? 'badge-danger' : r.status === 'PARTIAL' ? 'badge-info' : 'badge-warning'}`}>
                  {r.status === 'PAID' ? t('Paid') : overdue ? t('Overdue') : r.status === 'PARTIAL' ? t('Part-paid', 'আংশিক') : t('Unpaid', 'অপরিশোধিত')}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {r.status !== 'PAID' && <button className="btn btn-success btn-sm" onClick={() => setPay({ ...r, due })}>{t('Collect', 'আদায়')}</button>}{' '}
                  {Number(r.amount_paid) === 0 && <button className="btn btn-light btn-sm" aria-label="Delete invoice" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>}
                </td>
              </tr>
            );
          })}
        </tbody>
        {rows && rows.length > 0 && <tfoot><tr className="fw-bold"><td colSpan={5} className="text-right">{t('Total')}</td><td className="text-right">{money(total('rent_bdt'))}</td><td className="text-right">{money(total('other_bdt'))}</td><td className="text-right">{money(total('amount_paid'))}</td><td colSpan={2} /></tr></tfoot>}
      </table></div>
      {pay && <PayDialog title={`${t('Collect rent', 'ভাড়া আদায়')} · ${pay.tenant_name} · ${monthName(pay.billing_month, lang === 'bn')}`} due={pay.due} receiptDefault={false} onClose={() => setPay(null)}
        onSubmit={async body => {
          const r: any = await run(show, api.post(`/ops/tenants/invoices/${pay.id_rent_invoices}/pay`, body));
          if (r) { refresh(); if (r.id_receipts) openReceipt(r.id_receipts); }
          return !!r;
        }} />}
    </div>
  );
}
