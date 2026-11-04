import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function FacilitiesLifts() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [data, setData] = useState<{ lifts: any[]; common_areas: any[] }>({ lifts: [], common_areas: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/apartment/facilities');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Common Infrastructure")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-elevator text-primary"></i> {tr("Lifts (2 Units) & Common Area Facilities")}
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          {tr("Section 32 & 33 Compliance")}
        </span>
      </div>

      {/* SECTION 33: LIFT MANAGEMENT (2 Lifts) */}
      <div className="section-heading">
        <i className="fa-solid fa-arrows-up-down"></i> {tr("Passenger & Service Lifts (2 Dedicated High-Speed Elevators)")}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {data.lifts.map(l => (
          <div key={l.id_lifts} className="card" style={{ borderTop: '4px solid #4f46e5' }}>
            <div className="card-header flex-between" style={{ background: '#f8fafc' }}>
              <div className="fw-bold" style={{ fontSize: '1rem', color: '#1e1b4b' }}>
                <i className="fa-solid fa-elevator text-primary" style={{ marginRight: '8px' }}></i>
                {l.lift_number}
              </div>
              <span className="badge badge-success">{tr("Operational")}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
                <div>
                  <span className="text-muted">{tr("Capacity:")}</span>
                  <div className="fw-bold">{l.capacity_persons} {tr("Persons (630 KG)")}</div>
                </div>
                <div>
                  <span className="text-muted">{tr("Manufacturer:")}</span>
                  <div className="fw-bold">{l.manufacturer}</div>
                </div>
                <div>
                  <span className="text-muted">{tr("Installation Contractor:")}</span>
                  <div className="fw-bold text-primary">{l.vendor_name || 'Sigma Elevators'}</div>
                </div>
                <div>
                  <span className="text-muted">{tr("Warranty Period:")}</span>
                  <div className="fw-bold">{l.warranty_years} {tr("Years Complete")}</div>
                </div>
              </div>

              {/* Lift Cost Schedule */}
              <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div className="text-xs text-muted uppercase fw-bold mb-2">{tr("Lift Cost Breakdown:")}</div>
                <div className="flex-between py-1">
                  <span>{tr("Equipment Purchase:")}</span>
                  <span className="fw-bold">৳{parseFloat(l.purchase_cost).toLocaleString()}</span>
                </div>
                <div className="flex-between py-1">
                  <span>{tr("Mechanical Installation:")}</span>
                  <span className="fw-semibold">৳{parseFloat(l.installation_cost).toLocaleString()}</span>
                </div>
                <div className="flex-between py-1">
                  <span>{tr("Hoistway Civil Works:")}</span>
                  <span className="fw-semibold">৳{parseFloat(l.civil_work_cost).toLocaleString()}</span>
                </div>
                <div className="flex-between py-1">
                  <span>{tr("Electrical Cabling & ARD:")}</span>
                  <span className="fw-semibold">৳{parseFloat(l.electrical_cost).toLocaleString()}</span>
                </div>
                <div className="flex-between py-1" style={{ borderTop: '1px solid #cbd5e1', marginTop: '4px' }}>
                  <span className="fw-bold">{tr("Total Capital Cost:")}</span>
                  <span className="fw-bold text-primary">৳{(parseFloat(l.purchase_cost) + parseFloat(l.installation_cost) + parseFloat(l.civil_work_cost) + parseFloat(l.electrical_cost)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted">
                <i className="fa-solid fa-shield" style={{ marginRight: '6px' }}></i>
                {tr("AMC Contract")}: {l.maintenance_contract} (৳{l.monthly_maintenance_cost}/mo)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 32: COMMON AREAS MANAGEMENT */}
      <div className="section-heading">
        <i className="fa-solid fa-building-flag"></i> {tr("Common Areas & Facilities Maintenance")}
      </div>

      <div className="card mb-4">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{tr("Area Name")}</th>
                <th>{tr("Type")}</th>
                <th className="text-right">{tr("Area (SFT)")}</th>
                <th className="text-right">{tr("Construction Cost (৳)")}</th>
                <th className="text-right">{tr("Monthly Maintenance (৳)")}</th>
                <th>{tr("Specifications & Scope")}</th>
              </tr>
            </thead>
            <tbody>
              {data.common_areas.map(ca => (
                <tr key={ca.id_common_areas}>
                  <td className="fw-bold">{ca.area_name}</td>
                  <td><span className="badge badge-info">{ca.area_type}</span></td>
                  <td className="text-right fw-semibold">{ca.area_sqft} SFT</td>
                  <td className="text-right fw-bold text-primary">৳{parseFloat(ca.construction_cost).toLocaleString()}</td>
                  <td className="text-right text-muted">৳{parseFloat(ca.monthly_maintenance_cost).toFixed(2)}/mo</td>
                  <td className="text-muted text-sm">{ca.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>{tr("Total Common Facilities")}</td>
                <td className="text-right fw-bold">
                  {data.common_areas.reduce((s, ca) => s + parseFloat(ca.area_sqft || 0), 0)} SFT
                </td>
                <td className="text-right fw-bold text-primary">৳{data.common_areas.reduce((s, ca) => s + parseFloat(ca.construction_cost || 0), 0).toLocaleString()}
                </td>
                <td className="text-right fw-bold">৳{data.common_areas.reduce((s, ca) => s + parseFloat(ca.monthly_maintenance_cost || 0), 0).toFixed(2)}/mo
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
