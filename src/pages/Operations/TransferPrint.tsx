import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { fmtDate } from '../../utils/bd';

// Printable clearance letter (অনাপত্তি সনদ, after approval) and transfer certificate (after completion).
// "Print" → the browser's "Save as PDF" keeps Bangla text shaped correctly.

const CSS = `
  body { background: #e2e8f0; }
  .tp-sheet { background: #fff; color: #111; width: 210mm; min-height: 270mm; margin: 16px auto; padding: 18mm; box-sizing: border-box; font-size: 13px; line-height: 1.6; }
  .tp-sheet table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .tp-sheet th, .tp-sheet td { border: 1px solid #333; padding: 5px 8px; text-align: left; color: #111; background: none; }
  .tp-sheet th { background: #f1f5f9; }
  .tp-sign { border-top: 1px solid #333; padding-top: 4px; width: 190px; text-align: center; font-size: 12px; }
  .tp-toolbar { max-width: 210mm; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  @media print { @page { size: A4; margin: 0; } body { background: #fff; } .tp-toolbar { display: none !important; } .tp-sheet { margin: 0; } }
`;
const pct = (n: any) => `${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
const TYPE: Record<string, string> = { SALE: 'Sale (বিক্রয়)', GIFT: 'Gift — Heba (হেবা)', INHERITANCE: 'Inheritance (উত্তরাধিকার)', BOOKING: 'Booking transfer (বরাদ্দ হস্তান্তর)', INTERNAL: 'Between co-owners (সহ-মালিকদের মধ্যে)' };

export default function TransferPrint() {
  const { id } = useParams();
  const [qs] = useSearchParams();
  const doc = qs.get('doc') === 'certificate' ? 'certificate' : 'noc';
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.get(`/ops/transfers/${id}`).then(setD).catch((e: any) => setErr(e?.message || 'Could not load')); }, [id]);
  useEffect(() => { if (d) document.title = `${d.transfer.transfer_no}-${doc}`; }, [d, doc]);
  if (err) return <div className="alert alert-danger" style={{ margin: 24 }}>{err}</div>;
  if (!d) return <div className="loader-overlay"><div className="spinner" /></div>;
  const tr = d.transfer; const s = d.settings; const u = tr.unit || {};
  const ready = doc === 'noc' ? ['APPROVED', 'COMPLETED'].includes(tr.status) : tr.status === 'COMPLETED';
  const names = (list: any[]) => list.map((p: any) => p.full_name).join(', ');

  return (
    <>
      <style>{CSS}</style>
      <div className="tp-toolbar"><button className="btn btn-primary" onClick={() => window.print()}><i className="fa-solid fa-print" /> Print / Save as PDF</button></div>
      <div className="tp-sheet">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{s.company_name_bn}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{s.company_name_en}</div>
          <div style={{ fontSize: 12 }}>{[s.address, s.phone, s.email].filter(Boolean).join(' · ')}</div>
        </div>
        {!ready && <div className="alert alert-warning">This document is only available once the transfer is {doc === 'noc' ? 'approved' : 'completed'}.</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ref: <strong>{tr.transfer_no}</strong></span><span>Date: <strong>{fmtDate(doc === 'noc' ? tr.approved_at : tr.completed_at)}</strong></span></div>
        <h2 style={{ textAlign: 'center', margin: '18px 0 6px' }}>{doc === 'noc' ? 'অনাপত্তি সনদ / No-Objection & Clearance Certificate' : 'মালিকানা হস্তান্তর সনদ / Ownership Transfer Certificate'}</h2>

        <table><tbody>
          <tr><th style={{ width: '32%' }}>Flat / ফ্ল্যাট</th><td>{u.unit_number}{u.building_name ? ` — ${u.building_name}` : ''}{u.floor_number != null ? `, floor ${u.floor_number}` : ''}{u.area_sqft ? `, ${Number(u.area_sqft).toLocaleString('en-IN')} sft` : ''}</td></tr>
          <tr><th>Type of transfer / ধরন</th><td>{TYPE[tr.transfer_type]}</td></tr>
          {tr.succession_cert_no && <tr><th>Succession certificate / ওয়ারিশ সনদ</th><td>{tr.succession_cert_no}</td></tr>}
          {tr.deed_no && <tr><th>Deed / দলিল</th><td>No. {tr.deed_no}, dated {fmtDate(tr.deed_date)}{tr.sub_registry_office ? `, ${tr.sub_registry_office}` : ''}</td></tr>}
          {doc === 'certificate' && <tr><th>Effective from / কার্যকর</th><td>{fmtDate(tr.effective_date)}</td></tr>}
        </tbody></table>

        <table>
          <thead><tr><th>Party / পক্ষ</th><th>Name / নাম</th><th>NID</th><th style={{ textAlign: 'right' }}>Share / অংশ</th>{doc === 'certificate' && <th style={{ textAlign: 'right' }}>After / পরে</th>}</tr></thead>
          <tbody>{[...tr.from, ...tr.to].map((p: any) => (
            <tr key={p.id}><td>{p.side === 'FROM' ? (tr.transfer_type === 'INHERITANCE' ? 'Deceased owner / মৃত মালিক' : 'Transferor / হস্তান্তরকারী') : (tr.transfer_type === 'INHERITANCE' ? `Heir / ওয়ারিশ${p.relation ? ` (${p.relation})` : ''}` : 'Transferee / গ্রহীতা')}</td>
              <td>{p.full_name}</td><td>{p.identification_reference || '—'}</td><td style={{ textAlign: 'right' }}>{pct(p.percent)}</td>{doc === 'certificate' && <td style={{ textAlign: 'right' }}>{pct(p.after_percent)}</td>}</tr>
          ))}</tbody>
        </table>

        {doc === 'noc' ? (
          <p style={{ marginTop: 16 }}>
            This is to certify that the management has <strong>no objection</strong> to the transfer of {pct(tr.from.reduce((x: number, p: any) => x + Number(p.percent), 0))} ownership of the above flat from <strong>{names(tr.from)}</strong> to <strong>{names(tr.to)}</strong>.
            {' '}{tr.dues_override_reason
              ? <>Dues of ৳{Number(tr.dues_snapshot?.blocking_total_bdt || 0).toLocaleString('en-IN')} were outstanding on {fmtDate(tr.dues_snapshot?.checked_on)}; the transfer is cleared on the condition: <em>{tr.dues_override_reason}</em>.</>
              : <>As of {fmtDate(tr.dues_snapshot?.checked_on)} no service charge, instalment or holding tax was outstanding on this flat.</>}
            {tr.bank_release_ref && <> The bank's release for the mortgage has been received (ref. {tr.bank_release_ref}).</>}
            {' '}The transfer is recorded in the ownership register once the deed is registered and produced to the management.
          </p>
        ) : (
          <p style={{ marginTop: 16 }}>
            This is to certify that the ownership of the above flat has been transferred in the records of the management as shown, with effect from <strong>{fmtDate(tr.effective_date)}</strong>.
            From this date the transferee(s) are responsible for service charges, holding tax and all other dues for their share, and are members of the owners' association.
          </p>
        )}
        <p style={{ fontSize: 12 }}>এই সনদটি ব্যবস্থাপনার রেকর্ডের ভিত্তিতে প্রদত্ত। জমির মালিকানা সংক্রান্ত আইনগত প্রমাণ হিসেবে নিবন্ধিত দলিলই চূড়ান্ত।</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 70 }}>
          <div className="tp-sign">Prepared by</div><div className="tp-sign">General Secretary / সাধারণ সম্পাদক</div><div className="tp-sign">President / Managing Director</div>
        </div>
      </div>
    </>
  );
}
