import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { fmtDate } from '../../utils/bd';

// Printable tenant information form, laid out after the DMP "ভাড়াটিয়া নিবন্ধন ফরম".
// Print → "Save as PDF" in the browser keeps Bangla shaping intact. Some thanas insist on their own
// printed form; in that case this sheet is a filled-in copy to transcribe from.

const CSS = `
  body { background: #e2e8f0; }
  .tf-sheet { background: #fff; color: #111; width: 210mm; min-height: 297mm; margin: 16px auto; padding: 12mm 14mm; box-sizing: border-box; font-size: 12.5px; line-height: 1.45; }
  .tf-sheet h1 { font-size: 18px; margin: 0; text-align: center; }
  .tf-sheet h2 { font-size: 13px; margin: 12px 0 4px; padding: 3px 6px; background: #f1f5f9; border-left: 3px solid #0f172a; }
  .tf-row { display: flex; gap: 10px; margin: 3px 0; }
  .tf-row > div { flex: 1; display: flex; gap: 6px; }
  .tf-k { white-space: nowrap; color: #333; }
  .tf-v { flex: 1; border-bottom: 1px dotted #555; min-height: 17px; padding: 0 4px; font-weight: 600; }
  .tf-sheet table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 2px; }
  .tf-sheet th, .tf-sheet td { border: 1px solid #444; padding: 3px 5px; text-align: left; color: #111; background: none; white-space: normal; letter-spacing: 0; }
  .tf-sheet th { background: #f8fafc; font-weight: 700; }
  .tf-sheet tbody tr:hover { background: none; }
  .tf-photo { width: 30mm; height: 36mm; border: 1px solid #444; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 10px; color: #666; }
  .tf-sign { border-top: 1px solid #333; padding-top: 3px; width: 60mm; text-align: center; font-size: 11px; }
  .tf-toolbar { max-width: 210mm; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  @media print {
    @page { size: A4; margin: 0; }
    body { background: #fff; }
    .tf-toolbar { display: none !important; }
    .tf-sheet { margin: 0; }
  }
`;

const MARITAL: Record<string, string> = { SINGLE: 'অবিবাহিত', MARRIED: 'বিবাহিত', WIDOWED: 'বিধবা/বিপত্নীক', DIVORCED: 'তালাকপ্রাপ্ত' };

const F = ({ k, v }: { k: string; v?: any }) => <div><span className="tf-k">{k}:</span><span className="tf-v">{v ?? ''}</span></div>;

function People({ rows, cols, minRows = 2 }: { rows: any[]; cols: [string, string][]; minRows?: number }) {
  const list = [...rows, ...Array(Math.max(0, minRows - rows.length)).fill({})];
  return (
    <table>
      <thead><tr><th style={{ width: 28 }}>ক্রম</th>{cols.map(([, l]) => <th key={l}>{l}</th>)}</tr></thead>
      <tbody>{list.map((p, i) => <tr key={i}><td>{i + 1}</td>{cols.map(([k]) => <td key={k} style={{ height: 20 }}>{p[k] || ''}</td>)}</tr>)}</tbody>
    </table>
  );
}

