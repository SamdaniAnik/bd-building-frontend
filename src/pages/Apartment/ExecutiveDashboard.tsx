import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'budget'>('overview');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-3 text-muted fw-semibold">Loading Apartment Management Analytics...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const project = data?.project || {};

  return (
    <div>
      {/* Top Banner */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)', color: 'white', border: 'none' }}>
        <div className="card-body" style={{ padding: '24px 28px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 10px' }}>
                  {project.project_code || 'SHOPNO-BILASH-108'}
                </span>
                <span className="badge badge-success">ACTIVE MULTI-TOWER CAMPUS</span>
                <span className="badge" style={{ background: '#10b981', color: 'white' }}>3 TOWERS • 108 SHARES</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: 'white' }}>
                {project.project_name || 'Shopno Bilash (স্বপ্ন বিলাস)'}
              </h1>
              <p style={{ color: '#c7d2fe', fontSize: '0.88rem', marginTop: '4px', maxWidth: '850px' }}>
                <i className="fa-solid fa-location-dot" style={{ marginRight: '6px' }}></i>
                {project.address || 'Plot 42-46, Sector 15, Uttara Phase 3, Dhaka'} &bull; 3 Connected Towers (Padma, Meghna, Jamuna) &bull; 9 Floors &bull; 108 Units &bull; 105 Personal Shares + 3 Common Shares (Mosque, Meeting Hall, Pool)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link to="/apartment/shopno-bilash" className="btn btn-success btn-sm" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-circle-nodes"></i> Shopno Bilash (108 Shares) Hub
              </Link>
              <Link to="/apartment/works" className="btn btn-warning btn-sm">
                <i className="fa-solid fa-plus-circle"></i> Add Work & Allocate
              </Link>
              <Link to="/apartment/finances" className="btn btn-success btn-sm">
                <i className="fa-solid fa-money-bill-wave"></i> Record Payment
              </Link>
              <Link to="/apartment/reports" className="btn btn-light btn-sm">
                <i className="fa-solid fa-file-pdf"></i> Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY 8 FINANCIAL KPIS (Sections 39 & 55) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* 1. TOTAL PROJECT COST */}
        <div className="kpi-card" style={{ '--kpi-color': '#4f46e5' } as any}>
          <div className="kpi-title">
            <span>Total Project Cost</span>
            <i className="fa-solid fa-calculator text-primary"></i>
          </div>
          <div className="kpi-value text-primary">৳{kpis.total_project_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">Combined + Individual Work</div>
        </div>

        {/* 2. TOTAL PAID */}
        <div className="kpi-card" style={{ '--kpi-color': '#10b981' } as any}>
          <div className="kpi-title">
            <span>Total Paid by Owners</span>
            <i className="fa-solid fa-circle-check text-success"></i>
          </div>
          <div className="kpi-value text-success">৳{kpis.total_paid?.toLocaleString()}</div>
          <div className="kpi-subtitle">Equity + Loan-funded receipts</div>
        </div>

        {/* 3. TOTAL OUTSTANDING / RECEIVABLE */}
        <div className="kpi-card" style={{ '--kpi-color': '#ef4444' } as any}>
          <div className="kpi-title">
            <span>Owner Receivable</span>
            <i className="fa-solid fa-hand-holding-dollar text-danger"></i>
          </div>
          <div className="kpi-value text-danger">৳{kpis.total_outstanding?.toLocaleString()}</div>
          <div className="kpi-subtitle">Total Owner Dues Remaining</div>
        </div>

        {/* 4. VENDOR PAYABLE */}
        <div className="kpi-card" style={{ '--kpi-color': '#f59e0b' } as any}>
          <div className="kpi-title">
            <span>Vendor Payable</span>
            <i className="fa-solid fa-truck-ramp-box text-warning"></i>
          </div>
          <div className="kpi-value text-warning">৳{kpis.vendor_payable?.toLocaleString()}</div>
          <div className="kpi-subtitle">Invoiced but unpaid to vendors</div>
        </div>

        {/* 5. COMBINED COST */}
        <div className="kpi-card" style={{ '--kpi-color': '#8b5cf6' } as any}>
          <div className="kpi-title">
            <span>Combined Cost</span>
            <i className="fa-solid fa-building text-info"></i>
          </div>
          <div className="kpi-value" style={{ color: '#7c3aed' }}>৳{kpis.combined_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">Shared Common Facilities</div>
        </div>

        {/* 6. INDIVIDUAL COST */}
        <div className="kpi-card" style={{ '--kpi-color': '#06b6d4' } as any}>
          <div className="kpi-title">
            <span>Individual Cost</span>
            <i className="fa-solid fa-door-open" style={{ color: '#0891b2' }}></i>
          </div>
          <div className="kpi-value" style={{ color: '#0891b2' }}>৳{kpis.individual_cost?.toLocaleString()}</div>
          <div className="kpi-subtitle">Unit-Specific Upgrades</div>
        </div>

        {/* 7. TOTAL BANK LOANS */}
        <div className="kpi-card" style={{ '--kpi-color': '#0ea5e9' } as any}>
          <div className="kpi-title">
            <span>Bank Loans Disbursed</span>
            <i className="fa-solid fa-landmark text-info"></i>
          </div>
          <div className="kpi-value" style={{ color: '#0284c7' }}>৳{kpis.total_loan_disbursed?.toLocaleString()}</div>
          <div className="kpi-subtitle">Approved: ৳${kpis.total_loan_approved?.toLocaleString()}</div>
        </div>

        {/* 8. CONSTRUCTION PROGRESS */}
        <div className="kpi-card" style={{ '--kpi-color': '#10b981' } as any}>
          <div className="kpi-title">
            <span>Overall Progress</span>
            <i className="fa-solid fa-chart-line text-success"></i>
          </div>
          <div className="kpi-value text-success">{kpis.overall_progress}%</div>
          <div className="progress mt-2" style={{ height: '6px' }}>
            <div className="progress-bar success" style={{ width: `${kpis.overall_progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fa-solid fa-table-cells-large" style={{ marginRight: '6px' }}></i> Financial Matrix by Unit (Units A–F)
        </button>
        <button className={`pill-tab ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>
          <i className="fa-solid fa-chart-pie" style={{ marginRight: '6px' }}></i> Cost Category Breakdown
        </button>
        <button className={`pill-tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
          <i className="fa-solid fa-scale-balanced" style={{ marginRight: '6px' }}></i> Budget vs Actual Variance
        </button>
      </div>

      {/* TAB 1: UNIT FINANCIAL MATRIX */}
      {activeTab === 'overview' && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-building-user text-primary"></i>
              Unit-wise Financial Liability, Combined Share & Balance (Units A–F)
            </div>
            <span className="badge badge-primary">6 Units Configured</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Unit Number</th>
                  <th>Area (SFT)</th>
                  <th className="text-right">Combined Share (৳)</th>
                  <th className="text-right">Individual Upgrades (৳)</th>
                  <th className="text-right">Total Liability (৳)</th>
                  <th className="text-right">Total Paid (৳)</th>
                  <th className="text-right">Outstanding Due (৳)</th>
                  <th>Payment Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.costByUnit || []).map((u: any) => {
                  const pctPaid = u.total_liability > 0 ? (u.total_paid / u.total_liability) * 100 : 0;
                  return (
                    <tr key={u.unit_id}>
                      <td>
                        <span className="unit-badge">
                          <i className="fa-solid fa-door-closed"></i> {u.unit_number}
                        </span>
                      </td>
                      <td className="fw-semibold">{u.area_sqft?.toLocaleString()} SFT</td>
                      <td className="text-right text-primary fw-semibold">৳{u.combined_share?.toLocaleString()}</td>
                      <td className="text-right text-warning fw-semibold">৳{u.individual_cost?.toLocaleString()}</td>
                      <td className="text-right fw-bold" style={{ color: '#1e1b4b', fontSize: '0.95rem' }}>৳{u.total_liability?.toLocaleString()}
                      </td>
                      <td className="text-right text-success fw-bold">৳{u.total_paid?.toLocaleString()}</td>
                      <td className="text-right fw-bold text-danger">৳{u.outstanding?.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress" style={{ width: '70px', height: '6px' }}>
                            <div className={`progress-bar ${pctPaid >= 80 ? 'success' : pctPaid >= 50 ? 'warning' : 'danger'}`} style={{ width: `${Math.min(100, pctPaid)}%` }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pctPaid.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <Link to={`/apartment/units/${u.unit_id}`} className="btn btn-outline btn-sm">
                          Details <i className="fa-solid fa-arrow-right"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total (6 Units)</td>
                  <td>6,960 SFT</td>
                  <td className="text-right">৳{kpis.combined_cost?.toLocaleString()}</td>
                  <td className="text-right">৳{kpis.individual_cost?.toLocaleString()}</td>
                  <td className="text-right">৳{kpis.total_project_cost?.toLocaleString()}</td>
                  <td className="text-right text-success">৳{kpis.total_paid?.toLocaleString()}</td>
                  <td className="text-right text-danger">৳{kpis.total_outstanding?.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COST CATEGORIES */}
      {activeTab === 'charts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-chart-pie text-primary"></i> Cost by Construction Category
              </div>
            </div>
            <div className="card-body">
              {(data?.costByCategory || []).map((cat: any) => {
                const pct = kpis.total_project_cost > 0 ? ((cat.amount / kpis.total_project_cost) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.category} className="mb-3">
                    <div className="flex-between text-sm mb-1">
                      <span className="fw-semibold">{cat.category}</span>
                      <span className="text-muted">৳{cat.amount?.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: cat.category === 'Structural' ? '#4f46e5' : cat.category === 'Facilities & MEP' ? '#06b6d4' : '#f59e0b' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-code-compare text-success"></i> Combined Work vs Individual Upgrades
              </div>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#4f46e5' }}>
                  {kpis.total_project_cost > 0 ? ((kpis.combined_cost / kpis.total_project_cost) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-muted text-sm">Combined / Common Construction Facilities</div>
              </div>
              <hr style={{ borderColor: 'var(--gray-200)', margin: '14px 0' }} />
              <div className="flex-between mb-2">
                <span className="tag-badge tag-combined">Combined Share:</span>
                <span className="fw-bold">৳{kpis.combined_cost?.toLocaleString()}</span>
              </div>
              <div className="flex-between">
                <span className="tag-badge tag-individual">Individual Flat Upgrades:</span>
                <span className="fw-bold">৳{kpis.individual_cost?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET VS ACTUAL */}
      {activeTab === 'budget' && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-simple text-primary"></i> Budget vs Actual Variance Report
            </div>
            <Link to="/apartment/finances" className="btn btn-outline btn-sm">Manage Budgets & Change Orders</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Revised Budget (৳)</th>
                  <th className="text-right">Actual Spent (৳)</th>
                  <th className="text-right">Variance (৳)</th>
                  <th className="text-right">Variance %</th>
                  <th>Budget Health</th>
                </tr>
              </thead>
              <tbody>
                {(data?.budgetVsActual || []).map((b: any) => (
                  <tr key={b.category}>
                    <td className="fw-semibold">{b.category}</td>
                    <td className="text-right">৳{b.budget?.toLocaleString()}</td>
                    <td className="text-right text-primary fw-semibold">৳{b.actual?.toLocaleString()}</td>
                    <td className={`text-right fw-bold ${b.variance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {b.variance >= 0 ? '+' : ''}${b.variance?.toLocaleString()}
                    </td>
                    <td className="text-right">{b.variance_percent}%</td>
                    <td>
                      <span className={`badge ${b.variance >= 0 ? 'badge-success' : 'badge-danger'}`}>
                        {b.variance >= 0 ? 'Under Budget' : 'Over Budget'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOTTOM SECTION: RECENT AUDITS & NOTIFICATIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Recent Audit Trail */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-shield-halved text-primary"></i> Recent Audit Log
            </div>
            <Link to="/apartment/audit" className="text-sm text-primary fw-semibold">View All Logs</Link>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {(data?.recentAudits || []).map((a: any) => (
              <div key={a.id_audit} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '0.75rem' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {a.user_name}: <span className="text-muted">{a.action}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {a.new_value}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & System Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-bell text-warning"></i> Notifications & Alerts
            </div>
            <span className="badge badge-warning">Active Alerts</span>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {(data?.notifications || []).map((n: any) => (
              <div key={n.id_notifications} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: n.type === 'PAYMENT' ? '#d1fae5' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: n.type === 'PAYMENT' ? '#059669' : '#d97706', flexShrink: 0 }}>
                  <i className={`fa-solid ${n.type === 'PAYMENT' ? 'fa-receipt' : 'fa-triangle-exclamation'}`} style={{ fontSize: '0.75rem' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: '2px' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
