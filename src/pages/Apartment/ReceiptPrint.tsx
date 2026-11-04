import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { groupBD, toBanglaDigits } from '../../utils/bd';

// Printable money receipt / Mushak-6.3. "Print" → the browser's "Save as PDF" keeps Bangla shaping intact,
// which server-side PDF libraries generally get wrong.

const money = (n: any) => groupBD(Number(n) || 0, 2);
const dateTime = (d: string) => {
  const x = new Date(d);
  return {
    date: x.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: x.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
};

const PRINT_CSS = `
  body { background: #e2e8f0; }
  .rp-sheet { background: #fff; color: #111; width: 210mm; min-height: 148mm; margin: 16px auto; padding: 14mm; box-sizing: border-box; position: relative; font-size: 12.5px; }
  .rp-sheet table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  .rp-sheet th, .rp-sheet td { border: 1px solid #333; padding: 5px 6px; vertical-align: top; color: #111; background: none; }
  .rp-sheet th { background: #f1f5f9; font-weight: 700; text-align: center; white-space: normal; letter-spacing: 0; }
  .rp-sheet tbody tr:hover { background: none; }
  .rp-sheet tbody tr:last-child td { border-bottom: 1px solid #333; }
  .rp-num { text-align: right; white-space: nowrap; }
  .rp-row { display: flex; justify-content: space-between; gap: 16px; }
  .rp-field { border-bottom: 1px dotted #555; flex: 1; padding: 2px 4px; min-height: 18px; }
  .rp-sign { border-top: 1px solid #333; padding-top: 4px; width: 200px; text-align: center; font-size: 11px; }
  .rp-void { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; font-size: 90px; font-weight: 900; color: rgba(220,38,38,.18); transform: rotate(-20deg); }
  .rp-toolbar { max-width: 210mm; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  @media print {
    @page { size: A4; margin: 0; }
    body { background: #fff; }
    .rp-toolbar { display: none !important; }
    .rp-sheet { margin: 0; box-shadow: none; }
  }
`;

export default function ReceiptPrint() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/pay/my-receipts/${id}`).then((r: any) => setData(r)).catch((e: any) => setError(e?.message || 'Could not load receipt'));
  }, [id]);

  useEffect(() => {
    if (data?.receipt) document.title = data.receipt.receipt_no.replace(/\//g, '-');
  }, [data]);

  if (error) return <div className="alert alert-danger" style={{ margin: 24 }}>{error}</div>;
  if (!data) return <div className="loader-overlay"><div className="spinner" /></div>;

  const r = data.receipt;
  const s = data.settings;
  const lines: any[] = r.line_items_json || [];
  const { date, time } = dateTime(r.issue_datetime);
  const cancelled = r.status === 'CANCELLED';

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="rp-toolbar">
        <button className="btn btn-light" onClick={() => window.close()}>Close</button>
        <button className="btn btn-primary" onClick={() => window.print()}><i className="fa-solid fa-print" /> Print / Save as PDF</button>
      </div>
      {r.doc_type === 'MUSHAK_6_3' ? <Mushak63 r={r} s={s} lines={lines} date={date} time={time} /> : <MoneyReceipt r={r} s={s} lines={lines} date={date} />}
      {cancelled && <div className="rp-toolbar" style={{ justifyContent: 'center', color: '#b91c1c', fontWeight: 700 }}>Cancelled: {r.cancel_reason}</div>}
    </>
  );
}

function OrgHeader({ s, compact }: { s: any; compact?: boolean }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: compact ? 6 : 10 }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{s.company_name_bn}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{s.company_name_en}</div>
      <div style={{ fontSize: 11.5 }}>{s.address}{s.phone && <> · Phone: {s.phone}</>}{s.email && <> · {s.email}</>}</div>
      {(s.bin || s.tin) && <div style={{ fontSize: 11.5 }}>{s.bin && <>BIN: {s.bin}</>}{s.bin && s.tin && ' · '}{s.tin && <>TIN: {s.tin}</>}</div>}
    </div>
  );
}

function MoneyReceipt({ r, s, lines, date }: any) {
  return (
    <div className="rp-sheet">
      {r.status === 'CANCELLED' && <div className="rp-void">CANCELLED</div>}
      <OrgHeader s={s} />
      <div style={{ textAlign: 'center', margin: '6px 0 14px' }}>
        <span style={{ border: '2px solid #111', padding: '4px 18px', fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>মানি রিসিট · MONEY RECEIPT</span>
      </div>
      <div className="rp-row" style={{ marginBottom: 10 }}>
        <div><strong>No:</strong> {r.receipt_no}</div>
        <div><strong>Date:</strong> {date}</div>
      </div>
      <div className="rp-row" style={{ marginBottom: 8 }}>
        <span style={{ whiteSpace: 'nowrap' }}>Received with thanks from / যাহার নিকট হইতে গৃহীত:</span>
        <span className="rp-field"><strong>{r.received_from}</strong>{r.unit_number && <> — Flat {r.unit_number}</>}</span>
      </div>
      {(r.phone || r.address) && (
        <div className="rp-row" style={{ marginBottom: 10 }}>
          <span>Mobile / Address:</span>
          <span className="rp-field">{[r.phone, r.address].filter(Boolean).join(' · ')}</span>
        </div>
      )}
      <table style={{ margin: '8px 0' }}>
        <thead><tr><th style={{ width: 40 }}>SL</th><th>Particulars / বিবরণ</th><th style={{ width: 140 }}>Amount (Tk) / টাকা</th></tr></thead>
        <tbody>
          {lines.map((l: any) => <tr key={l.sl}><td style={{ textAlign: 'center' }}>{l.sl}</td><td>{l.description}{l.qty > 1 && ` (${l.qty} × ${money(l.unit_price)})`}</td><td className="rp-num">{money(l.total)}</td></tr>)}
          <tr><td colSpan={2} style={{ textAlign: 'right', fontWeight: 700 }}>Total / সর্বমোট</td><td className="rp-num" style={{ fontWeight: 800, fontSize: 13 }}>৳ {money(r.total_bdt)}</td></tr>
        </tbody>
      </table>
      <div className="rp-row" style={{ marginBottom: 6 }}><span>In words / কথায়:</span><span className="rp-field"><strong>{r.amount_words_bn}</strong></span></div>
      <div className="rp-row" style={{ marginBottom: 6 }}><span>In words:</span><span className="rp-field"><strong>{r.amount_words_en}</strong></span></div>
      <div className="rp-row" style={{ marginBottom: 6 }}>
        <span>Payment by / পরিশোধের মাধ্যম:</span><span className="rp-field">{String(r.payment_method || '').replace(/_/g, ' ')}{r.payment_ref && <> · Ref: {r.payment_ref}</>}</span>
      </div>
      <div className="rp-row" style={{ marginTop: 56, alignItems: 'flex-end' }}>
        <div className="rp-sign">Received by<br />{r.issued_by || ''}</div>
        <div className="rp-sign">Authorised Signature &amp; Seal<br />অনুমোদিত স্বাক্ষর ও সীল</div>
      </div>
      <div style={{ marginTop: 18, fontSize: 10.5, color: '#444', textAlign: 'center' }}>{s.receipt_footer}</div>
    </div>
  );
}

// Layout follows the NBR Mushak-6.3 (Tax Invoice) format.
function Mushak63({ r, s, lines, date, time }: any) {
  const bnDate = toBanglaDigits(date);
  return (
    <div className="rp-sheet" style={{ fontSize: 11.5 }}>
      {r.status === 'CANCELLED' && <div className="rp-void">CANCELLED</div>}
      <div className="rp-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 90 }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
          <div>জাতীয় রাজস্ব বোর্ড</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>কর চালানপত্র</div>
          <div style={{ fontSize: 10.5 }}>[বিধি ৪০ এর উপ-বিধি (১) এর দফা (গ) ও দফা (চ) দ্রষ্টব্য]</div>
        </div>
        <div style={{ width: 90, textAlign: 'right' }}><span style={{ border: '1.5px solid #111', padding: '3px 8px', fontWeight: 800 }}>মূসক-৬.৩</span></div>
      </div>
      <div style={{ margin: '10px 0', lineHeight: 1.7 }}>
        <div>নিবন্ধিত ব্যক্তির নাম: <strong>{s.company_name_bn} ({s.company_name_en})</strong></div>
        <div>নিবন্ধিত ব্যক্তির বিআইএন: <strong>{s.bin}</strong></div>
        <div>চালানপত্র ইস্যুর ঠিকানা: {s.address}</div>
      </div>
      <div className="rp-row" style={{ lineHeight: 1.7, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div>ক্রেতার নাম: <strong>{r.received_from}</strong>{r.unit_number && <> (ফ্ল্যাট {r.unit_number})</>}</div>
          <div>ক্রেতার বিআইএন: {r.buyer_bin || '—'}</div>
          <div>সরবরাহের গন্তব্যস্থল: {r.address || '—'}</div>
          <div>যানবাহনের প্রকৃতি ও নম্বর: —</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>চালানপত্র নম্বর: <strong>{r.receipt_no}</strong></div>
          <div>ইস্যুর তারিখ: {bnDate}</div>
          <div>ইস্যুর সময়: {toBanglaDigits(time)}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>ক্রমিক সংখ্যা</th><th>পণ্য বা সেবার বর্ণনা (প্রযোজ্য ক্ষেত্রে ব্র্যান্ড নামসহ)</th><th>সরবরাহের একক</th><th>পরিমাণ</th>
            <th>একক মূল্য (টাকায়)</th><th>মোট মূল্য (টাকায়)</th><th>সম্পূরক শুল্কের হার</th><th>সম্পূরক শুল্কের পরিমাণ (টাকায়)</th>
            <th>মূল্য সংযোজন করের হার / সুনির্দিষ্ট কর</th><th>মূল্য সংযোজন কর / সুনির্দিষ্ট কর এর পরিমাণ (টাকায়)</th><th>সকল প্রকার শুল্ক ও করসহ মূল্য</th>
          </tr>
          <tr>{Array.from({ length: 11 }, (_, i) => <th key={i} style={{ fontWeight: 500 }}>({toBanglaDigits(i + 1)})</th>)}</tr>
        </thead>
        <tbody>
          {lines.map((l: any) => (
            <tr key={l.sl}>
              <td style={{ textAlign: 'center' }}>{l.sl}</td><td>{l.description}</td><td>{l.uom}</td><td className="rp-num">{l.qty}</td>
              <td className="rp-num">{money(l.unit_price)}</td><td className="rp-num">{money(l.value)}</td><td className="rp-num">{l.sd_rate}%</td>
              <td className="rp-num">{money(l.sd)}</td><td className="rp-num">{l.vat_rate}%</td><td className="rp-num">{money(l.vat)}</td><td className="rp-num">{money(l.total)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}>
            <td colSpan={5} style={{ textAlign: 'right' }}>সর্বমোট</td><td className="rp-num">{money(r.subtotal_bdt)}</td><td />
            <td className="rp-num">{money(r.sd_total_bdt)}</td><td /><td className="rp-num">{money(r.vat_total_bdt)}</td><td className="rp-num">{money(r.total_bdt)}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>কথায়: <strong>{r.amount_words_bn}</strong> ({r.amount_words_en})</div>
      <div style={{ marginTop: 4 }}>পরিশোধের মাধ্যম: {String(r.payment_method || '').replace(/_/g, ' ')}{r.payment_ref && <> · {r.payment_ref}</>}</div>
      <div style={{ marginTop: 50, lineHeight: 1.7 }}>
        <div>প্রতিষ্ঠান কর্তৃপক্ষের দায়িত্বপ্রাপ্ত ব্যক্তির নাম: {r.issued_by || '________________'}</div>
        <div>পদবী: ________________</div>
        <div>স্বাক্ষর: ________________ &nbsp;&nbsp; সীল:</div>
      </div>
      <div style={{ marginTop: 14, fontSize: 10, color: '#444' }}>
        * উৎসে কর্তনযোগ্য সরবরাহের ক্ষেত্রে ফরমটি সমন্বিত কর চালানপত্র ও উৎসে কর কর্তন সনদপত্র হিসেবে বিবেচিত হইবে এবং উহা উৎসে কর কর্তনযোগ্য সরবরাহের ক্ষেত্রে প্রযোজ্য হইবে।
      </div>
    </div>
  );
}
