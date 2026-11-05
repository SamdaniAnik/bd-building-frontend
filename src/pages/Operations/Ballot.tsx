import React, { useState } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import { POSITION_LABELS, SYMBOLS } from './electionSymbols';

// Secret ballot paper, shared by the owner portal and the staff polling booth.
// Contested posts list each candidate with their symbol; the voter taps to mark (সিল) up to the number of seats.
// Uncontested posts are shown as elected unopposed. Voting goes: mark → review → cast → receipt.

export type BallotCandidate = { id_candidates: number; full_name: string; flats: string; symbol_key: string; manifesto?: string | null; votes?: number | null; elected?: boolean; tied?: boolean; unopposed?: boolean; won_by_lot?: boolean };
export type BallotPosition = { id_positions: number; position: string; seats: number; contested: boolean; candidates: BallotCandidate[]; skipped?: number | null; tie?: { seats_left: number; candidates: number[]; settled: boolean } | null };

export function BallotSymbol({ k, size = 44 }: { k: string; size?: number }) {
  const { lang } = useLang();
  const s = SYMBOLS[k];
  if (!s) return <span className="text-muted">?</span>;
  return (
    <span title={lang === 'bn' ? s.bn : s.en} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', flex: 'none' }}>
      <i className={s.icon} style={{ fontSize: size * 0.5, color: s.color }} aria-hidden="true" />
    </span>
  );
}

export const symbolName = (k: string, bn: boolean) => (SYMBOLS[k] ? (bn ? SYMBOLS[k].bn : SYMBOLS[k].en) : k);
export const postName = (p: string, bn: boolean) => POSITION_LABELS[p]?.[bn ? 1 : 0] || p;

