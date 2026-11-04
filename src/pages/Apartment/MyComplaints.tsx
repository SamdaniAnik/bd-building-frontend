import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { CATEGORIES, PRIORITIES, STATUSES, ACTIVE, dueText, hoursLabel } from '../Operations/helpdeskLabels';

// Owner portal: report a problem with the flat or building, follow its progress, reply, rate or reopen.
// previewOwnerId is set when staff preview the portal for an owner.
export default function MyComplaints({ previewOwnerId, onCount }: { previewOwnerId?: number | null; onCount?: (open: number) => void }) {
  const { t } = useLang();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const params = previewOwnerId ? { ownerId: previewOwnerId } : undefined;
  const extra = previewOwnerId ? { id_owners: previewOwnerId } : {};

  const load = () => api.get('/ops/helpdesk/portal/tickets', { params }).then((r: any) => {
    setD(r); setErr(null);
    onCount?.(r.rows.filter((x: any) => ACTIVE.includes(x.status)).length);
  }).catch((e: any) => setErr(e?.message || 'Could not load your complaints'));
  useEffect(() => { load(); }, [previewOwnerId]);

  const say = (ok: boolean, msg: string) => { setFlash({ ok, msg }); setTimeout(() => setFlash(null), 5000); };
  const call = async (p: Promise<any>) => {
    try { const r: any = await p; say(true, r.message); load(); return true; }
    catch (e: any) { say(false, e?.message || 'Something went wrong'); return false; }
  };

  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!d) return <div className="card"><div className="card-body text-muted">{t('Loading…')}</div></div>;
  const active = d.rows.filter((r: any) => ACTIVE.includes(r.status));
  const done = d.rows.filter((r: any) => !ACTIVE.includes(r.status));

  return (
    <div>
      {flash && <div className={`alert ${flash.ok ? 'alert-success' : 'alert-danger'} mb-4`} role="status">{flash.msg}</div>}
      <div className="card mb-4">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="card-title"><i className="fa-solid fa-headset text-primary" /> {t('Report a problem', 'সমস্যা জানান')}</div>
          {!formOpen && <button className="btn btn-primary" onClick={() => setFormOpen(true)}><i className="fa-solid fa-plus" /> {t('New complaint', 'নতুন অভিযোগ')}</button>}
        </div>
        {formOpen
          ? <NewComplaint d={d} onCancel={() => setFormOpen(false)} onSubmit={async body => { const ok = await call(api.post('/ops/helpdesk/portal/tickets', { ...body, ...extra })); if (ok) setFormOpen(false); return ok; }} />
          : <div className="card-body text-sm text-muted">{t('Water, lift, electricity, gas, security or anything else — tell management here. You will get an SMS with your complaint number, and can follow it below.',
            'পানি, লিফট, বিদ্যুৎ, গ্যাস, নিরাপত্তা বা অন্য কিছু — এখানে জানান। অভিযোগ নম্বরসহ এসএমএস পাবেন এবং নিচে অগ্রগতি দেখতে পারবেন।')}</div>}
      </div>

      <div className="section-heading"><i className="fa-solid fa-spinner" /> {t('In progress', 'চলমান')} ({active.length})</div>
      {active.length === 0 && <div className="card mb-4"><div className="card-body text-muted">{t('No open complaints.', 'কোনো চলমান অভিযোগ নেই।')}</div></div>}
      {active.map((r: any) => <ComplaintCard key={r.id_tickets} r={r} reopenDays={d.reopen_days} call={call} extra={extra} />)}

      {done.length > 0 && <>
        <div className="section-heading mt-4"><i className="fa-solid fa-circle-check" /> {t('Resolved', 'সমাধান হয়েছে')} ({done.length})</div>
        {done.map((r: any) => <ComplaintCard key={r.id_tickets} r={r} reopenDays={d.reopen_days} call={call} extra={extra} />)}
      </>}
    </div>
  );
}

