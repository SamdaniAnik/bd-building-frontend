import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { isValidBdMobile } from '../../utils/bd';
import { Empty, Field, Modal, PageHeader, Stat, UnitSelect, dateTime, money, run, useToast, useUnits, Notify, Unit } from './shared';
import { ACTIVE, CATEGORIES, PRIORITIES, SOURCES, STATUSES, dueText, hoursLabel, ticketNo } from './helpdeskLabels';

type Staff = { id_staff: number; full_name: string; role: string; phone: string | null };
type Setup = { staff: Staff[]; sla_hours: Record<string, number> };

const VIEWS: [string, string, string][] = [
  ['ACTIVE', 'Active', 'চলমান'], ['OPEN', 'Unassigned', 'দায়িত্বহীন'], ['IN_PROGRESS', 'In progress', 'কাজ চলছে'],
  ['ON_HOLD', 'On hold', 'স্থগিত'], ['DONE', 'Resolved & closed', 'সমাধান ও বন্ধ'], ['ALL', 'All', 'সব'],
];

export default function Helpdesk() {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const { show, node } = useToast();
  const units = useUnits();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<any[] | null>(null);
  const [view, setView] = useState('ACTIVE');
  const [filters, setFilters] = useState({ category: '', priority: '', staff: '', overdue: false, q: '' });
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const setF = (k: string, v: any) => setFilters(x => ({ ...x, [k]: v }));

  const loadSummary = () => api.get('/ops/helpdesk/summary').then(setSummary).catch(() => {});
  const load = () => api.get('/ops/helpdesk/tickets', { params: {
    status: view, category: filters.category || undefined, priority: filters.priority || undefined,
    staff: filters.staff || undefined, overdue: filters.overdue ? 1 : undefined, q: filters.q || undefined,
  } }).then((r: any) => setRows(r.rows)).catch((e: any) => show(false, e.message));
  const refresh = () => { load(); loadSummary(); };

  useEffect(() => { api.get('/ops/helpdesk/setup').then((r: any) => setSetup(r)).catch((e: any) => show(false, e.message)); loadSummary(); }, []);
  useEffect(() => { const h = setTimeout(load, 200); return () => clearTimeout(h); }, [view, filters]);

  const s = summary;
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-headset" title={t('Resident Helpdesk', 'বাসিন্দা হেল্পডেস্ক')}
        subtitle={t('Complaints from flat owners (owner portal) and those taken by phone or at the desk. Assign to building staff, keep residents updated by SMS, and watch the fix-by deadlines.',
          'মালিক পোর্টাল, ফোন বা সরাসরি আসা অভিযোগ। কর্মীকে দায়িত্ব দিন, এসএমএসে বাসিন্দাকে জানান এবং সমাধানের সময়সীমা নজরে রাখুন।')}
        actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><i className="fa-solid fa-plus" /> {t('Log a complaint', 'অভিযোগ লিখুন')}</button>} />

      <div className="stats-grid">
        <Stat icon="fa-solid fa-inbox" value={s?.open ?? '…'} label={t('Active complaints', 'চলমান অভিযোগ')} />
        <Stat icon="fa-solid fa-user-slash" value={s?.unassigned ?? '…'} label={t('Not yet assigned', 'দায়িত্ব দেওয়া হয়নি')} tone="warning" />
        <Stat icon="fa-solid fa-clock" value={s?.overdue ?? '…'} label={t('Past deadline', 'সময়সীমা পেরিয়েছে')} tone="danger" />
        <Stat icon="fa-solid fa-truck-medical" value={s?.emergency ?? '…'} label={t('Emergencies open', 'জরুরি খোলা')} tone="danger" />
        <Stat icon="fa-solid fa-stopwatch" value={s ? (s.avg_resolution_hours != null ? `${s.avg_resolution_hours}h` : '—') : '…'} label={t('Avg. time to fix (30 days)', 'গড় সমাধান সময় (৩০ দিন)')} tone="info" />
        <Stat icon="fa-solid fa-bullseye" value={s ? (s.on_time_percent != null ? `${s.on_time_percent}%` : '—') : '…'} label={t('Fixed on time (30 days)', 'সময়মতো সমাধান (৩০ দিন)')} tone="success" />
        <Stat icon="fa-solid fa-star" value={s ? (s.avg_rating != null ? `${s.avg_rating} / 5` : '—') : '…'} label={t(`Resident rating (${s?.ratings ?? 0})`, `বাসিন্দাদের রেটিং (${s?.ratings ?? 0})`)} tone="warning" />
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }} role="tablist">
            {VIEWS.map(([k, en, b]) => <button key={k} role="tab" aria-selected={view === k} className={`btn btn-sm ${view === k ? 'btn-primary' : 'btn-light'}`} onClick={() => setView(k)}>{bn ? b : en}</button>)}
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="form-control" style={{ width: 240 }} placeholder={t('Search no., title, flat, name, phone', 'নং, বিষয়, ফ্ল্যাট, নাম, ফোন')} value={filters.q} onChange={e => setF('q', e.target.value)} aria-label="Search complaints" />
            <select className="form-select" style={{ width: 180 }} value={filters.category} onChange={e => setF('category', e.target.value)} aria-label="Category">
              <option value="">{t('All categories', 'সব ধরন')}</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}
            </select>
            <select className="form-select" style={{ width: 150 }} value={filters.priority} onChange={e => setF('priority', e.target.value)} aria-label="Priority">
              <option value="">{t('Any priority', 'যেকোনো অগ্রাধিকার')}</option>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}
            </select>
            <select className="form-select" style={{ width: 190 }} value={filters.staff} onChange={e => setF('staff', e.target.value)} aria-label="Assigned to">
              <option value="">{t('Anyone', 'যে কেউ')}</option><option value="none">{t('— Unassigned —', '— দায়িত্বহীন —')}</option>
              {setup?.staff.map(x => <option key={x.id_staff} value={x.id_staff}>{x.full_name}</option>)}
            </select>
            <label className="flex gap-2 text-sm" style={{ alignItems: 'center' }}><input type="checkbox" checked={filters.overdue} onChange={e => setF('overdue', e.target.checked)} /> {t('Past deadline only', 'শুধু সময় পেরোনো')}</label>
          </div>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Complaint', 'অভিযোগ')}</th><th>{t('Flat / reported by', 'ফ্ল্যাট / অভিযোগকারী')}</th><th>{t('Priority', 'অগ্রাধিকার')}</th><th>{t('Status', 'অবস্থা')}</th><th>{t('Assigned to', 'দায়িত্বপ্রাপ্ত')}</th><th>{t('Deadline', 'সময়সীমা')}</th></tr></thead>
          <tbody>
            {!rows && <Empty cols={6} text={t('Loading…')} />}
            {rows?.length === 0 && <Empty cols={6} text={view === 'ACTIVE' ? t('No active complaints. 🎉', 'কোনো চলমান অভিযোগ নেই।') : t('No complaints match.', 'কোনো অভিযোগ মেলেনি।')} />}
            {rows?.map(r => {
              const due = dueText(r.due_by, r.status, bn);
              return (
                <tr key={r.id_tickets} style={{ cursor: 'pointer' }} tabIndex={0} onClick={() => setOpenId(r.id_tickets)} onKeyDown={e => { if (e.key === 'Enter') setOpenId(r.id_tickets); }}>
                  <td>
                    <div className="fw-semibold"><i className={CATEGORIES[r.category]?.[2] || 'fa-solid fa-circle-question'} style={{ color: 'var(--gray-500)', marginRight: 6 }} />{r.title}</div>
                    <div className="text-xs text-muted">{r.ticket_no} · {CATEGORIES[r.category]?.[bn ? 1 : 0] || r.category}{r.location ? ` · ${r.location}` : ''} · {dateTime(r.created_at)}</div>
                  </td>
                  <td>{r.unit_number ? <strong>{r.unit_number}</strong> : <span className="text-muted">{t('Common area', 'কমন এরিয়া')}</span>}
                    <div className="text-xs text-muted">{[r.reporter_name, r.reporter_phone].filter(Boolean).join(' · ') || '—'}{r.source === 'PORTAL' && <> · <i className="fa-solid fa-globe" title="Owner portal" /></>}</div></td>
                  <td><span className={`badge ${PRIORITIES[r.priority]?.[2] || 'badge-gray'}`}>{PRIORITIES[r.priority]?.[bn ? 1 : 0] || r.priority}</span></td>
                  <td><span className={`badge ${STATUSES[r.status]?.[2] || 'badge-gray'}`}>{STATUSES[r.status]?.[bn ? 1 : 0] || r.status}</span>
                    {r.reopen_count > 0 && <div className="text-xs text-muted">{t(`reopened ×${r.reopen_count}`, `পুনরায় খোলা ×${r.reopen_count}`)}</div>}
                    {r.rating && <div className="text-xs" style={{ color: '#d97706' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>}</td>
                  <td>{r.staff_name || <span className="text-muted">—</span>}</td>
                  <td>{due ? <span className={due.late ? 'badge badge-danger' : 'text-sm'}>{due.late && <i className="fa-solid fa-triangle-exclamation" />} {due.text}</span>
                    : r.resolved_at ? <span className="text-xs text-muted">{t('Fixed', 'সমাধান')} {dateTime(r.resolved_at)}</span> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {creating && setup && <NewTicket setup={setup} units={units} show={show} onClose={() => setCreating(false)} onSaved={id => { setCreating(false); refresh(); setOpenId(id); }} />}
      {openId && setup && <TicketDetail id={openId} setup={setup} show={show} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </div>
  );
}

function NewTicket({ setup, units, show, onClose, onSaved }: { setup: Setup; units: Unit[]; show: Notify; onClose: () => void; onSaved: (id: number) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [f, setF] = useState<any>({ id_units: null, title: '', category: 'OTHER', priority: 'MEDIUM', location: '', description: '', reporter_name: '', reporter_phone: '', source: 'PHONE', id_staff: '', notify_sms: true });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const phoneBad = f.reporter_phone && !isValidBdMobile(f.reporter_phone);
  const save = async () => {
    setBusy(true);
    const r = await run<any>(show, api.post('/ops/helpdesk/tickets', { ...f, id_staff: f.id_staff || null }));
    setBusy(false);
    if (r) onSaved(r.id);
  };
  return (
    <Modal title={<><i className="fa-solid fa-headset text-primary" /> {t('Log a complaint', 'অভিযোগ লিখুন')}</>} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-primary" disabled={busy || !f.title.trim() || !f.description.trim() || !!phoneBad} onClick={save}><i className="fa-solid fa-check" /> {t('Save complaint', 'অভিযোগ সংরক্ষণ')}</button>
    </>}>
      <div className="form-row cols-2">
        <Field label={t('Flat', 'ফ্ল্যাট')} hint={t('Leave empty for lifts, roof, parking and other shared areas', 'লিফট, ছাদ, পার্কিং ইত্যাদির জন্য খালি রাখুন')}>
          <UnitSelect units={units} allowEmpty emptyLabel={t('— Common area —', '— কমন এরিয়া —')} value={f.id_units} onChange={v => set('id_units', v)} /></Field>
        <Field label={t('Received by', 'যেভাবে এসেছে')}><select className="form-select" value={f.source} onChange={e => set('source', e.target.value)}>
          {(['PHONE', 'WALK_IN', 'STAFF'] as const).map(k => <option key={k} value={k}>{SOURCES[k][bn ? 1 : 0]}</option>)}</select></Field>
      </div>
      <Field label={t('Category', 'ধরন')}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>{Object.entries(CATEGORIES).map(([k, [en, b, icon]]) => (
          <button key={k} type="button" className={`btn btn-sm ${f.category === k ? 'btn-primary' : 'btn-light'}`} aria-pressed={f.category === k} onClick={() => set('category', k)}><i className={icon} /> {bn ? b : en}</button>
        ))}</div>
      </Field>
      <Field label={t('Short title', 'সংক্ষিপ্ত বিষয়')} required><input className="form-control" maxLength={200} placeholder={t('e.g. No water in kitchen tap', 'যেমন: রান্নাঘরের কলে পানি নেই')} value={f.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label={t('What is the problem?', 'সমস্যাটি কী?')} required><textarea className="form-control" rows={3} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
      <div className="form-row cols-2">
        <Field label={t('Priority', 'অগ্রাধিকার')} hint={t(`Fix within ${hoursLabel(setup.sla_hours[f.priority], false)}`, `${hoursLabel(setup.sla_hours[f.priority], true)}-এর মধ্যে সমাধান`)}>
          <select className="form-select" value={f.priority} onChange={e => set('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}</select></Field>
        <Field label={t('Where exactly', 'ঠিক কোথায়')}><input className="form-control" placeholder={t('Kitchen, Lift 2, Roof tank…', 'রান্নাঘর, লিফট ২, ছাদের ট্যাংক…')} value={f.location} onChange={e => set('location', e.target.value)} /></Field>
        <Field label={t('Reported by', 'অভিযোগকারী')} hint={f.id_units ? t('Leave empty to use the flat owner', 'খালি রাখলে ফ্ল্যাট মালিকের নাম') : undefined}><input className="form-control" value={f.reporter_name} onChange={e => set('reporter_name', e.target.value)} /></Field>
        <Field label={t('Their mobile', 'মোবাইল')} hint={phoneBad ? t('Use 01XXXXXXXXX', '01XXXXXXXXX লিখুন') : undefined}><input className="form-control" inputMode="tel" value={f.reporter_phone} onChange={e => set('reporter_phone', e.target.value)} /></Field>
        <Field label={t('Assign to', 'দায়িত্ব দিন')}><select className="form-select" value={f.id_staff} onChange={e => set('id_staff', e.target.value)}>
          <option value="">{t('— Decide later —', '— পরে ঠিক করুন —')}</option>{setup.staff.map(x => <option key={x.id_staff} value={x.id_staff}>{x.full_name} ({x.role.toLowerCase().replace('_', ' ')})</option>)}</select></Field>
      </div>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.notify_sms} onChange={e => set('notify_sms', e.target.checked)} /> {t('Text the resident the complaint number and deadline', 'বাসিন্দাকে অভিযোগ নম্বর ও সময়সীমা এসএমএস করুন')}</label>
    </Modal>
  );
}

function TicketDetail({ id, setup, show, onClose, onChanged }: { id: number; setup: Setup; show: Notify; onClose: () => void; onChanged: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [f, setF] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const load = () => api.get(`/ops/helpdesk/tickets/${id}`).then((r: any) => {
    setD(r);
    const tk = r.ticket;
    setF({ status: tk.status, id_staff: tk.id_staff ? String(tk.id_staff) : '', priority: tk.priority, repair_cost: tk.repair_cost ?? '', resolution_notes: tk.resolution_notes || '', message: '', is_internal: false, notify_sms: !!tk.reporter_phone });
  }).catch((e: any) => { show(false, e.message); onClose(); });
  useEffect(() => { load(); }, [id]);

  if (!d || !f) return <Modal title={ticketNo(id)} onClose={onClose}><div className="text-muted">{t('Loading…')}</div></Modal>;
  const tk = d.ticket;
  const changed = f.status !== tk.status || f.id_staff !== (tk.id_staff ? String(tk.id_staff) : '') || f.priority !== tk.priority
    || String(f.repair_cost) !== String(tk.repair_cost ?? '') || f.resolution_notes !== (tk.resolution_notes || '') || f.message.trim();
  const closing = ['RESOLVED', 'CLOSED'].includes(f.status);
  const willText = f.notify_sms && !!tk.reporter_phone && (f.status !== tk.status || (f.message.trim() && !f.is_internal));

  const save = async () => {
    setBusy(true);
    const body: any = { message: f.message, is_internal: f.is_internal, notify_sms: f.notify_sms };
    if (f.status !== tk.status) body.status = f.status;
    if (f.id_staff !== (tk.id_staff ? String(tk.id_staff) : '')) body.id_staff = f.id_staff ? Number(f.id_staff) : null;
    if (f.priority !== tk.priority) body.priority = f.priority;
    if (String(f.repair_cost) !== String(tk.repair_cost ?? '')) body.repair_cost = f.repair_cost;
    if (f.resolution_notes !== (tk.resolution_notes || '')) body.resolution_notes = f.resolution_notes;
    const r = await run(show, api.post(`/ops/helpdesk/tickets/${id}/update`, body));
    setBusy(false);
    if (r) { load(); onChanged(); }
  };
  const remove = async () => {
    if (!confirm(t(`Delete ${tk.ticket_no} and its history? This cannot be undone.`, `${tk.ticket_no} ও এর ইতিহাস মুছবেন? এটি ফেরানো যাবে না।`))) return;
    if (await run(show, api.delete(`/ops/helpdesk/tickets/${id}`))) { onChanged(); onClose(); }
  };
  const due = dueText(tk.due_by, tk.status, bn);

  return (
    <Modal wide onClose={onClose} title={<><span className="text-muted">{tk.ticket_no}</span> · {tk.title}</>} footer={<>
      <button className="btn btn-light" style={{ marginRight: 'auto', color: 'var(--danger)' }} onClick={remove}><i className="fa-solid fa-trash" /> {t('Delete')}</button>
      <button className="btn btn-light" onClick={onClose}>{t('Close')}</button>
      <button className="btn btn-primary" disabled={busy || !changed} onClick={save}><i className="fa-solid fa-check" /> {willText ? t('Save & text resident', 'সংরক্ষণ ও এসএমএস') : t('Save')}</button>
    </>}>
      <div className="grid ops-split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 340px)' }}>
        <div>
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge ${STATUSES[tk.status]?.[2]}`}>{STATUSES[tk.status]?.[bn ? 1 : 0] || tk.status}</span>
            <span className={`badge ${PRIORITIES[tk.priority]?.[2]}`}>{PRIORITIES[tk.priority]?.[bn ? 1 : 0]}</span>
            <span className="badge badge-gray"><i className={CATEGORIES[tk.category]?.[2]} /> {CATEGORIES[tk.category]?.[bn ? 1 : 0] || tk.category}</span>
            {due && <span className={`badge ${due.late ? 'badge-danger' : 'badge-gray'}`}><i className="fa-solid fa-clock" /> {due.text}</span>}
            {tk.escalated_at && <span className="badge badge-danger"><i className="fa-solid fa-arrow-up" /> {t('Escalated', 'এসকেলেটেড')}</span>}
          </div>
          <div style={{ background: 'var(--gray-50, #f8fafc)', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: 8, padding: 14, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{tk.description}</div>
          <div className="text-sm text-muted mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
            <div><i className="fa-solid fa-door-open" /> {tk.unit_number ? `${tk.unit_number}${tk.building_name ? ` · ${tk.building_name}` : ''}` : t('Common area', 'কমন এরিয়া')}{tk.location ? ` · ${tk.location}` : ''}</div>
            <div><i className="fa-solid fa-user" /> {tk.reporter_name || '—'}{tk.reporter_phone ? ` · ${tk.reporter_phone}` : ''}</div>
            <div><i className="fa-solid fa-inbox" /> {SOURCES[tk.source]?.[bn ? 1 : 0] || tk.source} · {dateTime(tk.created_at)}</div>
            {tk.rating && <div style={{ color: '#d97706' }}>{'★'.repeat(tk.rating)}{'☆'.repeat(5 - tk.rating)} {tk.rating_comment && <span className="text-muted">“{tk.rating_comment}”</span>}</div>}
          </div>

          <div className="section-heading"><i className="fa-solid fa-comments" /> {t('History', 'ইতিহাস')}</div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {d.updates.map((u: any) => {
              const tone = u.is_internal ? { bg: '#fffbeb', bd: '#fcd34d' } : u.author_type === 'RESIDENT' ? { bg: '#eff6ff', bd: '#93c5fd' } : u.author_type === 'SYSTEM' ? { bg: '#f3f4f6', bd: '#d1d5db' } : { bg: '#fff', bd: '#e5e7eb' };
              return (
                <li key={u.id_ticket_updates} style={{ background: tone.bg, border: `1px solid ${tone.bd}`, borderRadius: 8, padding: '8px 12px' }}>
                  <div className="text-xs text-muted flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--gray-700, #374151)' }}>{u.author_name}</strong>
                    {u.author_type === 'RESIDENT' && <span>· {t('resident', 'বাসিন্দা')}</span>}
                    {u.is_internal ? <span>· <i className="fa-solid fa-lock" /> {t('internal note', 'অভ্যন্তরীণ নোট')}</span> : null}
                    <span>· {dateTime(u.created_at)}</span>
                    {u.to_status && <span>· {u.from_status ? `${STATUSES[u.from_status]?.[bn ? 1 : 0] || u.from_status} → ` : ''}<strong>{STATUSES[u.to_status]?.[bn ? 1 : 0] || u.to_status}</strong></span>}
                  </div>
                  {u.message && <div className="text-sm" style={{ whiteSpace: 'pre-wrap', marginTop: 2 }}>{u.message}</div>}
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <Field label={t('Status', 'অবস্থা')}><select className="form-select" value={f.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]}</option>)}</select></Field>
          <Field label={t('Assigned to', 'দায়িত্বপ্রাপ্ত')} hint={tk.staff_phone ? `${tk.staff_name} · ${tk.staff_phone}` : undefined}><select className="form-select" value={f.id_staff} onChange={e => set('id_staff', e.target.value)}>
            <option value="">{t('— Nobody yet —', '— এখনো কেউ না —')}</option>{setup.staff.map(x => <option key={x.id_staff} value={x.id_staff}>{x.full_name} ({x.role.toLowerCase().replace('_', ' ')})</option>)}</select></Field>
          <Field label={t('Priority', 'অগ্রাধিকার')} hint={f.priority !== tk.priority ? t('The deadline will be recalculated', 'সময়সীমা নতুন করে হিসাব হবে') : undefined}><select className="form-select" value={f.priority} onChange={e => set('priority', e.target.value)}>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]} · {hoursLabel(setup.sla_hours[k], bn)}</option>)}</select></Field>
          {(closing || tk.resolution_notes || Number(tk.repair_cost) > 0) && <>
            <Field label={t('What was done', 'কী করা হয়েছে')}><textarea className="form-control" rows={2} value={f.resolution_notes} onChange={e => set('resolution_notes', e.target.value)} /></Field>
            <Field label={t('Repair cost (৳)', 'মেরামত খরচ (৳)')} hint={Number(tk.repair_cost) > 0 ? money(tk.repair_cost) : undefined}><input type="number" min={0} className="form-control" value={f.repair_cost} onChange={e => set('repair_cost', e.target.value)} /></Field>
          </>}
          <Field label={f.is_internal ? t('Internal note (staff only)', 'অভ্যন্তরীণ নোট (শুধু কর্মী)') : t('Reply to resident', 'বাসিন্দাকে উত্তর')}>
            <textarea className="form-control" rows={3} value={f.message} placeholder={f.is_internal ? t('Only staff will see this', 'শুধু কর্মীরা দেখবেন') : t('Shown on their portal', 'পোর্টালে দেখাবে')} onChange={e => set('message', e.target.value)} style={f.is_internal ? { background: '#fffbeb' } : undefined} /></Field>
          <label className="flex gap-2 text-sm mb-1"><input type="checkbox" checked={f.is_internal} onChange={e => set('is_internal', e.target.checked)} /> <i className="fa-solid fa-lock" /> {t('Internal note — hide from resident', 'অভ্যন্তরীণ নোট — বাসিন্দা দেখবেন না')}</label>
          <label className="flex gap-2 text-sm" title={!tk.reporter_phone ? t('No mobile number on this complaint', 'এই অভিযোগে মোবাইল নম্বর নেই') : undefined}>
            <input type="checkbox" disabled={!tk.reporter_phone} checked={f.notify_sms && !!tk.reporter_phone} onChange={e => set('notify_sms', e.target.checked)} /> {t('SMS the resident about status changes and replies', 'অবস্থা পরিবর্তন ও উত্তর এসএমএসে জানান')}</label>
        </div>
      </div>
    </Modal>
  );
}
