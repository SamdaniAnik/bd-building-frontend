
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const formatBDT = (v: any) => v ? `৳ ${Number(v).toLocaleString('en-BD')}` : '—';
const statusBadge = (s: string) => {
  const map: Record<string,string> = { Planning:'badge-info', 'Under Construction':'badge-warning', Completed:'badge-success', Cancelled:'badge-danger', Active:'badge-success', Inactive:'badge-danger' };
  return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
};

interface InfoRowProps { label: string; value: React.ReactNode; }
const InfoRow = ({ label, value }: InfoRowProps) => (
  <div style={{display:'flex',padding:'8px 0',borderBottom:'1px solid var(--gray-100)'}}>
    <span style={{width:'50%',color:'var(--gray-500)',fontSize:'0.8rem',fontWeight:600}}>{label}</span>
    <span style={{width:'50%',fontWeight:600}}>{value||'—'}</span>
  </div>
);

export default function BuildingDetails() {
  const { id } = useParams<{id:string}>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get(`/buildings/${id}`).then((res:any) => {
      setData(res);
    }).catch(console.error).finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <div className="loader-overlay"><div className="spinner" /></div>;
  if (!data?.building) return <div className="alert alert-danger">Building not found</div>;

  const b = data.building;
  const shareholders = data.shareholders || [];
  const unitsSummary: any[] = data.unitsSummary || [];
  const costingSummary = data.costingSummary || {};

  const totalUnits = unitsSummary.reduce((s:number, u:any) => s + Number(u.count), 0);
  const soldUnits = unitsSummary.filter((u:any)=>u.status==='Sold').reduce((s:number,u:any)=>s+Number(u.count),0);

  const tabs = [
    { key:'overview', icon:'fa-info-circle', label:'Overview' },
    { key:'land', icon:'fa-map', label:'Land Info' },
    { key:'shareholders', icon:'fa-users', label:`Shareholders (${shareholders.length})` },
    { key:'units', icon:'fa-home', label:`Units` },
    { key:'costing', icon:'fa-calculator', label:'Costing' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb mb-3">
        <Link to="/buildings">Buildings</Link><span className="breadcrumb-sep">/</span>
        <span>{b.building_name}</span>
      </div>

      {/* Header Card */}
      <div className="card mb-5">
        <div style={{background:'linear-gradient(135deg,#1e1b4b 0%,#4f46e5 100%)',padding:'24px 28px',borderRadius:'12px 12px 0 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px'}}>
            <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
              <div style={{width:'56px',height:'56px',background:'rgba(255,255,255,0.2)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',color:'white'}}>
                <i className="fa-solid fa-building" />
              </div>
              <div>
                <h2 style={{color:'white',fontSize:'1.4rem',fontWeight:800}}>{b.building_name}</h2>
                <div style={{display:'flex',gap:'8px',marginTop:'6px',flexWrap:'wrap'}}>
                  {b.building_code && <span className="badge badge-gray">{b.building_code}</span>}
                  <span className="badge badge-primary">{b.building_type}</span>
                  {statusBadge(b.status)}
                  {b.district && <span style={{color:'#c7d2fe',fontSize:'0.8rem'}}><i className="fa-solid fa-map-marker-alt" style={{marginRight:'4px'}} />{b.district}</span>}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <Link to={`/buildings/edit/${id}`} className="btn btn-warning btn-sm"><i className="fa-solid fa-pen" /> Edit</Link>
              <Link to={`/buildings/${id}/shareholders`} className="btn btn-info btn-sm"><i className="fa-solid fa-users" /> Shareholders</Link>
              <Link to={`/buildings/${id}/units`} className="btn btn-success btn-sm"><i className="fa-solid fa-home" /> Units</Link>
              <Link to={`/buildings/${id}/costing`} className="btn btn-primary btn-sm"><i className="fa-solid fa-calculator" /> Costing</Link>
              <Link to={`/buildings/${id}/payments`} className="btn btn-light btn-sm"><i className="fa-solid fa-money-bill" /> Payments</Link>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="card-body">
          <div className="stats-grid" style={{marginBottom:0}}>
            <div className="stat-card stat-success"><div className="stat-icon"><i className="fa-solid fa-map" /></div><div className="stat-value">{Number(b.total_land_area).toFixed(2)}</div><div className="stat-label">কাঠা Land</div></div>
            <div className="stat-card stat-primary"><div className="stat-icon"><i className="fa-solid fa-layer-group" /></div><div className="stat-value">{b.total_floors||'—'}</div><div className="stat-label">Floors</div></div>
            <div className="stat-card stat-warning"><div className="stat-icon"><i className="fa-solid fa-home" /></div><div className="stat-value">{totalUnits||b.total_units||'—'}</div><div className="stat-label">Total Units</div></div>
            <div className="stat-card stat-info"><div className="stat-icon"><i className="fa-solid fa-users" /></div><div className="stat-value">{shareholders.length}</div><div className="stat-label">Shareholders</div></div>
            <div className="stat-card stat-success"><div className="stat-icon"><i className="fa-solid fa-check-double" /></div><div className="stat-value">{soldUnits}</div><div className="stat-label">Units Sold</div></div>
            <div className="stat-card stat-danger"><div className="stat-icon"><i className="fa-solid fa-circle-dollar-to-slot" /></div><div className="stat-value" style={{fontSize:'1.1rem'}}>{formatBDT(b.estimated_construction_cost)}</div><div className="stat-label">Est. Cost</div></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-header" style={{padding:'0 20px',borderBottom:'1px solid var(--gray-200)'}}>
          <div className="tabs" style={{borderBottom:'none',marginBottom:0}}>
            {tabs.map(tab => (
              <button key={tab.key} className={`tab-btn ${activeTab===tab.key?'active':''}`} onClick={()=>setActiveTab(tab.key)}>
                <i className={`fa-solid ${tab.icon}`} />{tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {/* OVERVIEW */}
          {activeTab==='overview' && (
            <div className="grid grid-2">
              <div>
                <h5 className="section-heading"><i className="fa-solid fa-building" />Building Details</h5>
                <InfoRow label="Building Name" value={b.building_name} />
                <InfoRow label="Building Code" value={b.building_code} />
                <InfoRow label="Type" value={b.building_type} />
                <InfoRow label="Status" value={statusBadge(b.status)} />
                <InfoRow label="Floors" value={b.total_floors} />
                <InfoRow label="Basement" value={b.basement_floors} />
                <InfoRow label="Total Units" value={b.total_units} />
              </div>
              <div>
                <h5 className="section-heading"><i className="fa-solid fa-calendar" />Timeline & Approval</h5>
                <InfoRow label="Start Date" value={b.start_date?.split('T')[0]} />
                <InfoRow label="Completion" value={b.completion_date?.split('T')[0]} />
                <InfoRow label="Authority" value={b.approval_authority} />
                <InfoRow label="Approval No." value={b.rajuk_approval_no} />
                <InfoRow label="Approval Date" value={b.rajuk_approval_date?.split('T')[0]} />
                <InfoRow label="Land Cost" value={formatBDT(b.land_purchase_cost)} />
                <InfoRow label="Est. Construction Cost" value={formatBDT(b.estimated_construction_cost)} />
              </div>
              {b.notes && (
                <div style={{gridColumn:'span 2'}}>
                  <div className="alert alert-info"><i className="fa-solid fa-note-sticky" /><span>{b.notes}</span></div>
                </div>
              )}
            </div>
          )}

          {/* LAND */}
          {activeTab==='land' && (
            <div className="grid grid-2">
              <div>
                <h5 className="section-heading"><i className="fa-solid fa-ruler-combined" />Land Measurements</h5>
                <InfoRow label="Land (কাঠা)" value={`${Number(b.total_land_area).toFixed(4)} কাঠা`} />
                <InfoRow label="Land (Sqft)" value={b.total_land_area_sqft ? `${Number(b.total_land_area_sqft).toLocaleString()} sqft` : '—'} />
                <InfoRow label="FAR Ratio" value={b.far_ratio} />
                <InfoRow label="Buildable Area" value={b.total_buildable_area_sqft ? `${Number(b.total_buildable_area_sqft).toLocaleString()} sqft` : '—'} />
              </div>
              <div>
                <h5 className="section-heading"><i className="fa-solid fa-file-contract" />Legal Records</h5>
                <InfoRow label="Mouza (মৌজা)" value={b.mouza} />
                <InfoRow label="Dag No. (দাগ নং)" value={b.dag_no} />
                <InfoRow label="Khatian No." value={b.khatian_no} />
                <InfoRow label="District (জেলা)" value={b.district} />
                <InfoRow label="Upazila" value={b.upazila} />
                <InfoRow label="Address" value={b.address} />
              </div>
            </div>
          )}

          {/* SHAREHOLDERS */}
          {activeTab==='shareholders' && (
            <div>
              <div className="flex-between mb-4">
                <h5 className="section-heading" style={{marginBottom:0}}><i className="fa-solid fa-users" />Land Shareholders ({shareholders.length})</h5>
                <Link to={`/buildings/${id}/shareholders`} className="btn btn-primary btn-sm"><i className="fa-solid fa-plus" /> Manage</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>NID</th><th>Share (কাঠা)</th><th>Share (%)</th><th>Entitled Flats</th><th>Payment Mode</th><th>Status</th></tr></thead>
                  <tbody>
                    {shareholders.length===0 ? <tr><td colSpan={8}><div className="empty-state" style={{padding:'30px'}}><i className="fa-solid fa-users" /><p>No shareholders added yet</p></div></td></tr>
                    : shareholders.map((s:any,i:number) => (
                      <tr key={s.id_shareholders}>
                        <td>{i+1}</td>
                        <td><div className="fw-bold">{s.shareholder_name}</div>{s.father_name&&<div className="text-xs text-muted">S/O {s.father_name}</div>}</td>
                        <td>{s.nid_no||'—'}</td>
                        <td className="fw-semibold">{Number(s.land_share_katha).toFixed(4)} কাঠা</td>
                        <td><span className="badge badge-primary">{Number(s.land_share_percent).toFixed(2)}%</span></td>
                        <td>{s.entitled_flat_count||'—'}</td>
                        <td><span className="badge badge-info">{s.payment_mode||'—'}</span></td>
                        <td>{statusBadge(s.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* UNITS */}
          {activeTab==='units' && (
            <div>
              <div className="flex-between mb-4">
                <h5 className="section-heading" style={{marginBottom:0}}><i className="fa-solid fa-home" />Units Summary</h5>
                <Link to={`/buildings/${id}/units`} className="btn btn-success btn-sm"><i className="fa-solid fa-plus" /> Manage Units</Link>
              </div>
              <div className="stats-grid">
                {[
                  {label:'Available',count:unitsSummary.filter((u:any)=>u.status==='Available').reduce((s:number,u:any)=>s+Number(u.count),0),cls:'stat-success'},
                  {label:'Booked',count:unitsSummary.filter((u:any)=>u.status==='Booked').reduce((s:number,u:any)=>s+Number(u.count),0),cls:'stat-warning'},
                  {label:'Sold',count:soldUnits,cls:'stat-primary'},
                  {label:'Handed Over',count:unitsSummary.filter((u:any)=>u.status==='Handed Over').reduce((s:number,u:any)=>s+Number(u.count),0),cls:'stat-info'},
                  {label:'Total',count:totalUnits,cls:'stat-danger'},
                ].map(s=>(
                  <div key={s.label} className={`stat-card ${s.cls}`}>
                    <div className="stat-value">{s.count}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COSTING */}
          {activeTab==='costing' && (
            <div>
              <div className="flex-between mb-4">
                <h5 className="section-heading" style={{marginBottom:0}}><i className="fa-solid fa-calculator" />Costing Summary</h5>
                <Link to={`/buildings/${id}/costing`} className="btn btn-primary btn-sm"><i className="fa-solid fa-plus" /> Manage Costing</Link>
              </div>
              <div className="stats-grid">
                {[
                  {label:'Total Budget',value:formatBDT(costingSummary.total_cost),cls:'stat-primary'},
                  {label:'Total Paid',value:formatBDT(costingSummary.total_paid),cls:'stat-success'},
                  {label:'Remaining',value:formatBDT(Math.max(0,Number(costingSummary.total_cost)-Number(costingSummary.total_paid))),cls:'stat-warning'},
                ].map(s=>(
                  <div key={s.label} className={`stat-card ${s.cls}`}>
                    <div className="stat-value" style={{fontSize:'1.1rem'}}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
