import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function CostPerSftAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSft = async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/apartment/cost-per-sft');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Error fetching cost per sft:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSft();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2rem' }}></i>
          <p className="mt-2 text-muted">Calculating Square Footage Cost Metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const units = data?.units || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Apartment System</span>
            <span className="breadcrumb-sep">/</span>
            <span>Analytics</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-ruler-combined text-primary"></i> Cost per Square Foot (SFT) Analytics (Section 2)
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          Total Construction: {data?.total_construction_sft?.toLocaleString()} SFT
        </span>
      </div>

      {/* PRIMARY COST PER SFT METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ '--kpi-color': '#4f46e5' } as any}>
          <div className="kpi-title">
            <span>Overall Construction / SFT</span>
            <i className="fa-solid fa-calculator text-primary"></i>
          </div>
          <div className="kpi-value text-primary">৳{metrics.overall_cost_per_sft} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ SFT</span></div>
          <div className="kpi-subtitle">Total Cost ÷ 9,460 Gross SFT</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': '#7c3aed' } as any}>
          <div className="kpi-title">
            <span>Combined Work / SFT</span>
            <i className="fa-solid fa-building text-info"></i>
          </div>
          <div className="kpi-value" style={{ color: '#7c3aed' }}>৳{metrics.combined_cost_per_sft} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ SFT</span></div>
          <div className="kpi-subtitle">Shared Common Facilities</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': '#059669' } as any}>
          <div className="kpi-title">
            <span>Structural Frame / SFT</span>
            <i className="fa-solid fa-trowel-bricks text-success"></i>
          </div>
          <div className="kpi-value text-success">৳{metrics.structural_cost_per_sft} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ SFT</span></div>
          <div className="kpi-subtitle">Piling, Columns & RCC Slabs</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': '#0284c7' } as any}>
          <div className="kpi-title">
            <span>Facilities & Lifts / SFT</span>
            <i className="fa-solid fa-elevator text-info"></i>
          </div>
          <div className="kpi-value text-info">৳{metrics.facilities_cost_per_sft} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ SFT</span></div>
          <div className="kpi-subtitle">Dual Elevators & Generator</div>
        </div>
      </div>

      {/* UNIT-WISE COST PER SFT TABLE */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-building-user text-primary"></i> Unit A–F Net Cost per Square Foot Benchmark
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Unit Flat</th>
                <th className="text-right">Unit Area (SFT)</th>
                <th className="text-right">Total Unit Liability (৳)</th>
                <th className="text-right">Effective Cost / SFT (৳)</th>
                <th>Cost Variance from Average</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u: any) => {
                const avgSft = parseFloat(metrics.overall_cost_per_sft);
                const uSft = parseFloat(u.cost_per_sft);
                const diff = (uSft - avgSft).toFixed(2);
                return (
                  <tr key={u.id_units}>
                    <td>
                      <span className="unit-badge">
                        <i className="fa-solid fa-door-closed"></i> {u.unit_number}
                      </span>
                    </td>
                    <td className="text-right fw-semibold">{u.area_sqft} SFT</td>
                    <td className="text-right fw-bold text-primary">৳{parseFloat(u.total_cost).toLocaleString()}</td>
                    <td className="text-right fw-bold" style={{ fontSize: '1rem', color: '#1e1b4b' }}>৳{u.cost_per_sft} / SFT
                    </td>
                    <td>
                      <span className={`badge ${parseFloat(diff) > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {parseFloat(diff) > 0 ? `+$${diff}/SFT (Upgrades)` : 'Base Model Standard'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Average / Total</td>
                <td className="text-right">6,960 SFT</td>
                <td className="text-right fw-bold">৳{units.reduce((s: number, u: any) => s + parseFloat(u.total_cost || 0), 0).toLocaleString()}</td>
                <td className="text-right fw-bold text-primary">৳{metrics.combined_cost_per_sft} / SFT</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
