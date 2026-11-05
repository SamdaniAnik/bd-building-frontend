import React, { useState, useEffect } from 'react';
import MyComplaints from './MyComplaints';
import ZakatStatement from '../Operations/ZakatStatement';
import Ballot, { ElectionResults } from '../Operations/Ballot';
import api from '../../api/client';
import { useLang, tr } from '../../i18n/LanguageContext';
import { fmtDate } from '../../utils/bd';

export default function OwnerPortal() {
  const [portalData, setPortalData] = useState<any>(null);
  const { t, n } = useLang();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  // Coming back from the payment gateway lands on ?payment=success|failed|cancelled|error
  const returned = new URLSearchParams(window.location.search).get('payment');
  const [activeTab, setActiveTab] = useState<'summary' | 'pay' | 'works' | 'payments' | 'loans' | 'ledger' | 'complaints' | 'zakat' | 'vote'>(returned ? 'pay' : 'summary');
  const [openComplaints, setOpenComplaints] = useState<number | null>(null);
  const [banner, setBanner] = useState<string | null>(returned);
  const [payConfig, setPayConfig] = useState<{ enabled: boolean; mode: string | null; sandbox: boolean } | null>(null);
  const [payBusy, setPayBusy] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [advance, setAdvance] = useState('');
  const [notices, setNotices] = useState<any[]>([]);

  const fetchPortal = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/owner-portal/me');
      if (res.success) { setPortalData(res.data); setIsPreview(!!res.preview); }
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortal();
    api.get('/pay/config').then((r: any) => setPayConfig(r)).catch(() => setPayConfig({ enabled: false, mode: null, sandbox: true }));
    api.get('/ops/gate/portal/notices').then((r: any) => setNotices(r.rows || [])).catch(() => {});
    if (returned) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const startPayment = async (key: string, body: any) => {
    setPayBusy(key); setPayError(null);
    try {
      const r: any = await api.post('/pay/initiate', isPreview ? { ...body, id_owners: portalData?.owner?.id_owners } : body);
      window.location.assign(r.url); // off to SSLCommerz (or the local test page)
    } catch (e: any) {
      setPayError(e?.message || 'Could not start the payment');
      setPayBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2rem' }}></i>
          <p className="mt-2 text-muted">{t('Loading Private Flat Owner Portal...', 'আপনার ফ্ল্যাট পোর্টাল লোড হচ্ছে...')}</p>
        </div>
      </div>
    );
  }

  if (loadError && !portalData) {
    return <div className="alert alert-danger"><i className="fa-solid fa-triangle-exclamation" /> {loadError}</div>;
  }

  const owner = portalData?.owner || {};
  const schedules: any[] = portalData?.schedules || [];
  const receipts: any[] = portalData?.receipts || [];
  const receiptByNo = new Map(receipts.map((r: any) => [r.receipt_no, r]));
  const unpaid = schedules.filter((s: any) => s.status !== 'PAID' && Number(s.paid_amount) < Number(s.target_amount));
  const openReceipt = (id: number) => window.open(`/print/receipt/${id}`, '_blank', 'noopener');
  const BANNERS: Record<string, [string, string]> = {
    success: ['alert-success', t('Payment successful. It has been credited to your account and a receipt has been issued below.', 'পেমেন্ট সফল হয়েছে। আপনার হিসাবে জমা হয়েছে এবং নিচে রসিদ দেওয়া হয়েছে।')],
    failed: ['alert-danger', t('The payment did not go through. No money was taken — you can try again.', 'পেমেন্ট সম্পন্ন হয়নি। কোনো টাকা কাটা হয়নি — আবার চেষ্টা করুন।')],
    cancelled: ['alert-warning', t('You cancelled the payment. Nothing was charged.', 'আপনি পেমেন্ট বাতিল করেছেন। কোনো টাকা কাটা হয়নি।')],
    error: ['alert-danger', t('We could not confirm the payment with the gateway. If money left your account, contact the office with your transaction ID.', 'গেটওয়ে থেকে পেমেন্ট নিশ্চিত করা যায়নি। টাকা কেটে থাকলে ট্রানজেকশন আইডিসহ অফিসে যোগাযোগ করুন।')],
  };
  const summary = portalData?.financial_summary || {};
  const units = portalData?.units || [];
  const primaryUnit = units[0] || {};
  const works = portalData?.works || [];
  const contributions = portalData?.contributions || [];
  const loans = portalData?.loans || [];
  const ledger = portalData?.ledger || [];

  return (
    <div>
      {banner && BANNERS[banner] && (
        <div className={`alert ${BANNERS[banner][0]} mb-4`} role="status">
          <i className="fa-solid fa-circle-info" /> <div style={{ flex: 1 }}>{BANNERS[banner][1]}</div>
          <button className="btn btn-light btn-sm" onClick={() => setBanner(null)} aria-label="Dismiss"><i className="fa-solid fa-xmark" /></button>
        </div>
      )}
      {isPreview && <div className="alert alert-info mb-4"><i className="fa-solid fa-eye" /> {t('Staff preview of', 'কর্মী প্রিভিউ:')} {owner.full_name}</div>}
      {/* OWNER HERO PROFILE BANNER (Section 40 & 53: Isolated Private Information) */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)', color: 'white', border: 'none' }}>
        <div className="card-body" style={{ padding: '24px 28px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i> {t('Isolated Owner Portal', 'ব্যক্তিগত মালিক পোর্টাল')}
                </span>
                <span className="unit-badge" style={{ background: '#3b82f6', color: 'white', borderColor: '#60a5fa' }}>
                  {t('MY FLAT', 'আমার ফ্ল্যাট')}: {primaryUnit.unit_number || 'Unit A'} ({primaryUnit.area_sqft || 1160} SFT)
                </span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: 'white' }}>
                {owner.full_name || 'Engr. Rafiqul Islam'}
              </h1>
              <p style={{ color: '#c7d2fe', fontSize: '0.85rem', marginTop: '2px' }}>
                <i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> {owner.phone} &bull; {owner.email} &bull; NID: {owner.identification_reference}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-xs uppercase" style={{ color: '#a5b4fc', fontWeight: 600 }}>{t('My Net Outstanding Balance', 'আমার মোট বকেয়া')}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fca5a5' }}>৳{summary.outstanding?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 KEY METRICS FOR FLAT OWNER (Section 40) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Total Liability */}
        <div className="kpi-card" style={{ '--kpi-color': '#4f46e5' } as any}>
          <div className="kpi-title">
            <span>{t('My Total Liability', 'আমার মোট দায়')}</span>
            <i className="fa-solid fa-calculator text-primary"></i>
          </div>
          <div className="kpi-value text-primary">৳{summary.total_liability?.toLocaleString()}</div>
          <div className="kpi-subtitle">{t('Combined Share + Upgrades', 'যৌথ অংশ + আপগ্রেড')}</div>
        </div>

        {/* Combined Cost Share */}
        <div className="kpi-card" style={{ '--kpi-color': '#7c3aed' } as any}>
          <div className="kpi-title">
            <span>{t('Combined Cost Share', 'যৌথ খরচের অংশ')}</span>
            <i className="fa-solid fa-building text-info"></i>
          </div>
          <div className="kpi-value" style={{ color: '#7c3aed' }}>৳{summary.combined_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">{t('Foundation, Lifts, Common Areas', 'ফাউন্ডেশন, লিফট, কমন এরিয়া')}</div>
        </div>

        {/* Individual Upgrades */}
        <div className="kpi-card" style={{ '--kpi-color': '#d97706' } as any}>
          <div className="kpi-title">
            <span>{t('Individual Upgrades', 'ব্যক্তিগত আপগ্রেড')}</span>
            <i className="fa-solid fa-kitchen-set text-warning"></i>
          </div>
          <div className="kpi-value text-warning">৳{summary.individual_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">{t('Premium Kitchen / Interior', 'প্রিমিয়াম কিচেন / ইন্টেরিয়র')}</div>
        </div>

        {/* Total Paid */}
        <div className="kpi-card" style={{ '--kpi-color': '#059669' } as any}>
          <div className="kpi-title">
            <span>{t('Total Paid to Date', 'এ পর্যন্ত মোট পরিশোধ')}</span>
            <i className="fa-solid fa-circle-check text-success"></i>
          </div>
          <div className="kpi-value text-success">৳{summary.total_paid?.toLocaleString()}</div>
          <div className="kpi-subtitle">{t('Equity + Loan installments', 'নিজস্ব + ঋণের কিস্তি')}</div>
        </div>

        {/* Remaining Outstanding Due */}
        <div className="kpi-card" style={{ '--kpi-color': '#dc2626' } as any}>
          <div className="kpi-title">
            <span>{t('Outstanding Balance', 'বকেয়া')}</span>
            <i className="fa-solid fa-triangle-exclamation text-danger"></i>
          </div>
          <div className="kpi-value text-danger">৳{summary.outstanding?.toLocaleString()}</div>
          <div className="kpi-subtitle">{t('Net Due Payable to Project', 'প্রকল্পে প্রদেয় নিট বকেয়া')}</div>
        </div>

        {/* Bank Loan */}
        <div className="kpi-card" style={{ '--kpi-color': '#0284c7' } as any}>
          <div className="kpi-title">
            <span>{t('Bank Loan Disbursed', 'ব্যাংক ঋণ বিতরণ')}</span>
            <i className="fa-solid fa-landmark text-info"></i>
          </div>
          <div className="kpi-value text-info">৳{summary.loan_disbursed?.toLocaleString()}</div>
          <div className="kpi-subtitle">{t('Approved', 'অনুমোদিত')}: ৳{summary.loan_approved?.toLocaleString()}</div>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <i className="fa-solid fa-house" style={{ marginRight: '6px' }}></i> {t('My Flat Overview', 'আমার ফ্ল্যাট')}
        </button>
        <button className={`pill-tab ${activeTab === 'pay' ? 'active' : ''}`} onClick={() => setActiveTab('pay')}>
          <i className="fa-solid fa-credit-card" style={{ marginRight: '6px' }}></i> {t('Pay Online', 'অনলাইনে পরিশোধ')} ({n(unpaid.length)} {t('due', 'বাকি')})
        </button>
        <button className={`pill-tab ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}>
          <i className="fa-solid fa-hammer" style={{ marginRight: '6px' }}></i> {t('My Construction Works', 'আমার নির্মাণ কাজ')} ({n(works.length)})
        </button>
        <button className={`pill-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i> {t('Payment History & Receipts', 'পরিশোধের ইতিহাস ও রসিদ')} ({n(contributions.length)})
        </button>
        <button className={`pill-tab ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
          <i className="fa-solid fa-building-columns" style={{ marginRight: '6px' }}></i> {t('My Bank Loans', 'আমার ব্যাংক ঋণ')} ({n(loans.length)})
        </button>
        <button className={`pill-tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <i className="fa-solid fa-book" style={{ marginRight: '6px' }}></i> {t('Personal Ledger Statement', 'ব্যক্তিগত লেজার বিবরণী')}
        </button>
        <button className={`pill-tab ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>
          <i className="fa-solid fa-headset" style={{ marginRight: '6px' }}></i> {t('Complaints & Repairs', 'অভিযোগ ও মেরামত')}{openComplaints ? ` (${n(openComplaints)})` : ''}
        </button>
        <button className={`pill-tab ${activeTab === 'vote' ? 'active' : ''}`} onClick={() => setActiveTab('vote')}>
          <i className="fa-solid fa-check-to-slot" style={{ marginRight: '6px' }}></i> {t('Committee election', 'কমিটি নির্বাচন')}
        </button>
        <button className={`pill-tab ${activeTab === 'zakat' ? 'active' : ''}`} onClick={() => setActiveTab('zakat')}>
          <i className="fa-solid fa-hand-holding-heart" style={{ marginRight: '6px' }}></i> {t('Zakat statement', 'যাকাত বিবরণী')}
        </button>
      </div>

      {notices.length > 0 && <NoticeBoard notices={notices} />}

      {activeTab === 'vote' && <MyElections isPreview={isPreview} />}

      {activeTab === 'zakat' && <MyZakat previewOwnerId={isPreview ? portalData?.owner?.id_owners : null} />}

      {activeTab === 'complaints' && <MyComplaints previewOwnerId={isPreview ? portalData?.owner?.id_owners : null} onCount={setOpenComplaints} />}

      {/* TAB 1: FLAT OVERVIEW */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-door-open text-primary"></i> {tr("Flat Specifications")}: {primaryUnit.unit_number}
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem' }}>
                <div>
                  <span className="text-muted">{t('Gross Area:', 'মোট আয়তন:')}</span>
                  <div className="fw-bold">{primaryUnit.area_sqft || 1160} SFT</div>
                </div>
                <div>
                  <span className="text-muted">{t('Bedrooms:', 'শয়নকক্ষ:')}</span>
                  <div className="fw-bold">{t('3 Master / Family Beds', '৩টি মাস্টার / ফ্যামিলি বেড')}</div>
                </div>
                <div>
                  <span className="text-muted">{t('Bathrooms:', 'বাথরুম:')}</span>
                  <div className="fw-bold">{t('3 Bathrooms (2 Attached, 1 Common)', '৩টি বাথরুম (২টি সংযুক্ত, ১টি কমন)')}</div>
                </div>
                <div>
                  <span className="text-muted">{t('Kitchen & Dining:', 'রান্নাঘর ও ডাইনিং:')}</span>
                  <div className="fw-bold">{t('Modern Kitchen + Large Dining', 'আধুনিক রান্নাঘর + বড় ডাইনিং')}</div>
                </div>
                <div>
                  <span className="text-muted">{t('Balconies:', 'বারান্দা:')}</span>
                  <div className="fw-bold">{t('2 Attached Balconies', '২টি সংযুক্ত বারান্দা')}</div>
                </div>
                <div>
                  <span className="text-muted">{t('Car Parking:', 'গাড়ি পার্কিং:')}</span>
                  <div className="fw-bold">{t('1 Dedicated Basement Slot', 'বেসমেন্টে ১টি নির্দিষ্ট স্লট')}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginTop: '16px', border: '1px solid #e2e8f0' }}>
                <div className="text-xs text-muted uppercase fw-bold mb-1">{t('Ownership Agreement Details:', 'মালিকানা চুক্তির বিবরণ:')}</div>
                <div className="flex-between text-sm py-1">
                  <span>{t('Ownership Share:', 'মালিকানার অংশ:')}</span>
                  <span className="badge badge-primary">{primaryUnit.ownership_percentage || 100}{tr("% Exclusive")}</span>
                </div>
                <div className="flex-between text-sm py-1">
                  <span>{t('Agreement Date:', 'চুক্তির তারিখ:')}</span>
                  <span className="fw-semibold">{fmtDate(primaryUnit.agreement_date)}</span>
                </div>
                <div className="flex-between text-sm py-1">
                  <span>{t('Current Flat Status:', 'ফ্ল্যাটের বর্তমান অবস্থা:')}</span>
                  <span className="badge badge-info">{primaryUnit.unit_status || 'UNDER_CONSTRUCTION'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-chart-pie text-success"></i> {tr("My Cost Allocation Breakdown")}
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '16px' }}>
                <div className="flex-between text-sm mb-1">
                  <span className="fw-semibold">{t('Combined Common Work Share', 'যৌথ কাজের অংশ')}</span>
                  <span className="fw-bold">৳{summary.combined_cost?.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar" style={{ width: '87.5%', background: '#4f46e5' }}></div>
                </div>
                <div className="text-xs text-muted mt-1">{t('Foundation, RCC Superstructure, 2 Otis Elevators', 'ফাউন্ডেশন, আরসিসি কাঠামো, ২টি লিফট')}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div className="flex-between text-sm mb-1">
                  <span className="fw-semibold">{t('Personal Extra Work / Upgrades', 'ব্যক্তিগত অতিরিক্ত কাজ / আপগ্রেড')}</span>
                  <span className="fw-bold text-warning">৳{summary.individual_cost?.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar warning" style={{ width: '12.5%' }}></div>
                </div>
                <div className="text-xs text-muted mt-1">{t('Premium Spanish Acrylic Kitchen Upgrade solely for Unit A', 'শুধু এই ফ্ল্যাটের জন্য প্রিমিয়াম কিচেন আপগ্রেড')}</div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '16px' }}>
                <div className="flex-between">
                  <span className="fw-bold">{t('Total Payment Progress:', 'মোট পরিশোধের অগ্রগতি:')}</span>
                  <span className="fw-bold text-success">
                    {summary.total_liability > 0 ? ((summary.total_paid / summary.total_liability) * 100).toFixed(0) : 0}{tr("% Paid")}
                  </span>
                </div>
                <div className="progress mt-2" style={{ height: '8px' }}>
                  <div className="progress-bar success" style={{ width: `${Math.min(100, (summary.total_paid / summary.total_liability) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PAY ONLINE */}
      {activeTab === 'pay' && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title"><i className="fa-solid fa-credit-card text-primary"></i> {t('Pay with bKash, Nagad, Rocket or card', 'বিকাশ, নগদ, রকেট বা কার্ডে পরিশোধ করুন')}</div>
            {payConfig?.mode === 'MOCK' && <span className="badge badge-warning">{t('Test mode — no real money', 'টেস্ট মোড — আসল টাকা নয়')}</span>}
            {payConfig?.mode === 'SSLCOMMERZ' && payConfig.sandbox && <span className="badge badge-warning">{t('SSLCommerz sandbox', 'SSLCommerz স্যান্ডবক্স')}</span>}
          </div>
          <div className="card-body">
            {payConfig && !payConfig.enabled && <div className="alert alert-info mb-3"><i className="fa-solid fa-circle-info" /> {t('Online payment is not switched on yet. Please pay at the office or by bank transfer.', 'অনলাইন পেমেন্ট এখনো চালু হয়নি। অফিসে বা ব্যাংক ট্রান্সফারে পরিশোধ করুন।')}</div>}
            {payError && <div className="alert alert-danger mb-3"><i className="fa-solid fa-triangle-exclamation" /> {payError}</div>}
            <div className="table-wrapper">
              <table>
                <thead><tr><th>{t('Instalment', 'কিস্তি')}</th><th>{t('Due date', 'নির্ধারিত তারিখ')}</th><th className="text-right">{t('Amount', 'টাকা')}</th><th className="text-right">{t('Paid', 'পরিশোধিত')}</th><th className="text-right">{t('Remaining', 'বাকি')}</th><th className="text-right">{t('Late fine', 'বিলম্ব জরিমানা')}</th><th>{t('Status', 'অবস্থা')}</th><th /></tr></thead>
                <tbody>
                  {schedules.length === 0 && <tr><td colSpan={8} className="text-center text-muted">{t('No instalment schedule on file.', 'কোনো কিস্তির তালিকা নেই।')}</td></tr>}
                  {schedules.map((s: any) => {
                    const remaining = Math.max(0, Number(s.target_amount) - Number(s.paid_amount || 0));
                    const fine = Number(s.late_fine || 0);
                    const payable = remaining + fine;
                    const overdue = remaining > 0 && new Date(s.due_date) < new Date();
                    return (
                      <tr key={s.id_schedules}>
                        <td className="fw-semibold">{s.installment_name}</td>
                        <td>{new Date(s.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{overdue && <div><span className="badge badge-danger">{t('Overdue', 'মেয়াদোত্তীর্ণ')}</span></div>}</td>
                        <td className="text-right">৳{Number(s.target_amount).toLocaleString('en-IN')}</td>
                        <td className="text-right text-success">৳{Number(s.paid_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="text-right fw-bold">৳{remaining.toLocaleString('en-IN')}</td>
                        <td className="text-right">
                          {fine > 0 ? <span className="text-danger fw-semibold">৳{fine.toLocaleString('en-IN')}</span> : s.fine_waived ? <span className="badge badge-success">{t('Waived', 'মওকুফ')}</span> : '—'}
                          {fine > 0 && <div className="text-xs text-muted">{n(s.days_late)} {t('days late', 'দিন বিলম্ব')}</div>}
                        </td>
                        <td><span className={`badge ${s.status === 'PAID' ? 'badge-success' : overdue ? 'badge-danger' : 'badge-gray'}`}>{s.status === 'PAID' ? t('PAID', 'পরিশোধিত') : overdue ? t('OVERDUE', 'মেয়াদোত্তীর্ণ') : t(s.status, s.status === 'DUE' ? 'বাকি' : 'আসন্ন')}</span></td>
                        <td>{remaining > 0 && <button className="btn btn-primary btn-sm" disabled={!payConfig?.enabled || payBusy !== null} onClick={() => startPayment(`s${s.id_schedules}`, { id_schedules: s.id_schedules })}>{payBusy === `s${s.id_schedules}` ? t('Opening…', 'খোলা হচ্ছে…') : `${t('Pay', 'পরিশোধ')} ৳${payable.toLocaleString('en-IN')}`}</button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="text-sm fw-semibold">{t('Advance / other amount:', 'অগ্রিম / অন্য পরিমাণ:')}</span>
              <input type="number" min={10} className="form-control" style={{ width: 160 }} value={advance} onChange={e => setAdvance(e.target.value)} placeholder={t('৳ amount', '৳ পরিমাণ')} aria-label="Advance amount" />
              <button className="btn btn-light" disabled={!payConfig?.enabled || payBusy !== null || !(Number(advance) >= 10)} onClick={() => startPayment('adv', { amount: Number(advance), purpose: 'Advance contribution', id_units: primaryUnit.id_units })}>{payBusy === 'adv' ? t('Opening…', 'খোলা হচ্ছে…') : t('Pay', 'পরিশোধ')}</button>
            </div>
            <div className="form-text mt-3">{t('You will be taken to the secure SSLCommerz page. Once the payment is confirmed it is credited automatically, a receipt appears below and you get an SMS.', 'আপনাকে নিরাপদ SSLCommerz পেজে নেওয়া হবে। পেমেন্ট নিশ্চিত হলে তা স্বয়ংক্রিয়ভাবে জমা হবে, নিচে রসিদ দেখা যাবে এবং আপনি এসএমএস পাবেন।')}</div>

            {receipts.length > 0 && (
              <>
                <div className="section-heading mt-5"><i className="fa-solid fa-receipt"></i> {t('My receipts', 'আমার রসিদ')}</div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {receipts.map((r: any) => (
                    <button key={r.id_receipts} className="btn btn-light btn-sm" onClick={() => openReceipt(r.id_receipts)}>
                      <i className="fa-solid fa-print" /> {r.receipt_no} · ৳{Number(r.total_bdt).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY WORKS */}
      {activeTab === 'works' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('Construction Item', 'নির্মাণ কাজ')}</th>
                  <th>{t('Work Type', 'কাজের ধরন')}</th>
                  <th className="text-right">{t('My Share / Cost (৳)', 'আমার অংশ / খরচ (৳)')}</th>
                  <th>{t('Progress', 'অগ্রগতি')}</th>
                  <th>{t('Status', 'অবস্থা')}</th>
                </tr>
              </thead>
              <tbody>
                {works.map((w: any) => (
                  <tr key={w.id_work_allocations}>
                    <td className="fw-bold">{w.work_name}</td>
                    <td>
                      <span className={`tag-badge ${w.is_custom ? 'tag-individual' : 'tag-combined'}`}>
                        {w.is_custom ? 'MY INDIVIDUAL WORK' : 'SHARED COMMON WORK'}
                      </span>
                    </td>
                    <td className="text-right fw-bold text-primary">৳{parseFloat(w.allocated_amount).toLocaleString()}</td>
                    <td style={{ minWidth: '100px' }}>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar success" style={{ width: `${w.progress_percentage || 80}%` }}></div>
                      </div>
                    </td>
                    <td><span className="badge badge-success">{w.work_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS & RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('Receipt #', 'রসিদ নং')}</th>
                  <th>{t('Date', 'তারিখ')}</th>
                  <th>{t('Purpose', 'উদ্দেশ্য')}</th>
                  <th>{t('Payment Method', 'পরিশোধের মাধ্যম')}</th>
                  <th className="text-right">{t('Amount Paid (৳)', 'পরিশোধিত টাকা (৳)')}</th>
                  <th>{t('Reference', 'রেফারেন্স')}</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c: any) => (
                  <tr key={c.id_contributions}>
                    <td className="fw-bold text-primary">
                      {receiptByNo.has(c.receipt_number)
                        ? <button className="btn btn-light btn-sm" onClick={() => openReceipt(receiptByNo.get(c.receipt_number).id_receipts)}><i className="fa-solid fa-print" /> {c.receipt_number}</button>
                        : c.receipt_number}
                    </td>
                    <td>{fmtDate(c.payment_date)}</td>
                    <td><span className="badge badge-info">{c.contribution_type?.replace('_', ' ')}</span></td>
                    <td>{c.payment_method}</td>
                    <td className="text-right fw-bold text-success">৳{parseFloat(c.amount).toLocaleString()}</td>
                    <td className="text-muted text-sm">{c.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MY LOANS */}
      {activeTab === 'loans' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('Lender Bank', 'ঋণদাতা ব্যাংক')}</th>
                  <th className="text-right">{t('Approved Limit (৳)', 'অনুমোদিত সীমা (৳)')}</th>
                  <th className="text-right">{t('Disbursed to Project (৳)', 'প্রকল্পে বিতরণ (৳)')}</th>
                  <th className="text-right">{t('Interest Rate', 'সুদের হার')}</th>
                  <th>{t('Tenure', 'মেয়াদ')}</th>
                  <th>{t('Monthly Installment (৳)', 'মাসিক কিস্তি (৳)')}</th>
                  <th>{t('Status', 'অবস্থা')}</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l: any) => (
                  <tr key={l.id_loans}>
                    <td className="fw-bold">{l.bank_lender_name}</td>
                    <td className="text-right fw-semibold">৳{parseFloat(l.approved_amount).toLocaleString()}</td>
                    <td className="text-right fw-bold text-success">৳{parseFloat(l.disbursed_amount).toLocaleString()}</td>
                    <td className="text-right">{l.interest_rate}%</td>
                    <td>{l.loan_term_months} {tr("Months")}</td>
                    <td>৳{parseFloat(l.monthly_installment).toLocaleString()} / mo</td>
                    <td><span className="badge badge-success">{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('Date', 'তারিখ')}</th>
                  <th>{t('Category', 'ধরন')}</th>
                  <th>{t('Description', 'বিবরণ')}</th>
                  <th className="text-right">{t('Debit (৳)', 'ডেবিট (৳)')}</th>
                  <th className="text-right">{t('Credit / Payment (৳)', 'ক্রেডিট / পরিশোধ (৳)')}</th>
                  <th className="text-right">{t('Balance Due (৳)', 'বকেয়া (৳)')}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l: any) => (
                  <tr key={l.id_ledger}>
                    <td>{fmtDate(l.transaction_date)}</td>
                    <td>
                      <span className={`badge ${l.entry_type === 'DEBIT' ? 'badge-danger' : 'badge-success'}`}>
                        {l.category}
                      </span>
                    </td>
                    <td className="fw-medium">{l.description}</td>
                    <td className="text-right text-danger fw-semibold">
                      {parseFloat(l.debit_amount) > 0 ? `$${parseFloat(l.debit_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="text-right text-success fw-semibold">
                      {parseFloat(l.credit_amount) > 0 ? `$${parseFloat(l.credit_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="text-right fw-bold">৳{parseFloat(l.running_balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Live notices from the building management (Operations → Gate, Parking & Notices).
function NoticeBoard({ notices }: { notices: any[] }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const bn = lang === 'bn';
  const shown = open ? notices : notices.slice(0, 2);
  const urgent = (c: string) => c === 'EMERGENCY' || c === 'SECURITY' || c === 'UTILITY_OUTAGE';
  return (
    <div className="card mb-4" style={{ borderLeft: '4px solid #f59e0b' }}>
      <div className="card-header flex-between">
        <div className="card-title"><i className="fa-solid fa-bullhorn text-warning"></i> {t('Notices from management', 'ব্যবস্থাপনার নোটিশ')}</div>
        {notices.length > 2 && <button className="btn btn-light btn-sm" onClick={() => setOpen(!open)}>{open ? t('Show less', 'কম দেখান') : t(`Show all ${notices.length}`, `সব ${notices.length}টি দেখুন`)}</button>}
      </div>
      <div className="card-body">
        {shown.map(n => (
          <div key={n.id_notices} className="mb-4">
            <div className="fw-bold">{n.is_pinned ? <i className="fa-solid fa-thumbtack text-primary" style={{ marginRight: 6 }} /> : null}{urgent(n.category) ? <span className="badge badge-danger" style={{ marginRight: 6 }}>{t('Important', 'জরুরি')}</span> : null}{bn && n.title_bn ? n.title_bn : n.title_en}</div>
            <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{bn && n.body_bn ? n.body_bn : n.body_en}</div>
            <div className="text-xs text-muted">{new Date(n.publish_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Owner's own zakat statement (staff previewing the portal see the previewed owner's).
function MyZakat({ previewOwnerId }: { previewOwnerId: number | null }) {
  const { t } = useLang();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api.get(previewOwnerId ? `/ops/association/zakat/${previewOwnerId}` : '/ops/association/zakat/portal').then(setD).catch((e: any) => setErr(e?.message || 'Could not load'));
  }, [previewOwnerId]);
  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!d) return <div className="text-muted">{t('Loading…', 'লোড হচ্ছে…')}</div>;
  return <ZakatStatement data={d} />;
}

// Committee elections for the logged-in owner: vote while voting is open, see the result once published.
function MyElections({ isPreview }: { isPreview: boolean }) {
  const { t } = useLang();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [voting, setVoting] = useState<any>(null);
  const [code, setCode] = useState('');
  const [check, setCheck] = useState<{ id: number; result: any } | null>(null);
  const load = () => api.get('/ops/elections/portal').then((r: any) => setRows(r.rows)).catch((e: any) => setErr(e?.message || 'Could not load'));
  useEffect(() => { if (!isPreview) load(); }, [isPreview]);
  if (isPreview) return <div className="alert alert-info">{t('Owners vote here with their own login. Staff run elections from Owners’ Association → Elections.', 'মালিকরা নিজের লগইনে এখানে ভোট দেন। কর্মীরা মালিক সমিতি → নির্বাচন থেকে পরিচালনা করেন।')}</div>;
  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!rows) return <div className="text-muted">{t('Loading…', 'লোড হচ্ছে…')}</div>;
  if (voting) return (
    <div className="card"><div className="card-body">
      <Ballot title={voting.title} positions={voting.positions.filter((p: any) => p.contested).concat(voting.positions.filter((p: any) => !p.contested))}
        onCancel={() => { setVoting(null); load(); }}
        onCast={async choices => { try { const r: any = await api.post(`/ops/elections/portal/${voting.id_elections}/ballot`, { choices }); return r.receipt; } catch (e: any) { alert(e?.message || 'Could not record the vote'); return null; } }} />
    </div></div>
  );
  const verify = async (id: number) => { try { setCheck({ id, result: await api.get(`/ops/elections/portal/${id}/receipt/${encodeURIComponent(code.trim())}`) }); } catch { setCheck({ id, result: { counted: false } }); } };
  if (!rows.length) return <div className="alert alert-info">{t('There is no committee election at the moment.', 'এখন কোনো কমিটি নির্বাচন নেই।')}</div>;
  return (
    <div>
      {rows.map(e => (
        <div key={e.id_elections} className="card mb-4">
          <div className="card-header"><div className="card-title"><i className="fa-solid fa-check-to-slot" /> {e.title}</div></div>
          <div className="card-body">
            <div className="text-sm text-muted mb-4">{t('Voting', 'ভোটগ্রহণ')}: {new Date(e.voting_opens_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} → {new Date(e.voting_closes_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · {e.is_secret ? t('secret ballot', 'গোপন ব্যালট') : t('open ballot', 'প্রকাশ্য ব্যালট')}</div>
            {e.rules_note && <div className="alert alert-info mb-4">{e.rules_note}</div>}
            {!e.eligible && <div className="alert alert-warning">{t('Only owners with an active flat can vote.', 'শুধু সক্রিয় ফ্ল্যাটের মালিক ভোট দিতে পারেন।')}</div>}
            {e.eligible && e.has_voted && <div className="alert alert-success"><i className="fa-solid fa-circle-check" /> {t('You voted on', 'আপনি ভোট দিয়েছেন')} {new Date(e.voted_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. {t('Thank you.', 'ধন্যবাদ।')}</div>}
            {e.eligible && !e.has_voted && e.phase === 'VOTING' && <button className="btn btn-success btn-lg" onClick={() => setVoting(e)}><i className="fa-solid fa-box-archive" /> {t('Vote now', 'এখন ভোট দিন')}</button>}
            {e.eligible && !e.has_voted && e.phase === 'NOT_YET' && <div className="alert alert-info">{t('Voting has not opened yet.', 'ভোটগ্রহণ এখনো শুরু হয়নি।')}</div>}
            {!e.has_voted && ['ENDED', 'CLOSED', 'PUBLISHED'].includes(e.phase) && <div className="text-sm text-muted">{t('Voting is closed.', 'ভোটগ্রহণ শেষ।')}</div>}
            {e.status === 'CLOSED' && <div className="text-sm text-muted">{t('Votes are being counted — the result will appear here.', 'ভোট গণনা চলছে — ফলাফল এখানে দেখাবে।')}</div>}
            {e.results && <div className="mt-4"><ElectionResults positions={e.results.positions} ballots={e.results.ballots} /></div>}
            {e.has_voted && <div className="flex gap-2 mt-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-control" style={{ width: 160, fontFamily: 'monospace' }} placeholder="XXXX-XXXX" aria-label={t('Ballot receipt', 'ব্যালট রসিদ')} value={code} onChange={ev => setCode(ev.target.value)} />
              <button className="btn btn-light btn-sm" disabled={code.trim().length < 9} onClick={() => verify(e.id_elections)}>{t('Check my receipt', 'রসিদ যাচাই')}</button>
              {check && check.id === e.id_elections && (check.result.counted ? <span className="badge badge-success">{t('Your ballot is in the count', 'আপনার ব্যালট গণনায় আছে')}</span> : <span className="badge badge-danger">{t('No ballot with this code', 'এই কোডে কোনো ব্যালট নেই')}</span>)}
            </div>}
          </div>
        </div>
      ))}
    </div>
  );
}