export default function Ballot({ title, positions, voterName, onCast, onCancel }: {
  title: string; positions: BallotPosition[]; voterName?: string;
  onCast: (choices: Record<number, number[]>) => Promise<string | null>; // returns the receipt, or null on failure
  onCancel?: () => void;
}) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const contested = positions.filter(p => p.contested);
  const unopposed = positions.filter(p => !p.contested);
  const [picks, setPicks] = useState<Record<number, number[]>>({});
  const [step, setStep] = useState<'mark' | 'review' | 'done'>('mark');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const toggle = (p: BallotPosition, id: number) => setPicks(x => {
    const cur = x[p.id_positions] || [];
    if (cur.includes(id)) return { ...x, [p.id_positions]: cur.filter(c => c !== id) };
    if (p.seats === 1) return { ...x, [p.id_positions]: [id] };      // single seat: tapping another moves the mark
    if (cur.length >= p.seats) return x;                               // full — unmark one first
    return { ...x, [p.id_positions]: [...cur, id] };
  });
  const cast = async () => { setBusy(true); const r = await onCast(picks); setBusy(false); if (r) { setReceipt(r); setStep('done'); } };
  const blanks = contested.filter(p => !(picks[p.id_positions] || []).length);

  if (step === 'done') return (
    <div className="text-center" style={{ padding: '24px 8px' }}>
      <i className="fa-solid fa-circle-check" style={{ fontSize: 56, color: '#16a34a' }} aria-hidden="true" />
      <h2 className="mt-4">{t('Your vote has been recorded', 'আপনার ভোট গ্রহণ করা হয়েছে')}</h2>
      <p className="text-muted">{t('Nobody — not even the committee — can see who you voted for.', 'কাকে ভোট দিয়েছেন তা কেউ — কমিটিও — দেখতে পাবে না।')}</p>
      <div className="mt-4 text-sm text-muted">{t('Your ballot receipt', 'আপনার ব্যালট রসিদ')}</div>
      <div style={{ fontSize: '2rem', fontFamily: 'monospace', letterSpacing: 4, fontWeight: 700 }}>{receipt}</div>
      <p className="text-sm text-muted">{t('Note it down: with this code you can check later that your ballot was counted. It does not show your choices.', 'কোডটি লিখে রাখুন: পরে যাচাই করতে পারবেন আপনার ব্যালট গণনায় আছে কি না। এতে আপনার পছন্দ দেখা যায় না।')}</p>
      {onCancel && <button className="btn btn-primary mt-4" onClick={onCancel}>{t('Done', 'শেষ')}</button>}
    </div>
  );

  return (
    <div>
      <div className="text-center mb-4">
        <div className="fw-bold" style={{ fontSize: '1.2rem' }}>{title}</div>
        <div className="text-sm text-muted">{t('Secret ballot', 'গোপন ব্যালট')}{voterName ? ` · ${t('Voter', 'ভোটার')}: ${voterName}` : ''}</div>
      </div>

      {step === 'mark' && <>
        {contested.map(p => {
          const mine = picks[p.id_positions] || [];
          return (
            <fieldset key={p.id_positions} className="card mb-4" style={{ padding: 0, border: '1px solid #e2e8f0' }}>
              <legend className="card-header" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span className="card-title">{postName(p.position, bn)}</span>
                <span className="text-sm text-muted">{p.seats === 1 ? t('Mark one', 'একজনকে সিল দিন') : t(`Mark up to ${p.seats}`, `সর্বোচ্চ ${p.seats} জনকে সিল দিন`)} · {mine.length}/{p.seats}</span>
              </legend>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                {p.candidates.map(c => {
                  const on = mine.includes(c.id_candidates);
                  const full = !on && p.seats > 1 && mine.length >= p.seats;
                  return (
                    <button key={c.id_candidates} type="button" aria-pressed={on} disabled={full} onClick={() => toggle(p, c.id_candidates)}
                      style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: 12, borderRadius: 12, cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.5 : 1,
                        border: on ? '3px solid #16a34a' : '2px solid #e2e8f0', background: on ? '#f0fdf4' : '#fff', position: 'relative', minHeight: 84 }}>
                      <BallotSymbol k={c.symbol_key} size={56} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="fw-bold" style={{ display: 'block' }}>{c.full_name}</span>
                        <span className="text-sm" style={{ display: 'block', color: '#475569' }}>{t('Symbol', 'প্রতীক')}: {symbolName(c.symbol_key, bn)}</span>
                        {c.flats && <span className="text-xs text-muted" style={{ display: 'block' }}>{t('Flat', 'ফ্ল্যাট')} {c.flats}</span>}
                        {c.manifesto && <span className="text-xs text-muted" style={{ display: 'block', marginTop: 4 }}>{c.manifesto}</span>}
                      </span>
                      {on && <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 8, color: '#16a34a', fontSize: 22 }}><i className="fa-solid fa-stamp" /></span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        {unopposed.length > 0 && (
          <div className="alert alert-info mb-4"><strong>{t('Elected unopposed', 'বিনা প্রতিদ্বন্দ্বিতায় নির্বাচিত')}:</strong>{' '}
            {unopposed.map(p => `${postName(p.position, bn)} — ${p.candidates.map(c => c.full_name).join(', ')}`).join(' · ')}</div>
        )}
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          {onCancel && <button className="btn btn-light" onClick={onCancel}>{t('Cancel', 'বাতিল')}</button>}
          <button className="btn btn-primary btn-lg" onClick={() => setStep('review')}>{t('Review my vote', 'ভোট যাচাই করুন')} <i className="fa-solid fa-arrow-right" /></button>
        </div>
      </>}

      {step === 'review' && <>
        <div className="card mb-4"><div className="card-body">
          {contested.map(p => {
            const mine = (picks[p.id_positions] || []).map(id => p.candidates.find(c => c.id_candidates === id)!).filter(Boolean);
            return (
              <div key={p.id_positions} className="flex gap-2 mb-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="fw-semibold" style={{ width: 180 }}>{postName(p.position, bn)}</div>
                {mine.length ? mine.map(c => <span key={c.id_candidates} className="flex gap-2" style={{ alignItems: 'center' }}><BallotSymbol k={c.symbol_key} size={36} /> {c.full_name}</span>)
                  : <span className="badge badge-warning">{t('No vote for this post', 'এই পদে ভোট দেননি')}</span>}
              </div>
            );
          })}
        </div></div>
        {blanks.length > 0 && <div className="alert alert-warning mb-4">{t('You left some posts blank. That is allowed — the blank posts simply get no vote from you.', 'কিছু পদ খালি রেখেছেন। এটি অনুমোদিত — খালি পদে আপনার ভোট যাবে না।')}</div>}
        <div className="alert alert-info mb-4">{t('Once cast, a vote cannot be changed.', 'একবার দিলে ভোট আর বদলানো যাবে না।')}</div>
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-light" disabled={busy} onClick={() => setStep('mark')}><i className="fa-solid fa-arrow-left" /> {t('Change', 'পরিবর্তন')}</button>
          <button className="btn btn-success btn-lg" disabled={busy} onClick={cast}><i className={busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-box-archive'} /> {t('Cast my vote', 'ভোট দিন')}</button>
        </div>
      </>}
    </div>
  );
}

// Result per post: votes as bars, winners marked; used by staff and the owner portal.
export function ElectionResults({ positions, ballots, onTieBreak }: { positions: BallotPosition[]; ballots: number; onTieBreak?: (p: BallotPosition) => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  return (
    <div>
      {positions.map(p => {
        const max = Math.max(1, ...p.candidates.map(c => c.votes || 0));
        return (
          <div key={p.id_positions} className="card mb-4">
            <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
              <div className="card-title">{postName(p.position, bn)}{p.seats > 1 ? ` · ${p.seats} ${t('seats', 'আসন')}` : ''}</div>
              <div className="text-sm text-muted">{p.contested ? `${t('Blank on', 'খালি')} ${p.skipped ?? 0} ${t('ballots', 'ব্যালটে')}` : t('Uncontested', 'প্রতিদ্বন্দ্বিতাহীন')}</div>
            </div>
            <div className="card-body">
              {p.tie && !p.tie.settled && <div className="alert alert-warning mb-4 flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                <span>{t(`Tie for the last ${p.tie.seats_left} seat(s). Settle it by drawing lots in front of the candidates, then record the result.`, `শেষ ${p.tie.seats_left}টি আসনে সমান ভোট। প্রার্থীদের সামনে লটারি করে ফলাফল লিখুন।`)}</span>
                {onTieBreak && <button className="btn btn-warning btn-sm" onClick={() => onTieBreak(p)}><i className="fa-solid fa-shuffle" /> {t('Record draw of lots', 'লটারির ফল লিখুন')}</button>}
              </div>}
              {p.candidates.map(c => (
                <div key={c.id_candidates} className="flex gap-2 mb-1" style={{ alignItems: 'center' }}>
                  <BallotSymbol k={c.symbol_key} size={36} />
                  <div style={{ width: 210, minWidth: 0 }}><div className="fw-semibold">{c.full_name}</div><div className="text-xs text-muted">{symbolName(c.symbol_key, bn)}</div></div>
                  {p.contested ? <div style={{ flex: 1 }}>
                    <div className="progress" style={{ height: 14 }}><div className="progress-bar" style={{ width: `${((c.votes || 0) / max) * 100}%`, background: c.elected ? '#16a34a' : '#94a3b8' }} /></div>
                  </div> : <div style={{ flex: 1 }} />}
                  <div style={{ width: 60 }} className="text-right fw-bold">{p.contested ? c.votes : '—'}</div>
                  <div style={{ width: 170 }}>
                    {c.elected && <span className="badge badge-success"><i className="fa-solid fa-trophy" /> {c.unopposed ? t('Elected unopposed', 'বিনা প্রতিদ্বন্দ্বিতায়') : c.won_by_lot ? t('Elected (by lot)', 'নির্বাচিত (লটারিতে)') : t('Elected', 'নির্বাচিত')}</span>}
                    {c.tied && <span className="badge badge-warning">{t('Tied', 'সমান ভোট')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="text-sm text-muted">{t(`${ballots} ballot(s) counted.`, `${ballots}টি ব্যালট গণনা করা হয়েছে।`)}</div>
    </div>
  );
}
