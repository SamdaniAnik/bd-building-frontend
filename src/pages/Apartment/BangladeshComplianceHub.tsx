import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useLang, tr } from '../../i18n/LanguageContext';
import { fmtDate } from '../../utils/bd';

export default function BangladeshComplianceHub() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  // Follows the app-wide language selector
  const { lang, setLang } = useLang();
  const isBangla = lang === 'bn';
  const setIsBangla = (v: boolean) => setLang(v ? 'bn' : 'en');
  const [activeTab, setActiveTab] = useState<'land_jva' | 'approvals' | 'bnbc_fire' | 'utility' | 'handover' | 'baki_cheques'>('land_jva');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    authority: 'RAJUK',
    approval_title: '',
    approval_type: 'BUILDING_PLAN',
    application_number: '',
    application_date: '',
    approval_date: '',
    expiry_date: '',
    approval_reference_no: '',
    status: 'SUBMITTED',
    remarks: ''
  });

  const [showMeterModal, setShowMeterModal] = useState(false);
  const [meterForm, setMeterForm] = useState({
    unit_number: '',
    utility_type: 'ELECTRICITY',
    meter_number: '',
    previous_reading: 0,
    current_reading: 0,
    unit_rate_bdt: 9.80,
    billing_month: 'October 2026'
  });

  const [showBakiModal, setShowBakiModal] = useState(false);
  const [bakiForm, setBakiForm] = useState({
    vendor_name: '',
    trade_specialty: 'Cement / Steel',
    total_purchased_bdt: '',
    total_paid_bdt: '',
    credit_limit_bdt: 500000,
    payment_terms: 'Weekly settlement'
  });

  const [showChequeModal, setShowChequeModal] = useState(false);
  const [chequeForm, setChequeForm] = useState({
    cheque_number: '',
    bank_name: 'Dutch-Bangla Bank Ltd',
    branch_name: 'Uttara Branch',
    payee_or_drawer: '',
    amount_bdt: '',
    issue_date: '',
    deposit_date: '',
    clearance_date: '',
    cheque_type: 'INWARD_COLLECTION',
    status: 'ISSUED',
    reference_voucher_no: 'MR-2026-000210',
    remarks: ''
  });

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/apartment/compliance/overview');
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/compliance/approvals', approvalForm);
      if (res.success) {
        showToast('success', res.message);
        setShowApprovalModal(false);
        fetchComplianceData();
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Request failed');
    }
  };

  const handleSaveMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/compliance/meters', meterForm);
      if (res.success) {
        showToast('success', res.message);
        setShowMeterModal(false);
        fetchComplianceData();
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Request failed');
    }
  };

  const handleSaveBaki = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/compliance/baki', bakiForm);
      if (res.success) {
        showToast('success', res.message);
        setShowBakiModal(false);
        fetchComplianceData();
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Request failed');
    }
  };

  const handleSaveCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/compliance/cheques', chequeForm);
      if (res.success) {
        showToast('success', res.message);
        setShowChequeModal(false);
        fetchComplianceData();
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Request failed');
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#059669' }}></i>
        <p style={{ marginTop: '10px', color: '#64748b' }}>
          {isBangla ? 'বাংলাদেশ কমপ্লায়েন্স ডাটা লোড হচ্ছে...' : 'Loading Bangladesh Compliance & Property Management Layer...'}
        </p>
      </div>
    );
  }

  const land = data?.land || {};
  const jva = data?.jva || {};
  const approvals = data?.approvals || [];
  const bnbc = data?.bnbc || [];
  const fireEquipment = data?.fireEquipment || [];
  const utilityMeters = data?.utilityMeters || [];
  const handovers = data?.handovers || [];
  const bakiLedger = data?.bakiLedger || [];
  const cheques = data?.cheques || [];
  const metrics = data?.metrics || {};

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {notification && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 24px', borderRadius: '10px',
          background: notification.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <i className={notification.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}></i>
          {notification.message}
        </div>
      )}

      {/* Top Banner with Bilingual Switcher */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
              <span>🇧🇩</span> {tr("Real Estate Development & Management Act 2010 • BNBC 2020 Compliant")}
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '4px 0 6px 0' }}>
              {isBangla ? 'বাংলাদেশ রিয়েল এস্টেট কমপ্লায়েন্স ও প্রোপার্টি ম্যানেজমেন্ট' : 'Bangladesh Compliance & Property Management Layer'}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, maxWidth: '850px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {isBangla
                ? 'জমি ও খতিয়ান বিবরণ, যৌথ উন্নয়ন চুক্তি (JVA), রাজউক নকশা ও NOC অনুমোদন, বিএনবিসি ২০২০ অগ্নিনিরাপত্তা, বিদ্যুৎ ও ওয়াসা মিটার, ভেন্ডর বাকি এবং হস্তান্তর সমন্বয়।'
                : 'Complete statutory lifecycle: Land & Khatian records, Landowner JVA Co-Ownership, RAJUK & Inter-Agency NOCs, BNBC 2020 Fire Safety, Utility Sub-Meters, Vendor Baki & Handover Defect Settlements.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language Switcher Toggle */}
            <button
              onClick={() => setIsBangla(!isBangla)}
              style={{
                background: '#ffffff', color: '#064e3b', border: 'none',
                padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              <i className="fa-solid fa-language" style={{ fontSize: '1rem' }}></i>
              {isBangla ? 'English View' : 'বাংলা সংস্করণ'}
            </button>

            <button
              onClick={fetchComplianceData}
              style={{
                background: 'rgba(255,255,255,0.25)', color: '#ffffff', border: 'none',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
              }}
              title={tr("Refresh")}
            >
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{isBangla ? 'জমির পরিমাপ' : 'Total Land Title'}</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
            {land.area_katha} {isBangla ? 'কাঠা' : 'Katha'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            {land.mouza} &bull; {land.mutation_status}
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{isBangla ? 'জেভিএ অংশীদারিত্ব' : 'Landowner JVA Ratio'}</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', margin: '2px 0' }}>
            {jva.landowner_share_percent}% : {jva.developer_share_percent}%
          </div>
          <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
            {isBangla ? '৫২ ফ্ল্যাট জমির মালিক • ৫২ ফ্ল্যাট ডেভেলপার' : '54 Landowner Flats • 54 Pool Flats'}
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{isBangla ? 'রাজউক ও এনওসি অনুমোদন' : 'Authority NOC Status'}</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '2px 0' }}>
            {metrics.approvedNOCs} / {metrics.totalNOCs} {isBangla ? 'অনুমোদিত' : 'Approved'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            {tr("RAJUK, Fire, DoE, CAAB, WASA")}
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{isBangla ? 'মোট ভেন্ডর বাকি (বকেয়া)' : 'Vendor Baki Outstanding'}</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '2px 0' }}>
            ৳{((metrics.totalBaki || 0) / 100000).toFixed(2)} {isBangla ? 'লাখ' : 'Lakh'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
            {tr("Shah Cement, BSRM Steel, Stone")}
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{isBangla ? 'ক্লিয়ারিং চেক রেজিস্টার' : 'Cheques Register'}</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '2px 0' }}>
            ৳{((metrics.totalChequesInward || 0) / 100000).toFixed(1)} L <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{tr("Inward")}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {tr("DBBL, Islami Bank, BRAC Bank")}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { key: 'land_jva', labelEn: '1. Land & JVA Co-Ownership', labelBn: '১. জমি ও যৌথ চুক্তি (JVA)', icon: 'fa-solid fa-map-location-dot', badge: `${land.area_katha || 22.5} Katha` },
          { key: 'approvals', labelEn: '2. RAJUK & Inter-Agency NOCs', labelBn: '২. রাজউক ও এনওসি অনুমোদন', icon: 'fa-solid fa-stamp', badge: `${approvals.length} Permits` },
          { key: 'bnbc_fire', labelEn: '3. BNBC 2020 & Fire Safety', labelBn: '৩. বিএনবিসি ২০২০ ও অগ্নিনিরাপত্তা', icon: 'fa-solid fa-fire-extinguisher', badge: `${fireEquipment.length} Equipment` },
          { key: 'utility', labelEn: '4. Utility Sub-Meters (DESCO/WASA)', labelBn: '৪. ইউটিলিটি মিটার ও বিলিং', icon: 'fa-solid fa-bolt-lightning', badge: `${utilityMeters.length} Meters` },
          { key: 'handover', labelEn: '5. Handover & Area Discrepancy', labelBn: '৫. হস্তান্তর ও আয়তন সমন্বয়', icon: 'fa-solid fa-key', badge: `${handovers.length} Units` },
          { key: 'baki_cheques', labelEn: '6. Vendor Baki & Cheques Register', labelBn: '৬. ভেন্ডর বাকি ও চেক রেজিস্ট্রার', icon: 'fa-solid fa-receipt', badge: `৳${((metrics.totalBaki || 0)/100000).toFixed(1)}L Baki` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === tab.key ? '#059669' : '#64748b',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className={tab.icon}></i>
            {isBangla ? tab.labelBn : tab.labelEn}
            <span style={{
              background: activeTab === tab.key ? '#dcfce7' : '#f1f5f9',
              color: activeTab === tab.key ? '#166534' : '#64748b',
              padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600
            }}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: LAND PARCEL & JVA CO-OWNERSHIP
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'land_jva' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Land Parcel Record Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-scroll text-emerald-600" style={{ marginRight: '8px' }}></i>
                  {isBangla ? 'জমির তফসিল ও রেকর্ডপত্র' : 'Land Title & Mutation Record'}
                </h3>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {land.mutation_status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'মৌজা ও জে.এল. নং:' : 'Mouza & J.L. No:'}</span>
                  <strong>{land.mouza} ({land.jl_no})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'দাগ নম্বর (CS/SA/RS):' : 'Dag / Plot No:'}</span>
                  <strong>{land.dag_no}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'খতিয়ান নং (CS/SA/RS/BS):' : 'Khatian Record:'}</span>
                  <strong>CS: {land.cs_khatian} &bull; SA: {land.sa_khatian} &bull; RS: {land.rs_khatian} &bull; BS: {land.bs_khatian}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'জমির পরিমাপ:' : 'Plot Area:'}</span>
                  <strong style={{ color: '#059669' }}>{land.area_katha} {tr("Katha")} ({land.area_sqft} SQFT)</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'দলিল নম্বর ও তারিখ:' : 'Deed No & Date:'}</span>
                  <strong>{land.deed_no} ({fmtDate(land.deed_date)})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'ভূমি উন্নয়ন কর (খাজনা):' : 'Land Tax (Khajna):'}</span>
                  <strong style={{ color: '#047857' }}>{land.khajna_tax_status} ({land.khajna_last_paid_year})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'খারিজ / নামজারি ডিসিআর:' : 'Mutation / DCR No:'}</span>
                  <strong>{land.mutation_khatian_no}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'দায়মুক্তি অবস্থা:' : 'Encumbrance / Mortgage:'}</span>
                  <strong style={{ color: '#166534' }}>{land.mortgage_status}</strong>
                </div>
              </div>

              {/* Landowners Distribution List */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  {isBangla ? 'জমির মালিকগণের তালিকা ও অংশের অনুপাত:' : 'Original Landowners & Share Percentage:'}
                </h5>
                {(land.landowners_json || []).map((lo: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', marginBottom: '6px', fontSize: '0.82rem' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>{lo.name}</strong>
                      <span style={{ color: '#64748b', marginLeft: '6px' }}>({lo.nid})</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#059669', marginRight: '8px' }}>{lo.share_percent}%</span>
                      <span style={{ color: '#64748b' }}>({lo.katha} {tr("Katha")})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* JVA Details Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-handshake text-indigo-600" style={{ marginRight: '8px' }}></i>
                  {isBangla ? 'যৌথ উন্নয়ন চুক্তি (JVA)' : 'Joint Venture Agreement (JVA)'}
                </h3>
                <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {jva.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'চুক্তিপত্র নম্বর:' : 'Agreement No:'}</span>
                  <strong>{jva.agreement_no}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'চুক্তির তারিখ:' : 'Agreement Date:'}</span>
                  <strong>{fmtDate(jva.agreement_date)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'মালিক ও ডেভেলপার অনুপাত:' : 'Allocation Ratio:'}</span>
                  <strong style={{ color: '#4f46e5' }}>{jva.landowner_share_percent}{tr("% Landowner")} / {jva.developer_share_percent}{tr("% Developer")}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'সাইনিং মানি (অফেরতযোগ্য):' : 'Signing Money:'}</span>
                  <strong style={{ color: '#059669' }}>৳{(jva.signing_money_bdt / 100000).toFixed(1)} Lakh (৳1.5 Cr)</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'হস্তান্তরের শেষ সময়সীমা:' : 'Handover Deadline:'}</span>
                  <strong style={{ color: '#d97706' }}>{fmtDate(jva.handover_deadline)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>{isBangla ? 'বিলম্ব জরিমানা (মাসিক):' : 'Delay Penalty (Monthly):'}</span>
                  <strong style={{ color: '#dc2626' }}>৳{Number(jva.delay_penalty_per_month_bdt).toLocaleString()} / {tr("month")}</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isBangla ? 'ফ্ল্যাট বণ্টন শর্তাবলী (রিয়েল এস্টেট আইন ২০১০ অনুযায়ী):' : 'Flat Allocation (Real Estate Act 2010):'}
                </span>
                <p style={{ margin: 0, color: '#64748b' }}>
                  {tr("Total 108 Units: 54 flats to Landowners (Odd numbered floors 1, 3, 5, 7, 9) and 54 flats to Developer Co-Owners pool (Even numbered floors 2, 4, 6, 8 + Penthouses).")}
                </p>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                {jva.terms_and_conditions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RAJUK & AUTHORITY APPROVALS / NOC CHECKLIST
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
              <i className="fa-solid fa-stamp text-emerald-600" style={{ marginRight: '8px' }}></i>
              {isBangla ? 'কর্তৃপক্ষের অনুমোদন ও এনওসি ট্র্যাকার (রাজউক, ফায়ার, ওয়াসা)' : 'Statutory Approvals & Inter-Agency NOC Tracker'}
            </h3>
            <button
              onClick={() => setShowApprovalModal(true)}
              className="btn btn-primary"
              style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus"></i> {isBangla ? 'নতুন অনুমোদন যোগ করুন' : 'Add Approval / NOC'}
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
              <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '12px' }}>{isBangla ? 'কর্তৃপক্ষ' : 'Authority'}</th>
                  <th style={{ padding: '12px' }}>{isBangla ? 'অনুমোদন বিবরণ' : 'Permit Title & Scope'}</th>
                  <th style={{ padding: '12px' }}>{isBangla ? 'আবেদন / স্মারক নং' : 'App / Reference No'}</th>
                  <th style={{ padding: '12px' }}>{isBangla ? 'অনুমোদন তারিখ' : 'Approval Date'}</th>
                  <th style={{ padding: '12px' }}>{isBangla ? 'মেয়াদ' : 'Expiry Date'}</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>{isBangla ? 'অবস্থা' : 'Status'}</th>
                  <th style={{ padding: '12px' }}>{isBangla ? 'কাগজপত্র চেকলিস্ট' : 'Document Checklist'}</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((app: any) => (
                  <tr key={app.id_approvals} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                        background: app.authority === 'RAJUK' ? '#fee2e2' : app.authority === 'FIRE_SERVICE' ? '#fef3c7' : '#e0e7ff',
                        color: app.authority === 'RAJUK' ? '#991b1b' : app.authority === 'FIRE_SERVICE' ? '#92400e' : '#3730a3'
                      }}>
                        {app.authority}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{app.approval_title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.remarks}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{app.application_number}</div>
                      <span style={{ fontSize: '0.75rem', color: '#059669' }}>{app.approval_reference_no}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{app.approval_date ? fmtDate(app.approval_date) : 'Pending'}</td>
                    <td style={{ padding: '12px', color: '#d97706', fontWeight: 600 }}>{app.expiry_date ? fmtDate(app.expiry_date) : 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {(app.document_checklist || []).map((doc: any, dIdx: number) => (
                          <span key={dIdx} style={{ fontSize: '0.72rem', color: '#475569' }}>
                            <i className="fa-solid fa-check-circle text-emerald-600" style={{ marginRight: '4px' }}></i>
                            {doc.doc || doc.item}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: BNBC 2020 & FIRE SAFETY
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'bnbc_fire' && (
        <div>
          {/* BNBC 2020 Compliance Records */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', color: '#0f172a' }}>
              <i className="fa-solid fa-building-shield text-emerald-600" style={{ marginRight: '8px' }}></i>
              {isBangla ? 'বাংলাদেশ ন্যাশনাল বিল্ডিং কোড (বিএনবিসি ২০২০) পরিপালন রেজিস্টার' : 'BNBC 2020 Building Code Compliance Records'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
              {bnbc.map((item: any) => (
                <div key={item.id_bnbc} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      {item.category}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 700 }}>
                      {item.compliance_status}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#0f172a' }}>{item.requirement_name}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#64748b' }}>{item.specification_clause}</p>
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
                    <div><span style={{ color: '#64748b' }}>{tr("Evidence:")}</span> <strong>{item.evidence_document}</strong></div>
                    <div><span style={{ color: '#64748b' }}>{tr("Consultant:")}</span> <strong>{item.responsible_engineer}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fire Safety Equipment Management */}
          <div>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', color: '#0f172a' }}>
              <i className="fa-solid fa-fire-flame-curved text-danger" style={{ marginRight: '8px' }}></i>
              {isBangla ? 'অগ্নিনির্বাপণ সরঞ্জাম ও রিফিল পর্যবেক্ষণ' : 'Fire Safety Equipment Readiness Dashboard'}
            </h3>

            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
                <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px' }}>{tr("Tag / ID")}</th>
                    <th style={{ padding: '12px' }}>{tr("Equipment Type")}</th>
                    <th style={{ padding: '12px' }}>{tr("Location")}</th>
                    <th style={{ padding: '12px' }}>{tr("Last Inspection")}</th>
                    <th style={{ padding: '12px' }}>{tr("Refill / Expiry Date")}</th>
                    <th style={{ padding: '12px' }}>{tr("Inspector")}</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>{tr("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fireEquipment.map((fe: any) => (
                    <tr key={fe.id_fire_equip} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#059669' }}>{fe.equipment_tag}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{fe.equipment_type}</td>
                      <td style={{ padding: '12px' }}>{fe.location_description}</td>
                      <td style={{ padding: '12px' }}>{fmtDate(fe.last_inspection_date)}</td>
                      <td style={{ padding: '12px', color: fe.status === 'REFILL_DUE' ? '#dc2626' : '#059669', fontWeight: 700 }}>
                        {fmtDate(fe.expiry_refill_date)}
                      </td>
                      <td style={{ padding: '12px' }}>{fe.inspector_name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                          background: fe.status === 'ACTIVE_READY' ? '#dcfce7' : '#fee2e2',
                          color: fe.status === 'ACTIVE_READY' ? '#166534' : '#991b1b'
                        }}>
                          {fe.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: UTILITY SUB-METERS (DESCO / WASA / GENERATOR)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'utility' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                <i className="fa-solid fa-bolt-lightning text-amber-500" style={{ marginRight: '8px' }}></i>
                {isBangla ? 'ফ্ল্যাটভিত্তিক বিদ্যুৎ, পানি ও জেনারেটর সাব-মিটার' : 'Apartment Utility Sub-Meters & Billing Engine'}
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {tr("DESCO/DPDC 3-Phase digital meters & WASA consumption recorded monthly for billing.")}
              </span>
            </div>
            <button
              onClick={() => setShowMeterModal(true)}
              className="btn btn-primary"
              style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus"></i> {isBangla ? 'মিটার রিডিং রেকর্ড করুন' : 'Record Reading'}
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
              <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '12px' }}>{tr("Unit / Scope")}</th>
                  <th style={{ padding: '12px' }}>{tr("Utility Type")}</th>
                  <th style={{ padding: '12px' }}>{tr("Meter No")}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Previous Reading")}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Current Reading")}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Consumption")}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Rate (BDT)")}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Total Bill (৳)")}</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>{tr("Billing Month")}</th>
                </tr>
              </thead>
              <tbody>
                {utilityMeters.map((m: any) => (
                  <tr key={m.id_utility_meters} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#4f46e5' }}>{m.unit_number}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                        background: m.utility_type === 'ELECTRICITY' ? '#fef3c7' : m.utility_type === 'WATER' ? '#eff6ff' : '#fee2e2',
                        color: m.utility_type === 'ELECTRICITY' ? '#92400e' : m.utility_type === 'WATER' ? '#1d4ed8' : '#991b1b'
                      }}>
                        {m.utility_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{m.meter_number}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{m.previous_reading}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{m.current_reading}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>
                      {m.consumption_units} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.uom}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>৳{m.unit_rate_bdt}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                      ৳{Number(m.total_amount_bdt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{m.billing_month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: HANDOVER, SNAGS & AREA ADJUSTMENT
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'handover' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#0f172a' }}>
              <i className="fa-solid fa-ruler-combined text-emerald-600" style={{ marginRight: '8px' }}></i>
              {isBangla ? 'ফ্ল্যাট হস্তান্তর, ত্রুটি সংশোধন (Snag List) ও আয়তন সমন্বয়' : 'Flat Handover, Snag List & Area Adjustment (Real Estate Act 2010)'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              {tr("According to the Bangladesh Real Estate Development & Management Act 2010 Section 15: If the delivered flat area differs from the sanctioned plan, contractual price adjustments are settled prior to deed registration.")}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {handovers.map((h: any) => (
              <div key={h.id_handovers} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#4f46e5', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>
                      Unit {h.unit_number}
                    </span>
                    <h4 style={{ margin: '6px 0 2px 0', fontSize: '1.05rem', color: '#0f172a' }}>{h.owner_name}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{tr("Possession")}: {fmtDate(h.possession_date)} &bull; Ref: {h.possession_letter_ref}</span>
                  </div>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {h.handover_status}
                  </span>
                </div>

                {/* SFT Difference Box */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.82rem', textAlign: 'center' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>{tr("Approved SFT")}</span>
                      <strong>{h.approved_area_sft}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>{tr("Final Measured")}</span>
                      <strong>{h.final_measured_area_sft}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>{tr("Discrepancy")}</span>
                      <strong style={{ color: h.area_difference_sft >= 0 ? '#059669' : '#dc2626' }}>
                        {h.area_difference_sft > 0 ? `+${h.area_difference_sft}` : h.area_difference_sft} SFT
                      </strong>
                    </div>
                  </div>
                  {h.area_difference_sft !== 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: '#065f46' }}>
                      <span>{tr("Price Adjustment @ ৳")}{h.rate_per_sft_bdt}/SFT:</span>
                      <strong>৳{Number(h.area_adjustment_amount_bdt).toLocaleString()} ({h.adjustment_settlement})</strong>
                    </div>
                  )}
                </div>

                {/* Snag List */}
                <div>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {tr("Snag List Inspection:")}
                  </h5>
                  {(h.snag_list || []).map((snag: any, sIdx: number) => (
                    <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px' }}>
                      <span>{snag.item}</span>
                      <strong style={{ color: '#059669' }}>{snag.status}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: VENDOR BAKI & CHEQUES REGISTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'baki_cheques' && (
        <div>
          {/* Vendor Baki (Credit) Ledger */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-book-bookmark text-danger" style={{ marginRight: '8px' }}></i>
                  {isBangla ? 'সাইট ম্যাটেরিয়াল ভেন্ডর বাকি (Credit) খাতা' : 'Site Material Vendor Baki (Credit) Ledger'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {tr("Tracks credit purchases, payments, and outstanding balances with local cement, steel, and stone suppliers.")}
                </span>
              </div>
              <button
                onClick={() => setShowBakiModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-plus"></i> {isBangla ? 'বাকি এন্ট্রি করুন' : 'Add Baki Record'}
              </button>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
                <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px' }}>{tr("Supplier / Agency")}</th>
                    <th style={{ padding: '12px' }}>{tr("Trade Specialty")}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Total Purchased")}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Total Paid")}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Current Baki (৳)")}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Credit Limit")}</th>
                    <th style={{ padding: '12px' }}>{tr("Payment Terms")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bakiLedger.map((b: any) => (
                    <tr key={b.id_baki} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{b.vendor_name}</td>
                      <td style={{ padding: '12px' }}>{b.trade_specialty}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>৳{Number(b.total_purchased_bdt).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                        ৳{Number(b.total_paid_bdt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>
                        ৳{Number(b.current_baki_bdt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>৳{Number(b.credit_limit_bdt).toLocaleString()}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{b.payment_terms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cheque Management Register */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-money-check text-primary" style={{ marginRight: '8px' }}></i>
                  {isBangla ? 'ব্যাংক চেক ব্যবস্থাপনা ও ক্লিয়ারিং রেজিস্টার' : 'Bank Cheque Register & Clearing House'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {tr("Inward collections from flat buyers and outward payments to suppliers & contractors.")}
                </span>
              </div>
              <button
                onClick={() => setShowChequeModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-plus"></i> {isBangla ? 'নতুন চেক যোগ করুন' : 'Issue / Receive Cheque'}
              </button>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
                <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px' }}>{tr("Cheque No")}</th>
                    <th style={{ padding: '12px' }}>{tr("Bank & Branch")}</th>
                    <th style={{ padding: '12px' }}>{tr("Payee / Drawer")}</th>
                    <th style={{ padding: '12px' }}>{tr("Type")}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{tr("Amount (৳)")}</th>
                    <th style={{ padding: '12px' }}>{tr("Issue Date")}</th>
                    <th style={{ padding: '12px' }}>{tr("Clearance Date")}</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>{tr("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cheques.map((c: any) => (
                    <tr key={c.id_cheques} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#4f46e5' }}>{c.cheque_number}</td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{c.bank_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.branch_name}</span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{c.payee_or_drawer}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: c.cheque_type === 'INWARD_COLLECTION' ? '#dcfce7' : '#fee2e2',
                          color: c.cheque_type === 'INWARD_COLLECTION' ? '#166534' : '#991b1b'
                        }}>
                          {c.cheque_type === 'INWARD_COLLECTION' ? 'INWARD' : 'OUTWARD'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ৳{Number(c.amount_bdt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>{fmtDate(c.issue_date)}</td>
                      <td style={{ padding: '12px' }}>{c.clearance_date ? fmtDate(c.clearance_date) : 'Pending'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD STATUTORY APPROVAL / NOC
      ───────────────────────────────────────────────────────────── */}
      {showApprovalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{tr("Add Authority Approval / NOC")}</h3>
              <button onClick={() => setShowApprovalModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveApproval}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Authority")}</label>
                  <select
                    className="form-select"
                    value={approvalForm.authority}
                    onChange={e => setApprovalForm({ ...approvalForm, authority: e.target.value })}
                  >
                    <option value="RAJUK">{tr("RAJUK (রাজউক)")}</option>
                    <option value="FIRE_SERVICE">{tr("Fire Service & Civil Defence")}</option>
                    <option value="DOE_ENVIRONMENT">{tr("DoE (পরিবেশ অধিদপ্তর)")}</option>
                    <option value="CIVIL_AVIATION">{tr("Civil Aviation (CAAB)")}</option>
                    <option value="WASA">{tr("Dhaka WASA (ওয়াসা)")}</option>
                    <option value="CITY_CORPORATION">{tr("City Corporation")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Permit Type")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={approvalForm.approval_type}
                    onChange={e => setApprovalForm({ ...approvalForm, approval_type: e.target.value })}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Title / Description")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={approvalForm.approval_title}
                    onChange={e => setApprovalForm({ ...approvalForm, approval_title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Application No")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={approvalForm.application_number}
                    onChange={e => setApprovalForm({ ...approvalForm, application_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Approval Ref No")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={approvalForm.approval_reference_no}
                    onChange={e => setApprovalForm({ ...approvalForm, approval_reference_no: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Approval Date")}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={approvalForm.approval_date}
                    onChange={e => setApprovalForm({ ...approvalForm, approval_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Expiry Date")}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={approvalForm.expiry_date}
                    onChange={e => setApprovalForm({ ...approvalForm, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowApprovalModal(false)} className="btn btn-secondary">{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save Approval")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RECORD METER READING
      ───────────────────────────────────────────────────────────── */}
      {showMeterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '550px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{tr("Record Utility Meter Reading")}</h3>
              <button onClick={() => setShowMeterModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveMeter}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Flat / Unit")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. A-301 or Generator")}
                    value={meterForm.unit_number}
                    onChange={e => setMeterForm({ ...meterForm, unit_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Utility Type")}</label>
                  <select
                    className="form-select"
                    value={meterForm.utility_type}
                    onChange={e => setMeterForm({ ...meterForm, utility_type: e.target.value })}
                  >
                    <option value="ELECTRICITY">{tr("Electricity (DESCO)")}</option>
                    <option value="WATER">{tr("Water (Dhaka WASA)")}</option>
                    <option value="GENERATOR_BACKUP">{tr("Generator Backup")}</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Meter Serial No")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={meterForm.meter_number}
                    onChange={e => setMeterForm({ ...meterForm, meter_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Previous Reading")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={meterForm.previous_reading}
                    onChange={e => setMeterForm({ ...meterForm, previous_reading: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Current Reading")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={meterForm.current_reading}
                    onChange={e => setMeterForm({ ...meterForm, current_reading: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Rate per Unit (BDT)")}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={meterForm.unit_rate_bdt}
                    onChange={e => setMeterForm({ ...meterForm, unit_rate_bdt: parseFloat(e.target.value) || 9.8 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Billing Month")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={meterForm.billing_month}
                    onChange={e => setMeterForm({ ...meterForm, billing_month: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowMeterModal(false)} className="btn btn-secondary">{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save & Calculate Bill")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD VENDOR BAKI RECORD
      ───────────────────────────────────────────────────────────── */}
      {showBakiModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '550px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{tr("Add Vendor Baki Entry")}</h3>
              <button onClick={() => setShowBakiModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveBaki}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Supplier Name")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. Shah Cement Agency Uttara")}
                    value={bakiForm.vendor_name}
                    onChange={e => setBakiForm({ ...bakiForm, vendor_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Trade Specialty")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bakiForm.trade_specialty}
                    onChange={e => setBakiForm({ ...bakiForm, trade_specialty: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Credit Limit (BDT)")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={bakiForm.credit_limit_bdt}
                    onChange={e => setBakiForm({ ...bakiForm, credit_limit_bdt: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Total Purchased (BDT)")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={bakiForm.total_purchased_bdt}
                    onChange={e => setBakiForm({ ...bakiForm, total_purchased_bdt: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Total Paid (BDT)")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={bakiForm.total_paid_bdt}
                    onChange={e => setBakiForm({ ...bakiForm, total_paid_bdt: e.target.value })}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Payment Terms")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bakiForm.payment_terms}
                    onChange={e => setBakiForm({ ...bakiForm, payment_terms: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowBakiModal(false)} className="btn btn-secondary">{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save Baki Record")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ISSUE / RECEIVE CHEQUE
      ───────────────────────────────────────────────────────────── */}
      {showChequeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '580px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{tr("Cheque Register Entry")}</h3>
              <button onClick={() => setShowChequeModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveCheque}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Cheque Number")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. DBBL-CQ-109281")}
                    value={chequeForm.cheque_number}
                    onChange={e => setChequeForm({ ...chequeForm, cheque_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Bank Name")}</label>
                  <select
                    className="form-select"
                    value={chequeForm.bank_name}
                    onChange={e => setChequeForm({ ...chequeForm, bank_name: e.target.value })}
                  >
                    <option value="Dutch-Bangla Bank Ltd">{tr("Dutch-Bangla Bank Ltd (DBBL)")}</option>
                    <option value="Islami Bank Bangladesh Ltd">{tr("Islami Bank Bangladesh Ltd (IBBL)")}</option>
                    <option value="BRAC Bank Ltd">{tr("BRAC Bank Ltd")}</option>
                    <option value="City Bank Ltd">{tr("City Bank Ltd")}</option>
                    <option value="Sonali Bank PLC">{tr("Sonali Bank PLC")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Cheque Type")}</label>
                  <select
                    className="form-select"
                    value={chequeForm.cheque_type}
                    onChange={e => setChequeForm({ ...chequeForm, cheque_type: e.target.value })}
                  >
                    <option value="INWARD_COLLECTION">{tr("Inward (Collection from Member)")}</option>
                    <option value="OUTWARD_PAYMENT">{tr("Outward (Payment to Vendor/Worker)")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Amount (BDT)")}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={chequeForm.amount_bdt}
                    onChange={e => setChequeForm({ ...chequeForm, amount_bdt: e.target.value })}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Payee / Drawer Party Name")}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={chequeForm.payee_or_drawer}
                    onChange={e => setChequeForm({ ...chequeForm, payee_or_drawer: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Issue Date")}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={chequeForm.issue_date}
                    onChange={e => setChequeForm({ ...chequeForm, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tr("Status")}</label>
                  <select
                    className="form-select"
                    value={chequeForm.status}
                    onChange={e => setChequeForm({ ...chequeForm, status: e.target.value })}
                  >
                    <option value="ISSUED">{tr("ISSUED")}</option>
                    <option value="DEPOSITED">{tr("DEPOSITED")}</option>
                    <option value="CLEARED">{tr("CLEARED")}</option>
                    <option value="BOUNCED">{tr("BOUNCED")}</option>
                    <option value="CANCELLED">{tr("CANCELLED")}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowChequeModal(false)} className="btn btn-secondary">{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save Cheque")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
