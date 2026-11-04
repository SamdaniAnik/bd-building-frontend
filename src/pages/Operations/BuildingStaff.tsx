import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate, isValidBdMobile } from '../../utils/bd';
import { Empty, Field, MethodSelect, Modal, PageHeader, Stat, Tabs, inputDate, money, monthName, run, shiftMonth, thisMonth, todayStr, useToast, Notify } from './shared';

type Tab = 'staff' | 'attendance' | 'register' | 'advances' | 'payroll';

export const ROLES: Record<string, [string, string]> = {
  GUARD: ['Security guard', 'নিরাপত্তা প্রহরী'], CARETAKER: ['Caretaker', 'কেয়ারটেকার'], CLEANER: ['Cleaner', 'পরিচ্ছন্নতাকর্মী'],
  LIFT_OPERATOR: ['Lift operator', 'লিফটম্যান'], ELECTRICIAN: ['Electrician', 'ইলেকট্রিশিয়ান'], PLUMBER: ['Plumber', 'প্লাম্বার'],
  GARDENER: ['Gardener', 'মালি'], DRIVER: ['Driver', 'ড্রাইভার'], MANAGER: ['Manager', 'ম্যানেজার'], OTHER: ['Other', 'অন্যান্য'],
};
const SHIFTS: Record<string, [string, string]> = { GENERAL: ['General', 'সাধারণ'], DAY: ['Day', 'দিন'], NIGHT: ['Night', 'রাত'], ROTATING: ['Rotating', 'পালাক্রমে'] };
const ATT: Record<string, [string, string, string, string]> = {
  PRESENT: ['Present', 'উপস্থিত', 'P', '#16a34a'], ABSENT: ['Absent', 'অনুপস্থিত', 'A', '#dc2626'],
  LEAVE: ['Paid leave', 'ছুটি', 'L', '#2563eb'], HALF_DAY: ['Half day', 'অর্ধদিবস', 'H', '#d97706'],
};
const FESTIVALS = ['Eid-ul-Fitr bonus', 'Eid-ul-Adha bonus', 'Durga Puja bonus', 'Christmas bonus', 'Buddha Purnima bonus', 'Pohela Boishakh bonus'];

export default function BuildingStaff() {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [tab, setTab] = useState<Tab>('staff');
  const [staff, setStaff] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const { show, node } = useToast();
  const load = () => api.get('/ops/staff').then((r: any) => { setStaff(r.rows); setSummary(r.summary); }).catch((e: any) => { setStaff([]); show(false, e.message); });
  useEffect(() => { load(); }, []);
  const role = (r: string) => ROLES[r]?.[bn ? 1 : 0] || r;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-user-shield" title={t('Building Staff & Payroll', 'ভবনের কর্মী ও বেতন')}
        subtitle={t('Guards, caretaker, cleaners and lift operators: daily attendance, salary advances, and monthly payslips with festival bonus.', 'প্রহরী, কেয়ারটেকার, পরিচ্ছন্নতাকর্মী ও লিফটম্যান: দৈনিক হাজিরা, অগ্রিম বেতন, উৎসব বোনাসসহ মাসিক বেতন।')} />
      <div className="stats-grid">
        <Stat icon="fa-solid fa-people-group" value={summary?.active ?? '…'} label={t('Active staff', 'বর্তমান কর্মী')} />
        <Stat icon="fa-solid fa-money-bill-wave" value={summary ? money(summary.monthly_payroll_bdt) : '…'} label={t('Monthly salary bill', 'মাসিক বেতন')} tone="success" />
        <Stat icon="fa-solid fa-hand-holding-dollar" value={summary ? money(summary.open_advances_bdt) : '…'} label={t('Advances to recover', 'আদায়যোগ্য অগ্রিম')} tone="warning" />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'staff', label: t('Staff', 'কর্মী'), icon: 'fa-solid fa-id-badge' },
        { key: 'attendance', label: t('Daily attendance', 'দৈনিক হাজিরা'), icon: 'fa-solid fa-calendar-check' },
        { key: 'register', label: t('Monthly register', 'মাসিক হাজিরা খাতা'), icon: 'fa-solid fa-table-cells' },
        { key: 'advances', label: t('Advances', 'অগ্রিম'), icon: 'fa-solid fa-hand-holding-dollar' },
        { key: 'payroll', label: t('Payroll', 'বেতন'), icon: 'fa-solid fa-file-invoice-dollar' },
      ]} />
      {tab === 'staff' && <StaffTab show={show} rows={staff} reload={load} role={role} />}
      {tab === 'attendance' && <AttendanceTab show={show} role={role} />}
      {tab === 'register' && <RegisterTab show={show} role={role} />}
      {tab === 'advances' && <AdvancesTab show={show} staff={staff || []} reload={load} />}
      {tab === 'payroll' && <PayrollTab show={show} role={role} reload={load} />}
    </div>
  );
}

