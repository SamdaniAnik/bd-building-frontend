import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';
import { todayISO } from '../../utils/bd';

export default function WorksManagement() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [works, setWorks] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMBINED' | 'INDIVIDUAL' | 'EXTRA_WORK'>('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    work_name: '',
    work_category: 'Structural',
    work_type: 'COMBINED',
    description: '',
    estimated_cost: '',
    actual_cost: '',
    start_date: todayISO(),
    expected_completion: '',
    status: 'IN_PROGRESS',
    id_vendors: '',
    id_units: '',
    id_owners: '',
    cost_allocation_method: 'AREA_BASED',
  });

  // Allocation Preview State
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [wRes, uRes, vRes, oRes]: any = await Promise.all([
        api.get('/apartment/works'),
        api.get('/apartment/units'),
        api.get('/apartment/vendors'),
        api.get('/apartment/owners'),
      ]);
      if (wRes.success) setWorks(wRes.data);
      if (uRes.success) setUnits(uRes.data);
      if (vRes.success) setVendors(vRes.data);
      if (oRes.success) setOwners(oRes.data);
    } catch (err) {
      console.error('Error fetching works:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Handle allocation preview calculation
  const handlePreviewAllocation = async () => {
    if (!formData.actual_cost && !formData.estimated_cost) {
      alert('Please enter an estimated or actual cost to preview allocation.');
      return;
    }
    try {
      setPreviewLoading(true);
      const res: any = await api.post('/apartment/preview-allocation', {
        amount: formData.actual_cost || formData.estimated_cost,
        method: formData.cost_allocation_method
      });
      if (res.success) {
        setPreviewData(res.data);
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.work_name) return alert('Work name is required');
    try {
      setSubmitting(true);
      const res: any = await api.post('/apartment/works', {
        ...formData,
        actual_cost: formData.actual_cost || formData.estimated_cost
      });
      if (res.success) {
        alert(res.message || 'Work created successfully!');
        setShowCreateModal(false);
        setPreviewData(null);
        setFormData({
          work_name: '',
          work_category: 'Structural',
          work_type: 'COMBINED',
          description: '',
          estimated_cost: '',
          actual_cost: '',
          start_date: todayISO(),
          expected_completion: '',
          status: 'IN_PROGRESS',
          id_vendors: '',
          id_units: '',
          id_owners: '',
          cost_allocation_method: 'AREA_BASED',
        });
        fetchAll();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create work');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExtraWorkStatus = async (workId: number, nextStatus: string) => {
    try {
      const res: any = await api.patch(`/apartment/works/${workId}/extra-work-status`, { status: nextStatus });
      if (res.success) {
        fetchAll();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredWorks = works.filter(w => {
    if (activeFilter === 'ALL') return true;
    return w.work_type === activeFilter;
  });

  const extraWorkSteps = ['REQUESTED', 'QUOTATION', 'OWNER_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Construction")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-trowel-bricks text-primary"></i> {tr("Construction Works & Cost Allocation Engine")}
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <i className="fa-solid fa-plus-circle"></i> {tr("Create New Work & Cost Allocation")}
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="pill-tabs">
        <button className={`pill-tab ${activeFilter === 'ALL' ? 'active' : ''}`} onClick={() => setActiveFilter('ALL')}>
          {tr("All Works")} ({works.length})
        </button>
        <button className={`pill-tab ${activeFilter === 'COMBINED' ? 'active' : ''}`} onClick={() => setActiveFilter('COMBINED')}>
          <i className="fa-solid fa-users-gear" style={{ marginRight: '6px' }}></i>
          {tr("Combined / Common Works")} ({works.filter(w => w.work_type === 'COMBINED').length})
        </button>
        <button className={`pill-tab ${activeFilter === 'INDIVIDUAL' ? 'active' : ''}`} onClick={() => setActiveFilter('INDIVIDUAL')}>
          <i className="fa-solid fa-door-open" style={{ marginRight: '6px' }}></i>
          {tr("Individual Flat Works")} ({works.filter(w => w.work_type === 'INDIVIDUAL').length})
        </button>
        <button className={`pill-tab ${activeFilter === 'EXTRA_WORK' ? 'active' : ''}`} onClick={() => setActiveFilter('EXTRA_WORK')}>
          <i className="fa-solid fa-wrench" style={{ marginRight: '6px' }}></i>
          {tr("Owner Extra Works")} ({works.filter(w => w.work_type === 'EXTRA_WORK').length})
        </button>
      </div>

      {/* WORKS LIST */}
      <div className="card mb-4">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{tr("Work Details")}</th>
                <th>{tr("Type")}</th>
                <th>{tr("Contractor / Vendor")}</th>
                <th className="text-right">{tr("Cost (৳)")}</th>
                <th>{tr("Allocation / Target")}</th>
                <th>{tr("Progress")}</th>
                <th>{tr("Workflow Status")}</th>
                <th className="text-center">{tr("Allocations")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map(w => {
                const isExtra = w.work_type === 'EXTRA_WORK' || w.extra_work_status !== 'NOT_APPLICABLE';
                return (
                  <tr key={w.id_works}>
                    <td>
                      <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{w.work_name}</div>
                      <div className="text-muted text-xs">{w.work_category} &bull; {w.description?.slice(0, 75)}...</div>
                    </td>
                    <td>
                      <span className={`tag-badge ${w.work_type === 'COMBINED' ? 'tag-combined' : w.work_type === 'INDIVIDUAL' ? 'tag-individual' : 'tag-extra'}`}>
                        {w.work_type}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm fw-semibold">{w.vendor_name || 'In-House'}</span>
                    </td>
                    <td className="text-right">
                      <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>৳{parseFloat(w.actual_cost || w.estimated_cost).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      {w.work_type === 'COMBINED' ? (
                        <div>
                          <span className="badge badge-info">{w.cost_allocation_method}</span>
                          <div className="text-xs text-muted mt-1">{tr("Split across 6 units")}</div>
                        </div>
                      ) : (
                        <div>
                          <span className="unit-badge">{w.unit_number || 'Unit A'}</span>
                          <div className="text-xs text-muted mt-1">{w.owner_name || 'Unit Owner'} only</div>
                        </div>
                      )}
                    </td>
                    <td style={{ minWidth: '120px' }}>
                      <div className="flex-between text-xs text-muted mb-1">
                        <span>{tr("Progress")}</span>
                        <span>{w.progress_percentage}%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar success" style={{ width: `${w.progress_percentage}%` }}></div>
                      </div>
                    </td>
                    <td>
                      {isExtra ? (
                        <div>
                          <span className="badge badge-warning">{w.extra_work_status}</span>
                          <div className="text-xs text-muted mt-1">{tr("8-Step Workflow")}</div>
                        </div>
                      ) : (
                        <span className={`badge ${w.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                          {w.status}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-gray">
                        {(w.allocations || []).length} {tr("Units Allocated")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 12: OWNER-REQUESTED EXTRA WORK WORKFLOW TRACKER */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-arrows-split-up-and-left text-warning"></i>
            {tr("Owner-Requested Extra Work Workflow (Section 12: 8 Steps from Request to Payment)")}
          </div>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted mb-3">
            {tr("Individual owner modifications (e.g. Premium kitchen cabinets, Italian marble, additional power outlets) follow an isolated 8-step lifecycle and strictly charge only the requesting owner.")}
          </p>
          <div className="stepper-container">
            {extraWorkSteps.map((step, idx) => (
              <div key={step} className={`step-item ${idx <= 4 ? 'active' : ''}`}>
                <div className="step-node">{idx + 1}</div>
                <div className="step-label">{step.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE WORK & ALLOCATION PREVIEW MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateWork}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{tr("Create Construction Work & Cost Allocation")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowCreateModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Work Name")}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={tr("e.g. Ground Floor RCC Beams & Slabs")}
                      value={formData.work_name}
                      onChange={e => setFormData({ ...formData, work_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Work Type")}</label>
                    <select
                      className="form-select"
                      value={formData.work_type}
                      onChange={e => setFormData({ ...formData, work_type: e.target.value })}
                    >
                      <option value="COMBINED">{tr("COMBINED (Shared Common Facility)")}</option>
                      <option value="INDIVIDUAL">{tr("INDIVIDUAL (Belongs only to 1 Flat)")}</option>
                      <option value="EXTRA_WORK">{tr("OWNER EXTRA WORK (Owner-Requested Upgrade)")}</option>
                    </select>
                  </div>
                </div>

                <div className="form-row cols-3">
                  <div className="form-group">
                    <label className="form-label">{tr("Category")}</label>
                    <select
                      className="form-select"
                      value={formData.work_category}
                      onChange={e => setFormData({ ...formData, work_category: e.target.value })}
                    >
                      <option value="Structural">{tr("Structural (Civil/RCC)")}</option>
                      <option value="Facilities & MEP">{tr("Facilities & MEP (Lift/Generator)")}</option>
                      <option value="Finishing">{tr("Finishing (Tiles/Paint)")}</option>
                      <option value="Electrical">{tr("Electrical")}</option>
                      <option value="Plumbing">{tr("Plumbing & Sanitary")}</option>
                      <option value="Individual Interior">{tr("Individual Interior")}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Total Work Cost (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder={tr("e.g. 50000")}
                      value={formData.actual_cost}
                      onChange={e => setFormData({ ...formData, actual_cost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Contractor / Vendor")}</label>
                    <select
                      className="form-select"
                      value={formData.id_vendors}
                      onChange={e => setFormData({ ...formData, id_vendors: e.target.value })}
                    >
                      <option value="">{tr("Select Vendor (Optional)")}</option>
                      {vendors.map(v => (
                        <option key={v.id_vendors} value={v.id_vendors}>{v.company_name} ({v.category})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Unit Selection for Individual or Extra Work */}
                {(formData.work_type === 'INDIVIDUAL' || formData.work_type === 'EXTRA_WORK') && (
                  <div className="form-row cols-2" style={{ background: '#fef3c7', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div className="form-group mb-0">
                      <label className="form-label required">{tr("Select Target Flat Unit")}</label>
                      <select
                        className="form-select"
                        value={formData.id_units}
                        onChange={e => setFormData({ ...formData, id_units: e.target.value })}
                        required
                      >
                        <option value="">{tr("Choose Unit (A–F)")}</option>
                        {units.map(u => (
                          <option key={u.id_units} value={u.id_units}>{u.unit_number} ({u.area_sqft} SFT)</option>
                        ))}
                      </select>
                      <div className="form-text text-muted">{tr("Cost will be charged 100% to this unit. Zero impact on other owners.")}</div>
                    </div>
                    <div className="form-group mb-0">
                      <label className="form-label">{tr("Select Flat Owner")}</label>
                      <select
                        className="form-select"
                        value={formData.id_owners}
                        onChange={e => setFormData({ ...formData, id_owners: e.target.value })}
                      >
                        <option value="">{tr("Choose Owner")}</option>
                        {owners.map(o => (
                          <option key={o.id_owners} value={o.id_owners}>{o.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Combined Work Allocation Method Selection & Live Preview */}
                {formData.work_type === 'COMBINED' && (
                  <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div className="flex-between mb-2">
                      <label className="form-label fw-bold mb-0">
                        <i className="fa-solid fa-calculator text-primary"></i> {tr("Combined Cost Allocation Method (Section 10)")}
                      </label>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handlePreviewAllocation}
                        disabled={previewLoading}
                      >
                        <i className="fa-solid fa-eye"></i> {tr("Calculate & Preview Allocation")}
                      </button>
                    </div>
                    <div className="form-row cols-2">
                      <div>
                        <select
                          className="form-select"
                          value={formData.cost_allocation_method}
                          onChange={e => setFormData({ ...formData, cost_allocation_method: e.target.value })}
                        >
                          <option value="AREA_BASED">{tr("Area-based (Unit Area / Total Area × Combined Cost)")}</option>
                          <option value="EQUAL">{tr("Equal Allocation (Total Cost / Number of Units)")}</option>
                          <option value="PERCENTAGE">{tr("Percentage Allocation")}</option>
                          <option value="CUSTOM">{tr("Custom Manual Allocation")}</option>
                        </select>
                      </div>
                      <div className="text-xs text-muted flex-center">
                        {tr("Total allocation must always equal exactly 100% of the original expense.")}
                      </div>
                    </div>

                    {/* Preview Table Display */}
                    {previewData && (
                      <div className="mt-3">
                        <div className="flex-between mb-2">
                          <span className="text-xs text-muted uppercase fw-bold">{tr("Live Allocation Breakdown Preview:")}</span>
                          <span className={`badge ${previewData.is_balanced ? 'badge-success' : 'badge-danger'}`}>
                            {previewData.is_balanced ? '✓ Perfectly Balanced Total' : 'Sum Mismatch'}
                          </span>
                        </div>
                        <div className="table-wrapper">
                          <table style={{ background: 'white' }}>
                            <thead>
                              <tr>
                                <th>{tr("Unit")}</th>
                                <th>{tr("Area")}</th>
                                <th className="text-right">{tr("Share %")}</th>
                                <th className="text-right">{tr("Allocated Amount (৳)")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.allocations.map((a: any) => (
                                <tr key={a.id_units}>
                                  <td className="fw-bold">{a.unit_number}</td>
                                  <td>{a.area_sqft} SFT</td>
                                  <td className="text-right">{a.percentage}%</td>
                                  <td className="text-right fw-bold text-primary">৳{a.amount?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={3}>{tr("Calculated Total Allocation")}</td>
                                <td className="text-right fw-bold text-success">৳{previewData.calculated_sum?.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{tr("Scope Description & Specifications")}</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder={tr("Enter detailed scope, materials, test requirements...")}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>
                  {tr("Cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Allocating & Saving...' : 'Confirm Work & Apply Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