function NewComplaint({ d, onCancel, onSubmit }: { d: any; onCancel: () => void; onSubmit: (b: any) => Promise<boolean> }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [f, setF] = useState({ id_units: d.units.length === 1 ? String(d.units[0].id_units) : '', category: '', priority: 'MEDIUM', title: '', location: '', description: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => { setBusy(true); await onSubmit({ ...f, id_units: f.id_units ? Number(f.id_units) : null, category: f.category || 'OTHER' }); setBusy(false); };
  return (
    <div className="card-body">
      <div className="form-group">
        <div className="form-label">{t('What is it about?', 'কী নিয়ে?')}</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>{Object.entries(CATEGORIES).map(([k, [en, b, icon]]) => (
          <button key={k} type="button" className={`btn btn-sm ${f.category === k ? 'btn-primary' : 'btn-light'}`} aria-pressed={f.category === k} onClick={() => set('category', k)}><i className={icon} /> {bn ? b : en}</button>
        ))}</div>
      </div>
      <div className="form-row cols-2">
        <div className="form-group"><label className="form-label" htmlFor="mc-unit">{t('Where', 'কোথায়')}</label>
          <select id="mc-unit" className="form-select" value={f.id_units} onChange={e => set('id_units', e.target.value)}>
            {d.units.map((u: any) => <option key={u.id_units} value={u.id_units}>{t('My flat', 'আমার ফ্ল্যাট')} {u.unit_number}</option>)}
            <option value="">{t('Common area (lift, stairs, roof, parking…)', 'কমন এরিয়া (লিফট, সিঁড়ি, ছাদ, পার্কিং…)')}</option>
          </select></div>
        <div className="form-group"><label className="form-label" htmlFor="mc-loc">{t('Exact spot (optional)', 'ঠিক কোথায় (ঐচ্ছিক)')}</label>
          <input id="mc-loc" className="form-control" placeholder={t('Kitchen, bathroom, Lift 2…', 'রান্নাঘর, বাথরুম, লিফট ২…')} value={f.location} onChange={e => set('location', e.target.value)} /></div>
      </div>
      <div className="form-group"><label className="form-label required" htmlFor="mc-title">{t('Short title', 'সংক্ষিপ্ত বিষয়')}</label>
        <input id="mc-title" className="form-control" maxLength={200} placeholder={t('e.g. No water since morning', 'যেমন: সকাল থেকে পানি নেই')} value={f.title} onChange={e => set('title', e.target.value)} /></div>
      <div className="form-group"><label className="form-label required" htmlFor="mc-desc">{t('Tell us more', 'বিস্তারিত লিখুন')}</label>
        <textarea id="mc-desc" className="form-control" rows={3} value={f.description} onChange={e => set('description', e.target.value)} /></div>
      <div className="form-group"><label className="form-label" htmlFor="mc-pri">{t('How urgent?', 'কতটা জরুরি?')}</label>
        <select id="mc-pri" className="form-select" value={f.priority} onChange={e => set('priority', e.target.value)}>
          {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{bn ? v[1] : v[0]} — {t('aim to fix within', 'সমাধানের লক্ষ্য')} {hoursLabel(d.sla_hours[k], bn)}</option>)}
        </select>
        {f.priority === 'EMERGENCY' && <div className="form-text" style={{ color: 'var(--danger)' }}><i className="fa-solid fa-phone" /> {t('For fire, gas leaks or someone stuck in a lift, also call the guard desk right away.', 'আগুন, গ্যাস লিক বা লিফটে আটকে থাকলে এখনই গার্ড ডেস্কে ফোন করুন।')}</div>}
      </div>
      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-light" onClick={onCancel}>{t('Cancel')}</button>
        <button className="btn btn-primary" disabled={busy || !f.title.trim() || !f.description.trim()} onClick={submit}><i className="fa-solid fa-paper-plane" /> {t('Send complaint', 'অভিযোগ পাঠান')}</button>
      </div>
    </div>
  );
}

function ComplaintCard({ r, reopenDays, call, extra }: { r: any; reopenDays: number; call: (p: Promise<any>) => Promise<boolean>; extra: any }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [open, setOpen] = useState(ACTIVE.includes(r.status));
  const [reply, setReply] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [busy, setBusy] = useState(false);
  const isDone = !ACTIVE.includes(r.status);
  const doneAt = r.closed_at || r.resolved_at;
  const canReopen = isDone && (!doneAt || Date.now() - new Date(doneAt).getTime() <= reopenDays * 86400000);
  const due = dueText(r.due_by, r.status, bn);
  const when = (x: string) => new Date(x).toLocaleString(bn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  const send = async (reopen = false) => {
    setBusy(true);
    const ok = await call(api.post(`/ops/helpdesk/portal/tickets/${r.id_tickets}/comment`, { message: reply, reopen, ...extra }));
    setBusy(false);
    if (ok) setReply('');
  };
  const rate = async () => {
    setBusy(true);
    await call(api.post(`/ops/helpdesk/portal/tickets/${r.id_tickets}/rate`, { rating, comment: ratingNote, ...extra }));
    setBusy(false);
  };

  return (
    <div className="card mb-4" style={{ borderLeft: `4px solid ${due?.late ? 'var(--danger)' : isDone ? 'var(--success)' : 'var(--primary)'}` }}>
      <button type="button" className="card-header flex-between" style={{ width: '100%', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', flexWrap: 'wrap', gap: 8 }} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <div style={{ minWidth: 0 }}>
          <div className="fw-bold"><i className={CATEGORIES[r.category]?.[2] || 'fa-solid fa-circle-question'} style={{ marginRight: 6, color: 'var(--gray-500)' }} />{r.title}</div>
          <div className="text-xs text-muted">{r.ticket_no} · {r.unit_number || t('Common area', 'কমন এরিয়া')}{r.location ? ` · ${r.location}` : ''} · {when(r.created_at)}</div>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {due && <span className={`badge ${due.late ? 'badge-danger' : 'badge-gray'}`}>{due.text}</span>}
          <span className={`badge ${STATUSES[r.status]?.[2]}`}>{STATUSES[r.status]?.[bn ? 1 : 0] || r.status}</span>
          <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-muted`} />
        </div>
      </button>
      {open && <div className="card-body">
        {r.staff_name && ACTIVE.includes(r.status) && <div className="alert alert-info mb-4"><i className="fa-solid fa-user-gear" /> {t('Being handled by', 'দায়িত্বে আছেন')} <strong>{r.staff_name}</strong></div>}
        {r.resolution_notes && isDone && <div className="alert alert-success mb-4"><i className="fa-solid fa-screwdriver-wrench" /> {r.resolution_notes}</div>}
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'grid', gap: 6 }}>
          <li className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{r.description}</li>
          {r.updates.filter((u: any) => u.message !== 'Complaint lodged').map((u: any) => (
            <li key={u.id_ticket_updates} style={{ background: u.author_type === 'RESIDENT' ? '#eff6ff' : '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
              <div className="text-xs text-muted">
                <strong>{u.author_type === 'RESIDENT' ? t('You', 'আপনি') : u.author_type === 'SYSTEM' ? t('System', 'সিস্টেম') : t('Management', 'ব্যবস্থাপনা')}</strong> · {when(u.created_at)}
                {u.to_status && <> · {t('now', 'এখন')} <strong>{STATUSES[u.to_status]?.[bn ? 1 : 0] || u.to_status}</strong></>}
              </div>
              {u.message && <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{u.message}</div>}
            </li>
          ))}
        </ol>

        {r.rating ? <div className="text-sm mb-4" style={{ color: '#d97706' }}>{t('Your rating', 'আপনার রেটিং')}: {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          : isDone && <div className="mb-4" style={{ background: '#fffbeb', borderRadius: 8, padding: 12 }}>
            <div className="text-sm fw-bold mb-1">{t('How did we do?', 'আমাদের কাজ কেমন ছিল?')}</div>
            <div className="flex gap-2 mb-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`} className="btn btn-sm btn-light" style={{ color: n <= rating ? '#d97706' : '#9ca3af', fontSize: '1.2rem', padding: '2px 8px' }} onClick={() => setRating(n)}>★</button>)}
            </div>
            {rating > 0 && <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <input className="form-control" style={{ flex: '1 1 220px' }} placeholder={t('Anything to add? (optional)', 'আর কিছু বলবেন? (ঐচ্ছিক)')} value={ratingNote} onChange={e => setRatingNote(e.target.value)} />
              <button className="btn btn-warning" disabled={busy} onClick={rate}>{t('Submit rating', 'রেটিং দিন')}</button>
            </div>}
          </div>}

        {(!isDone || canReopen) && <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <input className="form-control" style={{ flex: '1 1 260px' }} aria-label="Message" value={reply} onChange={e => setReply(e.target.value)}
            placeholder={isDone ? t('Still not fixed? Tell us what is wrong', 'এখনো ঠিক হয়নি? কী সমস্যা লিখুন') : t('Add a message for management', 'ব্যবস্থাপনাকে বার্তা লিখুন')} />
          {isDone
            ? <button className="btn btn-danger" disabled={busy || !reply.trim()} onClick={() => send(true)}><i className="fa-solid fa-rotate-left" /> {t('Reopen', 'আবার খুলুন')}</button>
            : <button className="btn btn-primary" disabled={busy || !reply.trim()} onClick={() => send(false)}><i className="fa-solid fa-paper-plane" /> {t('Send', 'পাঠান')}</button>}
        </div>}
      </div>}
    </div>
  );
}
