import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useLang } from '../../i18n/LanguageContext';
import { fmtDate } from '../../utils/bd';
import { Empty, Field, Modal, Stat, dateTime, run, Notify } from './shared';
import Ballot, { BallotPosition, BallotSymbol, ElectionResults, postName, symbolName } from './Ballot';
import { POSITION_LABELS, SYMBOLS } from './electionSymbols';

// Staff side of committee elections: set up posts and candidates (with symbols), open voting, run a polling
// booth for owners without a portal login, close, settle ties, publish, and install the new committee.

const STATUS: Record<string, [string, string, string]> = {
  DRAFT: ['Draft — nominations', 'খসড়া — মনোনয়ন', 'badge-gray'], OPEN: ['Voting open', 'ভোটগ্রহণ চলছে', 'badge-success'], CLOSED: ['Counting', 'গণনা', 'badge-warning'],
  PUBLISHED: ['Result published', 'ফলাফল প্রকাশিত', 'badge-primary'], CANCELLED: ['Cancelled', 'বাতিল', 'badge-gray'],
};
const PHASE: Record<string, [string, string]> = { NOT_YET: ['opens soon', 'শীঘ্রই শুরু'], ENDED: ['time is up — close it', 'সময় শেষ — বন্ধ করুন'], VOTING: ['voting now', 'ভোট চলছে'] };

