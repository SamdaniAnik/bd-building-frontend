import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';
import { fmtDate } from '../../utils/bd';

export default function ContractorManagement() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Progress Bill Modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [billForm, setBillForm] = useState({
    bill_number: '',
    cumulative_work_percent: '40',
    gross_claim_amount: '',
    advance_recovery_amount: '0',
    retention_amount: '0',
    previous_payments: '0'
  });

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/contractors');
      if (res.success) setContracts(res.data);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      const res: any = await api.post('/apartment/contractors/progress-bills', {
        id_contracts: selectedContract.id_contracts,
        ...billForm
      });
      if (res.success) {
        alert(res.message);
        setShowBillModal(false);
        setSelectedContract(null);
        fetchContracts();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording progress bill');
    }
  };

  const openBillModal = (c: any) => {
    setSelectedContract(c);
    const contractVal = parseFloat(c.contract_value || 0);
    const estGross = contractVal * 0.40;
    const retentionAmt = estGross * (parseFloat(c.retention_percentage || 5) / 100);
    const advRecovery = 8000;
    const prevPaid = 30000;

    setBillForm({
      bill_number: `IPC-0${(c.bills?.length || 0) + 1}-${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase().replace(' ', '')}`,
      cumulative_work_percent: '40',
      gross_claim_amount: String(estGross),
      advance_recovery_amount: String(advRecovery),
      retention_amount: String(retentionAmt),
      previous_payments: String(prevPaid)
    });
    setShowBillModal(true);
  };

  // Live calculation of net payable
  const gross = parseFloat(billForm.gross_claim_amount || '0');
  const advRec = parseFloat(billForm.advance_recovery_amount || '0');
  const retAmt = parseFloat(billForm.retention_amount || '0');
  const prevP = parseFloat(billForm.previous_payments || '0');
  const calculatedNet = Math.max(0, gross - advRec - retAmt - prevP);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Contractors")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-hard-hat text-primary"></i> {tr("Contractor Management & Progress Billing Engine (Sections 6–9)")}
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          {tr("Advance Recovery & 5% Retention Money Engine")}
        </span>
      </div>

      {/* FORMULA HIGHLIGHT BOX (Section 7) */}
      <div className="card mb-4" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="text-xs text-muted uppercase fw-bold mb-2">{tr("Section 7 & 8 Construction Progress Billing Equation:")}</div>
          <div className="p-3 bg-white rounded border flex-between" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', flexWrap: 'wrap', gap: '10px' }}>
            <span>{tr("Gross Certified Work Claim")}</span>
            <span className="text-danger">{tr("- Advance Recovery")}</span>
            <span className="text-warning">{tr("- 5% Retention Money")}</span>
            <span className="text-muted">{tr("- Cumulative Previous Payments")}</span>
            <span className="text-success">{tr("= Net Approved Contractor Payment")}</span>
          </div>
        </div>
      </div>

      {/* CONTRACTS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {contracts.map(c => (
          <div key={c.id_contracts} className="card" style={{ borderTop: '4px solid #4f46e5' }}>
            <div className="card-header flex-between">
              <div>
                <span className="unit-badge">{c.contract_number}</span>
                <span className="badge badge-success ml-2" style={{ marginLeft: '6px' }}>{c.status}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openBillModal(c)}>
                <i className="fa-solid fa-calculator"></i> {tr("Progress Claim Bill")}
              </button>
            </div>
            <div className="card-body">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{c.contract_title}</h3>
              <div className="text-sm fw-semibold text-primary mt-1">
                {tr("Contractor")}: {c.company_name} &bull; {c.phone}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                <div>
                  <span className="text-xs text-muted">{tr("Contract Value:")}</span>
                  <div className="fw-bold" style={{ fontSize: '1.2rem', color: '#1e1b4b' }}>৳{parseFloat(c.contract_value).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-xs text-muted">{tr("Work Completed:")}</span>
                  <div className="fw-bold text-success" style={{ fontSize: '1.2rem' }}>{c.work_completed_percentage}%</div>
                </div>
                <div>
                  <span className="text-xs text-muted">{tr("Advance Paid / Recovered:")}</span>
                  <div className="fw-semibold">৳{parseFloat(c.advance_paid).toLocaleString()} / <span className="text-success">৳{parseFloat(c.advance_recovered).toLocaleString()}</span></div>
                </div>
                <div>
                  <span className="text-xs text-muted">{tr("Retention Held")} ({c.retention_percentage}%):</span>
                  <div className="fw-bold text-warning">৳{parseFloat(c.retention_held).toLocaleString()}</div>
                </div>
              </div>

              <p className="text-xs text-muted mt-3">
                <strong>{tr("Scope:")}</strong> {c.scope_of_work}
              </p>

              {/* Progress Bills History */}
              <div className="section-heading" style={{ fontSize: '0.8rem', marginTop: '16px' }}>
                <i className="fa-solid fa-receipt"></i> {tr("Certified Interim Progress Bills")} ({c.bills?.length || 0})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(c.bills || []).map((b: any) => (
                  <div key={b.id_progress_bills} className="p-2 rounded border bg-white flex-between text-xs">
                    <div>
                      <span className="fw-bold text-primary">{b.bill_number}</span> ({b.cumulative_work_percent}%)
                      <div className="text-muted">{fmtDate(b.billing_date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>৳{parseFloat(b.net_payable_amount).toLocaleString()}</div>
                      <span className="badge badge-info">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PROGRESS BILLING GENERATOR MODAL (Section 7) */}
      {showBillModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateBill}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{tr("Certified Contractor Interim Progress Bill (IPC)")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowBillModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="p-3 mb-3 rounded" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div className="flex-between text-sm">
                    <span>{tr("Contract Value:")} <strong>৳{parseFloat(selectedContract.contract_value).toLocaleString()}</strong></span>
                    <span>{tr("Retention Rate:")} <strong>{selectedContract.retention_percentage}%</strong></span>
                  </div>
                </div>

                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Bill / Certificate #")}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={billForm.bill_number}
                      onChange={e => setBillForm({ ...billForm, bill_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Cumulative Completed %")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={billForm.cumulative_work_percent}
                      onChange={e => {
                        const pct = parseFloat(e.target.value || '0');
                        const cVal = parseFloat(selectedContract.contract_value);
                        const newGross = (cVal * (pct / 100));
                        const newRet = newGross * (parseFloat(selectedContract.retention_percentage) / 100);
                        setBillForm({
                          ...billForm,
                          cumulative_work_percent: e.target.value,
                          gross_claim_amount: String(newGross.toFixed(2)),
                          retention_amount: String(newRet.toFixed(2))
                        });
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Gross Work Claim (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={billForm.gross_claim_amount}
                      onChange={e => setBillForm({ ...billForm, gross_claim_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Advance Recovery (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={billForm.advance_recovery_amount}
                      onChange={e => setBillForm({ ...billForm, advance_recovery_amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Retention Money Held (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={billForm.retention_amount}
                      onChange={e => setBillForm({ ...billForm, retention_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Previous Payments Deducted (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={billForm.previous_payments}
                      onChange={e => setBillForm({ ...billForm, previous_payments: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Net Payment Output Box */}
                <div className="p-3 rounded" style={{ background: '#f0fdf4', border: '1.5px solid #86efac', marginTop: '10px' }}>
                  <div className="flex-between">
                    <span className="fw-bold" style={{ color: '#166534' }}>{tr("Net Payable Current Certificate:")}</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>৳{calculatedNet.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Formula: ৳${gross.toLocaleString()} - ${advRec.toLocaleString()} (Adv) - ${retAmt.toLocaleString()} (Ret) - ${prevP.toLocaleString()} (Prev) = ${calculatedNet.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowBillModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-success">{tr("Certify & Approve Progress Bill")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
