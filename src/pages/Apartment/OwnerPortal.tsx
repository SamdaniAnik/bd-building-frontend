import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function OwnerPortal() {
  const [portalData, setPortalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'works' | 'payments' | 'loans' | 'ledger'>('summary');

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/apartment/owner-portal/me');
        if (res.success) setPortalData(res.data);
      } catch (err) {
        console.error('Error fetching owner portal:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortal();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2rem' }}></i>
          <p className="mt-2 text-muted">Loading Private Flat Owner Portal...</p>
        </div>
      </div>
    );
  }

  const owner = portalData?.owner || {};
  const summary = portalData?.financial_summary || {};
  const units = portalData?.units || [];
  const primaryUnit = units[0] || {};
  const works = portalData?.works || [];
  const contributions = portalData?.contributions || [];
  const loans = portalData?.loans || [];
  const ledger = portalData?.ledger || [];

  return (
    <div>
      {/* OWNER HERO PROFILE BANNER (Section 40 & 53: Isolated Private Information) */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)', color: 'white', border: 'none' }}>
        <div className="card-body" style={{ padding: '24px 28px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i> Isolated Owner Portal
                </span>
                <span className="unit-badge" style={{ background: '#3b82f6', color: 'white', borderColor: '#60a5fa' }}>
                  MY FLAT: {primaryUnit.unit_number || 'Unit A'} ({primaryUnit.area_sqft || 1160} SFT)
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
              <div className="text-xs uppercase" style={{ color: '#a5b4fc', fontWeight: 600 }}>My Net Outstanding Balance</div>
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
            <span>My Total Liability</span>
            <i className="fa-solid fa-calculator text-primary"></i>
          </div>
          <div className="kpi-value text-primary">৳{summary.total_liability?.toLocaleString()}</div>
          <div className="kpi-subtitle">Combined Share + Upgrades</div>
        </div>

        {/* Combined Cost Share */}
        <div className="kpi-card" style={{ '--kpi-color': '#7c3aed' } as any}>
          <div className="kpi-title">
            <span>Combined Cost Share</span>
            <i className="fa-solid fa-building text-info"></i>
          </div>
          <div className="kpi-value" style={{ color: '#7c3aed' }}>৳{summary.combined_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">Foundation, Lifts, Common Areas</div>
        </div>

        {/* Individual Upgrades */}
        <div className="kpi-card" style={{ '--kpi-color': '#d97706' } as any}>
          <div className="kpi-title">
            <span>Individual Upgrades</span>
            <i className="fa-solid fa-kitchen-set text-warning"></i>
          </div>
          <div className="kpi-value text-warning">৳{summary.individual_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">Premium Kitchen / Interior</div>
        </div>

        {/* Total Paid */}
        <div className="kpi-card" style={{ '--kpi-color': '#059669' } as any}>
          <div className="kpi-title">
            <span>Total Paid to Date</span>
            <i className="fa-solid fa-circle-check text-success"></i>
          </div>
          <div className="kpi-value text-success">৳{summary.total_paid?.toLocaleString()}</div>
          <div className="kpi-subtitle">Equity + Loan installments</div>
        </div>

        {/* Remaining Outstanding Due */}
        <div className="kpi-card" style={{ '--kpi-color': '#dc2626' } as any}>
          <div className="kpi-title">
            <span>Outstanding Balance</span>
            <i className="fa-solid fa-triangle-exclamation text-danger"></i>
          </div>
          <div className="kpi-value text-danger">৳{summary.outstanding?.toLocaleString()}</div>
          <div className="kpi-subtitle">Net Due Payable to Project</div>
        </div>

        {/* Bank Loan */}
        <div className="kpi-card" style={{ '--kpi-color': '#0284c7' } as any}>
          <div className="kpi-title">
            <span>Bank Loan Disbursed</span>
            <i className="fa-solid fa-landmark text-info"></i>
          </div>
          <div className="kpi-value text-info">৳{summary.loan_disbursed?.toLocaleString()}</div>
          <div className="kpi-subtitle">Approved: ৳${summary.loan_approved?.toLocaleString()}</div>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <i className="fa-solid fa-house" style={{ marginRight: '6px' }}></i> My Flat Overview
        </button>
        <button className={`pill-tab ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}>
          <i className="fa-solid fa-hammer" style={{ marginRight: '6px' }}></i> My Construction Works ({works.length})
        </button>
        <button className={`pill-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i> Payment History & Receipts ({contributions.length})
        </button>
        <button className={`pill-tab ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
          <i className="fa-solid fa-building-columns" style={{ marginRight: '6px' }}></i> My Bank Loans ({loans.length})
        </button>
        <button className={`pill-tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <i className="fa-solid fa-book" style={{ marginRight: '6px' }}></i> Personal Ledger Statement
        </button>
      </div>

      {/* TAB 1: FLAT OVERVIEW */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-door-open text-primary"></i> Flat Specifications: {primaryUnit.unit_number}
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem' }}>
                <div>
                  <span className="text-muted">Gross Area:</span>
                  <div className="fw-bold">{primaryUnit.area_sqft || 1160} SFT</div>
                </div>
                <div>
                  <span className="text-muted">Bedrooms:</span>
                  <div className="fw-bold">3 Master / Family Beds</div>
                </div>
                <div>
                  <span className="text-muted">Bathrooms:</span>
                  <div className="fw-bold">3 Bathrooms (2 Attached, 1 Common)</div>
                </div>
                <div>
                  <span className="text-muted">Kitchen & Dining:</span>
                  <div className="fw-bold">Modern Kitchen + Large Dining</div>
                </div>
                <div>
                  <span className="text-muted">Balconies:</span>
                  <div className="fw-bold">2 Attached Balconies</div>
                </div>
                <div>
                  <span className="text-muted">Car Parking:</span>
                  <div className="fw-bold">1 Dedicated Basement Slot</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginTop: '16px', border: '1px solid #e2e8f0' }}>
                <div className="text-xs text-muted uppercase fw-bold mb-1">Ownership Agreement Details:</div>
                <div className="flex-between text-sm py-1">
                  <span>Ownership Share:</span>
                  <span className="badge badge-primary">{primaryUnit.ownership_percentage || 100}% Exclusive</span>
                </div>
                <div className="flex-between text-sm py-1">
                  <span>Agreement Date:</span>
                  <span className="fw-semibold">{primaryUnit.agreement_date || '2026-01-15'}</span>
                </div>
                <div className="flex-between text-sm py-1">
                  <span>Current Flat Status:</span>
                  <span className="badge badge-info">{primaryUnit.unit_status || 'UNDER_CONSTRUCTION'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-chart-pie text-success"></i> My Cost Allocation Breakdown
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '16px' }}>
                <div className="flex-between text-sm mb-1">
                  <span className="fw-semibold">Combined Common Work Share</span>
                  <span className="fw-bold">৳{summary.combined_cost?.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar" style={{ width: '87.5%', background: '#4f46e5' }}></div>
                </div>
                <div className="text-xs text-muted mt-1">Foundation, RCC Superstructure, 2 Otis Elevators</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div className="flex-between text-sm mb-1">
                  <span className="fw-semibold">Personal Extra Work / Upgrades</span>
                  <span className="fw-bold text-warning">৳{summary.individual_cost?.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar warning" style={{ width: '12.5%' }}></div>
                </div>
                <div className="text-xs text-muted mt-1">Premium Spanish Acrylic Kitchen Upgrade solely for Unit A</div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '16px' }}>
                <div className="flex-between">
                  <span className="fw-bold">Total Payment Progress:</span>
                  <span className="fw-bold text-success">
                    {summary.total_liability > 0 ? ((summary.total_paid / summary.total_liability) * 100).toFixed(0) : 0}% Paid
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

      {/* TAB 2: MY WORKS */}
      {activeTab === 'works' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Construction Item</th>
                  <th>Work Type</th>
                  <th className="text-right">My Share / Cost (৳)</th>
                  <th>Progress</th>
                  <th>Status</th>
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
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Purpose</th>
                  <th>Payment Method</th>
                  <th className="text-right">Amount Paid (৳)</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c: any) => (
                  <tr key={c.id_contributions}>
                    <td className="fw-bold text-primary">{c.receipt_number}</td>
                    <td>{c.payment_date}</td>
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
                  <th>Lender Bank</th>
                  <th className="text-right">Approved Limit (৳)</th>
                  <th className="text-right">Disbursed to Project (৳)</th>
                  <th className="text-right">Interest Rate</th>
                  <th>Tenure</th>
                  <th>Monthly Installment (৳)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l: any) => (
                  <tr key={l.id_loans}>
                    <td className="fw-bold">{l.bank_lender_name}</td>
                    <td className="text-right fw-semibold">৳{parseFloat(l.approved_amount).toLocaleString()}</td>
                    <td className="text-right fw-bold text-success">৳{parseFloat(l.disbursed_amount).toLocaleString()}</td>
                    <td className="text-right">{l.interest_rate}%</td>
                    <td>{l.loan_term_months} Months</td>
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
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-right">Debit (৳)</th>
                  <th className="text-right">Credit / Payment (৳)</th>
                  <th className="text-right">Balance Due (৳)</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l: any) => (
                  <tr key={l.id_ledger}>
                    <td>{l.transaction_date}</td>
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
