import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fiscalYearOf, fmtDate } from '../../utils/bd';
import { Empty, Field, MethodSelect, Modal, PageHeader, Stat, Tabs, UnitSelect, dateTime, money, run, todayStr, useToast, useUnits, Notify } from './shared';
import ZakatStatement from './ZakatStatement';
import ElectionsTab from './Elections';

// Flat owners' association: meetings (AGM / EGM / committee), managing committee, reserve fund,
// yearly income & expenditure statement, and a zakat statement per owner.
type Tab = 'meetings' | 'elections' | 'committee' | 'reserve' | 'statement' | 'zakat';

const MEETING_TYPES: Record<string, [string, string]> = { AGM: ['Annual general meeting', 'বার্ষিক সাধারণ সভা'], EGM: ['Special general meeting', 'বিশেষ সাধারণ সভা'], COMMITTEE: ['Committee meeting', 'কমিটি সভা'] };
const MEETING_STATUS: Record<string, [string, string, string]> = { SCHEDULED: ['Scheduled', 'নির্ধারিত', 'badge-info'], HELD: ['Held', 'অনুষ্ঠিত', 'badge-success'], ADJOURNED: ['Adjourned', 'মুলতবি', 'badge-warning'], CANCELLED: ['Cancelled', 'বাতিল', 'badge-gray'] };
const POSITIONS: Record<string, [string, string]> = {
  PRESIDENT: ['President', 'সভাপতি'], VICE_PRESIDENT: ['Vice president', 'সহ-সভাপতি'], GENERAL_SECRETARY: ['General secretary', 'সাধারণ সম্পাদক'],
  JOINT_SECRETARY: ['Joint secretary', 'যুগ্ম সম্পাদক'], TREASURER: ['Treasurer', 'কোষাধ্যক্ষ'], MEMBER: ['Member', 'সদস্য'],
};
const ENTRY_TYPES: Record<string, [string, string]> = {
  OPENING: ['Opening balance', 'প্রারম্ভিক জের'], CONTRIBUTION: ['Contribution', 'চাঁদা / অনুদান'], INTEREST: ['Bank interest / profit', 'ব্যাংক সুদ / মুনাফা'],
  WITHDRAWAL: ['Withdrawal (spending)', 'উত্তোলন (খরচ)'], ADJUSTMENT: ['Adjustment', 'সমন্বয়'],
};
const RESULTS: Record<string, [string, string, string]> = { PASSED: ['Passed', 'গৃহীত', 'badge-success'], REJECTED: ['Rejected', 'প্রত্যাখ্যাত', 'badge-danger'], DEFERRED: ['Deferred', 'স্থগিত', 'badge-warning'] };

const localDateTime = (d?: string | null) => {
  if (!d) return '';
  const x = new Date(d);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};

export default function Association() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('meetings');
  const { show, node } = useToast();
  const [ov, setOv] = useState<any>(null);
  const loadOv = () => api.get('/ops/association/overview').then(setOv).catch(() => {});
  useEffect(() => { loadOv(); }, [tab]);
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-people-roof" title={t("Owners' Association", 'ফ্ল্যাট মালিক সমিতি')}
        subtitle={t('General meetings with attendance and minutes, the managing committee, the reserve fund for big repairs, the yearly accounts for owners, and zakat statements.', 'উপস্থিতি ও কার্যবিবরণীসহ সাধারণ সভা, ব্যবস্থাপনা কমিটি, বড় মেরামতের রিজার্ভ ফান্ড, মালিকদের জন্য বার্ষিক হিসাব এবং যাকাত বিবরণী।')} />
      <div className="stats-grid">
        <Stat icon="fa-solid fa-users" value={ov?.members ?? '…'} label={t('Member owners', 'সদস্য মালিক')} />
        <Stat icon="fa-solid fa-user-tie" value={ov?.committee?.length ?? '…'} label={t('Committee members now', 'বর্তমান কমিটি সদস্য')} tone="info" />
        <Stat icon="fa-solid fa-piggy-bank" value={ov ? money(ov.reserve_balance_bdt) : '…'} label={t('Reserve fund balance', 'রিজার্ভ ফান্ড স্থিতি')} tone="success" />
        <Stat icon="fa-solid fa-calendar-day" value={ov?.next_meeting ? fmtDate(ov.next_meeting.meeting_at) : '—'} label={ov?.next_meeting ? ov.next_meeting.title : t('No meeting scheduled', 'কোনো সভা নির্ধারিত নেই')} tone="warning" />
      </div>
      {ov?.agm_overdue && <div className="alert alert-warning mb-4"><i className="fa-solid fa-triangle-exclamation" /> {ov.last_agm
        ? t(`The last AGM was on ${fmtDate(ov.last_agm.meeting_at)} — more than a year ago. Schedule this year's AGM.`, `সর্বশেষ বার্ষিক সাধারণ সভা ${fmtDate(ov.last_agm.meeting_at)} তারিখে — এক বছরের বেশি আগে। এ বছরের সভা নির্ধারণ করুন।`)
        : t('No annual general meeting is on record yet. Owners should meet at least once a year to pass the accounts and elect the committee.', 'এখনো কোনো বার্ষিক সাধারণ সভার রেকর্ড নেই। হিসাব অনুমোদন ও কমিটি নির্বাচনের জন্য বছরে অন্তত একবার সভা করা উচিত।')}</div>}
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'meetings', label: t('Meetings', 'সভা'), icon: 'fa-solid fa-calendar-days' },
        { key: 'elections', label: t('Elections', 'নির্বাচন'), icon: 'fa-solid fa-check-to-slot' },
        { key: 'committee', label: t('Committee', 'কমিটি'), icon: 'fa-solid fa-user-tie' },
        { key: 'reserve', label: t('Reserve fund', 'রিজার্ভ ফান্ড'), icon: 'fa-solid fa-piggy-bank' },
        { key: 'statement', label: t('Yearly accounts', 'বার্ষিক হিসাব'), icon: 'fa-solid fa-file-invoice-dollar' },
        { key: 'zakat', label: t('Zakat statement', 'যাকাত বিবরণী'), icon: 'fa-solid fa-hand-holding-heart' },
      ]} />
      {tab === 'meetings' && <MeetingsTab show={show} />}
      {tab === 'elections' && <ElectionsTab show={show} />}
      {tab === 'committee' && <CommitteeTab show={show} />}
      {tab === 'reserve' && <ReserveTab show={show} />}
      {tab === 'statement' && <StatementTab show={show} />}
      {tab === 'zakat' && <ZakatTab show={show} />}
    </div>
  );
}