const blankStaff = { full_name: '', role: 'GUARD', shift: 'GENERAL', phone: '', nid_no: '', permanent_address: '', emergency_contact: '', join_date: todayStr(), monthly_salary_bdt: '', payment_method: 'CASH', wallet_or_account: '', agency_name: '', notes: '' };

function StaffTab({ show, rows, reload, role }: { show: Notify; rows: any[] | null; reload: () => void; role: (r: string) => string }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState<any>(null);
  const [showLeft, setShowLeft] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const inp = (k: string, props: any = {}) => <input className="form-control" value={form[k] ?? ''} onChange={e => set(k, e.target.value)} {...props} />;
  const save = async () => { if (await run(show, api.post('/ops/staff', form))) { setForm(null); reload(); } };
  const leave = async (r: any) => {
    const d = prompt(t(`Last working day for ${r.full_name} (YYYY-MM-DD)`, `${r.full_name}-এর শেষ কর্মদিবস (YYYY-MM-DD)`), todayStr());
    if (d && await run(show, api.post(`/ops/staff/${r.id_staff}/leave`, { leave_date: d }))) reload();
  };
  const rejoin = async (r: any) => { if (await run(show, api.post(`/ops/staff/${r.id_staff}/rejoin`))) reload(); };
  const remove = async (r: any) => { if (confirm(t(`Delete ${r.full_name}?`, `${r.full_name}-কে মুছবেন?`)) && await run(show, api.delete(`/ops/staff/${r.id_staff}`))) reload(); };
  const list = (rows || []).filter(r => showLeft || r.status === 'ACTIVE');
  const phoneBad = form?.phone && !isValidBdMobile(form.phone);

  return (
    <div className="card">
      <div className="card-header flex-between">
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={showLeft} onChange={e => setShowLeft(e.target.checked)} /> {t('Show former staff', 'সাবেক কর্মী দেখান')}</label>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...blankStaff, join_date: todayStr() })}><i className="fa-solid fa-user-plus" /> {t('Add staff', 'কর্মী যোগ')}</button>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{t('Name', 'নাম')}</th><th>{t('Role', 'পদ')}</th><th>{t('Shift', 'শিফট')}</th><th>{t('Joined', 'যোগদান')}</th><th className="text-right">{t('Salary', 'বেতন')}</th><th>{t('Paid by', 'বেতন মাধ্যম')}</th><th className="text-right">{t('Advance due', 'অগ্রিম বাকি')}</th><th /></tr></thead>
        <tbody>
          {rows === null && <Empty cols={8} text={t('Loading…')} />}
          {rows && list.length === 0 && <Empty cols={8} text={t('No staff yet. Add guards, caretaker and cleaners with "Add staff".', 'এখনো কোনো কর্মী নেই। "কর্মী যোগ" দিয়ে শুরু করুন।')} />}
          {list.map(r => (
            <tr key={r.id_staff} style={r.status === 'LEFT' ? { opacity: 0.55 } : undefined}>
              <td><div className="fw-semibold">{r.full_name}</div><div className="text-xs text-muted">{r.phone}{r.agency_name ? ` · ${r.agency_name}` : ''}</div></td>
              <td>{role(r.role)}</td><td>{SHIFTS[r.shift]?.[lang === 'bn' ? 1 : 0]}</td>
              <td>{fmtDate(r.join_date)}{r.status === 'LEFT' && <div className="text-xs text-muted">{t('left', 'চলে গেছেন')} {fmtDate(r.leave_date)}</div>}</td>
              <td className="text-right">{money(r.monthly_salary_bdt)}</td>
              <td>{r.payment_method}{r.wallet_or_account ? <div className="text-xs text-muted">{r.wallet_or_account}</div> : null}</td>
              <td className="text-right">{r.open_advance_bdt > 0 ? <span className="text-warning fw-semibold">{money(r.open_advance_bdt)}</span> : '—'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-light btn-sm" onClick={() => setForm({ ...blankStaff, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? ''])), join_date: inputDate(r.join_date) })}>{t('Edit')}</button>{' '}
                {r.status === 'ACTIVE' ? <button className="btn btn-light btn-sm" title={t('Mark as left', 'চাকরি ছেড়েছেন')} aria-label="Mark as left" onClick={() => leave(r)}><i className="fa-solid fa-user-minus" /></button>
                  : <button className="btn btn-light btn-sm" onClick={() => rejoin(r)}>{t('Rejoin', 'পুনরায় যোগদান')}</button>}{' '}
                <button className="btn btn-light btn-sm" aria-label="Delete staff" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {form && (
        <Modal title={form.id_staff ? t('Edit staff', 'কর্মী সম্পাদনা') : t('New staff member', 'নতুন কর্মী')} onClose={() => setForm(null)} footer={<>
          <button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel')}</button>
          <button className="btn btn-primary" disabled={!form.full_name || form.monthly_salary_bdt === '' || phoneBad} onClick={save}>{t('Save')}</button>
        </>}>
          <div className="form-row cols-2">
            <Field label={t('Full name', 'পূর্ণ নাম')} required>{inp('full_name')}</Field>
            <Field label={t('Role', 'পদ')} required><select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{lang === 'bn' ? v[1] : v[0]}</option>)}</select></Field>
            <Field label={t('Shift', 'শিফট')}><select className="form-select" value={form.shift} onChange={e => set('shift', e.target.value)}>{Object.entries(SHIFTS).map(([k, v]) => <option key={k} value={k}>{lang === 'bn' ? v[1] : v[0]}</option>)}</select></Field>
            <Field label={t('Monthly salary (৳)', 'মাসিক বেতন (৳)')} required>{inp('monthly_salary_bdt', { type: 'number', min: 0 })}</Field>
            <Field label={t('Mobile', 'মোবাইল')} hint={phoneBad ? t('Use 01XXXXXXXXX', '01XXXXXXXXX লিখুন') : undefined}>{inp('phone', { inputMode: 'tel' })}</Field>
            <Field label={t('NID number', 'এনআইডি নম্বর')}>{inp('nid_no', { inputMode: 'numeric' })}</Field>
            <Field label={t('Joining date', 'যোগদানের তারিখ')}>{inp('join_date', { type: 'date' })}</Field>
            <Field label={t('Security agency (if outsourced)', 'সিকিউরিটি এজেন্সি (যদি থাকে)')}>{inp('agency_name')}</Field>
            <Field label={t('Salary paid by', 'বেতন প্রদানের মাধ্যম')}><MethodSelect value={form.payment_method} onChange={v => set('payment_method', v)} /></Field>
            <Field label={t('bKash/Nagad no. or bank account', 'বিকাশ/নগদ নম্বর বা ব্যাংক হিসাব')}>{inp('wallet_or_account')}</Field>
            <Field label={t('Emergency contact', 'জরুরি যোগাযোগ')}>{inp('emergency_contact', { placeholder: t('Name, relation, mobile', 'নাম, সম্পর্ক, মোবাইল') })}</Field>
            <Field label={t('Permanent address', 'স্থায়ী ঠিকানা')}>{inp('permanent_address')}</Field>
          </div>
          <Field label={t('Notes', 'মন্তব্য')}>{inp('notes')}</Field>
        </Modal>
      )}
    </div>
  );
}

