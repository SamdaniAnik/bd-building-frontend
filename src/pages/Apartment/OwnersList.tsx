import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function OwnersList() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLedger, setSelectedLedger] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/owners');
      if (res.success) setOwners(res.data);
    } catch (err) {
      console.error('Error fetching owners:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLedger = async (ownerId: number) => {
    try {
      setLedgerLoading(true);
      const res: any = await api.get(`/apartment/owners/${ownerId}/ledger`);
      if (res.success) {
        setSelectedLedger(res.data);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-3 text-muted fw-semibold">{tr("Loading Owners & Shareholder Ledgers...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Owners")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-users text-primary"></i> {tr("Flat Owners & Multi-Ownership Management")}
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          {owners.length} {tr("Registered Apartment Owners")}
        </span>
      </div>

      {/* Owners Table */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-address-book text-primary"></i> {tr("Flat Owner Profiles & Financial Positions")}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{tr("Owner Name & Contact")}</th>
                <th>{tr("Unit & Ownership %")}</th>
                <th>{tr("Identification / NID")}</th>
                <th className="text-right">{tr("Total Liability (৳)")}</th>
                <th className="text-right">{tr("Total Paid (৳)")}</th>
                <th className="text-right">{tr("Outstanding Balance (৳)")}</th>
                <th className="text-right">{tr("Bank Loan (৳)")}</th>
                <th className="text-center">{tr("Ledger Statement")}</th>
              </tr>
            </thead>
            <tbody>
              {owners.map(o => (
                <tr key={o.id_owners}>
                  <td>
                    <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{o.full_name}</div>
                    <div className="text-muted text-xs">
                      <i className="fa-solid fa-phone" style={{ marginRight: '4px' }}></i> {o.phone} &bull; {o.email}
                    </div>
                  </td>
                  <td>
                    {(o.units || []).map((u: any) => (
                      <div key={u.id_units} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="unit-badge">{u.unit_number}</span>
                        <span className="badge badge-primary">{u.ownership_percentage}%</span>
                      </div>
                    ))}
                  </td>
                  <td className="text-muted text-sm">{o.identification_reference || '-'}</td>
                  <td className="text-right fw-bold" style={{ color: '#1e1b4b' }}>৳{o.total_liability?.toLocaleString()}
                  </td>
                  <td className="text-right text-success fw-bold">৳{o.total_paid?.toLocaleString()}
                  </td>
                  <td className="text-right fw-bold text-danger">৳{o.outstanding?.toLocaleString()}
                  </td>
                  <td className="text-right text-info fw-semibold">
                    {o.loan_disbursed > 0 ? (
                      <div>
                        <div>৳{o.loan_disbursed?.toLocaleString()}</div>
                        <div className="text-xs text-muted">of ${o.loan_approved?.toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">{tr("None")}</span>
                    )}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline btn-sm" onClick={() => openLedger(o.id_owners)}>
                      <i className="fa-solid fa-book"></i> {tr("Ledger")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>{tr("Total Financial Positions")}</td>
                <td className="text-right">৳{owners.reduce((s, o) => s + parseFloat(o.total_liability || 0), 0).toLocaleString()}
                </td>
                <td className="text-right text-success">৳{owners.reduce((s, o) => s + parseFloat(o.total_paid || 0), 0).toLocaleString()}
                </td>
                <td className="text-right text-danger">৳{owners.reduce((s, o) => s + parseFloat(o.outstanding || 0), 0).toLocaleString()}
                </td>
                <td className="text-right text-info">৳{owners.reduce((s, o) => s + parseFloat(o.loan_disbursed || 0), 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* OWNER LEDGER MODAL (Debit: Combined + Individual; Credit: Payments; Balance) */}
      {selectedLedger && (
        <div className="modal-overlay" onClick={() => setSelectedLedger(null)}>
          <div className="modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="text-xs text-muted fw-bold uppercase">{tr("Official Owner Financial Ledger")}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedLedger.owner?.full_name}</h3>
              </div>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedLedger(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="text-xs text-muted">{tr("Phone / Contact:")}</div>
                  <div className="fw-bold">{selectedLedger.owner?.phone}</div>
                </div>
                <div className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="text-xs text-muted">{tr("NID / Ref:")}</div>
                  <div className="fw-bold">{selectedLedger.owner?.identification_reference}</div>
                </div>
                <div className="p-3 rounded" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div className="text-xs text-muted">{tr("Agreement Date:")}</div>
                  <div className="fw-bold text-primary">{selectedLedger.owner?.agreement_date}</div>
                </div>
              </div>

              <div className="section-heading">
                <i className="fa-solid fa-list-check"></i> {tr("Chronological Debit & Credit Transactions")}
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{tr("Date")}</th>
                      <th>{tr("Category")}</th>
                      <th>{tr("Description")}</th>
                      <th className="text-right">{tr("Debit / Charge (৳)")}</th>
                      <th className="text-right">{tr("Credit / Payment (৳)")}</th>
                      <th className="text-right">{tr("Running Due (৳)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedLedger.ledger || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">{tr("No ledger transactions recorded yet.")}</td>
                      </tr>
                    ) : (
                      (selectedLedger.ledger || []).map((l: any) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer flex-between">
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> {tr("Print Owner Ledger")}
              </button>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedLedger(null)}>
                {tr("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