export default function TenantFormPrint() {
  const { id } = useParams();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get(`/ops/tenants/${id}`).then((r: any) => setD(r)).catch((e: any) => setErr(e.message || 'Could not load tenant')); }, [id]);
  useEffect(() => { if (d) document.title = `Tenant form – ${d.tenant.full_name}`; }, [d]);

  if (err) return <div style={{ padding: 40, textAlign: 'center' }}>{err}</div>;
  if (!d) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  const t = d.tenant; const u = d.unit || {}; const l = d.landlord || {}; const s = d.settings || {};
  const helper = t.domestic_helpers?.[0] || {}; const driver = t.drivers?.[0] || {};

  return (
    <>
      <style>{CSS}</style>
      <div className="tf-toolbar">
        <button className="btn btn-light" onClick={() => window.close()}>Close</button>
        <button className="btn btn-primary" onClick={() => window.print()}><i className="fa-solid fa-print" /> Print / Save as PDF</button>
      </div>
      <div className="tf-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: 'center', fontSize: 12 }}>ঢাকা মেট্রোপলিটন পুলিশ</div>
            <h1>ভাড়াটিয়া নিবন্ধন ফরম</h1>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#444' }}>Tenant Information Form</div>
            <div className="tf-row" style={{ marginTop: 10 }}><F k="থানা" v={t.police_station} /><F k="ফ্ল্যাট / তলা" v={`${u.unit_number || ''}${u.floor_number != null ? ` / ${u.floor_number} তলা` : ''}`} /></div>
            <div className="tf-row"><F k="বাড়ি / ভবন" v={u.building_name} /><F k="ঠিকানা" v={s.address} /></div>
          </div>
          <div className="tf-photo">ভাড়াটিয়ার<br />পাসপোর্ট সাইজ<br />ছবি</div>
        </div>

        <h2>ভাড়াটিয়ার তথ্য</h2>
        <div className="tf-row"><F k="১. ভাড়াটিয়ার নাম" v={t.full_name} /></div>
        <div className="tf-row"><F k="২. পিতার নাম" v={t.father_name} /></div>
        <div className="tf-row"><F k="৩. জন্ম তারিখ" v={t.date_of_birth ? fmtDate(t.date_of_birth) : ''} /><F k="৪. বৈবাহিক অবস্থা" v={MARITAL[t.marital_status] || ''} /></div>
        <div className="tf-row"><F k="৫. স্থায়ী ঠিকানা" v={t.permanent_address} /></div>
        <div className="tf-row"><F k="৬. পেশা ও প্রতিষ্ঠান / কর্মস্থলের ঠিকানা" v={[t.occupation, t.workplace_address].filter(Boolean).join(', ')} /></div>
        <div className="tf-row"><F k="৭. ধর্ম" v={t.religion} /><F k="৮. শিক্ষাগত যোগ্যতা" v={t.education} /></div>
        <div className="tf-row"><F k="৯. মোবাইল নম্বর" v={t.phone} /><F k="১০. ই-মেইল" v={t.email} /></div>
        <div className="tf-row"><F k="১১. জাতীয় পরিচয়পত্র নম্বর" v={t.nid_no} /><F k="১২. পাসপোর্ট নম্বর (যদি থাকে)" v={t.passport_no} /></div>

        <h2>১৩. জরুরি যোগাযোগ</h2>
        <div className="tf-row"><F k="(ক) নাম" v={t.emergency_name} /><F k="(খ) সম্পর্ক" v={t.emergency_relation} /></div>
        <div className="tf-row"><F k="(গ) ঠিকানা" v={t.emergency_address} /><F k="(ঘ) মোবাইল নম্বর" v={t.emergency_phone} /></div>

        <h2>১৪. পরিবার / মেসের সঙ্গে বসবাসকারীদের বিবরণ</h2>
        <People rows={t.family_members || []} minRows={4} cols={[['name', 'নাম'], ['age', 'বয়স'], ['relation', 'সম্পর্ক'], ['occupation', 'পেশা'], ['phone', 'মোবাইল নম্বর']]} />

        <h2>১৫. গৃহকর্মীর তথ্য</h2>
        <div className="tf-row"><F k="নাম" v={helper.name} /><F k="জাতীয় পরিচয়পত্র নম্বর" v={helper.nid_no} /></div>
        <div className="tf-row"><F k="মোবাইল নম্বর" v={helper.phone} /><F k="স্থায়ী ঠিকানা" v={helper.permanent_address} /></div>
        {t.domestic_helpers?.length > 1 && <People rows={t.domestic_helpers.slice(1)} minRows={0} cols={[['name', 'নাম'], ['nid_no', 'এনআইডি'], ['phone', 'মোবাইল'], ['permanent_address', 'স্থায়ী ঠিকানা']]} />}

        <h2>১৬. ড্রাইভারের তথ্য</h2>
        <div className="tf-row"><F k="নাম" v={driver.name} /><F k="জাতীয় পরিচয়পত্র নম্বর" v={driver.nid_no} /></div>
        <div className="tf-row"><F k="মোবাইল নম্বর" v={driver.phone} /><F k="স্থায়ী ঠিকানা" v={driver.permanent_address} /></div>

        <h2>পূর্ববর্তী ও বর্তমান বাসা</h2>
        <div className="tf-row"><F k="১৭. পূর্ববর্তী বাড়িওয়ালার নাম" v={t.prev_landlord_name} /><F k="মোবাইল" v={t.prev_landlord_phone} /></div>
        <div className="tf-row"><F k="পূর্ববর্তী ঠিকানা" v={t.prev_address} /></div>
        <div className="tf-row"><F k="১৮. পূর্ববর্তী বাসা ছাড়ার কারণ" v={t.reason_for_leaving_prev} /></div>
        <div className="tf-row"><F k="১৯. বর্তমান বাড়িওয়ালার নাম" v={l.full_name} /><F k="মোবাইল" v={l.phone} /></div>
        <div className="tf-row"><F k="২০. বর্তমান বাসায় কোন তারিখ থেকে বসবাস" v={t.move_in_date ? fmtDate(t.move_in_date) : ''} /></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 46 }}>
          <div className="tf-sign">ভাড়াটিয়ার স্বাক্ষর ও তারিখ</div>
          <div className="tf-sign">বাড়িওয়ালার স্বাক্ষর ও তারিখ</div>
        </div>
        <div style={{ marginTop: 18, fontSize: 10, color: '#555' }}>
          প্রস্তুতকারী: {s.company_name_bn || s.company_name_en} · {new Date().toLocaleDateString('en-GB')} · পূরণকৃত ফরম সংশ্লিষ্ট থানায় জমা দিন।
        </div>
      </div>
    </>
  );
}