const localDT = (d?: string | Date | null) => {
  if (!d) return '';
  const x = new Date(d); const p = (v: number) => String(v).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
const ymdOf = (d?: string | null) => (d ? localDT(d).slice(0, 10) : '');

export default function ElectionsTab({ show }: { show: Notify }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const load = () => api.get('/ops/elections').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const save = async () => { const r: any = await run(show, api.post('/ops/elections', form)); if (r) { setForm(null); load(); if (r.id && !form.id_elections) setOpenId(r.id); } };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  if (openId) return <ElectionDetail id={openId} show={show} onBack={() => { setOpenId(null); load(); }} onEdit={e => setForm({ ...e, voting_opens_at: localDT(e.voting_opens_at), voting_closes_at: localDT(e.voting_closes_at), term_start: ymdOf(e.term_start), term_end: ymdOf(e.term_end), id_meetings: e.id_meetings || '' })} formNode={form && <ElectionForm form={form} set={set} meetings={d?.meetings || []} onClose={() => setForm(null)} onSave={save} />} />;

  const year = new Date().getFullYear();
  return (
    <>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="text-sm text-muted">{t('Elect the executive committee by secret ballot. Each candidate gets a symbol; owners vote in the owner portal or at a polling booth.', 'গোপন ব্যালটে কার্যনির্বাহী কমিটি নির্বাচন। প্রত্যেক প্রার্থীর একটি প্রতীক থাকে; মালিকরা পোর্টালে বা ভোটকেন্দ্রে ভোট দেন।')}</div>
          <button className="btn btn-primary" onClick={() => setForm({ title: t(`Executive committee election ${year}`, `কার্যনির্বাহী কমিটি নির্বাচন ${year}`), id_meetings: '', voting_opens_at: '', voting_closes_at: '', term_start: `${year + 1}-01-01`, term_end: `${year + 2}-12-31`, is_secret: true, vote_basis: 'PER_OWNER', rules_note: '' })}>
            <i className="fa-solid fa-plus" /> {t('New election', 'নতুন নির্বাচন')}</button>
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('Election', 'নির্বাচন')}</th><th>{t('Voting', 'ভোটগ্রহণ')}</th><th>{t('Status', 'অবস্থা')}</th><th>{t('Turnout', 'ভোটার উপস্থিতি')}</th><th /></tr></thead>
          <tbody>
            {!d && <Empty cols={5} text={t('Loading…')} />}
            {d?.rows.length === 0 && <Empty cols={5} text={t('No elections yet.', 'এখনো কোনো নির্বাচন নেই।')} />}
            {d?.rows.map((e: any) => (
              <tr key={e.id_elections}>
                <td><div className="fw-semibold">{e.title}</div><div className="text-xs text-muted">{t('Term', 'মেয়াদ')} {fmtDate(e.term_start)} – {e.term_end ? fmtDate(e.term_end) : '…'}{e.meeting_title ? ` · ${e.meeting_title}` : ''}</div></td>
                <td className="text-sm">{dateTime(e.voting_opens_at)} → {dateTime(e.voting_closes_at)}</td>
                <td><span className={`badge ${STATUS[e.status]?.[2]}`}>{STATUS[e.status]?.[bn ? 1 : 0]}</span>{e.status === 'OPEN' && PHASE[e.phase] && <div className="text-xs text-muted">{PHASE[e.phase][bn ? 1 : 0]}</div>}</td>
                <td>{e.voted}/{d.eligible} <span className="text-xs text-muted">({d.eligible ? Math.round(e.voted * 100 / d.eligible) : 0}%)</span></td>
                <td><button className="btn btn-light btn-sm" onClick={() => setOpenId(e.id_elections)}>{t('Open', 'খুলুন')} <i className="fa-solid fa-arrow-right" /></button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {form && <ElectionForm form={form} set={set} meetings={d?.meetings || []} onClose={() => setForm(null)} onSave={save} />}
    </>
  );
}

function ElectionForm({ form, set, meetings, onClose, onSave }: { form: any; set: (k: string, v: any) => void; meetings: any[]; onClose: () => void; onSave: () => void }) {
  const { t } = useLang();
  const started = form.id_elections && form.status !== 'DRAFT';
  return (
    <Modal title={form.id_elections ? t('Election settings', 'নির্বাচনের সেটিংস') : t('New election', 'নতুন নির্বাচন')} onClose={onClose}
      footer={<><button className="btn btn-light" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.title || !form.voting_opens_at || !form.voting_closes_at || !form.term_start} onClick={onSave}>{t('Save', 'সংরক্ষণ')}</button></>}>
      {started && <div className="alert alert-info mb-4">{t('Voting has started: only the closing time can be moved later (to extend voting).', 'ভোট শুরু হয়েছে: শুধু শেষ সময় বাড়ানো যাবে।')}</div>}
      <div className="form-row cols-2">
        <Field label={t('Title', 'শিরোনাম')} required><input className="form-control" disabled={started} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label={t('Held at (meeting)', 'যে সভায়')}><select className="form-select" disabled={started} value={form.id_meetings || ''} onChange={e => set('id_meetings', e.target.value ? Number(e.target.value) : null)}>
          <option value="">—</option>{meetings.map(m => <option key={m.id_meetings} value={m.id_meetings}>{m.title}</option>)}</select></Field>
        <Field label={t('Voting opens', 'ভোট শুরু')} required><input type="datetime-local" className="form-control" disabled={started} value={form.voting_opens_at} onChange={e => set('voting_opens_at', e.target.value)} /></Field>
        <Field label={t('Voting closes', 'ভোট শেষ')} required><input type="datetime-local" className="form-control" value={form.voting_closes_at} onChange={e => set('voting_closes_at', e.target.value)} /></Field>
        <Field label={t('New committee takes office', 'নতুন কমিটির দায়িত্ব শুরু')} required><input type="date" className="form-control" disabled={started} value={form.term_start} onChange={e => set('term_start', e.target.value)} /></Field>
        <Field label={t('Term ends', 'মেয়াদ শেষ')}><input type="date" className="form-control" disabled={started} value={form.term_end || ''} onChange={e => set('term_end', e.target.value)} /></Field>
        <Field label={t('Votes', 'ভোটের হিসাব')} hint={t('Per flat gives an owner of two flats two votes — check your by-laws', 'ফ্ল্যাটভিত্তিক হলে দুই ফ্ল্যাটের মালিক দুই ভোট পাবেন — গঠনতন্ত্র দেখুন')}>
          <select className="form-select" disabled={started} value={form.vote_basis} onChange={e => set('vote_basis', e.target.value)}><option value="PER_OWNER">{t('One vote per owner', 'প্রতি মালিক এক ভোট')}</option><option value="PER_FLAT">{t('One vote per flat', 'প্রতি ফ্ল্যাট এক ভোট')}</option></select></Field>
        <Field label={t('Ballot', 'ব্যালট')}><select className="form-select" disabled={started} value={form.is_secret ? '1' : '0'} onChange={e => set('is_secret', e.target.value === '1')}>
          <option value="1">{t('Secret — nobody can see who voted for whom', 'গোপন — কে কাকে ভোট দিয়েছে কেউ দেখবে না')}</option><option value="0">{t('Open — choices are recorded against the owner', 'প্রকাশ্য — মালিকের নামে পছন্দ রেকর্ড হবে')}</option></select></Field>
      </div>
      <Field label={t('Rules / note for voters', 'ভোটারদের জন্য নিয়ম / নোট')}><textarea className="form-control" rows={2} value={form.rules_note || ''} onChange={e => set('rules_note', e.target.value)} /></Field>
    </Modal>
  );
}

function ElectionDetail({ id, show, onBack, onEdit, formNode }: { id: number; show: Notify; onBack: () => void; onEdit: (e: any) => void; formNode: React.ReactNode }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [view, setView] = useState<'setup' | 'voters'>('setup');
  const [cand, setCand] = useState<any>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [booth, setBooth] = useState<any>(null);
  const [tie, setTie] = useState<{ p: BallotPosition; picks: number[] } | null>(null);
  const load = () => api.get(`/ops/elections/${id}`).then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, [id, formNode === null]);
  if (!d) return <div className="text-muted">{t('Loading…')}</div>;
  const e = d.election;
  const draft = e.status === 'DRAFT';
  const status = async (to: string, ask?: string) => { if ((!ask || confirm(ask)) && await run(show, api.post(`/ops/elections/${id}/status`, { status: to }))) load(); };
  const notice = async (onlyNotVoted: boolean) => {
    if (!confirm(onlyNotVoted ? t('Text a reminder to every owner who has not voted yet?', 'যারা ভোট দেননি তাদের এসএমএস রিমাইন্ডার পাঠাবেন?') : t('Text the voting times to every member owner?', 'সব সদস্য মালিককে ভোটের সময় এসএমএস করবেন?'))) return;
    if (await run(show, api.post(`/ops/elections/${id}/notice`, { only_not_voted: onlyNotVoted }))) load();
  };
  const savePosts = async () => { if (await run(show, api.put(`/ops/elections/${id}/positions`, { positions: posts }))) { setPosts(null); load(); } };
  const saveCand = async () => { if (await run(show, api.post(`/ops/elections/${id}/candidates`, cand))) { setCand(null); load(); } };
  const removeCand = async (c: any) => { if (confirm(t(`Remove ${c.full_name}?`, `${c.full_name}-কে সরাবেন?`)) && await run(show, api.delete(`/ops/elections/${id}/candidates/${c.id_candidates}`))) load(); };
  const del = async () => { if (confirm(t('Delete this election?', 'নির্বাচনটি মুছবেন?')) && await run(show, api.delete(`/ops/elections/${id}`))) onBack(); };
  const install = async () => { if (confirm(t(`Make the winners the managing committee from ${fmtDate(e.term_start)}? Current members' terms will end the day before.`, `${fmtDate(e.term_start)} থেকে বিজয়ীদের ব্যবস্থাপনা কমিটি করবেন? বর্তমান সদস্যদের মেয়াদ আগের দিন শেষ হবে।`)) && await run(show, api.post(`/ops/elections/${id}/install`))) load(); };
  const saveTie = async () => { if (tie && await run(show, api.post(`/ops/elections/${id}/tie-break`, { id_positions: tie.p.id_positions, winners: tie.picks }))) { setTie(null); load(); } };
  const startBooth = async (owner: any) => {
    try { const r: any = await api.post(`/ops/elections/${id}/booth/start`, { id_owners: owner.id_owners }); setBooth(r); }
    catch (err: any) { show(false, err.message); }
  };
  const used = new Set<string>((d.positions || []).flatMap((p: any) => p.candidates.map((c: any) => c.symbol_key)));
  const candidateOwners = new Set<number>((d.positions || []).flatMap((p: any) => p.candidates.map((c: any) => c.id_owners)));
  const tu = d.turnout;

  return (
    <>
      {formNode}
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 10 }}>
        <button className="btn btn-light" onClick={onBack}><i className="fa-solid fa-arrow-left" /> {t('All elections', 'সব নির্বাচন')}</button>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {['DRAFT', 'OPEN'].includes(e.status) && <button className="btn btn-light" onClick={() => onEdit(e)}><i className="fa-solid fa-gear" /> {t('Settings', 'সেটিংস')}</button>}
          {draft && <button className="btn btn-light" onClick={() => notice(false)}><i className="fa-solid fa-comment-sms" /> {t('SMS voting notice', 'ভোটের নোটিশ এসএমএস')}</button>}
          {draft && <button className="btn btn-success" onClick={() => status('OPEN', t('Open voting? Posts and candidates are locked from now on.', 'ভোটগ্রহণ শুরু করবেন? এরপর পদ ও প্রার্থী আর বদলানো যাবে না।'))}><i className="fa-solid fa-box-archive" /> {t('Open voting', 'ভোট শুরু')}</button>}
          {draft && (d.positions || []).length > 0 && (d.positions || []).every((p: any) => p.candidates.length && !p.contested) && <button className="btn btn-primary" onClick={() => status('CLOSED')}>{t('Declare all elected unopposed', 'সবাইকে বিনা প্রতিদ্বন্দ্বিতায় ঘোষণা')}</button>}
          {e.status === 'OPEN' && <button className="btn btn-light" onClick={() => notice(true)}><i className="fa-solid fa-bell" /> {t('Remind non-voters', 'অভোটারদের মনে করান')}</button>}
          {e.status === 'OPEN' && <button className="btn btn-warning" onClick={() => status('CLOSED', t('Close voting now? No more ballots will be accepted and the count is shown.', 'এখন ভোট বন্ধ করবেন? আর কোনো ব্যালট নেওয়া হবে না এবং গণনা দেখাবে।'))}><i className="fa-solid fa-lock" /> {t('Close voting', 'ভোট বন্ধ')}</button>}
          {e.status === 'CLOSED' && <button className="btn btn-primary" disabled={d.results?.unresolved_ties} onClick={() => status('PUBLISHED', t('Publish the result to all owners?', 'সব মালিকের কাছে ফলাফল প্রকাশ করবেন?'))}><i className="fa-solid fa-bullhorn" /> {t('Publish result', 'ফলাফল প্রকাশ')}</button>}
          {e.status === 'PUBLISHED' && !e.committee_installed && <button className="btn btn-success" onClick={install}><i className="fa-solid fa-user-tie" /> {t('Install as committee', 'কমিটি হিসেবে বসান')}</button>}
          {['DRAFT', 'OPEN'].includes(e.status) && <button className="btn btn-light" onClick={() => status('CANCELLED', t('Cancel this election? This cannot be undone.', 'নির্বাচন বাতিল করবেন? এটি ফেরানো যাবে না।'))}>{t('Cancel election', 'বাতিল')}</button>}
          {['DRAFT', 'CANCELLED'].includes(e.status) && <button className="btn btn-light" aria-label={t('Delete', 'মুছুন')} onClick={del}><i className="fa-solid fa-trash" /></button>}
        </div>
      </div>

      <div className="card mb-4"><div className="card-body">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="fw-bold" style={{ fontSize: '1.15rem' }}>{e.title} <span className={`badge ${STATUS[e.status]?.[2]}`}>{STATUS[e.status]?.[bn ? 1 : 0]}</span>{e.status === 'OPEN' && PHASE[e.phase] && <span className="text-sm text-muted"> · {PHASE[e.phase][bn ? 1 : 0]}</span>}</div>
            <div className="text-sm text-muted">{dateTime(e.voting_opens_at)} → {dateTime(e.voting_closes_at)} · {t('term', 'মেয়াদ')} {fmtDate(e.term_start)} – {e.term_end ? fmtDate(e.term_end) : '…'} · {e.is_secret ? t('secret ballot', 'গোপন ব্যালট') : t('open ballot', 'প্রকাশ্য ব্যালট')} · {e.vote_basis === 'PER_FLAT' ? t('one vote per flat', 'প্রতি ফ্ল্যাট এক ভোট') : t('one vote per owner', 'প্রতি মালিক এক ভোট')}</div>
            {e.notice_sent_at && <div className="text-xs text-muted"><i className="fa-solid fa-comment-sms" /> {t('Notice sent', 'নোটিশ পাঠানো')} {dateTime(e.notice_sent_at)}</div>}
            {e.committee_installed && <div className="text-xs text-muted"><i className="fa-solid fa-user-tie" /> {t('Installed as the managing committee', 'ব্যবস্থাপনা কমিটি হিসেবে বসানো হয়েছে')}</div>}
          </div>
          <div className="stats-grid" style={{ margin: 0, minWidth: 320 }}>
            <Stat icon="fa-solid fa-users" value={tu.eligible} label={t('Eligible owners', 'যোগ্য মালিক')} />
            <Stat icon="fa-solid fa-check-to-slot" value={`${tu.voted} · ${tu.eligible ? Math.round(tu.voted * 100 / tu.eligible) : 0}%`} label={t('Voted', 'ভোট দিয়েছেন')} tone="success" />
          </div>
        </div>
      </div></div>

      {e.status !== 'DRAFT' && <div className="tabs mb-4" role="tablist">
        <button role="tab" aria-selected={view === 'setup'} className={`tab-btn${view === 'setup' ? ' active' : ''}`} onClick={() => setView('setup')}><i className="fa-solid fa-list-check" /> {d.results ? t('Result', 'ফলাফল') : t('Ballot', 'ব্যালট')}</button>
        <button role="tab" aria-selected={view === 'voters'} className={`tab-btn${view === 'voters' ? ' active' : ''}`} onClick={() => setView('voters')}><i className="fa-solid fa-clipboard-user" /> {t('Voter list & booth', 'ভোটার তালিকা ও বুথ')}</button>
      </div>}

      {view === 'voters' && e.status !== 'DRAFT' ? <VoterList id={id} election={e} show={show} onStartBooth={startBooth} />
        : d.results ? <ElectionResults positions={d.results.positions} ballots={d.results.ballots} onTieBreak={e.status === 'CLOSED' ? p => setTie({ p, picks: [] }) : undefined} />
          : <>
            {e.status === 'OPEN' && <div className="alert alert-info mb-4"><i className="fa-solid fa-eye-slash" /> {t('The count stays hidden from everyone until voting is closed.', 'ভোট বন্ধ না হওয়া পর্যন্ত গণনা সবার কাছে গোপন থাকে।')}</div>}
            {draft && <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="text-sm text-muted">{t('A post with no more candidates than seats is elected unopposed and left off the ballot.', 'আসনের চেয়ে বেশি প্রার্থী না থাকলে সেই পদে বিনা প্রতিদ্বন্দ্বিতায় নির্বাচিত হন এবং ব্যালটে থাকে না।')}</div>
              <button className="btn btn-light" onClick={() => setPosts(d.positions.map((p: any) => ({ position: p.position, seats: p.seats })))}><i className="fa-solid fa-sitemap" /> {t('Edit posts & seats', 'পদ ও আসন')}</button>
            </div>}
            {(d.positions || []).map((p: any) => (
              <div key={p.id_positions} className="card mb-4">
                <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div className="card-title">{postName(p.position, bn)} <span className="text-sm text-muted">· {p.seats} {t('seat(s)', 'আসন')}</span> {p.candidates.length > 0 && !p.contested && <span className="badge badge-info">{t('Unopposed', 'প্রতিদ্বন্দ্বিতাহীন')}</span>}</div>
                  {draft && <button className="btn btn-light btn-sm" onClick={() => setCand({ id_positions: p.id_positions, id_owners: '', symbol_key: '', manifesto: '' })}><i className="fa-solid fa-user-plus" /> {t('Add candidate', 'প্রার্থী যোগ')}</button>}
                </div>
                <div className="card-body">
                  {p.candidates.length === 0 && <div className="text-sm text-muted">{t('No candidates yet.', 'এখনো প্রার্থী নেই।')}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                    {p.candidates.map((c: any) => (
                      <div key={c.id_candidates} className="flex gap-2 p-3 rounded" style={{ border: '1px solid #e2e8f0', alignItems: 'center' }}>
                        <BallotSymbol k={c.symbol_key} size={48} />
                        <div style={{ flex: 1, minWidth: 0 }}><div className="fw-semibold">{c.full_name}</div><div className="text-xs text-muted">{symbolName(c.symbol_key, bn)} · {t('Flat', 'ফ্ল্যাট')} {c.flats}</div></div>
                        {draft && <div className="flex gap-2"><button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => setCand({ ...c, id_positions: p.id_positions })}><i className="fa-solid fa-pen" /></button>
                          <button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => removeCand(c)}><i className="fa-solid fa-xmark" /></button></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>}

      {posts && (
        <Modal title={t('Posts & seats', 'পদ ও আসন')} onClose={() => setPosts(null)}
          footer={<><button className="btn btn-light" onClick={() => setPosts(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" onClick={savePosts}>{t('Save', 'সংরক্ষণ')}</button></>}>
          {posts.map((p, i) => (
            <div key={p.position} className="flex gap-2 mb-1" style={{ alignItems: 'center' }}>
              <div style={{ flex: 1 }} className="fw-semibold">{postName(p.position, bn)}</div>
              <input type="number" min={1} max={30} className="form-control" style={{ width: 90 }} aria-label={t('Seats', 'আসন')} disabled={p.position !== 'MEMBER'} value={p.seats} onChange={ev => setPosts(posts.map((x, j) => (j === i ? { ...x, seats: Number(ev.target.value) } : x)))} />
              <button className="btn btn-light btn-sm" aria-label={t('Move up', 'উপরে')} disabled={i === 0} onClick={() => { const n = [...posts]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setPosts(n); }}><i className="fa-solid fa-arrow-up" /></button>
              <button className="btn btn-light btn-sm" aria-label={t('Remove', 'সরান')} onClick={() => setPosts(posts.filter((_, j) => j !== i))}><i className="fa-solid fa-xmark" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
            {Object.keys(POSITION_LABELS).filter(k => !posts.some(p => p.position === k)).map(k => (
              <button key={k} className="btn btn-light btn-sm" onClick={() => setPosts([...posts, { position: k, seats: 1 }])}><i className="fa-solid fa-plus" /> {postName(k, bn)}</button>
            ))}
          </div>
          <div className="form-text mt-1">{t('Office-bearer posts have one seat each; set the number of executive members.', 'প্রতিটি পদাধিকারী পদে একটি আসন; কার্যনির্বাহী সদস্যের সংখ্যা ঠিক করুন।')}</div>
        </Modal>
      )}

      {cand && (
        <Modal title={cand.id_candidates ? t('Edit candidate', 'প্রার্থী সম্পাদনা') : t('Register candidate', 'প্রার্থী নিবন্ধন')} onClose={() => setCand(null)}
          footer={<><button className="btn btn-light" onClick={() => setCand(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!cand.id_owners || !cand.symbol_key} onClick={saveCand}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <Field label={t('Owner', 'মালিক')} required hint={t('Only owners with an active flat; one post per person', 'শুধু সক্রিয় ফ্ল্যাটের মালিক; একজন একটি পদে')}>
            <select className="form-select" value={cand.id_owners} onChange={ev => setCand({ ...cand, id_owners: Number(ev.target.value) || '' })}>
              <option value="">{t('— Choose owner —', '— মালিক নির্বাচন —')}</option>
              {d.owners.filter((o: any) => o.id_owners === cand.id_owners || !candidateOwners.has(o.id_owners)).map((o: any) => <option key={o.id_owners} value={o.id_owners}>{o.full_name} ({o.flats})</option>)}
            </select></Field>
          <div className="form-label">{t('Ballot symbol', 'প্রতীক')} <span className="text-danger">*</span></div>
          <div role="radiogroup" aria-label={t('Ballot symbol', 'প্রতীক')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8, marginBottom: 16 }}>
            {Object.keys(SYMBOLS).map(k => {
              const taken = used.has(k) && cand.symbol_key !== k && !(cand.id_candidates && d.positions.some((p: any) => p.candidates.some((c: any) => c.id_candidates === cand.id_candidates && c.symbol_key === k)));
              const on = cand.symbol_key === k;
              return (
                <button key={k} type="button" role="radio" aria-checked={on} disabled={taken} onClick={() => setCand({ ...cand, symbol_key: k })}
                  style={{ padding: 8, borderRadius: 10, border: on ? '3px solid #4f46e5' : '1px solid #e2e8f0', background: on ? '#eef2ff' : '#fff', opacity: taken ? 0.35 : 1, cursor: taken ? 'not-allowed' : 'pointer', textAlign: 'center' }}>
                  <BallotSymbol k={k} size={40} /><div className="text-xs mt-1">{symbolName(k, bn)}</div>{taken && <div className="text-xs text-muted">{t('taken', 'নেওয়া')}</div>}
                </button>
              );
            })}
          </div>
          <Field label={t('Short message to voters (optional)', 'ভোটারদের জন্য সংক্ষিপ্ত বার্তা (ঐচ্ছিক)')}><textarea className="form-control" rows={2} maxLength={500} value={cand.manifesto || ''} onChange={ev => setCand({ ...cand, manifesto: ev.target.value })} /></Field>
        </Modal>
      )}

      {tie && (
        <Modal title={`${t('Draw of lots', 'লটারি')} — ${postName(tie.p.position, bn)}`} onClose={() => setTie(null)}
          footer={<><button className="btn btn-light" onClick={() => setTie(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={tie.picks.length !== tie.p.tie!.seats_left} onClick={saveTie}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <p className="text-sm">{t(`Choose the ${tie.p.tie!.seats_left} candidate(s) who won the draw.`, `লটারিতে জয়ী ${tie.p.tie!.seats_left} জন নির্বাচন করুন।`)}</p>
          {tie.p.candidates.filter(c => tie.p.tie!.candidates.includes(c.id_candidates)).map(c => (
            <label key={c.id_candidates} className="flex gap-2 mb-1" style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={tie.picks.includes(c.id_candidates)} onChange={ev => setTie({ ...tie, picks: ev.target.checked ? [...tie.picks, c.id_candidates] : tie.picks.filter(x => x !== c.id_candidates) })} />
              <BallotSymbol k={c.symbol_key} size={32} /> {c.full_name}
            </label>
          ))}
        </Modal>
      )}

      {booth && (
        <div className="modal-overlay" style={{ zIndex: 9000 }}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 1000, width: '100%', maxHeight: '96vh', overflowY: 'auto' }}>
            <div className="modal-body">
              <Ballot title={booth.election.title} positions={booth.positions} voterName={`${booth.voter.full_name} (${booth.voter.flats})`}
                onCancel={() => { setBooth(null); load(); }}
                onCast={async choices => { try { const r: any = await api.post(`/ops/elections/${id}/booth/cast`, { token: booth.token, choices }); return r.receipt; } catch (err: any) { show(false, err.message); return null; } }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VoterList({ id, election, show, onStartBooth }: { id: number; election: any; show: Notify; onStartBooth: (o: any) => void }) {
  const { t } = useLang();
  const [rows, setRows] = useState<any[] | null>(null);
  const [choices, setChoices] = useState<any>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'voted' | 'not'>('all');
  useEffect(() => { api.get(`/ops/elections/${id}/voters`).then((r: any) => { setRows(r.rows); setChoices(r.choices); }).catch((e: any) => show(false, e.message)); }, [id]);
  const voting = election.phase === 'VOTING';
  const shown = (rows || []).filter(r => (filter === 'all' || (filter === 'voted') === r.voted) && (!q || `${r.full_name} ${r.flats} ${r.phone}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="card">
      <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="flex gap-2">{([['all', t('All', 'সব')], ['not', t('Not voted', 'ভোট দেননি')], ['voted', t('Voted', 'ভোট দিয়েছেন')]] as const).map(([k, l]) =>
          <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-light'}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
        <input className="form-control" style={{ width: 240 }} placeholder={t('Search owner, flat, phone', 'মালিক, ফ্ল্যাট, ফোন')} aria-label={t('Search owner, flat, phone', 'মালিক, ফ্ল্যাট, ফোন')} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {voting && <div className="alert alert-info" style={{ margin: 12 }}><i className="fa-solid fa-person-booth" /> {t('Polling booth: check the owner’s NID, press "Give ballot", then hand the device to them and step away. The ballot screen does not show you their choices.', 'ভোটকেন্দ্র: মালিকের এনআইডি যাচাই করে "ব্যালট দিন" চাপুন, তারপর ডিভাইসটি তাকে দিয়ে সরে দাঁড়ান। তার পছন্দ আপনি দেখবেন না।')}</div>}
      <div className="table-wrapper"><table>
        <thead><tr><th>{t('Owner', 'মালিক')}</th><th>{t('Flats', 'ফ্ল্যাট')}</th><th>{t('Voted', 'ভোট')}</th>{choices && <th>{t('Choices (open ballot)', 'পছন্দ (প্রকাশ্য)')}</th>}<th /></tr></thead>
        <tbody>
          {!rows && <Empty cols={4} text={t('Loading…')} />}
          {shown.map(r => (
            <tr key={r.id_owners}>
              <td>{r.full_name}<div className="text-xs text-muted">{r.phone}</div></td>
              <td className="text-sm">{r.flats}{election.vote_basis === 'PER_FLAT' && r.flat_count > 1 ? ` · ${r.flat_count} ${t('votes', 'ভোট')}` : ''}</td>
              <td>{r.voted ? <span className="badge badge-success">{dateTime(r.voted_at)} · {r.channel === 'BOOTH' ? t('booth', 'বুথ') : t('portal', 'পোর্টাল')}</span> : <span className="badge badge-gray">{t('Not yet', 'এখনো না')}</span>}</td>
              {choices && <td className="text-sm">{(choices[r.id_owners] || []).join(', ') || '—'}</td>}
              <td>{voting && !r.voted && <button className="btn btn-success btn-sm" onClick={() => onStartBooth(r)}><i className="fa-solid fa-person-booth" /> {t('Give ballot', 'ব্যালট দিন')}</button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
