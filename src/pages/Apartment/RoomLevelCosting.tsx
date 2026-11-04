import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function RoomLevelCosting() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/apartment/room-level-costing');
        if (res.success) {
          setUnits(res.data);
          if (res.data.length > 0 && !selectedUnitId) {
            setSelectedUnitId(res.data[0].unit_id);
          }
        }
      } catch (err) {
        console.error('Error fetching room costing:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner">
          <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '2rem' }}></i>
          <p className="mt-2 text-muted">Calculating Room-Level Finishes Costing...</p>
        </div>
      </div>
    );
  }

  const currentUnit = units.find(u => u.unit_id === selectedUnitId) || units[0] || {};
  const rooms = currentUnit.rooms || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Apartment System</span>
            <span className="breadcrumb-sep">/</span>
            <span>Finishing Costing</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-layer-group text-primary"></i> Room-Level Costing & Hierarchy (Section 3)
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          Room → Unit → Owner → Project
        </span>
      </div>

      {/* UNIT SELECTOR TABS */}
      <div className="pill-tabs mb-4">
        {units.map(u => (
          <button
            key={u.unit_id}
            className={`pill-tab ${selectedUnitId === u.unit_id ? 'active' : ''}`}
            onClick={() => setSelectedUnitId(u.unit_id)}
          >
            <i className="fa-solid fa-door-closed" style={{ marginRight: '6px' }}></i>
            {u.unit_number} ({u.area_sqft} SFT)
          </button>
        ))}
      </div>

      {/* UNIT ROOM-LEVEL FINISHING SCHEDULE */}
      <div className="card mb-4">
        <div className="card-header flex-between">
          <div className="card-title">
            <i className="fa-solid fa-brush text-primary"></i>
            Finishing Cost Breakdown for {currentUnit.unit_number}
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
            Total Room Finishes: ৳${currentUnit.total_finishing_cost?.toLocaleString()}
          </span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Room Type</th>
                <th>Dimensions (L × W)</th>
                <th className="text-right">Area (SFT)</th>
                <th className="text-right">Finish Rate / SFT (৳)</th>
                <th className="text-right">Estimated Cost (৳)</th>
                <th>Finishing Materials & Scope</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r: any) => (
                <tr key={r.id_rooms}>
                  <td className="fw-bold">{r.room_name}</td>
                  <td><span className="badge badge-info">{r.room_type}</span></td>
                  <td className="text-muted">{r.length_feet}' × {r.width_feet}'</td>
                  <td className="text-right fw-semibold text-primary">{r.area_sqft} SFT</td>
                  <td className="text-right text-muted">৳{r.rate_per_sft.toFixed(2)}</td>
                  <td className="text-right fw-bold" style={{ fontSize: '0.95rem', color: '#1e1b4b' }}>৳{r.estimated_cost?.toLocaleString()}
                  </td>
                  <td className="text-muted text-sm">{r.details}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total Unit Rooms Area & Finishes Cost</td>
                <td className="text-right fw-bold text-primary">
                  {rooms.reduce((s: number, r: any) => s + parseFloat(r.area_sqft || 0), 0).toFixed(2)} SFT
                </td>
                <td></td>
                <td className="text-right fw-bold text-success" style={{ fontSize: '1.05rem' }}>৳{currentUnit.total_finishing_cost?.toLocaleString()}
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
