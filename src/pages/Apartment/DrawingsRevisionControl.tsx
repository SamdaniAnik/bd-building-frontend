import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function DrawingsRevisionControl() {
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Revision Modal
  const [showRevModal, setShowRevModal] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<any | null>(null);
  const [revForm, setRevForm] = useState({
    revision_reason: '',
    uploaded_by: 'Arch. Farhan Rahman',
    file_url: ''
  });

  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/drawings');
      if (res.success) setDrawings(res.data);
    } catch (err) {
      console.error('Error fetching drawings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, []);

  const handleUploadRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrawing) return;
    try {
      const res: any = await api.post('/apartment/drawings/revision', {
        id_drawings: selectedDrawing.id_drawings,
        ...revForm
      });
      if (res.success) {
        alert(res.message);
        setShowRevModal(false);
        setSelectedDrawing(null);
        setRevForm({ revision_reason: '', uploaded_by: 'Arch. Farhan Rahman', file_url: '' });
        fetchDrawings();
      }
    } catch (err: any) {
      alert(err.message || 'Error saving revision');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Apartment System</span>
            <span className="breadcrumb-sep">/</span>
            <span>Technical Documents</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-compass-drafting text-primary"></i> Drawing & Floor Plan Revision Control (Sections 4 & 5)
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          Strict Versioning: Never Overwrite History
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {drawings.map(d => (
          <div key={d.id_drawings} className="card" style={{ borderTop: '4px solid #4f46e5' }}>
            <div className="card-header flex-between">
              <div>
                <span className="badge badge-info">{d.category}</span>
                <span className="unit-badge ml-2" style={{ marginLeft: '8px' }}>{d.drawing_code}</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setSelectedDrawing(d); setShowRevModal(true); }}
              >
                <i className="fa-solid fa-code-fork"></i> Add Revision (Rev 0{d.current_revision + 1})
              </button>
            </div>
            <div className="card-body">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>{d.title}</h3>
              <p className="text-muted text-xs mb-3">
                Current Active Version: <span className="fw-bold text-success">Rev 0{d.current_revision} (Approved)</span>
              </p>

              <div className="section-heading" style={{ fontSize: '0.8rem', marginTop: '12px' }}>
                <i className="fa-solid fa-timeline"></i> Revision Audit Trail
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(d.revisions || []).map((rev: any) => (
                  <div
                    key={rev.id_revisions}
                    style={{
                      background: rev.approval_status === 'APPROVED' ? '#eff6ff' : '#f8fafc',
                      border: rev.approval_status === 'APPROVED' ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px 14px'
                    }}
                  >
                    <div className="flex-between">
                      <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                        <i className={`fa-solid ${rev.approval_status === 'APPROVED' ? 'fa-check-circle text-success' : 'fa-clock-rotate-left text-muted'}`} style={{ marginRight: '6px' }}></i>
                        {rev.revision_code}
                      </div>
                      <span className={`badge ${rev.approval_status === 'APPROVED' ? 'badge-success' : 'badge-gray'}`}>
                        {rev.approval_status}
                      </span>
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#334155' }}>
                      {rev.revision_reason}
                    </div>
                    <div className="flex-between text-xs text-muted mt-2" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                      <span>Uploaded by {rev.uploaded_by} on {rev.upload_date}</span>
                      <a href={rev.file_url} target="_blank" rel="noreferrer" className="text-primary fw-semibold">
                        <i className="fa-solid fa-file-pdf"></i> View Blueprint
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NEW REVISION MODAL */}
      {showRevModal && selectedDrawing && (
        <div className="modal-overlay" onClick={() => setShowRevModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleUploadRevision}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Upload New Revision: {selectedDrawing.drawing_code}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowRevModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="p-3 rounded mb-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div className="text-xs text-muted">Target Blueprint:</div>
                  <div className="fw-bold text-primary">{selectedDrawing.title}</div>
                  <div className="text-xs text-muted mt-1">
                    Previous version (Rev 0{selectedDrawing.current_revision}) will be retained as historical record and superseded.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Architect / Engineer</label>
                  <input
                    type="text"
                    className="form-control"
                    value={revForm.uploaded_by}
                    onChange={e => setRevForm({ ...revForm, uploaded_by: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Revision Reason / Scope Changes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Specify structural or architectural modifications made..."
                    value={revForm.revision_reason}
                    onChange={e => setRevForm({ ...revForm, revision_reason: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Drawing File Reference URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="/drawings/rev03_blueprint.pdf"
                    value={revForm.file_url}
                    onChange={e => setRevForm({ ...revForm, file_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowRevModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Commit New Revision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
