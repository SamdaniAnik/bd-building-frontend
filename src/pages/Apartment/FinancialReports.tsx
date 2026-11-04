import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function FinancialReports() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>('project_cost');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dashRes, uRes, oRes, vRes, lRes, bRes]: any = await Promise.all([
        api.get('/apartment/dashboard'),
        api.get('/apartment/units'),
        api.get('/apartment/owners'),
        api.get('/apartment/vendors'),
        api.get('/apartment/loans'),
        api.get('/apartment/budgets')
      ]);

      setReportData({
        dashboard: dashRes.data,
        units: uRes.data,
        owners: oRes.data,
        vendors: vRes.data,
        loans: lRes.data,
        budgets: bRes.data
      });
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2rem' }}></i>
          <p className="mt-2 text-muted">{tr("Compiling Financial Reports...")}</p>
        </div>
      </div>
    );
  }

  const kpis = reportData?.dashboard?.kpis || {};
  const project = reportData?.dashboard?.project || {};

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Reports")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-file-invoice text-primary"></i> {tr("Financial & Project Statements (Section 43)")}
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <i className="fa-solid fa-print"></i> {tr("Print / Download PDF")}
        </button>
      </div>

      {/* REPORT SELECTOR TABS (Hidden in Print) */}
      <div className="pill-tabs no-print">
        <button className={`pill-tab ${selectedReport === 'project_cost' ? 'active' : ''}`} onClick={() => setSelectedReport('project_cost')}>
          {tr("Project Cost Summary")}
        </button>
        <button className={`pill-tab ${selectedReport === 'unit_cost' ? 'active' : ''}`} onClick={() => setSelectedReport('unit_cost')}>
          {tr("Unit-Wise Cost Allocation")}
        </button>
        <button className={`pill-tab ${selectedReport === 'budget_actual' ? 'active' : ''}`} onClick={() => setSelectedReport('budget_actual')}>
          {tr("Budget vs Actual")}
        </button>
        <button className={`pill-tab ${selectedReport === 'vendor_ledger' ? 'active' : ''}`} onClick={() => setSelectedReport('vendor_ledger')}>
          {tr("Vendor Balances & Payable")}
        </button>
        <button className={`pill-tab ${selectedReport === 'loan_summary' ? 'active' : ''}`} onClick={() => setSelectedReport('loan_summary')}>
          {tr("Owner Bank Loans")}
        </button>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div className="card" style={{ padding: '30px', background: 'white' }}>
        {/* Report Official Letterhead */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{project.project_name || 'Gulshan Heights Luxury Residences'}</h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '2px' }}>
              {tr("Project Code")}: {project.project_code || 'GH-2026'} &bull; {project.address || 'Plot 42, Road 71, Gulshan-2, Dhaka 1212'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="badge badge-primary uppercase" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {tr("Official Financial Statement")}
            </div>
            <div className="text-xs text-muted mt-2">
              {tr("Generated")}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* 1. PROJECT COST SUMMARY */}
        {selectedReport === 'project_cost' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              {tr("Executive Project Financial Summary")}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="text-xs text-muted">{tr("Total Construction Cost:")}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4f46e5' }}>৳{kpis.total_project_cost?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="text-xs text-muted">{tr("Total Paid by Flat Owners:")}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>৳{kpis.total_paid?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="text-xs text-muted">{tr("Total Owner Dues / Receivable:")}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>৳{kpis.owner_receivable?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div className="text-xs text-muted">{tr("Vendor Payable Dues:")}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706' }}>৳{kpis.vendor_payable?.toLocaleString()}</div>
              </div>
            </div>

            <div className="section-heading">{tr("Detailed Construction Cost Breakdown")}</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Category")}</th>
                    <th className="text-right">{tr("Amount (৳)")}</th>
                    <th className="text-right">{tr("Share of Total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.dashboard?.costByCategory || []).map((cat: any) => (
                    <tr key={cat.category}>
                      <td className="fw-semibold">{cat.category}</td>
                      <td className="text-right fw-bold text-primary">৳{cat.amount?.toLocaleString()}</td>
                      <td className="text-right">
                        {kpis.total_project_cost > 0 ? ((cat.amount / kpis.total_project_cost) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{tr("Total Project Construction Cost")}</td>
                    <td className="text-right fw-bold" style={{ fontSize: '1rem' }}>৳{kpis.total_project_cost?.toLocaleString()}</td>
                    <td className="text-right">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 2. UNIT COST ALLOCATION REPORT */}
        {selectedReport === 'unit_cost' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              {tr("Unit-wise Cost & Payment Schedule (Units A–F)")}
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Unit")}</th>
                    <th>{tr("Area (SFT)")}</th>
                    <th className="text-right">{tr("Combined Cost (৳)")}</th>
                    <th className="text-right">{tr("Individual Upgrade (৳)")}</th>
                    <th className="text-right">{tr("Total Liability (৳)")}</th>
                    <th className="text-right">{tr("Amount Paid (৳)")}</th>
                    <th className="text-right">{tr("Outstanding Balance (৳)")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.units || []).map((u: any) => (
                    <tr key={u.id_units}>
                      <td className="fw-bold">{u.unit_number}</td>
                      <td>{u.area_sqft} SFT</td>
                      <td className="text-right text-primary">৳{u.combined_share?.toLocaleString()}</td>
                      <td className="text-right text-warning">৳{u.individual_cost?.toLocaleString()}</td>
                      <td className="text-right fw-bold">৳{u.total_liability?.toLocaleString()}</td>
                      <td className="text-right text-success fw-bold">৳{u.total_paid?.toLocaleString()}</td>
                      <td className="text-right fw-bold text-danger">৳{u.outstanding?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{tr("Total (6 Units)")}</td>
                    <td>{tr("6,960 SFT")}</td>
                    <td className="text-right">৳{kpis.combined_cost?.toLocaleString()}</td>
                    <td className="text-right">৳{kpis.individual_cost?.toLocaleString()}</td>
                    <td className="text-right">৳{kpis.total_project_cost?.toLocaleString()}</td>
                    <td className="text-right text-success">৳{kpis.total_paid?.toLocaleString()}</td>
                    <td className="text-right text-danger">৳{kpis.total_outstanding?.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 3. BUDGET VS ACTUAL */}
        {selectedReport === 'budget_actual' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              {tr("Budget vs Actual Variance Report")}
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Category")}</th>
                    <th className="text-right">{tr("Original Budget (৳)")}</th>
                    <th className="text-right">{tr("Revised Budget (৳)")}</th>
                    <th className="text-right">{tr("Actual Spent (৳)")}</th>
                    <th className="text-right">{tr("Variance (৳)")}</th>
                    <th>{tr("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.budgets || []).map((b: any) => {
                    const orig = parseFloat(b.original_budget);
                    const rev = parseFloat(b.revised_budget || orig);
                    const act = parseFloat(b.actual_spent);
                    const variance = rev - act;
                    return (
                      <tr key={b.id_budgets}>
                        <td className="fw-bold">{b.category}</td>
                        <td className="text-right">৳{orig.toLocaleString()}</td>
                        <td className="text-right">৳{rev.toLocaleString()}</td>
                        <td className="text-right text-primary fw-bold">৳{act.toLocaleString()}</td>
                        <td className={`text-right fw-bold ${variance >= 0 ? 'text-success' : 'text-danger'}`}>
                          {variance >= 0 ? '+' : ''}${variance.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${variance >= 0 ? 'badge-success' : 'badge-danger'}`}>
                            {variance >= 0 ? 'Within Budget' : 'Over Budget'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. VENDOR BALANCES */}
        {selectedReport === 'vendor_ledger' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              {tr("Vendor Liabilities & Payment Position")}
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Company Name")}</th>
                    <th>{tr("Category")}</th>
                    <th className="text-right">{tr("Total Invoiced (৳)")}</th>
                    <th className="text-right">{tr("Paid to Date (৳)")}</th>
                    <th className="text-right">{tr("Outstanding Due (৳)")}</th>
                    <th>{tr("Payment Terms")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.vendors || []).map((v: any) => (
                    <tr key={v.id_vendors}>
                      <td className="fw-bold">{v.company_name}</td>
                      <td><span className="badge badge-info">{v.category}</span></td>
                      <td className="text-right">৳{parseFloat(v.total_invoiced || 0).toLocaleString()}</td>
                      <td className="text-right text-success">৳{parseFloat(v.total_paid || 0).toLocaleString()}</td>
                      <td className="text-right fw-bold text-danger">৳{parseFloat(v.outstanding || 0).toLocaleString()}</td>
                      <td>{v.payment_terms}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>{tr("Total Vendor Liabilities")}</td>
                    <td className="text-right">৳{(reportData?.vendors || []).reduce((s: number, v: any) => s + parseFloat(v.total_invoiced || 0), 0).toLocaleString()}</td>
                    <td className="text-right text-success">৳{(reportData?.vendors || []).reduce((s: number, v: any) => s + parseFloat(v.total_paid || 0), 0).toLocaleString()}</td>
                    <td className="text-right text-danger">৳{kpis.vendor_payable?.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 5. LOAN SUMMARY */}
        {selectedReport === 'loan_summary' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              {tr("Owner Institutional Bank Loans Schedule")}
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Flat Owner")}</th>
                    <th>{tr("Unit")}</th>
                    <th>{tr("Lender Bank")}</th>
                    <th className="text-right">{tr("Approved Amount (৳)")}</th>
                    <th className="text-right">{tr("Disbursed Amount (৳)")}</th>
                    <th className="text-right">{tr("Principal Paid (৳)")}</th>
                    <th className="text-right">{tr("Outstanding Principal (৳)")}</th>
                    <th>{tr("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.loans || []).map((l: any) => (
                    <tr key={l.id_loans}>
                      <td className="fw-bold">{l.owner_name}</td>
                      <td><span className="unit-badge">{l.unit_number}</span></td>
                      <td>{l.bank_lender_name}</td>
                      <td className="text-right fw-semibold">৳{parseFloat(l.approved_amount).toLocaleString()}</td>
                      <td className="text-right text-success fw-bold">৳{parseFloat(l.disbursed_amount).toLocaleString()}</td>
                      <td className="text-right">৳{parseFloat(l.principal_paid || 0).toLocaleString()}</td>
                      <td className="text-right fw-bold text-primary">৳{parseFloat(l.outstanding_amount || 0).toLocaleString()}</td>
                      <td><span className="badge badge-success">{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures Footer */}
        <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
          <div>
            <div style={{ height: '30px' }}></div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '180px', textAlign: 'center', paddingTop: '4px' }}>
              {tr("Project Manager")}
            </div>
          </div>
          <div>
            <div style={{ height: '30px' }}></div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '180px', textAlign: 'center', paddingTop: '4px' }}>
              {tr("Chief Accountant")}
            </div>
          </div>
          <div>
            <div style={{ height: '30px' }}></div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '180px', textAlign: 'center', paddingTop: '4px' }}>
              {tr("Committee Chairman")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
