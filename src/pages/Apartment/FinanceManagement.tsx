import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';
import { fmtDate, todayISO } from '../../utils/bd';

export default function FinanceManagement() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [contributions, setContributions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contributions' | 'loans' | 'budgets' | 'accounts'>('contributions');

  // New Contribution Modal
  const [showContribModal, setShowContribModal] = useState(false);
  const [contribForm, setContribForm] = useState({
    id_owners: '',
    id_units: '',
    amount: '',
    payment_date: todayISO(),
    contribution_type: 'CONSTRUCTION_INSTALLMENT',
    payment_method: 'BANK_TRANSFER',
    bank_or_cash_account: 'Dhaka Bank Project Escrow',
    reference: '',
    notes: ''
  });

  // Change Order Modal
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [changeForm, setChangeForm] = useState({
    change_amount: '',
    reason: '',
    requested_by: 'Engr. Kabir Hossain (Project Manager)',
    approved_by: 'Building Committee Resolution'
  });

  // New Loan Disbursement Modal
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [disburseForm, setDisburseForm] = useState({
    amount: '',
    disbursement_date: todayISO(),
    reference_number: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, lRes, bRes, aRes, oRes, uRes]: any = await Promise.all([
        api.get('/apartment/contributions'),
        api.get('/apartment/loans'),
        api.get('/apartment/budgets'),
        api.get('/apartment/cash-bank'),
        api.get('/apartment/owners'),
        api.get('/apartment/units'),
      ]);
      if (cRes.success) setContributions(cRes.data);
      if (lRes.success) setLoans(lRes.data);
      if (bRes.success) setBudgets(bRes.data);
      if (aRes.success) setAccounts(aRes.data);
      if (oRes.success) setOwners(oRes.data);
      if (uRes.success) setUnits(uRes.data);
    } catch (err) {
      console.error('Error fetching finances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/contributions', contribForm);
      if (res.success) {
        alert('Owner contribution recorded and credited to ledger!');
        setShowContribModal(false);
        setContribForm({
          id_owners: '',
          id_units: '',
          amount: '',
          payment_date: todayISO(),
          contribution_type: 'CONSTRUCTION_INSTALLMENT',
          payment_method: 'BANK_TRANSFER',
          bank_or_cash_account: 'Dhaka Bank Project Escrow',
          reference: '',
          notes: ''
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording contribution');
    }
  };

  const handleApplyChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    try {
      const res: any = await api.post('/apartment/budgets/change-order', {
        id_budgets: selectedBudget.id_budgets,
        ...changeForm
      });
      if (res.success) {
        alert('Change order approved and revised budget updated!');
        setShowChangeModal(false);
        setSelectedBudget(null);
        setChangeForm({ change_amount: '', reason: '', requested_by: '', approved_by: '' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error saving change order');
    }
  };

  const handleDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      const res: any = await api.post(`/apartment/loans/${selectedLoan.id_loans}/disbursements`, disburseForm);
      if (res.success) {
        alert('Loan disbursement installment registered!');
        setShowDisburseModal(false);
        setSelectedLoan(null);
        setDisburseForm({ amount: '', disbursement_date: todayISO(), reference_number: '', notes: '' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording disbursement');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Finance")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-coins text-primary"></i> {tr("Financial Management, Loans & Budgets")}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-success" onClick={() => setShowContribModal(true)}>
            <i className="fa-solid fa-plus-circle"></i> {tr("Record Owner Contribution")}
          </button>
        </div>
      </div>

      {/* SECTION 28: SEPARATE FUNDING FROM EXPENSES BANNER */}
      <div className="card mb-4" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-primary">{tr("Section 28 Architecture")}</span>
            <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#1e293b' }}>
              {tr("Separation of Funding Sources from Construction Expenditures")}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '6px 0', fontSize: '0.8rem', fontWeight: 600 }}>
            <div className="p-2 rounded bg-white shadow-sm flex-center" style={{ border: '1px solid #e2e8f0', minWidth: '130px' }}>
              <i className="fa-solid fa-landmark text-info mr-1" style={{ marginRight: '6px' }}></i> {tr("BANK LOAN")}
            </div>
            <i className="fa-solid fa-arrow-right text-muted"></i>
            <div className="p-2 rounded bg-white shadow-sm flex-center" style={{ border: '1px solid #e2e8f0', minWidth: '130px' }}>
              <i className="fa-solid fa-user-shield text-primary mr-1" style={{ marginRight: '6px' }}></i> {tr("OWNER FUNDING")}
            </div>
            <i className="fa-solid fa-arrow-right text-muted"></i>
            <div className="p-2 rounded bg-white shadow-sm flex-center" style={{ border: '1px solid #e2e8f0', minWidth: '150px' }}>
              <i className="fa-solid fa-vault text-success mr-1" style={{ marginRight: '6px' }}></i> {tr("PROJECT CONTRIBUTION")}
            </div>
            <i className="fa-solid fa-arrow-right text-muted"></i>
            <div className="p-2 rounded bg-white shadow-sm flex-center" style={{ border: '1px solid #e2e8f0', minWidth: '160px' }}>
              <i className="fa-solid fa-helmet-safety text-warning mr-1" style={{ marginRight: '6px' }}></i> {tr("CONSTRUCTION EXPENSE")}
            </div>
            <i className="fa-solid fa-arrow-right text-muted"></i>
            <div className="p-2 rounded bg-white shadow-sm flex-center" style={{ border: '1px solid #e2e8f0', minWidth: '140px' }}>
              <i className="fa-solid fa-money-bill-transfer text-danger mr-1" style={{ marginRight: '6px' }}></i> {tr("VENDOR PAYMENT")}
            </div>
          </div>
        </div>
      </div>

      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'contributions' ? 'active' : ''}`} onClick={() => setActiveTab('contributions')}>
          <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i> {tr("Owner Contributions & Payments")} ({contributions.length})
        </button>
        <button className={`pill-tab ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
          <i className="fa-solid fa-building-columns" style={{ marginRight: '6px' }}></i> {tr("Bank Loans & Disbursements")} ({loans.length})
        </button>
        <button className={`pill-tab ${activeTab === 'budgets' ? 'active' : ''}`} onClick={() => setActiveTab('budgets')}>
          <i className="fa-solid fa-scale-balanced" style={{ marginRight: '6px' }}></i> {tr("Budgets & Change Orders")} ({budgets.length})
        </button>
        <button className={`pill-tab ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => setActiveTab('accounts')}>
          <i className="fa-solid fa-wallet" style={{ marginRight: '6px' }}></i> {tr("Cash & Bank Accounts")} ({accounts.length})
        </button>
      </div>

      {/* TAB 1: OWNER CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Receipt #")}</th>
                  <th>{tr("Flat Owner")}</th>
                  <th>{tr("Unit")}</th>
                  <th>{tr("Payment Date")}</th>
                  <th>{tr("Contribution Purpose")}</th>
                  <th>{tr("Method")}</th>
                  <th className="text-right">{tr("Amount Paid (৳)")}</th>
                  <th>{tr("Account / Ref")}</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map(c => (
                  <tr key={c.id_contributions}>
                    <td className="fw-bold text-primary">{c.receipt_number}</td>
                    <td className="fw-semibold">{c.owner_name}</td>
                    <td><span className="unit-badge">{c.unit_number || 'General'}</span></td>
                    <td>{fmtDate(c.payment_date)}</td>
                    <td>
                      <span className="badge badge-info">{c.contribution_type?.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray">{c.payment_method}</span>
                    </td>
                    <td className="text-right fw-bold text-success" style={{ fontSize: '0.95rem' }}>৳{parseFloat(c.amount).toLocaleString()}
                    </td>
                    <td className="text-muted text-sm">{c.bank_or_cash_account} &bull; {c.reference}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>{tr("Total Owner Contributions Received")}</td>
                  <td className="text-right fw-bold text-success" style={{ fontSize: '1.05rem' }}>৳{contributions.reduce((s, c) => s + parseFloat(c.amount || 0), 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BANK LOANS */}
      {activeTab === 'loans' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Owner & Unit")}</th>
                  <th>{tr("Lender / Bank")}</th>
                  <th className="text-right">{tr("Approved Limit (৳)")}</th>
                  <th className="text-right">{tr("Disbursed to Date (৳)")}</th>
                  <th className="text-right">{tr("Remaining to Disburse (৳)")}</th>
                  <th className="text-right">{tr("Interest Rate")}</th>
                  <th>{tr("Monthly Installment (৳)")}</th>
                  <th className="text-center">{tr("Disbursements")}</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => {
                  const remaining = Math.max(0, parseFloat(l.approved_amount) - parseFloat(l.disbursed_amount));
                  return (
                    <tr key={l.id_loans}>
                      <td>
                        <div className="fw-bold">{l.owner_name}</div>
                        <span className="unit-badge text-xs">{l.unit_number}</span>
                      </td>
                      <td className="fw-semibold">{l.bank_lender_name}</td>
                      <td className="text-right fw-bold">৳{parseFloat(l.approved_amount).toLocaleString()}</td>
                      <td className="text-right fw-bold text-success">৳{parseFloat(l.disbursed_amount).toLocaleString()}</td>
                      <td className="text-right text-muted">৳{remaining.toLocaleString()}</td>
                      <td className="text-right">{l.interest_rate}%</td>
                      <td>৳{parseFloat(l.monthly_installment).toLocaleString()} / mo</td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setSelectedLoan(l); setShowDisburseModal(true); }}
                        >
                          <i className="fa-solid fa-arrow-down-to-bracket"></i> {tr("Record Disbursement")} ({l.disbursements?.length || 0})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGETS & CHANGE ORDERS */}
      {activeTab === 'budgets' && (
        <div className="card mb-4">
          <div className="card-header flex-between">
            <div className="card-title">
              <i className="fa-solid fa-calculator text-primary"></i> {tr("Master Project Construction Budgets")}
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Category")}</th>
                  <th className="text-right">{tr("Original Budget (৳)")}</th>
                  <th className="text-right">{tr("Revised Budget (৳)")}</th>
                  <th className="text-right">{tr("Actual Spent (৳)")}</th>
                  <th className="text-right">{tr("Variance (৳)")}</th>
                  <th>{tr("Change Orders")}</th>
                  <th className="text-center">{tr("Modify")}</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => {
                  const orig = parseFloat(b.original_budget || 0);
                  const rev = parseFloat(b.revised_budget || orig);
                  const act = parseFloat(b.actual_spent || 0);
                  const variance = rev - act;
                  return (
                    <tr key={b.id_budgets}>
                      <td className="fw-bold">{b.category}</td>
                      <td className="text-right text-muted">৳{orig.toLocaleString()}</td>
                      <td className="text-right fw-bold">৳{rev.toLocaleString()}</td>
                      <td className="text-right fw-bold text-primary">৳{act.toLocaleString()}</td>
                      <td className={`text-right fw-bold ${variance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {variance >= 0 ? '+' : ''}${variance.toLocaleString()}
                      </td>
                      <td>
                        {(b.change_orders || []).length > 0 ? (
                          <span className="badge badge-warning">
                            {b.change_orders.length} {tr("Approved Change Order(s)")}
                          </span>
                        ) : (
                          <span className="badge badge-gray">{tr("No Changes")}</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setSelectedBudget(b); setShowChangeModal(true); }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> {tr("Change Order")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CASH & BANK ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {accounts.map(acc => (
            <div key={acc.id_accounts} className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className={`fa-solid ${acc.account_type === 'PETTY_CASH' || acc.account_type === 'SITE_CASH' ? 'fa-money-bill-1' : 'fa-building-columns'} text-primary`}></i>
                  {acc.account_name}
                </div>
              </div>
              <div className="card-body">
                <div className="text-xs text-muted mb-1">{tr("Current Liquid Balance")}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>৳{parseFloat(acc.balance).toLocaleString()}
                </div>
                <div style={{ marginTop: '14px', fontSize: '0.85rem' }}>
                  <div className="flex-between py-1 border-bottom">
                    <span className="text-muted">{tr("Account Type:")}</span>
                    <span className="badge badge-info">{acc.account_type}</span>
                  </div>
                  <div className="flex-between py-1 border-bottom">
                    <span className="text-muted">{tr("Bank Institution:")}</span>
                    <span className="fw-semibold">{acc.bank_name || 'Cash Safe'}</span>
                  </div>
                  <div className="flex-between py-1">
                    <span className="text-muted">{tr("Account Number:")}</span>
                    <span className="font-mono">{acc.account_number}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORD OWNER CONTRIBUTION MODAL */}
      {showContribModal && (
        <div className="modal-overlay" onClick={() => setShowContribModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleRecordContribution}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Record Flat Owner Payment / Contribution")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowContribModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Flat Owner")}</label>
                    <select
                      className="form-select"
                      value={contribForm.id_owners}
                      onChange={e => setContribForm({ ...contribForm, id_owners: e.target.value })}
                      required
                    >
                      <option value="">{tr("Select Flat Owner")}</option>
                      {owners.map(o => (
                        <option key={o.id_owners} value={o.id_owners}>{o.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Unit / Flat")}</label>
                    <select
                      className="form-select"
                      value={contribForm.id_units}
                      onChange={e => setContribForm({ ...contribForm, id_units: e.target.value })}
                      required
                    >
                      <option value="">{tr("Select Unit")}</option>
                      {units.map(u => (
                        <option key={u.id_units} value={u.id_units}>{u.unit_number}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Payment Amount (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder={tr("e.g. 15000")}
                      value={contribForm.amount}
                      onChange={e => setContribForm({ ...contribForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Payment Date")}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={contribForm.payment_date}
                      onChange={e => setContribForm({ ...contribForm, payment_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">{tr("Contribution Type")}</label>
                    <select
                      className="form-select"
                      value={contribForm.contribution_type}
                      onChange={e => setContribForm({ ...contribForm, contribution_type: e.target.value })}
                    >
                      <option value="INITIAL_DEPOSIT">{tr("Initial Booking Deposit")}</option>
                      <option value="CONSTRUCTION_INSTALLMENT">{tr("Construction Installment")}</option>
                      <option value="MONTHLY_CONTRIBUTION">{tr("Monthly Contribution")}</option>
                      <option value="SPECIAL_CONTRIBUTION">{tr("Special Contribution")}</option>
                      <option value="LOAN_FUNDED">{tr("Bank Loan Funded Payment")}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Payment Method")}</label>
                    <select
                      className="form-select"
                      value={contribForm.payment_method}
                      onChange={e => setContribForm({ ...contribForm, payment_method: e.target.value })}
                    >
                      <option value="BANK_TRANSFER">{tr("Bank Wire / EFT Transfer")}</option>
                      <option value="CHEQUE">{tr("Bank Cheque")}</option>
                      <option value="CASH">{tr("Cash")}</option>
                      <option value="LOAN">{tr("Direct Bank Loan Disbursement")}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{tr("Cheque # / Transaction Reference")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. CHQ-001290 or EFT-88123")}
                    value={contribForm.reference}
                    onChange={e => setContribForm({ ...contribForm, reference: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowContribModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-success">{tr("Save Contribution & Issue Receipt")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ORDER MODAL */}
      {showChangeModal && selectedBudget && (
        <div className="modal-overlay" onClick={() => setShowChangeModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleApplyChangeOrder}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Apply Change Order")}: {selectedBudget.category}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowChangeModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="p-3 mb-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex-between text-sm">
                    <span className="text-muted">{tr("Current Budget:")}</span>
                    <span className="fw-bold">৳{parseFloat(selectedBudget.revised_budget || selectedBudget.original_budget).toLocaleString()}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label required">{tr("Change Amount (৳ +/-)")}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder={tr("e.g. +5000 or -2000")}
                    value={changeForm.change_amount}
                    onChange={e => setChangeForm({ ...changeForm, change_amount: e.target.value })}
                    required
                  />
                  <div className="form-text">Positive values increase budget; negative values reduce it.</div>
                </div>
                <div className="form-group">
                  <label className="form-label required">{tr("Reason / Committee Resolution")}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder={tr("Explain technical or material justification approved by committee...")}
                    value={changeForm.reason}
                    onChange={e => setChangeForm({ ...changeForm, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowChangeModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Authorize Change Order")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOAN DISBURSEMENT MODAL */}
      {showDisburseModal && selectedLoan && (
        <div className="modal-overlay" onClick={() => setShowDisburseModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleDisbursement}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Record Bank Loan Disbursement Installment")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowDisburseModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="p-3 mb-3 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="text-xs text-muted">{tr("Lender & Owner:")}</div>
                  <div className="fw-bold">{selectedLoan.bank_lender_name} &bull; {selectedLoan.owner_name}</div>
                  <div className="text-xs text-muted mt-1">
                    Approved Limit: ৳${parseFloat(selectedLoan.approved_amount).toLocaleString()} &bull; Disbursed: ৳${parseFloat(selectedLoan.disbursed_amount).toLocaleString()}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label required">{tr("Disbursement Amount (৳)")}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder={tr("e.g. 30000")}
                    value={disburseForm.amount}
                    onChange={e => setDisburseForm({ ...disburseForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">{tr("Disbursement Date")}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={disburseForm.disbursement_date}
                      onChange={e => setDisburseForm({ ...disburseForm, disbursement_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Bank Reference #")}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={tr("e.g. BA-TRF-03")}
                      value={disburseForm.reference_number}
                      onChange={e => setDisburseForm({ ...disburseForm, reference_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowDisburseModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Confirm Disbursement")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