// ── Meetings ────────────────────────────────────────────────────
function MeetingsTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [att, setAtt] = useState<any>(null);
  const load = () => api.get('/ops/association/meetings').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await run(show, api.post('/ops/association/meetings', form))) { setForm(null); load(); } };
  const remove = async (m: any) => { if (confirm(t(`Delete "${m.title}" with its attendance?`, `"${m.title}" ও উপস্থিতি মুছবেন?`)) && await run(show, api.delete(`/ops/association/meetings/${m.id_meetings}`))) load(); };
  const notice = async (m: any) => {
    if (!confirm(t(`Send the meeting notice by SMS to all ${d?.members} member owners?`, `সব ${d?.members} জন মালিককে এসএমএসে নোটিশ পাঠাবেন?`))) return;
    if (await run(show, api.post(`/ops/association/meetings/${m.id_meetings}/notice`))) load();
  };
  const openAtt = async (m: any) => { try { setAtt(await api.get(`/ops/association/meetings/${m.id_meetings}/attendance`)); } catch (e: any) { show(false, e.message); } };
  const newMeeting = (type = 'AGM') => setForm({ meeting_type: type, title: type === 'AGM' ? t(`Annual General Meeting ${new Date().getFullYear()}`, `বার্ষিক সাধারণ সভা ${new Date().getFullYear()}`) : '', meeting_at: '', venue: '', agenda: type === 'AGM'
    ? t('1. Confirm minutes of the last AGM\n2. Approve the yearly accounts\n3. Service charge & reserve fund for the coming year\n4. Elect the managing committee\n5. Any other business', '১. গত সভার কার্যবিবরণী অনুমোদন\n২. বার্ষিক হিসাব অনুমোদন\n৩. আগামী বছরের সার্ভিস চার্জ ও রিজার্ভ ফান্ড\n৪. ব্যবস্থাপনা কমিটি নির্বাচন\n৫. বিবিধ') : '',
    quorum_percent: 50, status: 'SCHEDULED', chaired_by: '', minutes: '', resolutions: [] });
  const edit = (m: any) => setForm({ ...m, meeting_at: localDateTime(m.meeting_at), resolutions: m.resolutions || [] });
  const setRes = (i: number, k: string, v: string) => set('resolutions', form.resolutions.map((r: any, j: number) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="text-sm text-muted">{d ? t(`${d.members} member owners. Quorum is counted on owners present in person or by proxy.`, `${d.members} জন সদস্য মালিক। উপস্থিত বা প্রক্সির মাধ্যমে মালিকদের ধরে কোরাম গণনা হয়।`) : ''}</div>
          <div className="flex gap-2"><button className="btn btn-light" onClick={() => newMeeting('COMMITTEE')}><i className="fa-solid fa-plus" /> {t('Committee meeting', 'কমিটি সভা')}</button>
            <button className="btn btn-primary" onClick={() => newMeeting('AGM')}><i className="fa-solid fa-plus" /> {t('General meeting', 'সাধারণ সভা')}</button></div>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Meeting', 'সভা')}</th><th>{t('When', 'সময়')}</th><th>{t('Status', 'অবস্থা')}</th><th>{t('Attendance', 'উপস্থিতি')}</th><th>{t('Resolutions', 'সিদ্ধান্ত')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={6} text={t('Loading…')} />}
            {d?.rows.length === 0 && <Empty cols={6} text={t('No meetings yet.', 'এখনো কোনো সভা নেই।')} />}
            {d?.rows.map((m: any) => (
              <tr key={m.id_meetings}>
                <td><div className="fw-semibold">{m.title}</div><div className="text-xs text-muted">{MEETING_TYPES[m.meeting_type]?.[bn ? 1 : 0]}{m.venue ? ` · ${m.venue}` : ''}</div></td>
                <td>{dateTime(m.meeting_at)}{m.notice_sent_at && <div className="text-xs text-muted"><i className="fa-solid fa-comment-sms" /> {t('notice sent', 'নোটিশ পাঠানো')} {fmtDate(m.notice_sent_at)}</div>}</td>
                <td><span className={`badge ${MEETING_STATUS[m.status]?.[2]}`}>{MEETING_STATUS[m.status]?.[bn ? 1 : 0]}</span></td>
                <td>{m.present_count}/{d.members} <span className={`badge ${m.quorum_met ? 'badge-success' : 'badge-gray'}`}>{m.quorum_met ? t('Quorum', 'কোরাম পূর্ণ') : t(`Need ${m.quorum_needed}`, `দরকার ${m.quorum_needed}`)}</span></td>
                <td className="text-sm">{m.resolutions.length ? `${m.resolutions.filter((r: any) => r.result === 'PASSED').length}/${m.resolutions.length} ${t('passed', 'গৃহীত')}` : '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {m.status === 'SCHEDULED' && <><button className="btn btn-light btn-sm" onClick={() => notice(m)}><i className="fa-solid fa-comment-sms" /> {t('Send notice', 'নোটিশ পাঠান')}</button>{' '}</>}
                  <button className="btn btn-light btn-sm" onClick={() => openAtt(m)}><i className="fa-solid fa-clipboard-user" /> {t('Attendance', 'উপস্থিতি')}</button>{' '}
                  <button className="btn btn-light btn-sm" onClick={() => edit(m)}><i className="fa-solid fa-pen" /> {t('Minutes', 'কার্যবিবরণী')}</button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Delete', 'মুছুন')} onClick={() => remove(m)}><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {form && (
        <Modal wide title={form.id_meetings ? form.title : t('Schedule a meeting', 'সভা নির্ধারণ')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.title || !form.meeting_at} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-3">
            <Field label={t('Type', 'ধরন')}><select className="form-select" value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>{Object.entries(MEETING_TYPES).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select></Field>
            <Field label={t('Title', 'শিরোনাম')} required><input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} /></Field>
            <Field label={t('Date & time', 'তারিখ ও সময়')} required><input type="datetime-local" className="form-control" value={form.meeting_at} onChange={e => set('meeting_at', e.target.value)} /></Field>
            <Field label={t('Venue', 'স্থান')}><input className="form-control" placeholder={t('Community hall / roof', 'কমিউনিটি হল / ছাদ')} value={form.venue || ''} onChange={e => set('venue', e.target.value)} /></Field>
            <Field label={t('Quorum (% of owners)', 'কোরাম (মালিকদের %)')} hint={t('Check your association’s by-laws', 'সমিতির গঠনতন্ত্র দেখুন')}><input type="number" min={0} max={100} className="form-control" value={form.quorum_percent} onChange={e => set('quorum_percent', e.target.value)} /></Field>
            <Field label={t('Status', 'অবস্থা')}><select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>{Object.entries(MEETING_STATUS).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select></Field>
          </div>
          <Field label={t('Agenda (one item per line)', 'আলোচ্যসূচি (প্রতি লাইনে একটি)')}><textarea className="form-control" rows={5} value={form.agenda || ''} onChange={e => set('agenda', e.target.value)} /></Field>
          {form.id_meetings && <>
            <hr />
            <div className="form-row cols-3"><Field label={t('Chaired by', 'সভাপতিত্ব করেন')}><input className="form-control" value={form.chaired_by || ''} onChange={e => set('chaired_by', e.target.value)} /></Field></div>
            <Field label={t('Minutes', 'কার্যবিবরণী')}><textarea className="form-control" rows={6} value={form.minutes || ''} onChange={e => set('minutes', e.target.value)} /></Field>
            <div className="section-heading">{t('Resolutions', 'সিদ্ধান্তসমূহ')}</div>
            {form.resolutions.map((r: any, i: number) => (
              <div key={i} className="flex gap-2 mb-1">
                <input className="form-control" aria-label={t('Resolution', 'সিদ্ধান্ত')} value={r.text} onChange={e => setRes(i, 'text', e.target.value)} />
                <select className="form-select" style={{ width: 150 }} aria-label={t('Result', 'ফলাফল')} value={r.result} onChange={e => setRes(i, 'result', e.target.value)}>{Object.entries(RESULTS).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select>
                <button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => set('resolutions', form.resolutions.filter((_: any, j: number) => j !== i))}><i className="fa-solid fa-xmark" /></button>
              </div>
            ))}
            <button className="btn btn-light btn-sm" onClick={() => set('resolutions', [...form.resolutions, { text: '', result: 'PASSED' }])}><i className="fa-solid fa-plus" /> {t('Add resolution', 'সিদ্ধান্ত যোগ')}</button>
            <div className="form-text mt-1">{t('Spending from the reserve fund needs an approved proposal on the Committee Voting page.', 'রিজার্ভ ফান্ড থেকে খরচের জন্য কমিটি ভোটিং পেজে অনুমোদিত প্রস্তাব লাগবে।')} <Link to="/apartment/voting">{t('Open Committee Voting', 'কমিটি ভোটিং খুলুন')}</Link></div>
          </>}
        </Modal>
      )}

      {att && <AttendanceDialog data={att} show={show} onClose={() => setAtt(null)} onSaved={() => { setAtt(null); load(); }} />}
    </>
  );
}

function AttendanceDialog({ data, show, onClose, onSaved }: { data: any; show: Notify; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [rows, setRows] = useState<any[]>(data.rows);
  const [q, setQ] = useState('');
  const present = rows.filter(r => r.present).length;
  const needed = Math.ceil(rows.length * Number(data.meeting.quorum_percent) / 100);
  const upd = (id: number, patch: any) => setRows(rs => rs.map(r => (r.id_owners === id ? { ...r, ...patch } : r)));
  const save = async () => { if (await run(show, api.put(`/ops/association/meetings/${data.meeting.id_meetings}/attendance`, { present: rows.filter(r => r.present) }))) onSaved(); };
  const shown = rows.filter(r => !q || `${r.full_name} ${r.flats}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal wide title={`${t('Attendance', 'উপস্থিতি')} — ${data.meeting.title}`} onClose={onClose}
      footer={<><span className={`badge ${present >= needed ? 'badge-success' : 'badge-warning'}`} style={{ marginRight: 'auto' }}>{present}/{rows.length} {t('present', 'উপস্থিত')} · {t('quorum', 'কোরাম')} {needed}</span>
        <button className="btn btn-light" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={save}>{t('Save attendance', 'উপস্থিতি সংরক্ষণ')}</button></>}>
      <input className="form-control mb-4" placeholder={t('Search owner or flat', 'মালিক বা ফ্ল্যাট খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('Search owner or flat', 'মালিক বা ফ্ল্যাট খুঁজুন')} />
      <div className="table-wrapper" style={{ maxHeight: 420, overflowY: 'auto' }}><table>
        <thead><tr><th>{t('Present', 'উপস্থিত')}</th><th>{t('Owner', 'মালিক')}</th><th>{t('Flats', 'ফ্ল্যাট')}</th><th>{t('How', 'কীভাবে')}</th></tr></thead>
        <tbody>{shown.map(r => (
          <tr key={r.id_owners}>
            <td><input type="checkbox" aria-label={r.full_name} checked={r.present} onChange={e => upd(r.id_owners, { present: e.target.checked })} /></td>
            <td>{r.full_name}</td><td className="text-sm">{r.flats}</td>
            <td>{r.present && <div className="flex gap-2">
              <select className="form-select" style={{ width: 130 }} aria-label={t('How', 'কীভাবে')} value={r.attended_as} onChange={e => upd(r.id_owners, { attended_as: e.target.value })}><option value="IN_PERSON">{t('In person', 'সশরীরে')}</option><option value="PROXY">{t('By proxy', 'প্রক্সি')}</option></select>
              {r.attended_as === 'PROXY' && <input className="form-control" placeholder={t('Proxy name', 'প্রক্সির নাম')} aria-label={t('Proxy name', 'প্রক্সির নাম')} value={r.proxy_name} onChange={e => upd(r.id_owners, { proxy_name: e.target.value })} />}
            </div>}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </Modal>
  );
}

// ── Committee ───────────────────────────────────────────────────
function CommitteeTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [past, setPast] = useState(false);
  const load = () => api.get('/ops/association/committee').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await run(show, api.post('/ops/association/committee', form))) { setForm(null); load(); } };
  const remove = async (c: any) => { if (confirm(t(`Remove ${c.member_name}?`, `${c.member_name}-কে সরাবেন?`)) && await run(show, api.delete(`/ops/association/committee/${c.id_committee}`))) load(); };
  const rows = (d?.rows || []).filter((c: any) => past || c.current);
  return (
    <>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={past} onChange={e => setPast(e.target.checked)} /> {t('Show past committees', 'আগের কমিটিও দেখান')}</label>
          <button className="btn btn-primary" onClick={() => setForm({ id_owners: null, member_name: '', phone: '', position: 'MEMBER', term_start: todayStr(), term_end: '', id_meetings: '' })}><i className="fa-solid fa-plus" /> {t('Add member', 'সদস্য যোগ')}</button>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Position', 'পদ')}</th><th>{t('Name', 'নাম')}</th><th>{t('Term', 'মেয়াদ')}</th><th>{t('Elected at', 'নির্বাচিত')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={5} text={t('Loading…')} />}
            {d && rows.length === 0 && <Empty cols={5} text={t('No committee on record. Add the president, general secretary and treasurer elected at your last AGM.', 'কোনো কমিটি নেই। গত সভায় নির্বাচিত সভাপতি, সাধারণ সম্পাদক ও কোষাধ্যক্ষ যোগ করুন।')} />}
            {rows.map((c: any) => (
              <tr key={c.id_committee} style={c.current ? undefined : { opacity: 0.55 }}>
                <td className="fw-semibold">{POSITIONS[c.position]?.[bn ? 1 : 0]}</td>
                <td>{c.member_name}{c.phone && <div className="text-xs text-muted">{c.phone}</div>}</td>
                <td className="text-sm">{fmtDate(c.term_start)} – {c.term_end ? fmtDate(c.term_end) : t('until replaced', 'পরবর্তী নির্বাচন পর্যন্ত')}</td>
                <td className="text-sm">{c.elected_at_title || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}><button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => setForm({ ...c, term_end: c.term_end || '', id_meetings: c.id_meetings || '' })}><i className="fa-solid fa-pen" /></button>{' '}
                  <button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => remove(c)}><i className="fa-solid fa-trash" /></button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {form && (
        <Modal title={form.id_committee ? t('Edit committee member', 'কমিটি সদস্য সম্পাদনা') : t('Add committee member', 'কমিটি সদস্য যোগ')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.id_owners && !form.member_name} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Owner', 'মালিক')} hint={t('Or type a name below for a non-owner (e.g. a co-opted adviser)', 'মালিক না হলে নিচে নাম লিখুন')}><select className="form-select" value={form.id_owners || ''} onChange={e => set('id_owners', e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('— Choose owner —', '— মালিক নির্বাচন —')}</option>{(d?.owners || []).map((o: any) => <option key={o.id_owners} value={o.id_owners}>{o.full_name} ({o.flats})</option>)}</select></Field>
            {!form.id_owners && <Field label={t('Name', 'নাম')} required><input className="form-control" value={form.member_name} onChange={e => set('member_name', e.target.value)} /></Field>}
            <Field label={t('Position', 'পদ')}><select className="form-select" value={form.position} onChange={e => set('position', e.target.value)}>{Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v[bn ? 1 : 0]}</option>)}</select></Field>
            <Field label={t('Term starts', 'মেয়াদ শুরু')} required><input type="date" className="form-control" value={form.term_start} onChange={e => set('term_start', e.target.value)} /></Field>
            <Field label={t('Term ends', 'মেয়াদ শেষ')}><input type="date" className="form-control" value={form.term_end} onChange={e => set('term_end', e.target.value)} /></Field>
            <Field label={t('Elected at', 'নির্বাচিত হয়েছেন')}><select className="form-select" value={form.id_meetings || ''} onChange={e => set('id_meetings', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>{(d?.meetings || []).map((m: any) => <option key={m.id_meetings} value={m.id_meetings}>{m.title}</option>)}</select></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Reserve fund ────────────────────────────────────────────────
function ReserveTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const units = useUnits();
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const load = () => api.get('/ops/association/reserve').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => { if (await run(show, api.post('/ops/association/reserve', form))) { setForm(null); load(); } };
  const remove = async (e: any) => { if (confirm(t('Delete this entry?', 'এই এন্ট্রি মুছবেন?')) && await run(show, api.delete(`/ops/association/reserve/${e.id_reserve_entries}`))) load(); };
  const flag = async (h: any) => { if (await run(show, api.put(`/ops/association/reserve/heads/${h.id_charge_heads}`, { is_reserve_fund: !h.is_reserve_fund }))) load(); };
  const s = d?.summary;
  const by = s?.by_type || {};
  const reserveHeads = (d?.heads || []).filter((h: any) => h.is_reserve_fund);
  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-piggy-bank" value={s ? money(s.balance_bdt) : '…'} label={t('Balance', 'স্থিতি')} tone="success" />
        <Stat icon="fa-solid fa-file-invoice-dollar" value={s ? money(by.AUTO_SERVICE_CHARGE || 0) : '…'} label={t('Collected through service charge', 'সার্ভিস চার্জের মাধ্যমে আদায়')} tone="info" />
        <Stat icon="fa-solid fa-hand-holding-dollar" value={s ? money((by.CONTRIBUTION || 0) + (by.INTEREST || 0) + (by.OPENING || 0)) : '…'} label={t('Opening, contributions & interest', 'প্রারম্ভিক জের, চাঁদা ও মুনাফা')} />
        <Stat icon="fa-solid fa-screwdriver-wrench" value={s ? money(-(by.WITHDRAWAL || 0)) : '…'} label={t('Spent', 'খরচ')} tone="warning" />
      </div>
      <div className="card mb-4">
        <div className="card-header"><div className="card-title"><i className="fa-solid fa-link text-primary" /> {t('Monthly contribution through the service charge bill', 'সার্ভিস চার্জ বিলের মাধ্যমে মাসিক চাঁদা')}</div></div>
        <div className="card-body">
          <div className="text-sm mb-4">{t('Tick the service-charge head that is the reserve fund contribution. Once a bill is fully paid, that head’s amount is added to the fund automatically. To add a new head (e.g. "Reserve fund — ৳500 per flat"), use Masters → service charge heads.', 'যে সার্ভিস চার্জ হেড রিজার্ভ ফান্ডের চাঁদা, সেটি টিক দিন। বিল পুরো পরিশোধ হলে ওই হেডের টাকা নিজে থেকে ফান্ডে যোগ হবে। নতুন হেড যোগ করতে মাস্টার → সার্ভিস চার্জ হেড ব্যবহার করুন।')} <Link to="/apartment/masters">{t('Open Masters', 'মাস্টার খুলুন')}</Link></div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>{(d?.heads || []).map((h: any) => (
            <label key={h.id_charge_heads} className={`btn btn-sm ${h.is_reserve_fund ? 'btn-success' : 'btn-light'}`} style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={!!h.is_reserve_fund} onChange={() => flag(h)} style={{ marginRight: 6 }} />{bn && h.head_name_bn ? h.head_name_bn : h.head_name_en} · {money(h.default_rate_bdt)}
            </label>
          ))}</div>
          {d && reserveHeads.length === 0 && <div className="form-text mt-1">{t('No head is linked yet — only manual entries count.', 'এখনো কোনো হেড যুক্ত নেই — শুধু হাতে লেখা এন্ট্রি গণনা হচ্ছে।')}</div>}
        </div>
      </div>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header flex-between"><div className="card-title">{t('Entries', 'এন্ট্রি')}</div>
            <div className="flex gap-2">
              <button className="btn btn-light btn-sm" onClick={() => setForm({ entry_type: 'CONTRIBUTION', amount_bdt: '', entry_date: todayStr(), id_units: null, purpose: '', payment_method: 'BANK', reference: '', notes: '' })}><i className="fa-solid fa-plus" /> {t('Money in', 'জমা')}</button>
              <button className="btn btn-warning btn-sm" onClick={() => setForm({ entry_type: 'WITHDRAWAL', amount_bdt: '', entry_date: todayStr(), id_proposals: '', purpose: '', payment_method: 'BANK', reference: '', notes: '' })}><i className="fa-solid fa-minus" /> {t('Spend', 'খরচ')}</button>
            </div></div>
          <div className="table-wrapper"><table>
            <thead><tr><th>{t('Date', 'তারিখ')}</th><th>{t('Entry', 'এন্ট্রি')}</th><th className="text-right">{t('Amount', 'টাকা')}</th><th /></tr></thead>
            <tbody>
              {d?.entries.length === 0 && <Empty cols={4} text={t('No entries. Start with the opening balance in the fund’s bank account.', 'কোনো এন্ট্রি নেই। ফান্ডের ব্যাংক হিসাবের প্রারম্ভিক জের দিয়ে শুরু করুন।')} />}
              {d?.entries.map((e: any) => (
                <tr key={e.id_reserve_entries}>
                  <td className="text-sm">{fmtDate(e.entry_date)}</td>
                  <td><div className="fw-semibold">{ENTRY_TYPES[e.entry_type]?.[bn ? 1 : 0]}{e.unit_number ? ` · ${e.unit_number}` : ''}</div><div className="text-xs text-muted">{[e.purpose, e.proposal_title && `${t('approved', 'অনুমোদিত')}: ${e.proposal_title}`, e.reference].filter(Boolean).join(' · ')}</div></td>
                  <td className={`text-right fw-bold ${e.amount_bdt < 0 ? 'text-warning' : ''}`}>{e.amount_bdt < 0 ? '− ' : ''}{money(Math.abs(e.amount_bdt))}</td>
                  <td><button className="btn btn-light btn-sm" aria-label={t('Delete', 'মুছুন')} onClick={() => remove(e)}><i className="fa-solid fa-trash" /></button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">{t('From service charge, by month', 'সার্ভিস চার্জ থেকে, মাসভিত্তিক')}</div></div>
          <div className="table-wrapper"><table>
            <thead><tr><th>{t('Month paid', 'পরিশোধের মাস')}</th><th className="text-right">{t('Bills', 'বিল')}</th><th className="text-right">{t('Amount', 'টাকা')}</th></tr></thead>
            <tbody>
              {d?.auto_by_month.length === 0 && <Empty cols={3} text={t('Nothing yet.', 'এখনো কিছু নেই।')} />}
              {d?.auto_by_month.map((m: any) => <tr key={m.month}><td>{m.month}</td><td className="text-right">{m.bills}</td><td className="text-right">{money(m.amount_bdt)}</td></tr>)}
            </tbody>
          </table></div>
        </div>
      </div>

      {form && (
        <Modal title={form.entry_type === 'WITHDRAWAL' ? t('Spend from the reserve fund', 'রিজার্ভ ফান্ড থেকে খরচ') : t('Money into the reserve fund', 'রিজার্ভ ফান্ডে জমা')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.amount_bdt} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          {form.entry_type === 'WITHDRAWAL' && (d?.proposals.length
            ? <div className="alert alert-info mb-4">{t(`Available: ${money(s.balance_bdt)}. Spending must be backed by an approved committee proposal.`, `বর্তমান স্থিতি: ${money(s.balance_bdt)}। খরচের জন্য অনুমোদিত কমিটি প্রস্তাব লাগবে।`)}</div>
            : <div className="alert alert-warning mb-4">{t('There is no approved proposal yet. Raise one on Committee Voting and get it approved first.', 'কোনো অনুমোদিত প্রস্তাব নেই। আগে কমিটি ভোটিং-এ প্রস্তাব তুলে অনুমোদন নিন।')} <Link to="/apartment/voting">{t('Committee Voting', 'কমিটি ভোটিং')}</Link></div>)}
          <div className="form-row cols-2">
            {form.entry_type !== 'WITHDRAWAL' && <Field label={t('Type', 'ধরন')}><select className="form-select" value={form.entry_type} onChange={e => set('entry_type', e.target.value)}>
              {['OPENING', 'CONTRIBUTION', 'INTEREST', 'ADJUSTMENT'].map(k => <option key={k} value={k}>{ENTRY_TYPES[k][bn ? 1 : 0]}</option>)}</select></Field>}
            {form.entry_type === 'WITHDRAWAL' && <Field label={t('Approved proposal', 'অনুমোদিত প্রস্তাব')} required><select className="form-select" value={form.id_proposals} onChange={e => set('id_proposals', e.target.value)}>
              <option value="">{t('— Choose —', '— নির্বাচন —')}</option>{(d?.proposals || []).map((p: any) => <option key={p.id_proposals} value={p.id_proposals}>{p.title} ({money(p.estimated_cost)})</option>)}</select></Field>}
            <Field label={t('Amount (৳)', 'টাকা (৳)')} required hint={form.entry_type === 'ADJUSTMENT' ? t('Use a minus sign to reduce the balance', 'কমাতে মাইনাস চিহ্ন দিন') : undefined}><input type="number" className="form-control" value={form.amount_bdt} onChange={e => set('amount_bdt', e.target.value)} /></Field>
            <Field label={t('Date', 'তারিখ')}><input type="date" className="form-control" max={todayStr()} value={form.entry_date} onChange={e => set('entry_date', e.target.value)} /></Field>
            {form.entry_type === 'CONTRIBUTION' && <Field label={t('From flat (optional)', 'যে ফ্ল্যাট থেকে (ঐচ্ছিক)')}><UnitSelect units={units} allowEmpty emptyLabel={t('— All / general —', '— সাধারণ —')} value={form.id_units} onChange={v => set('id_units', v)} /></Field>}
            <Field label={t('Method', 'মাধ্যম')}><MethodSelect value={form.payment_method} onChange={v => set('payment_method', v)} /></Field>
            <Field label={t('Cheque / transaction no.', 'চেক / ট্রানজেকশন নং')}><input className="form-control" value={form.reference} onChange={e => set('reference', e.target.value)} /></Field>
          </div>
          <Field label={form.entry_type === 'WITHDRAWAL' ? t('What it was spent on', 'কী কাজে খরচ') : t('Note', 'নোট')} required={form.entry_type === 'WITHDRAWAL'}><input className="form-control" placeholder={form.entry_type === 'WITHDRAWAL' ? t('e.g. Lift 2 rope replacement — Sigma invoice 4471', 'যেমন: লিফট ২ রোপ পরিবর্তন') : ''} value={form.purpose} onChange={e => set('purpose', e.target.value)} /></Field>
        </Modal>
      )}
    </>
  );
}

// ── Yearly statement ────────────────────────────────────────────
function StatementTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const current = fiscalYearOf(new Date());
  const years = useMemo(() => { const y = Number(current.slice(0, 4)); return [0, 1, 2, 3, 4].map(i => `${y - i}-${String((y - i + 1) % 100).padStart(2, '0')}`); }, [current]);
  const [fy, setFy] = useState(current);
  const [d, setD] = useState<any>(null);
  useEffect(() => { setD(null); api.get('/ops/association/statement', { params: { fy } }).then(setD).catch((e: any) => show(false, e.message)); }, [fy]);
  const label = (r: any) => (bn ? r.label_bn : r.label);
  const pos = (k: string) => d?.committee?.find((c: any) => c.position === k)?.member_name || '';
  return (
    <>
      <div className="flex-between mb-4 no-print" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <label className="text-sm fw-semibold" htmlFor="st-fy">{t('Fiscal year (Jul–Jun)', 'অর্থবছর (জুলাই–জুন)')}</label>
          <select id="st-fy" className="form-select" style={{ width: 'auto' }} value={fy} onChange={e => setFy(e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select>
        </div>
        <button className="btn btn-light" onClick={() => window.print()}><i className="fa-solid fa-print" /> {t('Print for the AGM', 'সভার জন্য প্রিন্ট')}</button>
      </div>
      {!d ? <div className="card"><div className="card-body text-muted">{t('Loading…')}</div></div> : (
        <div className="card"><div className="card-body">
          <div className="text-center mb-4">
            <div className="fw-bold" style={{ fontSize: '1.2rem' }}>{bn ? d.settings.company_name_bn : d.settings.company_name_en}</div>
            <div className="text-sm text-muted">{d.settings.address}</div>
            <div className="fw-bold mt-1">{t('Income & expenditure statement', 'আয়-ব্যয়ের বিবরণী')} · {t('FY', 'অর্থবছর')} {d.fiscal_year} ({fmtDate(d.from)} – {fmtDate(d.to)})</div>
          </div>
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <table><thead><tr><th>{t('Income', 'আয়')}</th><th className="text-right">৳</th></tr></thead><tbody>
              {d.income.map((r: any) => <tr key={r.key}><td>{label(r)}</td><td className="text-right">{money(r.amount_bdt)}</td></tr>)}
              <tr><td className="fw-bold">{t('Total income', 'মোট আয়')}</td><td className="text-right fw-bold">{money(d.total_income_bdt)}</td></tr>
            </tbody></table>
            <table><thead><tr><th>{t('Expenditure', 'ব্যয়')}</th><th className="text-right">৳</th></tr></thead><tbody>
              {d.expenses.map((r: any) => <tr key={r.key}><td>{label(r)}</td><td className="text-right">{money(r.amount_bdt)}</td></tr>)}
              <tr><td className="fw-bold">{t('Total expenditure', 'মোট ব্যয়')}</td><td className="text-right fw-bold">{money(d.total_expense_bdt)}</td></tr>
            </tbody></table>
          </div>
          <div className={`alert ${d.surplus_bdt >= 0 ? 'alert-success' : 'alert-danger'} mt-4`}>{d.surplus_bdt >= 0 ? t('Surplus for the year', 'বছরের উদ্বৃত্ত') : t('Deficit for the year', 'বছরের ঘাটতি')}: <strong>{money(Math.abs(d.surplus_bdt))}</strong></div>
          <div className="grid grid-2 mt-4" style={{ alignItems: 'start' }}>
            <table><thead><tr><th>{t('Reserve fund', 'রিজার্ভ ফান্ড')}</th><th className="text-right">৳</th></tr></thead><tbody>
              <tr><td>{t('Opening balance', 'প্রারম্ভিক জের')}</td><td className="text-right">{money(d.reserve.opening_bdt)}</td></tr>
              <tr><td>{t('Add: from service charge', 'যোগ: সার্ভিস চার্জ থেকে')}</td><td className="text-right">{money(d.reserve.from_service_charge_bdt)}</td></tr>
              <tr><td>{t('Add: other contributions', 'যোগ: অন্যান্য চাঁদা')}</td><td className="text-right">{money(d.reserve.contributions_bdt)}</td></tr>
              <tr><td>{t('Add: bank interest / profit', 'যোগ: ব্যাংক মুনাফা')}</td><td className="text-right">{money(d.reserve.interest_bdt)}</td></tr>
              {d.reserve.adjustments_bdt !== 0 && <tr><td>{t('Adjustments / opening entry', 'সমন্বয় / প্রারম্ভিক এন্ট্রি')}</td><td className="text-right">{money(d.reserve.adjustments_bdt)}</td></tr>}
              <tr><td>{t('Less: spent', 'বাদ: খরচ')}</td><td className="text-right">− {money(d.reserve.withdrawals_bdt)}</td></tr>
              <tr><td className="fw-bold">{t('Closing balance', 'সমাপনী জের')}</td><td className="text-right fw-bold">{money(d.reserve.closing_bdt)}</td></tr>
            </tbody></table>
            <table><tbody>
              <tr><td>{t('Service charge still unpaid at year end', 'বছর শেষে অনাদায়ী সার্ভিস চার্জ')}</td><td className="text-right">{money(d.service_charge_outstanding_bdt)}</td></tr>
            </tbody></table>
          </div>
          <div className="form-text mt-4">{t('Prepared from the records in this system: service-charge collections, paid payslips, upkeep costs and reserve-fund entries. Spending recorded elsewhere (vendor bills, utility bills paid in cash) is not included — add it before presenting, and have the accounts checked by an auditor.', 'এই সিস্টেমের হিসাব থেকে তৈরি: সার্ভিস চার্জ আদায়, পরিশোধিত বেতন, রক্ষণাবেক্ষণ খরচ ও রিজার্ভ ফান্ড। অন্যত্র লেখা খরচ (সরবরাহকারীর বিল, নগদে দেওয়া ইউটিলিটি বিল) এখানে নেই — উপস্থাপনের আগে যোগ করুন এবং নিরীক্ষককে দিয়ে যাচাই করান।')}</div>
          <div className="grid grid-3 mt-4" style={{ paddingTop: 48 }}>
            {[[t('Treasurer', 'কোষাধ্যক্ষ'), pos('TREASURER')], [t('General secretary', 'সাধারণ সম্পাদক'), pos('GENERAL_SECRETARY')], [t('Auditor', 'নিরীক্ষক'), '']].map(([role, nm]) => (
              <div key={role} className="text-center text-sm" style={{ borderTop: '1px solid #94a3b8', paddingTop: 6 }}>{nm || ' '}<div className="text-muted">{role}</div></div>
            ))}
          </div>
        </div></div>
      )}
    </>
  );
}

// ── Zakat ───────────────────────────────────────────────────────
function ZakatTab({ show }: { show: Notify }) {
  const { t } = useLang();
  const [owners, setOwners] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [to, setTo] = useState(todayStr());
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/ops/association/committee').then((r: any) => setOwners(r.owners)).catch((e: any) => show(false, e.message)); }, []);
  useEffect(() => {
    if (!ownerId) return;
    setD(null);
    api.get(`/ops/association/zakat/${ownerId}`, { params: { to } }).then(setD).catch((e: any) => show(false, e.message));
  }, [ownerId, to]);
  return (
    <>
      <div className="card mb-4"><div className="card-body">
        <div className="form-row cols-3">
          <Field label={t('Owner', 'মালিক')}><select className="form-select" value={ownerId || ''} onChange={e => setOwnerId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t('— Choose owner —', '— মালিক নির্বাচন —')}</option>{owners.map(o => <option key={o.id_owners} value={o.id_owners}>{o.full_name} ({o.flats})</option>)}</select></Field>
          <Field label={t('Zakat date', 'যাকাতের তারিখ')} hint={t('Records cover the lunar year (354 days) before this date', 'এই তারিখের আগের এক চান্দ্র বছর (৩৫৪ দিন)')}><input type="date" className="form-control" max={todayStr()} value={to} onChange={e => setTo(e.target.value)} /></Field>
        </div>
        <div className="form-text">{t('Owners can see their own statement in the owner portal.', 'মালিকরা নিজের বিবরণী মালিক পোর্টালে দেখতে পান।')}</div>
      </div></div>
      {ownerId && !d && <div className="text-muted">{t('Loading…')}</div>}
      {d && <ZakatStatement data={d} />}
    </>
  );
}