function AttendanceTab({ show, role }: { show: Notify; role: (r: string) => string }) {
  const { t, lang } = useLang();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<any[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const load = () => api.get('/ops/staff/attendance', { params: { date } }).then((r: any) => { setRows(r.rows); setDirty(false); }).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { load(); }, [date]);
  const set = (id: number, k: string, v: any) => { setRows(rs => rs!.map(r => (r.id_staff === id ? { ...r, [k]: v } : r))); setDirty(true); };
  const allPresent = () => { setRows(rs => rs!.map(r => ({ ...r, status: r.status || 'PRESENT' }))); setDirty(true); };
  const save = async () => { if (await run(show, api.post('/ops/staff/attendance', { date, entries: rows!.filter(r => r.status) }))) load(); };

  return (
    <div className="card">
      <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <input type="date" className="form-control" style={{ width: 180 }} value={date} max={todayStr()} onChange={e => setDate(e.target.value)} aria-label="Date" />
        <div className="flex gap-2">
          <button className="btn btn-light btn-sm" onClick={allPresent}>{t('Mark the rest present', 'বাকিদের উপস্থিত দিন')}</button>
          <button className="btn btn-primary btn-sm" disabled={!dirty} onClick={save}><i className="fa-solid fa-floppy-disk" /> {t('Save attendance', 'হাজিরা সংরক্ষণ')}</button>
        </div>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{t('Name', 'নাম')}</th><th>{t('Role', 'পদ')}</th><th>{t('Attendance', 'হাজিরা')}</th><th>{t('Overtime (hours)', 'ওভারটাইম (ঘণ্টা)')}</th><th>{t('Note', 'মন্তব্য')}</th></tr></thead>
        <tbody>
          {rows === null && <Empty cols={5} text={t('Loading…')} />}
          {rows?.length === 0 && <Empty cols={5} text={t('No staff on the rolls on this date.', 'এই তারিখে কোনো কর্মী নেই।')} />}
          {rows?.map(r => (
            <tr key={r.id_staff}>
              <td className="fw-semibold">{r.full_name}</td><td>{role(r.role)}</td>
              <td><div className="flex gap-2" role="radiogroup" aria-label={`Attendance for ${r.full_name}`}>{Object.entries(ATT).map(([k, [en, bnL, , color]]) => (
                <button key={k} type="button" role="radio" aria-checked={r.status === k} className="btn btn-sm" onClick={() => set(r.id_staff, 'status', k)}
                  style={r.status === k ? { background: color, color: '#fff', borderColor: color } : { background: '#fff', border: '1px solid var(--gray-200)', color: 'var(--gray-700)' }}>{lang === 'bn' ? bnL : en}</button>
              ))}</div></td>
              <td><input type="number" min={0} max={16} step={0.5} className="form-control" style={{ width: 90 }} aria-label="Overtime hours" value={r.overtime_hours || ''} onChange={e => set(r.id_staff, 'overtime_hours', e.target.value)} /></td>
              <td><input className="form-control" aria-label="Note" value={r.note} onChange={e => set(r.id_staff, 'note', e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div className="text-xs text-muted p-3">{t('Absent and half days are deducted from salary; paid leave is not. Days not marked count as present.', 'অনুপস্থিত ও অর্ধদিবস বেতন থেকে কাটা হয়; ছুটি নয়। চিহ্ন না দেওয়া দিন উপস্থিত ধরা হয়।')}</div>
    </div>
  );
}

function RegisterTab({ show, role }: { show: Notify; role: (r: string) => string }) {
  const { t } = useLang();
  const [month, setMonth] = useState(thisMonth());
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/ops/staff/attendance/month', { params: { month } }).then(setD).catch((e: any) => show(false, e.message)); }, [month]);
  const days = d ? Array.from({ length: d.days_in_month }, (_, i) => i + 1) : [];
  const weekday = (day: number) => new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, day).getDay();
  return (
    <div className="card">
      <div className="card-header flex gap-2" style={{ alignItems: 'center' }}>
        <button className="btn btn-light btn-sm" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}><i className="fa-solid fa-chevron-left" /></button>
        <input type="month" className="form-control" style={{ width: 170 }} value={month} onChange={e => setMonth(e.target.value)} aria-label="Month" />
        <button className="btn btn-light btn-sm" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}><i className="fa-solid fa-chevron-right" /></button>
        <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{Object.entries(ATT).map(([k, v]) => <span key={k} style={{ marginLeft: 10 }}><b style={{ color: v[3] }}>{v[2]}</b> {t(v[0], v[1])}</span>)} · <span style={{ background: '#fef3c7', padding: '0 4px' }}>{t('Friday', 'শুক্রবার')}</span></span>
      </div>
      <div className="table-wrapper"><table style={{ fontSize: '0.75rem' }}>
        <thead><tr><th>{t('Name', 'নাম')}</th>{days.map(x => <th key={x} className="text-center" style={{ padding: '6px 2px', background: weekday(x) === 5 ? '#fef3c7' : undefined }}>{x}</th>)}
          <th className="text-center">P</th><th className="text-center">A</th><th className="text-center">L</th><th className="text-center">H</th><th className="text-center">OT</th></tr></thead>
        <tbody>
          {!d && <Empty cols={6} text={t('Loading…')} />}
          {d?.rows.length === 0 && <Empty cols={days.length + 6} text={t('No staff this month.', 'এই মাসে কোনো কর্মী নেই।')} />}
          {d?.rows.map((r: any) => (
            <tr key={r.id_staff}>
              <td style={{ whiteSpace: 'nowrap' }}><b>{r.full_name}</b><div className="text-xs text-muted">{role(r.role)}</div></td>
              {days.map(x => { const s = r.days[x]; return <td key={x} className="text-center" style={{ padding: '6px 2px', fontWeight: 700, color: s ? ATT[s][3] : '#cbd5e1', background: weekday(x) === 5 ? '#fffbeb' : undefined }}>{s ? ATT[s][2] : '·'}</td>; })}
              <td className="text-center">{r.present}</td><td className="text-center text-danger">{r.absent}</td><td className="text-center">{r.leave}</td><td className="text-center">{r.half}</td><td className="text-center">{r.ot_hours || ''}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

function AdvancesTab({ show, staff, reload }: { show: Notify; staff: any[]; reload: () => void }) {
  const { t } = useLang();
  const [rows, setRows] = useState<any[] | null>(null);
  const [form, setForm] = useState<any>(null);
  const load = () => api.get('/ops/staff/advances').then((r: any) => setRows(r.rows)).catch((e: any) => { setRows([]); show(false, e.message); });
  useEffect(() => { load(); }, []);
  const save = async () => { if (await run(show, api.post('/ops/staff/advances', form))) { setForm(null); load(); reload(); } };
  const remove = async (r: any) => { if (confirm(t('Delete this advance?', 'এই অগ্রিম মুছবেন?')) && await run(show, api.delete(`/ops/staff/advances/${r.id_staff_advances}`))) { load(); reload(); } };
  return (
    <div className="card">
      <div className="card-header flex-between"><div className="text-sm text-muted">{t('Advances are recovered automatically from the next payslips.', 'অগ্রিম পরবর্তী বেতন থেকে স্বয়ংক্রিয়ভাবে কাটা হয়।')}</div>
        <button className="btn btn-primary btn-sm" disabled={!staff.some(s => s.status === 'ACTIVE')} onClick={() => setForm({ id_staff: '', amount_bdt: '', given_on: todayStr(), monthly_recovery_bdt: '', reason: '' })}><i className="fa-solid fa-plus" /> {t('Give advance', 'অগ্রিম দিন')}</button></div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{t('Date')}</th><th>{t('Name', 'নাম')}</th><th>{t('Reason')}</th><th className="text-right">{t('Amount')}</th><th className="text-right">{t('Per month', 'মাসিক কিস্তি')}</th><th className="text-right">{t('Recovered', 'আদায়')}</th><th>{t('Status')}</th><th /></tr></thead>
        <tbody>
          {rows === null && <Empty cols={8} text={t('Loading…')} />}
          {rows?.length === 0 && <Empty cols={8} text={t('No advances given.', 'কোনো অগ্রিম দেওয়া হয়নি।')} />}
          {rows?.map(r => (
            <tr key={r.id_staff_advances}>
              <td>{fmtDate(r.given_on)}</td><td className="fw-semibold">{r.full_name}</td><td>{r.reason || '—'}</td>
              <td className="text-right">{money(r.amount_bdt)}</td><td className="text-right">{Number(r.monthly_recovery_bdt) > 0 ? money(r.monthly_recovery_bdt) : t('All at once', 'একবারে')}</td>
              <td className="text-right">{money(r.recovered_bdt)}</td>
              <td><span className={`badge ${r.status === 'SETTLED' ? 'badge-success' : 'badge-warning'}`}>{r.status === 'SETTLED' ? t('Settled', 'পরিশোধিত') : t('Open', 'চলমান')}</span></td>
              <td>{Number(r.recovered_bdt) === 0 && <button className="btn btn-light btn-sm" aria-label="Delete advance" onClick={() => remove(r)}><i className="fa-solid fa-trash" /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {form && (
        <Modal title={t('Salary advance', 'অগ্রিম বেতন')} onClose={() => setForm(null)} footer={<>
          <button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel')}</button>
          <button className="btn btn-primary" disabled={!form.id_staff || !(Number(form.amount_bdt) > 0)} onClick={save}>{t('Save')}</button>
        </>}>
          <div className="form-row cols-2">
            <Field label={t('Staff member', 'কর্মী')} required><select className="form-select" value={form.id_staff} onChange={e => setForm({ ...form, id_staff: e.target.value })}>
              <option value="" disabled>—</option>{staff.filter(s => s.status === 'ACTIVE').map(s => <option key={s.id_staff} value={s.id_staff}>{s.full_name}</option>)}</select></Field>
            <Field label={t('Amount (৳)', 'পরিমাণ (৳)')} required><input type="number" min={0} className="form-control" value={form.amount_bdt} onChange={e => setForm({ ...form, amount_bdt: e.target.value })} /></Field>
            <Field label={t('Given on', 'প্রদানের তারিখ')}><input type="date" className="form-control" value={form.given_on} onChange={e => setForm({ ...form, given_on: e.target.value })} /></Field>
            <Field label={t('Recover per month (৳)', 'মাসিক কর্তন (৳)')} hint={t('Leave blank to recover it all from the next payslip', 'ফাঁকা রাখলে পরের বেতন থেকে পুরোটা কাটা হবে')}><input type="number" min={0} className="form-control" value={form.monthly_recovery_bdt} onChange={e => setForm({ ...form, monthly_recovery_bdt: e.target.value })} /></Field>
          </div>
          <Field label={t('Reason')}><input className="form-control" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}

function PayrollTab({ show, role, reload }: { show: Notify; role: (r: string) => string; reload: () => void }) {
  const { t, lang } = useLang();
  const [month, setMonth] = useState(shiftMonth(thisMonth(), -1));
  const [bonus, setBonus] = useState({ on: false, label: FESTIVALS[0], percent: '100' });
  const [otMult, setOtMult] = useState('2');
  const [slips, setSlips] = useState<any[] | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [pay, setPay] = useState<any>(null);
  const [adjust, setAdjust] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const body = () => ({ salary_month: month, bonus_label: bonus.on ? bonus.label : null, bonus_percent: bonus.on ? Number(bonus.percent) : 0, overtime_multiplier: Number(otMult) });

  const load = () => { setPreview(null); api.get('/ops/staff/payslips', { params: { month } }).then((r: any) => setSlips(r.rows)).catch((e: any) => { setSlips([]); show(false, e.message); }); };
  useEffect(() => { load(); }, [month]);
  const doPreview = async () => { setBusy(true); try { setPreview(await api.post('/ops/staff/payroll/preview', body())); } catch (e: any) { show(false, e.message); } setBusy(false); };
  const generate = async () => { setBusy(true); if (await run(show, api.post('/ops/staff/payroll/generate', body()))) load(); setBusy(false); };
  const doPay = async () => { if (await run(show, api.post(`/ops/staff/payslips/${pay.id_payslips}/pay`, pay))) { setPay(null); load(); reload(); } };
  const doAdjust = async () => { if (await run(show, api.post(`/ops/staff/payslips/${adjust.id_payslips}/adjust`, adjust))) { setAdjust(null); load(); } };
  const remove = async (s: any) => { if (confirm(t('Delete this draft payslip?', 'এই খসড়া বেতন স্লিপ মুছবেন?')) && await run(show, api.delete(`/ops/staff/payslips/${s.id_payslips}`))) load(); };
  const printSlip = (s: any) => {
    // Not 'noopener': that makes window.open return null and we need the handle to write the slip.
    const w = window.open('', '_blank', 'width=700,height=800');
    if (!w) { show(false, t('Allow pop-ups to print the payslip', 'স্লিপ প্রিন্টের জন্য পপ-আপ অনুমতি দিন')); return; }
    w.opener = null;
    const esc = (v: any) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const row = (k: string, v: any, neg = false) => `<tr><td>${esc(k)}</td><td style="text-align:right">${neg && Number(v) ? '− ' : ''}${money(v, 2)}</td></tr>`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Payslip ${esc(s.full_name)} ${esc(s.salary_month)}</title><style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:6px}h2{margin:0}.tot td{font-weight:700;border-top:2px solid #111}</style></head><body>
      <h2>Salary slip · ${esc(monthName(s.salary_month))}</h2><p><b>${esc(s.full_name)}</b> · ${esc(role(s.role))}${s.nid_no ? ` · NID ${esc(s.nid_no)}` : ''}</p>
      <table>${row('Basic salary', s.basic_bdt)}${row(`Unpaid days (${Number(s.unpaid_days)} of ${s.days_in_month})`, s.absence_deduction_bdt, true)}${row(`Overtime (${Number(s.overtime_hours)} h)`, s.overtime_bdt)}${row(s.bonus_label || 'Bonus', s.bonus_bdt)}${row('Advance recovery', s.advance_recovery_bdt, true)}${row('Other deduction', s.other_deduction_bdt, true)}
      <tr class="tot"><td>Net pay</td><td style="text-align:right">${money(s.net_pay_bdt, 2)}</td></tr></table>
      <p>${s.status === 'PAID' ? `Paid on ${esc(fmtDate(s.paid_on))} by ${esc(s.payment_method)}${s.payment_ref ? ` (${esc(s.payment_ref)})` : ''}` : 'Not paid yet'}</p>
      <div style="display:flex;justify-content:space-between;margin-top:60px"><span style="border-top:1px solid #333;padding-top:4px">Received by</span><span style="border-top:1px solid #333;padding-top:4px">Authorised by</span></div>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  const total = (slips || []).reduce((s, x) => s + Number(x.net_pay_bdt), 0);
  const paidTotal = (slips || []).filter(x => x.status === 'PAID').reduce((s, x) => s + Number(x.net_pay_bdt), 0);

  return (
    <>
      <div className="card mb-4"><div className="card-body">
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label={t('Salary month', 'বেতনের মাস')}><input type="month" className="form-control" style={{ width: 170 }} value={month} onChange={e => setMonth(e.target.value)} /></Field>
          <Field label={t('Overtime rate (× hourly basic)', 'ওভারটাইম হার (ঘণ্টাপ্রতি মূল বেতনের গুণ)')}><input type="number" min={1} step={0.5} className="form-control" style={{ width: 120 }} value={otMult} onChange={e => setOtMult(e.target.value)} /></Field>
          <div className="form-group"><label className="flex gap-2 text-sm"><input type="checkbox" checked={bonus.on} onChange={e => setBonus({ ...bonus, on: e.target.checked })} /> {t('Add festival bonus', 'উৎসব বোনাস যোগ')}</label>
            {bonus.on && <div className="flex gap-2 mt-1">
              <select className="form-select" style={{ width: 200 }} aria-label="Bonus name" value={bonus.label} onChange={e => setBonus({ ...bonus, label: e.target.value })}>{FESTIVALS.map(f => <option key={f}>{f}</option>)}</select>
              <input type="number" min={0} max={200} className="form-control" style={{ width: 90 }} aria-label="Bonus percent of basic" value={bonus.percent} onChange={e => setBonus({ ...bonus, percent: e.target.value })} /><span className="text-sm" style={{ alignSelf: 'center' }}>{t('% of basic', '% মূল বেতনের')}</span>
            </div>}</div>
          <div className="form-group flex gap-2">
            <button className="btn btn-outline" disabled={busy} onClick={doPreview}><i className="fa-solid fa-calculator" /> {t('Calculate', 'হিসাব করুন')}</button>
            <button className="btn btn-primary" disabled={busy} onClick={generate}><i className="fa-solid fa-file-circle-plus" /> {t('Create / update payslips', 'বেতন স্লিপ তৈরি / হালনাগাদ')}</button>
          </div>
        </div>
        <div className="text-xs text-muted">{t('Per-day rate = basic ÷ days in month. Overtime = hourly basic (per-day ÷ 8) × rate; Labour Act s.108 uses 2×. Paid payslips are never recalculated.', 'দৈনিক হার = মূল বেতন ÷ মাসের দিন। ওভারটাইম = ঘণ্টাপ্রতি মূল বেতন (দৈনিক ÷ ৮) × হার; শ্রম আইন ধারা ১০৮ অনুযায়ী ২ গুণ। পরিশোধিত স্লিপ আর হিসাব হয় না।')}</div>
        {preview && (
          <div className="table-wrapper mt-4"><table>
            <thead><tr><th>{t('Name', 'নাম')}</th><th className="text-right">{t('Basic', 'মূল')}</th><th className="text-right">{t('Unpaid days', 'বেতনহীন দিন')}</th><th className="text-right">{t('Deduction', 'কর্তন')}</th><th className="text-right">{t('Overtime', 'ওভারটাইম')}</th><th className="text-right">{t('Bonus', 'বোনাস')}</th><th className="text-right">{t('Advance', 'অগ্রিম')}</th><th className="text-right">{t('Net pay', 'নিট বেতন')}</th><th /></tr></thead>
            <tbody>{preview.rows.map((r: any) => (
              <tr key={r.id_staff}><td className="fw-semibold">{r.full_name}</td><td className="text-right">{money(r.basic_bdt)}</td><td className="text-right">{r.unpaid_days}</td>
                <td className="text-right text-danger">{r.absence_deduction_bdt ? `− ${money(r.absence_deduction_bdt)}` : '—'}</td><td className="text-right">{r.overtime_bdt ? money(r.overtime_bdt) : '—'}</td>
                <td className="text-right">{r.bonus_bdt ? money(r.bonus_bdt) : '—'}</td><td className="text-right text-danger">{r.advance_recovery_bdt ? `− ${money(r.advance_recovery_bdt)}` : '—'}</td>
                <td className="text-right fw-bold">{money(r.net_pay_bdt)}</td><td>{r.existing_status === 'PAID' && <span className="badge badge-gray">{t('already paid', 'পরিশোধিত')}</span>}</td></tr>
            ))}</tbody>
            <tfoot><tr className="fw-bold"><td colSpan={7} className="text-right">{t('Total')}</td><td className="text-right">{money(preview.total_net_bdt)}</td><td /></tr></tfoot>
          </table></div>
        )}
      </div></div>

      <div className="card">
        <div className="card-header flex-between"><div className="card-title">{t('Payslips', 'বেতন স্লিপ')} · {monthName(month, lang === 'bn')}</div>
          <div className="text-sm">{t('Paid', 'পরিশোধিত')} <b>{money(paidTotal)}</b> {t('of', '/')} <b>{money(total)}</b></div></div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Name', 'নাম')}</th><th>{t('Role', 'পদ')}</th><th className="text-right">{t('Basic', 'মূল')}</th><th className="text-right">{t('Additions', 'সংযোজন')}</th><th className="text-right">{t('Deductions', 'কর্তন')}</th><th className="text-right">{t('Net pay', 'নিট বেতন')}</th><th>{t('Status')}</th><th /></tr></thead>
          <tbody>
            {slips === null && <Empty cols={8} text={t('Loading…')} />}
            {slips?.length === 0 && <Empty cols={8} text={t('No payslips for this month. Press "Create / update payslips".', 'এই মাসের স্লিপ নেই। "বেতন স্লিপ তৈরি" চাপুন।')} />}
            {slips?.map(s => {
              const add = Number(s.overtime_bdt) + Number(s.bonus_bdt);
              const ded = Number(s.absence_deduction_bdt) + Number(s.advance_recovery_bdt) + Number(s.other_deduction_bdt);
              return (
                <tr key={s.id_payslips}>
                  <td className="fw-semibold">{s.full_name}<div className="text-xs text-muted">{s.wallet_or_account}</div></td><td>{role(s.role)}</td>
                  <td className="text-right">{money(s.basic_bdt)}</td>
                  <td className="text-right">{add ? money(add) : '—'}{Number(s.bonus_bdt) > 0 && <div className="text-xs text-muted">{s.bonus_label}</div>}</td>
                  <td className="text-right text-danger">{ded ? `− ${money(ded)}` : '—'}</td>
                  <td className="text-right fw-bold">{money(s.net_pay_bdt)}</td>
                  <td>{s.status === 'PAID' ? <span className="badge badge-success">{t('Paid')} {fmtDate(s.paid_on)}</span> : <span className="badge badge-warning">{t('Draft', 'খসড়া')}</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {s.status === 'DRAFT' && <><button className="btn btn-success btn-sm" onClick={() => setPay({ ...s, paid_on: todayStr(), payment_method: s.default_method || 'CASH', payment_ref: '' })}>{t('Pay', 'পরিশোধ')}</button>{' '}
                      <button className="btn btn-light btn-sm" onClick={() => setAdjust({ id_payslips: s.id_payslips, full_name: s.full_name, bonus_bdt: Number(s.bonus_bdt), bonus_label: s.bonus_label || '', other_deduction_bdt: Number(s.other_deduction_bdt) })}>{t('Adjust', 'সমন্বয়')}</button>{' '}</>}
                    <button className="btn btn-light btn-sm" aria-label="Print payslip" onClick={() => printSlip(s)}><i className="fa-solid fa-print" /></button>{' '}
                    {s.status === 'DRAFT' && <button className="btn btn-light btn-sm" aria-label="Delete payslip" onClick={() => remove(s)}><i className="fa-solid fa-trash" /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {pay && (
        <Modal title={`${t('Pay salary', 'বেতন পরিশোধ')} · ${pay.full_name} · ${money(pay.net_pay_bdt)}`} onClose={() => setPay(null)} footer={<>
          <button className="btn btn-light" onClick={() => setPay(null)}>{t('Cancel')}</button>
          <button className="btn btn-success" onClick={doPay}><i className="fa-solid fa-check" /> {t('Mark as paid', 'পরিশোধিত চিহ্নিত করুন')}</button>
        </>}>
          <div className="form-row cols-2">
            <Field label={t('Paid on', 'পরিশোধের তারিখ')}><input type="date" className="form-control" value={pay.paid_on} onChange={e => setPay({ ...pay, paid_on: e.target.value })} /></Field>
            <Field label={t('Method', 'মাধ্যম')}><MethodSelect value={pay.payment_method} onChange={v => setPay({ ...pay, payment_method: v })} /></Field>
            <Field label={t('Transaction ID / reference', 'ট্রানজেকশন আইডি')}><input className="form-control" value={pay.payment_ref} onChange={e => setPay({ ...pay, payment_ref: e.target.value })} /></Field>
          </div>
          {Number(pay.advance_recovery_bdt) > 0 && <div className="alert alert-info">{money(pay.advance_recovery_bdt)} {t('will be booked against this person’s open advances.', 'এই কর্মীর চলমান অগ্রিম থেকে সমন্বয় হবে।')}</div>}
        </Modal>
      )}
      {adjust && (
        <Modal title={`${t('Adjust payslip', 'স্লিপ সমন্বয়')} · ${adjust.full_name}`} onClose={() => setAdjust(null)} footer={<>
          <button className="btn btn-light" onClick={() => setAdjust(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={doAdjust}>{t('Save')}</button>
        </>}>
          <div className="form-row cols-2">
            <Field label={t('Bonus (৳)', 'বোনাস (৳)')}><input type="number" min={0} className="form-control" value={adjust.bonus_bdt} onChange={e => setAdjust({ ...adjust, bonus_bdt: e.target.value })} /></Field>
            <Field label={t('Bonus name', 'বোনাসের নাম')}><input className="form-control" value={adjust.bonus_label} onChange={e => setAdjust({ ...adjust, bonus_label: e.target.value })} /></Field>
            <Field label={t('Other deduction (৳)', 'অন্যান্য কর্তন (৳)')} hint={t('E.g. damaged property, uniform', 'যেমন: ক্ষতিগ্রস্ত সম্পদ, ইউনিফর্ম')}><input type="number" min={0} className="form-control" value={adjust.other_deduction_bdt} onChange={e => setAdjust({ ...adjust, other_deduction_bdt: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}
