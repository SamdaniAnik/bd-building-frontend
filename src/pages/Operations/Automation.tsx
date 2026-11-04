import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../i18n/LanguageContext';
import { Empty, Field, PageHeader, dateTime, run, useToast, Notify } from './shared';

const FREQ: Record<string, [string, string]> = { HOURLY: ['Every hour', 'প্রতি ঘণ্টায়'], DAILY: ['Every day', 'প্রতিদিন'], MONTHLY: ['Every month', 'প্রতি মাসে'] };
const RESULT: Record<string, [string, string, string]> = {
  OK: ['Done', 'সম্পন্ন', 'badge-success'], NOTHING: ['Nothing to do', 'কিছু করার ছিল না', 'badge-gray'],
  FAILED: ['Failed', 'ব্যর্থ', 'badge-danger'], RUNNING: ['Running', 'চলছে', 'badge-info'],
};
const ICONS: Record<string, string> = {
  RENT_INVOICES: 'fa-solid fa-house-user', SERVICE_CHARGE_RUN: 'fa-solid fa-file-invoice-dollar', REFRESH_OVERDUE: 'fa-solid fa-calendar-xmark',
  DUE_REMINDERS: 'fa-solid fa-comment-sms', RENT_REMINDERS: 'fa-solid fa-comment-dollar', HELPDESK_ESCALATION: 'fa-solid fa-headset',
};
const hhmm = (h: number, m: number) => `${String(h ?? 0).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;

export default function Automation() {
  const { t } = useLang();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { show, node } = useToast();
  const [d, setD] = useState<any>(null);
  const [runsKey, setRunsKey] = useState(0);
  const load = () => api.get('/ops/automation/jobs').then(setD).catch((e: any) => show(false, e.message));
  const reload = () => { load(); setRunsKey(k => k + 1); };
  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-robot" title={t('Automation', 'স্বয়ংক্রিয় কাজ')}
        subtitle={t('Monthly bills, overdue marking, SMS reminders and complaint escalation that run on their own. Switch each one on, pick its time, or run it now.',
          'মাসিক বিল, বকেয়া চিহ্নিতকরণ, এসএমএস রিমাইন্ডার ও অভিযোগ এসকেলেশন নিজে থেকেই চলে। প্রতিটি চালু করুন, সময় ঠিক করুন, বা এখনই চালান।')} />

      {d && <>
        {!d.scheduler_enabled && <div className="alert alert-danger mb-4"><i className="fa-solid fa-circle-pause" /> {t('The scheduler is switched off on this server (SCHEDULER_ENABLED=false). Jobs will only run when you press "Run now".', 'এই সার্ভারে শিডিউলার বন্ধ (SCHEDULER_ENABLED=false)। শুধু "এখনই চালান" চাপলে চলবে।')}</div>}
        {d.sms?.provider === 'log' && <div className="alert alert-warning mb-4"><i className="fa-solid fa-triangle-exclamation" /> {t('SMS is in test mode (SMS_PROVIDER=log): reminder jobs record messages in the SMS outbox but nothing reaches phones. Set a real provider in the API’s .env before switching SMS jobs on.', 'এসএমএস টেস্ট মোডে আছে (SMS_PROVIDER=log): রিমাইন্ডার আউটবক্সে জমা হবে কিন্তু ফোনে যাবে না। এসএমএস কাজ চালুর আগে .env-এ আসল প্রোভাইডার দিন।')}</div>}
        {!isAdmin && <div className="alert alert-info mb-4"><i className="fa-solid fa-lock" /> {t('Only admins can change schedules. You can still run a job now.', 'শুধু অ্যাডমিন সময়সূচি বদলাতে পারেন। আপনি এখনই চালাতে পারবেন।')}</div>}
        <div className="text-xs text-muted mb-4"><i className="fa-solid fa-clock" /> {t('Times use the server clock', 'সময় সার্ভারের ঘড়ি অনুযায়ী')}: {d.timezone} · {t('now', 'এখন')} {dateTime(d.server_time)}</div>
      </>}

      <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        {!d && <div className="card"><div className="card-body text-muted">{t('Loading…')}</div></div>}
        {d?.jobs.map((j: any) => <JobCard key={j.job_key} job={j} canEdit={isAdmin} show={show} onChanged={reload} />)}
      </div>

      <RunLog jobs={d?.jobs || []} refreshKey={runsKey} show={show} />
    </div>
  );
}

function JobCard({ job, canEdit, show, onChanged }: { job: any; canEdit: boolean; show: Notify; onChanged: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const initial = () => ({ is_enabled: job.is_enabled, frequency: job.frequency, run_day: job.run_day ?? 1, time: hhmm(job.run_hour, job.run_minute), minute: job.run_minute ?? 0, options: { ...job.options } });
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState<'' | 'save' | 'run'>('');
  useEffect(() => { setF(initial()); }, [job]);
  const set = (k: string, v: any) => setF(x => ({ ...x, [k]: v }));
  const setOpt = (k: string, v: any) => setF(x => ({ ...x, options: { ...x.options, [k]: v } }));

  const dirty = JSON.stringify(f) !== JSON.stringify(initial());
  const body = () => {
    const [h, m] = f.time.split(':').map(Number);
    return { is_enabled: f.is_enabled, frequency: f.frequency, run_day: f.frequency === 'MONTHLY' ? Number(f.run_day) : undefined,
      run_hour: f.frequency === 'HOURLY' ? job.run_hour : h, run_minute: f.frequency === 'HOURLY' ? Number(f.minute) : m, options: f.options };
  };
  const save = async (patch?: any) => {
    setBusy('save');
    const r = await run(show, api.put(`/ops/automation/jobs/${job.job_key}`, { ...body(), ...patch }));
    setBusy('');
    if (r) onChanged();
  };
  const runNow = async () => {
    if (!confirm(t(`Run "${job.title}" now?`, `"${job.title_bn}" এখনই চালাবেন?`))) return;
    setBusy('run');
    await run(show, api.post(`/ops/automation/jobs/${job.job_key}/run`));
    setBusy('');
    onChanged();
  };
  const toggle = (on: boolean) => { set('is_enabled', on); if (!dirty) save({ is_enabled: on }); };
  const last = RESULT[job.last_status];

  return (
    <div className="card" style={{ borderLeft: `4px solid ${job.is_enabled ? 'var(--success, #059669)' : 'var(--gray-300, #d1d5db)'}` }}>
      <div className="card-body">
        <div className="flex-between" style={{ gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 0 }}>
            <div className="fw-bold" style={{ fontSize: '1.05rem' }}><i className={ICONS[job.job_key] || 'fa-solid fa-gear'} style={{ color: 'var(--primary)', marginRight: 8 }} />{bn ? job.title_bn : job.title}</div>
            <div className="text-sm text-muted mt-1">{bn ? job.description_bn : job.description}</div>
            <div className="text-xs mt-1 flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              {job.running ? <span className="badge badge-info"><i className="fa-solid fa-spinner fa-spin" /> {t('Running now', 'এখন চলছে')}</span>
                : job.is_enabled && job.next_run_at ? <span><i className="fa-solid fa-forward" /> {t('Next', 'পরবর্তী')}: <strong>{dateTime(job.next_run_at)}</strong></span>
                  : <span className="text-muted">{t('Off — runs only when you press Run now', 'বন্ধ — শুধু "এখনই চালান" চাপলে চলবে')}</span>}
              {last && <span>· {t('Last', 'সর্বশেষ')}: <span className={`badge ${last[2]}`}>{last[bn ? 1 : 0]}</span> <span className="text-muted">{job.last_message}</span></span>}
            </div>
          </div>
          <label className="flex gap-2" style={{ alignItems: 'center', fontWeight: 600, cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            <input type="checkbox" role="switch" aria-checked={f.is_enabled} disabled={!canEdit || busy !== ''} checked={f.is_enabled} onChange={e => toggle(e.target.checked)} style={{ width: 20, height: 20 }} />
            {f.is_enabled ? t('On', 'চালু') : t('Off', 'বন্ধ')}
          </label>
        </div>

        <div className="form-row cols-4 mt-4" style={{ alignItems: 'end' }}>
          <Field label={t('How often', 'কত ঘন ঘন')}>
            <select className="form-select" disabled={!canEdit || job.frequencies.length < 2} value={f.frequency} onChange={e => set('frequency', e.target.value)}>
              {job.frequencies.map((k: string) => <option key={k} value={k}>{FREQ[k][bn ? 1 : 0]}</option>)}
            </select>
          </Field>
          {f.frequency === 'MONTHLY' && <Field label={t('On day', 'তারিখ')} hint={t('1–28', '১–২৮')}>
            <input type="number" min={1} max={28} className="form-control" disabled={!canEdit} value={f.run_day} onChange={e => set('run_day', e.target.value)} /></Field>}
          {f.frequency === 'HOURLY'
            ? <Field label={t('Minutes past the hour', 'ঘণ্টার কত মিনিটে')}><input type="number" min={0} max={59} className="form-control" disabled={!canEdit} value={f.minute} onChange={e => set('minute', e.target.value)} /></Field>
            : <Field label={t('At', 'সময়')}><input type="time" className="form-control" disabled={!canEdit} value={f.time} onChange={e => set('time', e.target.value)} /></Field>}
          {job.option_fields.map((o: any) => (
            <Field key={o.key} label={bn ? o.label_bn : o.label}>
              {o.type === 'number'
                ? <input type="number" min={o.min} max={o.max} className="form-control" disabled={!canEdit} value={f.options[o.key] ?? ''} onChange={e => setOpt(o.key, e.target.value)} />
                : <input className="form-control" inputMode={o.type === 'phone' ? 'tel' : undefined} placeholder={o.type === 'phone' ? '01XXXXXXXXX' : undefined} disabled={!canEdit} value={f.options[o.key] ?? ''} onChange={e => setOpt(o.key, e.target.value)} />}
            </Field>
          ))}
        </div>

        <div className="flex gap-2" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {canEdit && dirty && <button className="btn btn-light" disabled={busy !== ''} onClick={() => setF(initial())}>{t('Undo', 'বাতিল')}</button>}
          {canEdit && <button className="btn btn-primary" disabled={!dirty || busy !== ''} onClick={() => save()}><i className="fa-solid fa-check" /> {t('Save schedule', 'সময়সূচি সংরক্ষণ')}</button>}
          <button className="btn btn-light" disabled={busy !== '' || job.running} onClick={runNow}>
            <i className={busy === 'run' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-play'} /> {t('Run now', 'এখনই চালান')}</button>
        </div>
      </div>
    </div>
  );
}

function RunLog({ jobs, refreshKey, show }: { jobs: any[]; refreshKey: number; show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [job, setJob] = useState('');
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    api.get('/ops/automation/runs', { params: { job: job || undefined, limit: 100 } }).then((r: any) => setRows(r.rows)).catch((e: any) => show(false, e.message));
  }, [job, refreshKey]);
  const secs = (a: string, b: string | null) => (b ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000)) : null);

  return (
    <div className="card">
      <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="card-title"><i className="fa-solid fa-list-check text-primary" /> {t('Run history', 'চলার ইতিহাস')}</div>
        <select className="form-select" style={{ width: 260 }} value={job} onChange={e => setJob(e.target.value)} aria-label="Filter by job">
          <option value="">{t('All jobs', 'সব কাজ')}</option>{jobs.map(j => <option key={j.job_key} value={j.job_key}>{bn ? j.title_bn : j.title}</option>)}
        </select>
      </div>
      <div className="table-wrapper"><table>
        <thead><tr><th>{t('When', 'কখন')}</th><th>{t('Job', 'কাজ')}</th><th>{t('Started by', 'চালিয়েছেন')}</th><th>{t('Result', 'ফলাফল')}</th><th>{t('Details', 'বিস্তারিত')}</th></tr></thead>
        <tbody>
          {!rows && <Empty cols={5} text={t('Loading…')} />}
          {rows?.length === 0 && <Empty cols={5} text={t('Nothing has run yet.', 'এখনো কিছু চলেনি।')} />}
          {rows?.map(r => {
            const s = secs(r.started_at, r.finished_at);
            return (
              <tr key={r.id_runs}>
                <td style={{ whiteSpace: 'nowrap' }}>{dateTime(r.started_at)}{s != null && <div className="text-xs text-muted">{s}s</div>}</td>
                <td>{bn ? r.title_bn : r.title}</td>
                <td>{r.triggered_by === 'Scheduler' ? <span className="text-muted"><i className="fa-solid fa-robot" /> {t('Schedule', 'সময়সূচি')}</span> : r.triggered_by}</td>
                <td><span className={`badge ${RESULT[r.status]?.[2] || 'badge-gray'}`}>{RESULT[r.status]?.[bn ? 1 : 0] || r.status}</span></td>
                <td className="text-sm">{r.message}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </div>
  );
}
