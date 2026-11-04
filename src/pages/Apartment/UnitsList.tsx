import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function UnitsList() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/units');
      if (res.success) setUnits(res.data);
    } catch (err) {
      console.error('Error fetching units:', err);
    } finally {
      setLoading(false);
    }
  };

  const openUnitDetails = async (id: number) => {
    try {
      setModalLoading(true);
      const res: any = await api.get(`/apartment/units/${id}`);
      if (res.success) {
        setSelectedUnit(res.data);
      }
    } catch (err) {
      console.error('Error fetching unit details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-3 text-muted fw-semibold">{tr("Loading Apartment Units...")}</p>
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
            <span>{tr("Building & Flats")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-door-open text-primary"></i> {tr("Unit & Flat Management (Units A–F)")}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {tr("6 Multi-Owner Units Configured")}
          </span>
        </div>
      </div>

      {/* Grid of Units A-F */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {units.map(unit => {
          const pctPaid = unit.total_liability > 0 ? (unit.total_paid / unit.total_liability) * 100 : 0;
          return (
            <div key={unit.id_units} className="card" style={{ transition: 'all 0.2s', borderTop: '4px solid #4f46e5' }}>
              <div className="card-header" style={{ background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="unit-badge" style={{ fontSize: '0.9rem', padding: '5px 12px' }}>
                    <i className="fa-solid fa-house-chimney"></i> {unit.unit_number}
                  </span>
                  <span className="text-muted text-sm">{unit.floor_name}</span>
                </div>
                <span className="badge badge-info">{unit.status}</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <div>
                    <span className="text-muted">{tr("Gross Area:")}</span>
                    <div className="fw-bold">{unit.area_sqft} SFT</div>
                  </div>
                  <div>
                    <span className="text-muted">{tr("Common Share:")}</span>
                    <div className="fw-bold text-primary">{unit.common_area_sqft || 250} SFT</div>
                  </div>
                  <div>
                    <span className="text-muted">{tr("Land Share:")}</span>
                    <div className="fw-bold text-success">
                      {unit.land_share_katha ? Number(unit.land_share_katha).toFixed(4) + ' Katha' : '0.2083 Katha'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">{tr("Layout:")}</span>
                    <div className="fw-bold">{unit.bedrooms || 3} {tr("Beds")}, {unit.bathrooms || 3} {tr("Baths")}</div>
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                  <div className="text-xs text-muted fw-semibold uppercase mb-1">{tr("Owners & Share:")}</div>
                  {(unit.owners || []).map((o: any) => (
                    <div key={o.id_owners} className="flex-between text-sm py-1">
                      <span className="fw-semibold text-primary">{o.full_name}</span>
                      <span className="badge badge-primary">{o.ownership_percentage}{tr("% Share")}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.85rem' }}>
                  <div className="flex-between py-1">
                    <span className="text-muted">{tr("Combined Share:")}</span>
                    <span className="fw-semibold">৳{unit.combined_share?.toLocaleString()}</span>
                  </div>
                  {unit.individual_cost > 0 && (
                    <div className="flex-between py-1">
                      <span className="tag-badge tag-individual">{tr("Individual Upgrade:")}</span>
                      <span className="fw-semibold text-warning">৳{unit.individual_cost?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex-between py-1">
                    <span className="fw-bold">{tr("Total Liability:")}</span>
                    <span className="fw-bold" style={{ color: '#1e1b4b' }}>৳{unit.total_liability?.toLocaleString()}</span>
                  </div>
                  <div className="flex-between py-1">
                    <span className="text-muted">{tr("Paid to Date:")}</span>
                    <span className="fw-bold text-success">৳{unit.total_paid?.toLocaleString()}</span>
                  </div>
                  <div className="flex-between py-1" style={{ borderTop: '1px dashed #cbd5e1', marginTop: '4px' }}>
                    <span className="fw-bold text-danger">{tr("Outstanding Balance:")}</span>
                    <span className="fw-bold text-danger">৳{unit.outstanding?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex-between text-xs text-muted mb-1">
                    <span>{tr("Payment Completion")}</span>
                    <span className="fw-semibold">{pctPaid.toFixed(0)}%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className={`progress-bar ${pctPaid >= 80 ? 'success' : pctPaid >= 50 ? 'warning' : 'danger'}`} style={{ width: `${Math.min(100, pctPaid)}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="card-footer flex-between" style={{ background: '#fafafa' }}>
                <button className="btn btn-outline btn-sm w-100" onClick={() => openUnitDetails(unit.id_units)}>
                  <i className="fa-solid fa-ruler-combined"></i> {tr("View Rooms & Complete Financials")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* UNIT DETAILS MODAL (Room-by-Room Area & Works) */}
      {selectedUnit && (
        <div className="modal-overlay" onClick={() => setSelectedUnit(null)}>
          <div className="modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="unit-badge" style={{ fontSize: '1rem' }}>{selectedUnit.unit_number}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{tr("Unit Specifications & Room-Level SFT Breakdown")}</h3>
              </div>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedUnit(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* Room Breakdown (Length x Width = Area) */}
              <div className="section-heading">
                <i className="fa-solid fa-vector-square"></i> {tr("Room-Level Dimension & Area Schedule (Length × Width = Area)")}
              </div>
              <div className="table-wrapper mb-4">
                <table>
                  <thead>
                    <tr>
                      <th>{tr("Room Name")}</th>
                      <th>{tr("Type")}</th>
                      <th>{tr("Length (ft)")}</th>
                      <th>{tr("Width (ft)")}</th>
                      <th className="text-right">{tr("Area (SFT)")}</th>
                      <th>{tr("Notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedUnit.rooms || []).map((r: any) => (
                      <tr key={r.id_rooms}>
                        <td className="fw-semibold">{r.room_name}</td>
                        <td><span className="badge badge-info">{r.room_type}</span></td>
                        <td>{r.length_feet}'</td>
                        <td>{r.width_feet}'</td>
                        <td className="text-right fw-bold text-primary">{r.area_sqft} SFT</td>
                        <td className="text-muted text-sm">{r.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>{tr("Sum of Calculated Rooms Area")}</td>
                      <td className="text-right fw-bold text-primary">
                        {(selectedUnit.rooms || []).reduce((s: number, r: any) => s + parseFloat(r.area_sqft || 0), 0).toFixed(2)} SFT
                      </td>
                      <td>{tr("Gross Unit Registered")}: {selectedUnit.area_sqft} SFT</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Works Allocated to this unit */}
              <div className="section-heading">
                <i className="fa-solid fa-hammer"></i> {tr("Construction Works & Allocations Assigned to Unit")}
              </div>
              <div className="table-wrapper mb-4">
                <table>
                  <thead>
                    <tr>
                      <th>{tr("Work Name")}</th>
                      <th>{tr("Type")}</th>
                      <th>{tr("Allocation Method")}</th>
                      <th className="text-right">{tr("Unit Allocated Amount (৳)")}</th>
                      <th>{tr("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedUnit.works || []).map((w: any) => (
                      <tr key={w.id_work_allocations}>
                        <td className="fw-semibold">{w.work_name}</td>
                        <td>
                          <span className={`tag-badge ${w.is_custom ? 'tag-individual' : 'tag-combined'}`}>
                            {w.is_custom ? 'INDIVIDUAL UPGRADE' : 'COMBINED COMMON SHARE'}
                          </span>
                        </td>
                        <td>{w.notes || 'Area proportional'}</td>
                        <td className="text-right fw-bold text-primary">৳{parseFloat(w.allocated_amount).toLocaleString()}</td>
                        <td><span className="badge badge-success">{w.work_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>{tr("Total Unit Liability")}</td>
                      <td className="text-right fw-bold" style={{ fontSize: '1rem', color: '#1e1b4b' }}>৳{selectedUnit.financial_summary?.total_liability?.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payments History for this unit */}
              <div className="section-heading">
                <i className="fa-solid fa-receipt"></i> {tr("Owner Payment History for this Unit")}
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{tr("Receipt #")}</th>
                      <th>{tr("Date")}</th>
                      <th>{tr("Type")}</th>
                      <th>{tr("Method")}</th>
                      <th className="text-right">{tr("Amount (৳)")}</th>
                      <th>{tr("Reference")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedUnit.contributions || []).map((c: any) => (
                      <tr key={c.id_contributions}>
                        <td className="fw-semibold">{c.receipt_number}</td>
                        <td>{c.payment_date}</td>
                        <td><span className="badge badge-primary">{c.contribution_type}</span></td>
                        <td>{c.payment_method}</td>
                        <td className="text-right fw-bold text-success">৳{parseFloat(c.amount).toLocaleString()}</td>
                        <td className="text-muted text-sm">{c.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>{tr("Total Paid / Remaining Balance")}</td>
                      <td className="text-right fw-bold text-success">৳{selectedUnit.financial_summary?.total_paid?.toLocaleString()}
                      </td>
                      <td className="fw-bold text-danger">
                        Due: ৳${selectedUnit.financial_summary?.outstanding?.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-light" onClick={() => setSelectedUnit(null)}>{tr("Close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
