import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function SiteManagerMobile() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [pettyExpenses, setPettyExpenses] = useState<any[]>([]);
  const [labour, setLabour] = useState<{ workers: any[]; attendance: any[] }>({ workers: [], attendance: [] });
  const [inventory, setInventory] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'petty' | 'labour' | 'stock' | 'matching' | 'photos'>('petty');

  // New Petty Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'TRANSPORTATION',
    amount: '',
    payee: '',
    description: '',
    receipt_number: ''
  });

  // New Attendance Modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attForm, setAttForm] = useState({
    id_workers: '',
    hours_worked: '8',
    overtime_hours: '0',
    work_performed: ''
  });

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      const [pRes, lRes, iRes, phRes]: any = await Promise.all([
        api.get('/apartment/site-expenses'),
        api.get('/apartment/labour'),
        api.get('/apartment/inventory'),
        api.get('/apartment/site-photos')
      ]);
      if (pRes.success) setPettyExpenses(pRes.data);
      if (lRes.success) setLabour(lRes.data);
      if (iRes.success) {
        setInventory(iRes.data.inventory || []);
        setDeliveries(iRes.data.deliveries || []);
        setReorderAlerts(iRes.data.reorder_alerts || []);
      }
      if (phRes.success) setPhotos(phRes.data);
    } catch (err) {
      console.error('Error fetching site data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteData();
  }, []);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/site-expenses', expenseForm);
      if (res.success) {
        alert('Site expense logged');
        setShowExpenseModal(false);
        setExpenseForm({ category: 'TRANSPORTATION', amount: '', payee: '', description: '', receipt_number: '' });
        fetchSiteData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    }
  };

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/labour/attendance', attForm);
      if (res.success) {
        alert(res.message);
        setShowAttendanceModal(false);
        fetchSiteData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording attendance');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Site Operations")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-mobile-screen-button text-primary"></i> {tr("Site Management & Inventory (Sections 10–16 & 36–38)")}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpenseModal(true)}>
            <i className="fa-solid fa-receipt"></i> {tr("Log Site Expense")}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAttendanceModal(true)}>
            <i className="fa-solid fa-user-clock"></i> {tr("Labour Attendance")}
          </button>
        </div>
      </div>

      {/* SECTION 14: REORDER ALERTS BANNER */}
      {reorderAlerts.length > 0 && (
        <div className="alert alert-warning mb-4">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.4rem' }}></i>
          <div>
            <div className="fw-bold">
              {tr("⚠ Material Minimum Stock Reorder Alert (Section 14)")}
            </div>
            <p className="text-sm mt-1">
              {reorderAlerts.map(r => (
                <span key={r.id_inventory}>
                  <strong>{r.material_name}</strong>{tr(": Current stock is")} <strong>{r.current_stock} {r.unit}</strong> ({tr("Minimum safe threshold")}: {r.minimum_reorder_stock} {r.unit}). Please initiate Purchase Order. &nbsp;
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'petty' ? 'active' : ''}`} onClick={() => setActiveTab('petty')}>
          <i className="fa-solid fa-wallet" style={{ marginRight: '6px' }}></i> {tr("Site Petty Cash")} ({pettyExpenses.length})
        </button>
        <button className={`pill-tab ${activeTab === 'labour' ? 'active' : ''}`} onClick={() => setActiveTab('labour')}>
          <i className="fa-solid fa-person-digging" style={{ marginRight: '6px' }}></i> {tr("Labour & Attendance")} ({labour.attendance.length})
        </button>
        <button className={`pill-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          <i className="fa-solid fa-boxes-packing" style={{ marginRight: '6px' }}></i> {tr("Site Stock / Inventory")} ({inventory.length})
        </button>
        <button className={`pill-tab ${activeTab === 'matching' ? 'active' : ''}`} onClick={() => setActiveTab('matching')}>
          <i className="fa-solid fa-scale-balanced" style={{ marginRight: '6px' }}></i> {tr("3-Way Matching")} ({deliveries.length})
        </button>
        <button className={`pill-tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
          <i className="fa-solid fa-camera" style={{ marginRight: '6px' }}></i> {tr("Photo Timeline & GPS")} ({photos.length})
        </button>
      </div>

      {/* TAB 1: PETTY EXPENSES */}
      {activeTab === 'petty' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Receipt #")}</th>
                  <th>{tr("Category")}</th>
                  <th>{tr("Payee / Purpose")}</th>
                  <th>{tr("Date")}</th>
                  <th>{tr("Supervisor")}</th>
                  <th className="text-right">{tr("Amount (৳)")}</th>
                </tr>
              </thead>
              <tbody>
                {pettyExpenses.map(p => (
                  <tr key={p.id_site_expenses}>
                    <td className="fw-bold text-primary">{p.receipt_number}</td>
                    <td><span className="badge badge-info">{p.category?.replace('_', ' ')}</span></td>
                    <td>
                      <div className="fw-semibold">{p.payee}</div>
                      <div className="text-xs text-muted">{p.description}</div>
                    </td>
                    <td>{p.expense_date}</td>
                    <td className="text-muted text-sm">{p.entered_by}</td>
                    <td className="text-right fw-bold text-danger">৳{parseFloat(p.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>{tr("Total Site Petty Cash Spent")}</td>
                  <td className="text-right fw-bold text-danger">৳{pettyExpenses.reduce((s, p) => s + parseFloat(p.amount || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LABOUR ATTENDANCE */}
      {activeTab === 'labour' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Worker Name")}</th>
                  <th>{tr("Trade / Category")}</th>
                  <th>{tr("Date")}</th>
                  <th>{tr("Hours (Reg + OT)")}</th>
                  <th>{tr("Work Performed")}</th>
                  <th className="text-right">{tr("Daily Earned Pay (৳)")}</th>
                </tr>
              </thead>
              <tbody>
                {labour.attendance.map((a: any) => (
                  <tr key={a.id_attendance}>
                    <td className="fw-bold">{a.worker_name}</td>
                    <td><span className="badge badge-primary">{a.worker_type}</span></td>
                    <td>{a.attendance_date}</td>
                    <td>{a.hours_worked} {tr("hrs")} {parseFloat(a.overtime_hours) > 0 ? `(+${a.overtime_hours} OT)` : ''}</td>
                    <td className="text-muted text-sm">{a.work_performed}</td>
                    <td className="text-right fw-bold text-success">৳{parseFloat(a.calculated_pay).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SITE INVENTORY */}
      {activeTab === 'stock' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Material")}</th>
                  <th>{tr("Category")}</th>
                  <th className="text-right">{tr("Opening Stock")}</th>
                  <th className="text-right">{tr("Purchased")}</th>
                  <th className="text-right">{tr("Consumed")}</th>
                  <th className="text-right">{tr("Current Balance")}</th>
                  <th>{tr("Min Reorder Limit")}</th>
                  <th>{tr("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(inv => {
                  const isLow = parseFloat(inv.current_stock) <= parseFloat(inv.minimum_reorder_stock);
                  return (
                    <tr key={inv.id_inventory}>
                      <td className="fw-bold">{inv.material_name}</td>
                      <td><span className="badge badge-info">{inv.material_category}</span></td>
                      <td className="text-right text-muted">{inv.opening_stock} {inv.unit}</td>
                      <td className="text-right text-success fw-semibold">+{inv.purchased_qty}</td>
                      <td className="text-right text-danger fw-semibold">-{inv.used_qty}</td>
                      <td className="text-right fw-bold" style={{ fontSize: '1rem', color: isLow ? '#dc2626' : '#1e1b4b' }}>
                        {inv.current_stock} {inv.unit}
                      </td>
                      <td>{inv.minimum_reorder_stock} {inv.unit}</td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                          {isLow ? '⚠ REORDER REQUIRED' : 'Sufficient Stock'}
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

      {/* TAB 4: 3-WAY MATCHING (PO vs Received vs Invoice) */}
      {activeTab === 'matching' && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-code-compare text-primary"></i> {tr("3-Way Matching: Purchase Order vs Goods Received vs Invoice (Section 16)")}
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Delivery Challan #")}</th>
                  <th>{tr("Supplier / Vendor")}</th>
                  <th>{tr("Material Item")}</th>
                  <th className="text-right">{tr("PO Ordered")}</th>
                  <th className="text-right">{tr("Received")}</th>
                  <th className="text-right">{tr("Damaged")}</th>
                  <th className="text-right">{tr("Accepted Net")}</th>
                  <th>{tr("3-Way Match Verification")}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id_deliveries}>
                    <td className="fw-bold text-primary">{d.delivery_challan_no}</td>
                    <td className="fw-semibold">{d.vendor_name}</td>
                    <td>{d.material_item}</td>
                    <td className="text-right">{d.po_ordered_qty}</td>
                    <td className="text-right">{d.received_qty}</td>
                    <td className="text-right text-danger">{d.damaged_qty}</td>
                    <td className="text-right fw-bold text-success">{d.accepted_qty}</td>
                    <td>
                      <div>
                        <span className={`badge ${d.is_three_way_matched ? 'badge-success' : 'badge-danger'}`}>
                          {d.is_three_way_matched ? '✓ Perfectly Matched' : '⚠ Quantity Discrepancy Flagged'}
                        </span>
                        <div className="text-xs text-muted mt-1">{d.matching_notes}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PHOTO TIMELINE & GPS (Sections 37 & 38) */}
      {activeTab === 'photos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {photos.map(p => (
            <div key={p.id_photos} className="card">
              <img
                src={p.photo_url}
                alt={p.title}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <div className="flex-between mb-1">
                  <span className="badge badge-primary">{p.stage_tag}</span>
                  <span className="text-xs text-muted">{p.photo_date}</span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px' }}>{p.title}</h4>
                <p className="text-xs text-muted mt-1">{p.notes}</p>
                <div className="mt-2 text-xs text-muted" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <i className="fa-solid fa-location-crosshairs text-danger" style={{ marginRight: '4px' }}></i>
                  GPS: {p.gps_coordinates} &bull; Taken by {p.taken_by}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORD SITE EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleRecordExpense}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Record Site Petty Cash Expense")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowExpenseModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">{tr("Expense Category")}</label>
                  <select
                    className="form-select"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="TRANSPORTATION">{tr("Transportation & Pickup")}</option>
                    <option value="LABOUR_FOOD">{tr("Labour Overtime Food & Tea")}</option>
                    <option value="SMALL_TOOLS">{tr("Small Tools & Safety Gear")}</option>
                    <option value="EMERGENCY_MATERIALS">{tr("Emergency Material Purchase")}</option>
                    <option value="TEMPORARY_WATER">{tr("Temporary Water Tanker")}</option>
                    <option value="TEMPORARY_ELECTRICITY">{tr("Temporary Generator Fuel")}</option>
                  </select>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Amount (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Payee / Vendor")}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={expenseForm.payee}
                      onChange={e => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{tr("Scope Description")}</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowExpenseModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save Expense")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LABOUR ATTENDANCE MODAL */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleRecordAttendance}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Log Daily Worker Attendance")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowAttendanceModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">{tr("Worker")}</label>
                  <select
                    className="form-select"
                    value={attForm.id_workers}
                    onChange={e => setAttForm({ ...attForm, id_workers: e.target.value })}
                    required
                  >
                    <option value="">{tr("Select Worker")}</option>
                    {labour.workers.map((w: any) => (
                      <option key={w.id_workers} value={w.id_workers}>{w.worker_name} ({w.worker_type} - ${w.daily_rate}/day)</option>
                    ))}
                  </select>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Regular Hours")}</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={attForm.hours_worked}
                      onChange={e => setAttForm({ ...attForm, hours_worked: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Overtime Hours")}</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={attForm.overtime_hours}
                      onChange={e => setAttForm({ ...attForm, overtime_hours: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{tr("Task / Work Performed")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. 4th floor column shuttering")}
                    value={attForm.work_performed}
                    onChange={e => setAttForm({ ...attForm, work_performed: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowAttendanceModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save Attendance")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
