import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function AuditApprovals() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [approvals, setApprovals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approvals' | 'audit'>('approvals');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, audRes]: any = await Promise.all([
        api.get('/apartment/approvals'),
        api.get('/apartment/audit-logs')
      ]);
      if (appRes.success) setApprovals(appRes.data);
      if (audRes.success) setAuditLogs(audRes.data);
    } catch (err) {
      console.error('Error fetching audit/approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res: any = await api.post(`/apartment/approvals/${id}/decide`, { status, comments: `Decision marked as ${status}` });
      if (res.success) {
        alert(`Approval request ${status.toLowerCase()}`);
        fetchData();
      }
    } catch (err) {
      console.error('Error updating approval:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Governance & Security")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-shield-halved text-primary"></i> {tr("Multi-Tier Approvals & Audit Trail")}
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          {tr("Section 36 & 38 Compliance")}
        </span>
      </div>

      {/* SECTION 36: APPROVAL LIMITS INFO */}
      <div className="card mb-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="text-xs text-muted uppercase fw-bold mb-2">{tr("Configured Financial Approval Tiers:")}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div className="p-2 bg-white rounded border">
              <div className="text-xs text-muted">Tier 1 (&lt; ৳1,000):</div>
              <div className="fw-bold text-primary">{tr("Project Manager Solo")}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-xs text-muted">{tr("Tier 2 (৳1,000 – ৳10,000):")}</div>
              <div className="fw-bold" style={{ color: '#d97706' }}>{tr("Project Manager + Accountant")}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-xs text-muted">Tier 3 (&gt; ৳10,000):</div>
              <div className="fw-bold text-danger">{tr("Building Committee Resolution")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          <i className="fa-solid fa-stamp" style={{ marginRight: '6px' }}></i> {tr("Financial Approvals Inbox")} ({approvals.length})
        </button>
        <button className={`pill-tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '6px' }}></i> {tr("Full System Audit Logs")} ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Action Request")}</th>
                  <th className="text-right">{tr("Transaction Amount (৳)")}</th>
                  <th>{tr("Required Governance Tier")}</th>
                  <th>{tr("Requested By")}</th>
                  <th>{tr("Approved By / Status")}</th>
                  <th>{tr("Decision Comments")}</th>
                  <th className="text-center">{tr("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(app => (
                  <tr key={app.id_approvals}>
                    <td className="fw-bold">{app.action_type}</td>
                    <td className="text-right fw-bold text-primary">৳{parseFloat(app.amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${app.tier === 'COMMITTEE' ? 'badge-danger' : app.tier === 'MANAGER_AND_ACCOUNTANT' ? 'badge-warning' : 'badge-primary'}`}>
                        {app.tier}
                      </span>
                    </td>
                    <td>{app.requested_by}</td>
                    <td>
                      <div>
                        <span className={`badge ${app.status === 'APPROVED' ? 'badge-success' : app.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                          {app.status}
                        </span>
                        {app.approved_by && <div className="text-xs text-muted mt-1">{app.approved_by}</div>}
                      </div>
                    </td>
                    <td className="text-muted text-sm">{app.comments || '-'}</td>
                    <td className="text-center">
                      {app.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleDecision(app.id_approvals, 'APPROVED')}>
                            {tr("Approve")}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDecision(app.id_approvals, 'REJECTED')}>
                            {tr("Reject")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">{tr("Finalized")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="card mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Timestamp")}</th>
                  <th>{tr("Authorized User")}</th>
                  <th>{tr("Action Performed")}</th>
                  <th>{tr("Entity")}</th>
                  <th>{tr("Previous State")}</th>
                  <th>{tr("New State / Change")}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id_audit}>
                    <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="fw-bold text-primary">{log.user_name}</td>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td><span className="unit-badge text-xs">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</span></td>
                    <td className="text-muted text-xs">{log.old_value || 'None'}</td>
                    <td className="fw-semibold text-xs text-success">{log.new_value}</td>
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
