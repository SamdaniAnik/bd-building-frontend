import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function ProcurementVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vendors' | 'invoices'>('vendors');

  // Vendor Ledger Modal
  const [selectedLedger, setSelectedLedger] = useState<any | null>(null);

  // New Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invForm, setInvForm] = useState({
    invoice_number: '',
    id_vendors: '',
    id_works: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_amount: ''
  });

  // New Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    id_invoices: '',
    id_vendors: '',
    amount: '',
    payment_type: 'PARTIAL',
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, iRes, wRes]: any = await Promise.all([
        api.get('/apartment/vendors'),
        api.get('/apartment/vendor-invoices'),
        api.get('/apartment/works')
      ]);
      if (vRes.success) setVendors(vRes.data);
      if (iRes.success) setInvoices(iRes.data);
      if (wRes.success) setWorks(wRes.data);
    } catch (err) {
      console.error('Error fetching procurement:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLedger = async (vendorId: number) => {
    try {
      const res: any = await api.get(`/apartment/vendors/${vendorId}/ledger`);
      if (res.success) setSelectedLedger(res.data);
    } catch (err) {
      console.error('Error fetching vendor ledger:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/vendor-invoices', invForm);
      if (res.success) {
        alert('Vendor invoice recorded');
        setShowInvoiceModal(false);
        setInvForm({ invoice_number: '', id_vendors: '', id_works: '', invoice_date: new Date().toISOString().split('T')[0], due_date: '', total_amount: '' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording invoice');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/vendor-payments', paymentForm);
      if (res.success) {
        alert('Vendor payment registered successfully');
        setShowPaymentModal(false);
        setPaymentForm({ id_invoices: '', id_vendors: '', amount: '', payment_type: 'PARTIAL', payment_method: 'BANK_TRANSFER', reference_number: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error saving payment');
    }
  };

  const openPaymentForInvoice = (inv: any) => {
    setPaymentForm({
      ...paymentForm,
      id_invoices: inv.id_invoices,
      id_vendors: inv.id_vendors,
      amount: String(inv.outstanding_amount || '')
    });
    setShowPaymentModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Apartment System</span>
            <span className="breadcrumb-sep">/</span>
            <span>Procurement</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-truck-ramp-box text-primary"></i> Vendors, Invoices & Vendor Ledgers
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setShowInvoiceModal(true)}>
            <i className="fa-solid fa-file-invoice-dollar"></i> New Vendor Invoice
          </button>
          <button className="btn btn-success" onClick={() => setShowPaymentModal(true)}>
            <i className="fa-solid fa-money-bill-transfer"></i> Record Vendor Payment
          </button>
        </div>
      </div>

      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => setActiveTab('vendors')}>
          <i className="fa-solid fa-handshake" style={{ marginRight: '6px' }}></i> Registered Vendors & Balances ({vendors.length})
        </button>
        <button className={`pill-tab ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
          <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i> Vendor Invoices & Due Payments ({invoices.length})
        </button>
      </div>

      {/* TAB 1: VENDORS LIST & BALANCES */}
      {activeTab === 'vendors' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vendor & Trade</th>
                  <th>Category</th>
                  <th>Contact Person & Phone</th>
                  <th className="text-right">Total Invoiced (৳)</th>
                  <th className="text-right">Total Paid (৳)</th>
                  <th className="text-right">Vendor Payable (৳)</th>
                  <th>Terms</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id_vendors}>
                    <td>
                      <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{v.company_name}</div>
                      <div className="text-muted text-xs">{v.trade || 'Supplier / Contractor'}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{v.category}</span>
                    </td>
                    <td>
                      <div className="fw-semibold">{v.contact_person || '-'}</div>
                      <div className="text-xs text-muted">{v.phone}</div>
                    </td>
                    <td className="text-right fw-semibold">৳{parseFloat(v.total_invoiced || 0).toLocaleString()}</td>
                    <td className="text-right text-success fw-semibold">৳{parseFloat(v.total_paid || 0).toLocaleString()}</td>
                    <td className="text-right fw-bold text-danger">৳{parseFloat(v.outstanding || 0).toLocaleString()}
                    </td>
                    <td><span className="badge badge-gray">{v.payment_terms}</span></td>
                    <td className="text-center">
                      <button className="btn btn-outline btn-sm" onClick={() => openLedger(v.id_vendors)}>
                        <i className="fa-solid fa-book"></i> Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES & PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Vendor</th>
                  <th>Associated Work</th>
                  <th>Date / Due</th>
                  <th className="text-right">Total Amount (৳)</th>
                  <th className="text-right">Paid Amount (৳)</th>
                  <th className="text-right">Outstanding (৳)</th>
                  <th>Status</th>
                  <th className="text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id_invoices}>
                    <td>
                      <div className="fw-bold text-primary">{inv.invoice_number}</div>
                    </td>
                    <td className="fw-semibold">{inv.vendor_name}</td>
                    <td className="text-muted text-sm">{inv.work_name || 'General Project'}</td>
                    <td>
                      <div>{inv.invoice_date}</div>
                      {inv.due_date && <div className="text-xs text-muted">Due: {inv.due_date}</div>}
                    </td>
                    <td className="text-right fw-bold">৳{parseFloat(inv.total_amount).toLocaleString()}</td>
                    <td className="text-right text-success fw-semibold">৳{parseFloat(inv.paid_amount || 0).toLocaleString()}</td>
                    <td className="text-right fw-bold text-danger">৳{parseFloat(inv.outstanding_amount || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'PARTIALLY_PAID' ? 'badge-warning' : 'badge-danger'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-center">
                      {parseFloat(inv.outstanding_amount || 0) > 0 ? (
                        <button className="btn btn-success btn-sm" onClick={() => openPaymentForInvoice(inv)}>
                          <i className="fa-solid fa-hand-holding-dollar"></i> Pay Due
                        </button>
                      ) : (
                        <span className="badge badge-success">Fully Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENDOR LEDGER MODAL (Section 21: Invoice +৳10k, Payment -৳3k -> Outstanding ৳5k) */}
      {selectedLedger && (
        <div className="modal-overlay" onClick={() => setSelectedLedger(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="text-xs text-muted uppercase fw-bold">Official Vendor Financial Statement</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedLedger.vendor?.company_name}</h3>
              </div>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedLedger(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="text-xs text-muted">Total Invoiced:</div>
                  <div className="fw-bold" style={{ fontSize: '1.1rem' }}>৳{selectedLedger.total_invoiced?.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="text-xs text-muted">Total Paid:</div>
                  <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>৳{selectedLedger.total_paid?.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div className="text-xs text-muted">Total Outstanding Due:</div>
                  <div className="fw-bold text-danger" style={{ fontSize: '1.1rem' }}>৳{selectedLedger.outstanding?.toLocaleString()}</div>
                </div>
              </div>

              <div className="section-heading">
                <i className="fa-solid fa-timeline"></i> Chronological Invoices & Payments Ledger
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entry Type</th>
                      <th>Reference / Details</th>
                      <th className="text-right">Invoiced / Billed (৳)</th>
                      <th className="text-right">Paid to Vendor (৳)</th>
                      <th className="text-right">Net Due Balance (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedLedger.ledger || []).map((e: any, idx: number) => (
                      <tr key={idx}>
                        <td>{e.date}</td>
                        <td>
                          <span className={`badge ${e.type === 'INVOICE' ? 'badge-primary' : 'badge-success'}`}>
                            {e.type}
                          </span>
                        </td>
                        <td className="fw-semibold">{e.desc}</td>
                        <td className="text-right text-primary fw-semibold">
                          {e.debit > 0 ? `+$${e.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right text-success fw-semibold">
                          {e.credit > 0 ? `-$${e.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right fw-bold text-danger">৳{e.balance?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer flex-between">
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Print Vendor Statement
              </button>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedLedger(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateInvoice}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Create Vendor Invoice</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowInvoiceModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">Invoice Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. INV-2026-003"
                      value={invForm.invoice_number}
                      onChange={e => setInvForm({ ...invForm, invoice_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Vendor</label>
                    <select
                      className="form-select"
                      value={invForm.id_vendors}
                      onChange={e => setInvForm({ ...invForm, id_vendors: e.target.value })}
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(v => (
                        <option key={v.id_vendors} value={v.id_vendors}>{v.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">Total Invoice Amount (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 25000"
                      value={invForm.total_amount}
                      onChange={e => setInvForm({ ...invForm, total_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Associated Work</label>
                    <select
                      className="form-select"
                      value={invForm.id_works}
                      onChange={e => setInvForm({ ...invForm, id_works: e.target.value })}
                    >
                      <option value="">Select Work (Optional)</option>
                      {works.map(w => (
                        <option key={w.id_works} value={w.id_works}>{w.work_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Invoice Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={invForm.invoice_date}
                      onChange={e => setInvForm({ ...invForm, invoice_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={invForm.due_date}
                      onChange={e => setInvForm({ ...invForm, due_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD VENDOR PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreatePayment}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Record Payment to Vendor</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowPaymentModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">Vendor</label>
                    <select
                      className="form-select"
                      value={paymentForm.id_vendors}
                      onChange={e => setPaymentForm({ ...paymentForm, id_vendors: e.target.value })}
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(v => (
                        <option key={v.id_vendors} value={v.id_vendors}>{v.company_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Payment Amount (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 10000"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Payment Milestone Type</label>
                    <select
                      className="form-select"
                      value={paymentForm.payment_type}
                      onChange={e => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                    >
                      <option value="ADVANCE">Advance Payment</option>
                      <option value="PARTIAL">Partial Payment</option>
                      <option value="MILESTONE">Milestone Progress Payment</option>
                      <option value="FINAL">Final Handover Settlement</option>
                      <option value="RETENTION">Retention Money Release</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentForm.payment_method}
                      onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <option value="BANK_TRANSFER">Bank Wire / EFT Transfer</option>
                      <option value="CHEQUE">Bank Cheque</option>
                      <option value="CASH">Site Cash</option>
                      <option value="ONLINE">RTGS / Online Transfer</option>
                    </select>
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Cheque / EFT Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. EFT-992144"
                      value={paymentForm.reference_number}
                      onChange={e => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={paymentForm.payment_date}
                      onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Confirm Vendor Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
