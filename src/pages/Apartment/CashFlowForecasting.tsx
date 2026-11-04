import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function CashFlowForecasting() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/apartment/cash-flow-forecast');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Error fetching cash flow forecast:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2rem' }}></i>
          <p className="mt-2 text-muted">{tr("Calculating Project Cash Flow Projections...")}</p>
        </div>
      </div>
    );
  }

  const forecast = data?.forecast || [];
  const shortfalls = data?.shortfall_alerts || [];
  const liquidReserves = data?.current_liquid_reserves || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Financial Planning")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-chart-line text-primary"></i> {tr("Project Cash Flow Forecasting (Section 1)")}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            Current Liquid Cash: ৳${liquidReserves.toLocaleString()}
          </span>
        </div>
      </div>

      {/* SHORTFALL WARNING BANNER (Section 1 requirement) */}
      {shortfalls.length > 0 && (
        <div className="alert alert-danger mb-4">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.4rem' }}></i>
          <div>
            <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
              {tr("⚠ Projected Cash Shortage Warning Detected!")}
            </div>
            <p className="text-sm mt-1">
              {tr("In")} <strong>{shortfalls[0].month}</strong>, projected construction expenditures (৳{shortfalls[0].projected_expense.toLocaleString()}) exceed total projected collections and loan inflows (৳{shortfalls[0].total_inflow.toLocaleString()}) by <span className="fw-bold">৳{shortfalls[0].shortfall_amount.toLocaleString()}</span>{tr(". Recommend issuing Owner Milestone Call Notice #03 or accelerating Bank Asia loan disbursement tranche.")}
            </p>
          </div>
        </div>
      )}

      {/* 6-MONTH PROJECTION CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {forecast.map((f: any) => (
          <div key={f.month} className="kpi-card" style={{ '--kpi-color': f.has_shortfall ? '#dc2626' : '#10b981' } as any}>
            <div className="kpi-title">
              <span>{f.month}</span>
              {f.has_shortfall ? (
                <span className="badge badge-danger">{tr("Shortfall")}</span>
              ) : (
                <span className="badge badge-success">{tr("Surplus")}</span>
              )}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              <div className="flex-between py-1">
                <span className="text-muted">{tr("Expected Expenses:")}</span>
                <span className="fw-bold text-danger">-${f.projected_expense.toLocaleString()}</span>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">{tr("Owner Collections:")}</span>
                <span className="fw-semibold text-success">+${f.projected_collection.toLocaleString()}</span>
              </div>
              {f.projected_loan_disbursed > 0 && (
                <div className="flex-between py-1">
                  <span className="text-muted">{tr("Bank Loan Inflow:")}</span>
                  <span className="fw-semibold text-info">+${f.projected_loan_disbursed.toLocaleString()}</span>
                </div>
              )}
              <div className="flex-between py-1 border-top mt-1">
                <span className="fw-bold">{tr("Net Monthly Cash:")}</span>
                <span className={`fw-bold ${f.net_cash >= 0 ? 'text-success' : 'text-danger'}`}>
                  {f.net_cash >= 0 ? '+' : ''}${f.net_cash.toLocaleString()}
                </span>
              </div>
              <div className="flex-between py-1" style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', marginTop: '6px' }}>
                <span className="text-xs text-muted">{tr("Closing Reserve:")}</span>
                <span className="fw-bold text-primary">৳{f.projected_closing_balance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FORECAST SCHEDULE TABLE */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-table-list text-primary"></i> {tr("6-Month Rolling Planned vs Actual Cash Flow Model")}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{tr("Forecast Month")}</th>
                <th className="text-right">{tr("Projected Expenses (৳)")}</th>
                <th className="text-right">{tr("Owner Collections (৳)")}</th>
                <th className="text-right">{tr("Loan Disbursements (৳)")}</th>
                <th className="text-right">{tr("Total Inflows (৳)")}</th>
                <th className="text-right">{tr("Net Flow (৳)")}</th>
                <th className="text-right">{tr("Projected Closing Reserve (৳)")}</th>
                <th>{tr("Liquidity Health")}</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f: any) => (
                <tr key={f.month}>
                  <td className="fw-bold">{f.month}</td>
                  <td className="text-right text-danger fw-semibold">-${f.projected_expense.toLocaleString()}</td>
                  <td className="text-right text-success fw-semibold">+${f.projected_collection.toLocaleString()}</td>
                  <td className="text-right text-info fw-semibold">
                    {f.projected_loan_disbursed > 0 ? `+$${f.projected_loan_disbursed.toLocaleString()}` : '-'}
                  </td>
                  <td className="text-right fw-bold">+${f.total_inflow.toLocaleString()}</td>
                  <td className={`text-right fw-bold ${f.net_cash >= 0 ? 'text-success' : 'text-danger'}`}>
                    {f.net_cash >= 0 ? '+' : ''}${f.net_cash.toLocaleString()}
                  </td>
                  <td className="text-right fw-bold text-primary">৳{f.projected_closing_balance.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${f.has_shortfall ? 'badge-danger' : 'badge-success'}`}>
                      {f.has_shortfall ? `Shortfall (-$${f.shortfall_amount.toLocaleString()})` : 'Healthy Surplus'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>{tr("6-Month Totals")}</td>
                <td className="text-right text-danger">
                  -${forecast.reduce((s: number, f: any) => s + f.projected_expense, 0).toLocaleString()}
                </td>
                <td className="text-right text-success">
                  +${forecast.reduce((s: number, f: any) => s + f.projected_collection, 0).toLocaleString()}
                </td>
                <td className="text-right text-info">
                  +${forecast.reduce((s: number, f: any) => s + f.projected_loan_disbursed, 0).toLocaleString()}
                </td>
                <td className="text-right fw-bold">
                  +${forecast.reduce((s: number, f: any) => s + f.total_inflow, 0).toLocaleString()}
                </td>
                <td className="text-right fw-bold">
                  +${forecast.reduce((s: number, f: any) => s + f.net_cash, 0).toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
