
import React, { useState, useEffect, useCallback } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import api from '../../api/client';

interface Building {
  id_buildings: number; building_name: string; building_code: string; building_type: string;
  total_land_area: string; total_floors: number; total_units: number;
  status: string; district: string; estimated_construction_cost: string; created_at: string;
}

const formatBDT = (v: string|number|null) => v ? `৳ ${Number(v).toLocaleString('en-BD')}` : '—';
const statusBadge = (s: string) => {
  const map: Record<string,string> = { Planning:'badge-info', 'Under Construction':'badge-warning', Completed:'badge-success', Cancelled:'badge-danger' };
  return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
};
const typeBadge = (t: string) => {
  const map: Record<string,string> = { Residential:'badge-success', Commercial:'badge-warning', Mixed:'badge-info' };
  return <span className={`badge ${map[t]||'badge-gray'}`}>{t}</span>;
};

export default function ListBuilding() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [total, setTotal] = useState(0);

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit:'50', orderBy:'id_buildings', order:'desc' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('building_type', filterType);
      const res: any = await api.get(`/buildings?${params}`);
      setBuildings(res.data || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterStatus, filterType]);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res: any = await api.delete(`/buildings/${id}`);
      if (!res.success) return alert(res.message);
      fetchBuildings();
    } catch(e: any) { alert(e.message); }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="fa-solid fa-city text-primary" />{tr("Buildings (ভবন তালিকা)")}</h1>
          <p className="text-muted text-sm mt-1">{total} building{total !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/buildings/create" className="btn btn-primary">
          <i className="fa-solid fa-plus" /> {tr("New Building")}
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-5">
        <div className="stat-card stat-primary"><div className="stat-icon"><i className="fa-solid fa-building" /></div><div className="stat-value">{total}</div><div className="stat-label">{tr("Total Buildings")}</div></div>
        <div className="stat-card stat-warning"><div className="stat-icon"><i className="fa-solid fa-hard-hat" /></div><div className="stat-value">{buildings.filter(b=>b.status==='Under Construction').length}</div><div className="stat-label">{tr("Under Construction")}</div></div>
        <div className="stat-card stat-success"><div className="stat-icon"><i className="fa-solid fa-check-circle" /></div><div className="stat-value">{buildings.filter(b=>b.status==='Completed').length}</div><div className="stat-label">{tr("Completed")}</div></div>
        <div className="stat-card stat-info"><div className="stat-icon"><i className="fa-solid fa-drafting-compass" /></div><div className="stat-value">{buildings.filter(b=>b.status==='Planning').length}</div><div className="stat-label">{tr("Planning")}</div></div>
      </div>

      {/* Filter bar */}
      <div className="card mb-4">
        <div className="card-body" style={{paddingTop:'14px',paddingBottom:'14px'}}>
          <div className="form-row cols-4">
            <div className="search-bar">
              <i className="fa-solid fa-search search-icon" />
              <input className="form-control" placeholder={tr("Search buildings...")} value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="form-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">{tr("All Status")}</option>
              {['Planning','Under Construction','Completed','Cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="">{tr("All Types")}</option>
              {['Residential','Commercial','Mixed'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-light" onClick={()=>{setSearch('');setFilterStatus('');setFilterType('');}}>
              <i className="fa-solid fa-refresh" /> {tr("Reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>{tr("Building Name")}</th><th>{tr("Type")}</th><th>{tr("Land (Katha)")}</th>
                  <th>{tr("Floors")}</th><th>{tr("Units")}</th><th>{tr("District")}</th><th>{tr("Est. Cost (৳)")}</th>
                  <th>{tr("Status")}</th><th>{tr("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{textAlign:'center',padding:'40px'}}><div className="flex-center gap-2"><div className="spinner" /><span>{tr("Loading...")}</span></div></td></tr>
                ) : buildings.length === 0 ? (
                  <tr><td colSpan={10}><div className="empty-state"><i className="fa-solid fa-building" /><h3>{tr("No Buildings Found")}</h3><p>{tr("Create your first building to get started")}</p></div></td></tr>
                ) : buildings.map((b, i) => (
                  <tr key={b.id_buildings}>
                    <td className="text-muted text-sm">{i+1}</td>
                    <td><div className="fw-bold">{b.building_name}</div>{b.building_code&&<div className="text-xs text-muted">{b.building_code}</div>}</td>
                    <td>{typeBadge(b.building_type)}</td>
                    <td className="fw-semibold">{Number(b.total_land_area).toFixed(2)} কাঠা</td>
                    <td className="text-center">{b.total_floors||'—'}</td>
                    <td className="text-center">{b.total_units||'—'}</td>
                    <td>{b.district||'—'}</td>
                    <td className="text-right"><span className="bdt-amount">{formatBDT(b.estimated_construction_cost)}</span></td>
                    <td>{statusBadge(b.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/buildings/details/${b.id_buildings}`} className="btn btn-primary btn-sm btn-icon" title={tr("View Details")}><i className="fa-solid fa-eye" /></Link>
                        <Link to={`/buildings/edit/${b.id_buildings}`} className="btn btn-warning btn-sm btn-icon" title={tr("Edit")}><i className="fa-solid fa-pen" /></Link>
                        <button className="btn btn-danger btn-sm btn-icon" title={tr("Delete")} onClick={()=>handleDelete(b.id_buildings, b.building_name)}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
