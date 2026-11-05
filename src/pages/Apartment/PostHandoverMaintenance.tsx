import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';
import { fmtDate } from '../../utils/bd';

export default function PostHandoverMaintenance() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Ticket Modal
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'LIFT',
    priority: 'MEDIUM',
    description: '',
    id_units: '1'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/post-handover');
      if (res.success) setData(res.data);
    } catch (err) {
      console.error('Error fetching post-handover:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLodgeTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/post-handover/tickets', ticketForm);
      if (res.success) {
        alert('Ticket lodged successfully');
        setShowTicketModal(false);
        setTicketForm({ title: '', category: 'LIFT', priority: 'MEDIUM', description: '', id_units: '1' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating ticket');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Facility Management")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-wrench text-primary"></i> {tr("Post-Handover Facilities & Warranty Management (Sections 31–35)")}
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTicketModal(true)}>
          <i className="fa-solid fa-plus-circle"></i> {tr("Lodge Maintenance Ticket")}
        </button>
      </div>

      {/* MAINTENANCE FUND KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ '--kpi-color': '#059669' } as any}>
          <div className="kpi-title">
            <span>{tr("Building Maintenance Reserve Fund")}</span>
            <i className="fa-solid fa-vault text-success"></i>
          </div>
          <div className="kpi-value text-success">৳{data?.maintenance_fund_balance?.toLocaleString()}</div>
          <div className="kpi-subtitle">{tr("Collected Service Charges Sinking Fund")}</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': '#4f46e5' } as any}>
          <div className="kpi-title">
            <span>{tr("Monthly Service Charge / Flat")}</span>
            <i className="fa-solid fa-receipt text-primary"></i>
          </div>
          <div className="kpi-value text-primary">৳150 <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{tr("/ month")}</span></div>
          <div className="kpi-subtitle">{tr("Security, Cleaning, Lift AMC & Power")}</div>
        </div>
      </div>

      {/* SECTION 34: COMPLAINT & TICKET SYSTEM */}
      <div className="card mb-4">
        <div className="card-header flex-between">
          <div className="card-title">
            <i className="fa-solid fa-ticket text-primary"></i> {tr("Maintenance Ticket Tracking (Section 34: Open → Assigned → Resolved → Closed)")}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{tr("Issue / Ticket Title")}</th>
                <th>{tr("Category")}</th>
                <th>{tr("Unit / Owner")}</th>
                <th>{tr("Priority")}</th>
                <th>{tr("Assigned Contractor")}</th>
                <th>{tr("Status")}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.tickets || []).map((t: any) => (
                <tr key={t.id_tickets}>
                  <td>
                    <div className="fw-bold">{t.title}</div>
                    <div className="text-xs text-muted">{t.description}</div>
                  </td>
                  <td><span className="badge badge-info">{t.category}</span></td>
                  <td><span className="unit-badge">{t.unit_number || 'Common'}</span></td>
                  <td>
                    <span className={`badge ${t.priority === 'HIGH' || t.priority === 'EMERGENCY' ? 'badge-danger' : 'badge-warning'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{t.assigned_contractor || 'General Maintenance'}</td>
                  <td>
                    <span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : 'badge-primary'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 35: ASSET WARRANTIES & EXPIRATION TRACKING */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-shield-halved text-success"></i> {tr("Equipment & Structural Warranties (Section 35)")}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{tr("Asset / Equipment")}</th>
                <th>{tr("Vendor / Manufacturer")}</th>
                <th>{tr("Start Date")}</th>
                <th>{tr("Warranty Expiration")}</th>
                <th>{tr("Coverage Scope")}</th>
                <th>{tr("Emergency Support Hotline")}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.warranties || []).map((w: any) => (
                <tr key={w.id_warranties}>
                  <td className="fw-bold">{w.asset_name}</td>
                  <td className="fw-semibold text-primary">{w.vendor_name}</td>
                  <td>{fmtDate(w.start_date)}</td>
                  <td className="fw-bold text-success">{fmtDate(w.expiration_date)}</td>
                  <td className="text-xs text-muted">{w.coverage_terms}</td>
                  <td className="fw-semibold">{w.contact_hotline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LODGE TICKET MODAL */}
      {showTicketModal && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleLodgeTicket}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Lodge Maintenance Request")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowTicketModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">{tr("Problem Title")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. Lift 1 leveling sensor alarm")}
                    value={ticketForm.title}
                    onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Category")}</label>
                    <select
                      className="form-select"
                      value={ticketForm.category}
                      onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                    >
                      <option value="LIFT">{tr("Elevator / Lift")}</option>
                      <option value="GENERATOR">{tr("Standby Generator")}</option>
                      <option value="WATER_LEAKAGE">{tr("Water Leakage / Plumbing")}</option>
                      <option value="ELECTRICAL">{tr("Common Electrical")}</option>
                      <option value="SECURITY">{tr("Security / CCTV")}</option>
                      <option value="CLEANING">{tr("Cleaning & Janitorial")}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Priority")}</label>
                    <select
                      className="form-select"
                      value={ticketForm.priority}
                      onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    >
                      <option value="LOW">{tr("Low")}</option>
                      <option value="MEDIUM">{tr("Medium")}</option>
                      <option value="HIGH">{tr("High")}</option>
                      <option value="EMERGENCY">{tr("Emergency")}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label required">{tr("Detailed Problem Description")}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={ticketForm.description}
                    onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowTicketModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Lodge Request")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
