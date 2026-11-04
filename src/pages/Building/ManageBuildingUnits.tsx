
import React, { useState, useEffect, useCallback } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const formatBDT = (v:any) => v ? `৳ ${Number(v).toLocaleString('en-BD')}` : '—';
const EMPTY = { unitNo:'', unitName:'', unitType:'Residential Flat', idFloors:'', grossAreaSqft:'', carpetAreaSqft:'', superBuiltUpAreaSqft:'', balconyAreaSqft:'', carParkCount:'0', bedCount:'', bathCount:'', isCornerUnit:false, facingDirection:'', pricePerSqftBdt:'', totalPriceBdt:'', carParkPriceBdt:'', utilityConnectionBdt:'', totalSalePriceBdt:'', allocationType:'Available', idShareholders:'', buyerName:'', buyerPhone:'', status:'Available', notes:'' };

export default function ManageBuildingUnits() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const { id: buildingId } = useParams<{id:string}>();
  const [units, setUnits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [buildingName, setBuildingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...EMPTY});
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ id_buildings: buildingId!, limit:'200' });
      if (filterStatus) params.set('status', filterStatus);
      const [listRes, sumRes] = await Promise.all([
        api.get(`/units?${params}`) as any,
        api.get(`/units/summary?id_buildings=${buildingId}`) as any,
      ]);
      setUnits(listRes.data||[]);
      setSummary(sumRes.data||{});
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [buildingId, filterStatus]);

  useEffect(() => {
    fetchData();
    (api.get(`/buildings/${buildingId}`) as any).then((r:any)=>setBuildingName(r.building?.building_name||'')).catch(()=>{});
    (api.get(`/shareholders/dropdown?id_buildings=${buildingId}`) as any).then((r:any)=>setShareholders(r.data||[])).catch(()=>{});
  }, [buildingId]);

  useEffect(() => { fetchData(); }, [filterStatus]);

  const h = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const {name,value,type} = e.target;
    setForm(f=>({...f,[name]: type==='checkbox'?(e.target as HTMLInputElement).checked:value}));
  };

  // Auto-calc total from sqft × rate
  useEffect(() => {
    const rate = parseFloat(form.pricePerSqftBdt);
    const sqft = parseFloat(form.superBuiltUpAreaSqft||form.carpetAreaSqft);
    if (!isNaN(rate) && !isNaN(sqft) && rate>0 && sqft>0) setForm(f=>({...f, totalPriceBdt:(rate*sqft).toFixed(2)}));
  }, [form.pricePerSqftBdt, form.superBuiltUpAreaSqft, form.carpetAreaSqft]);

  // Auto-calc grand total
  useEffect(() => {
    const total = parseFloat(form.totalPriceBdt)||0;
    const car = parseFloat(form.carParkPriceBdt)||0;
    const util = parseFloat(form.utilityConnectionBdt)||0;
    if (total>0) setForm(f=>({...f, totalSalePriceBdt:(total+car+util).toFixed(2)}));
  }, [form.totalPriceBdt, form.carParkPriceBdt, form.utilityConnectionBdt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError('');
    try {
      const payload = {
        idBuildings:parseInt(buildingId!), idFloors:form.idFloors?parseInt(form.idFloors):null,
        unitNo:form.unitNo, unitName:form.unitName||null, unitType:form.unitType,
        grossAreaSqft:form.grossAreaSqft?parseFloat(form.grossAreaSqft):null,
        carpetAreaSqft:form.carpetAreaSqft?parseFloat(form.carpetAreaSqft):null,
        superBuiltUpAreaSqft:form.superBuiltUpAreaSqft?parseFloat(form.superBuiltUpAreaSqft):null,
        balconyAreaSqft:form.balconyAreaSqft?parseFloat(form.balconyAreaSqft):null,
        carParkCount:parseInt(form.carParkCount)||0, bedCount:form.bedCount||null,
        bathCount:form.bathCount?parseInt(form.bathCount):null, isCornerUnit:form.isCornerUnit,
        facingDirection:form.facingDirection||null,
        pricePerSqftBdt:form.pricePerSqftBdt?parseFloat(form.pricePerSqftBdt):null,
        totalPriceBdt:form.totalPriceBdt?parseFloat(form.totalPriceBdt):null,
        carParkPriceBdt:form.carParkPriceBdt?parseFloat(form.carParkPriceBdt):null,
        utilityConnectionBdt:form.utilityConnectionBdt?parseFloat(form.utilityConnectionBdt):null,
        totalSalePriceBdt:form.totalSalePriceBdt?parseFloat(form.totalSalePriceBdt):null,
        allocationType:form.allocationType, idShareholders:form.idShareholders?parseInt(form.idShareholders):null,
        buyerName:form.buyerName||null, buyerPhone:form.buyerPhone||null,
        status:form.status, notes:form.notes||null,
      };
      const res: any = editId ? await api.put(`/units/${editId}`, payload) : await api.post('/units', payload);
      if (!res.success) { setError(res.message); return; }
      setForm({...EMPTY}); setEditId(null); setShowForm(false); fetchData();
    } catch(e:any) { setError(e.message||'Server error'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (u: any) => {
    setForm({ unitNo:u.unit_no||'', unitName:u.unit_name||'', unitType:u.unit_type||'Residential Flat', idFloors:u.id_floors?.toString()||'', grossAreaSqft:u.gross_area_sqft||'', carpetAreaSqft:u.carpet_area_sqft||'', superBuiltUpAreaSqft:u.super_built_up_area_sqft||'', balconyAreaSqft:u.balcony_area_sqft||'', carParkCount:u.car_park_count?.toString()||'0', bedCount:u.bed_count||'', bathCount:u.bath_count?.toString()||'', isCornerUnit:!!u.is_corner_unit, facingDirection:u.facing_direction||'', pricePerSqftBdt:u.price_per_sqft_bdt||'', totalPriceBdt:u.total_price_bdt||'', carParkPriceBdt:u.car_park_price_bdt||'', utilityConnectionBdt:u.utility_connection_bdt||'', totalSalePriceBdt:u.total_sale_price_bdt||'', allocationType:u.allocation_type||'Available', idShareholders:'', buyerName:u.buyer_name||'', buyerPhone:u.buyer_phone||'', status:u.status||'Available', notes:u.notes||'' });
    setEditId(u.id_units); setShowForm(true);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleDelete = async (id:number, name:string) => {
    if (!confirm(`Delete unit "${name}"?`)) return;
    try {
      const res: any = await api.delete(`/units/${id}`);
      if (!res.success) { alert(res.message); return; }
      fetchData();
    } catch(e:any) { alert(e.message); }
  };

  const statusColors: Record<string,string> = { Available:'badge-success', Booked:'badge-warning', Sold:'badge-primary', 'Under Construction':'badge-info', 'Handed Over':'badge-gray' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb mb-2"><Link to="/buildings">{tr("Buildings")}</Link><span className="breadcrumb-sep">/</span><Link to={`/buildings/details/${buildingId}`}>{buildingName}</Link><span className="breadcrumb-sep">/</span><span>{tr("Units")}</span></div>
          <h1 className="page-title"><i className="fa-solid fa-home text-success" />Units — {buildingName}</h1>
        </div>
        <button className="btn btn-success" onClick={()=>{setShowForm(true);setEditId(null);setForm({...EMPTY});}}>
          <i className="fa-solid fa-plus" /> {tr("Add Unit")}
        </button>
      </div>

      {/* Summary */}
      <div className="stats-grid mb-4">
        <div className="stat-card stat-info"><div className="stat-value">{summary.total_units||0}</div><div className="stat-label">{tr("Total Units")}</div></div>
        <div className="stat-card stat-success"><div className="stat-value">{summary.available||0}</div><div className="stat-label">{tr("Available")}</div></div>
        <div className="stat-card stat-warning"><div className="stat-value">{summary.booked||0}</div><div className="stat-label">{tr("Booked")}</div></div>
        <div className="stat-card stat-primary"><div className="stat-value">{summary.sold||0}</div><div className="stat-label">{tr("Sold")}</div></div>
        <div className="stat-card stat-danger"><div className="stat-value" style={{fontSize:'1.1rem'}}>{formatBDT(summary.total_sale_value)}</div><div className="stat-label">{tr("Total Sale Value")}</div></div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className={`fa-solid ${editId?'fa-pen-to-square text-warning':'fa-home text-success'}`} />{editId?'Edit Unit':'Add Unit'}</h3><button className="btn btn-light btn-sm" onClick={()=>{setShowForm(false);setEditId(null);}}><i className="fa-solid fa-times" /></button></div>
          {error && <div className="alert alert-danger" style={{margin:'0 20px'}}><i className="fa-solid fa-circle-exclamation" />{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="section-heading"><i className="fa-solid fa-tag" />{tr("Basic Info")}</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label required">{tr("Unit No.")}</label><input type="text" name="unitNo" className="form-control" value={form.unitNo} onChange={h} required placeholder={tr("e.g. A-101")} /></div>
                <div className="form-group"><label className="form-label">{tr("Unit Name")}</label><input type="text" name="unitName" className="form-control" value={form.unitName} onChange={h} /></div>
                <div className="form-group"><label className="form-label required">{tr("Type")}</label><select name="unitType" className="form-select" value={form.unitType} onChange={h}>{['Residential Flat','Commercial Space','Office','Shop','Car Park','Store Room'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">{tr("BHK / Beds")}</label><select name="bedCount" className="form-select" value={form.bedCount} onChange={h}><option value="">{tr("Select")}</option>{['Studio','1 BHK','2 BHK','3 BHK','4 BHK','5 BHK'].map(b=><option key={b} value={b}>{b}</option>)}</select></div>
              </div>

              <div className="section-heading"><i className="fa-solid fa-ruler" />{tr("Area (Sqft)")}</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">{tr("Gross Area")}</label><div className="input-group"><input type="number" step="0.01" name="grossAreaSqft" className="form-control" value={form.grossAreaSqft} onChange={h} /><span className="input-group-text">{tr("sqft")}</span></div></div>
                <div className="form-group"><label className="form-label">{tr("Carpet Area")}</label><div className="input-group"><input type="number" step="0.01" name="carpetAreaSqft" className="form-control" value={form.carpetAreaSqft} onChange={h} /><span className="input-group-text">{tr("sqft")}</span></div></div>
                <div className="form-group"><label className="form-label">{tr("Super Built-up (for price)")}</label><div className="input-group"><input type="number" step="0.01" name="superBuiltUpAreaSqft" className="form-control" value={form.superBuiltUpAreaSqft} onChange={h} /><span className="input-group-text">{tr("sqft")}</span></div></div>
                <div className="form-group"><label className="form-label">{tr("Balcony")}</label><div className="input-group"><input type="number" step="0.01" name="balconyAreaSqft" className="form-control" value={form.balconyAreaSqft} onChange={h} /><span className="input-group-text">{tr("sqft")}</span></div></div>
                <div className="form-group"><label className="form-label">{tr("Car Parks")}</label><input type="number" name="carParkCount" className="form-control" value={form.carParkCount} onChange={h} min="0" /></div>
                <div className="form-group"><label className="form-label">{tr("Facing Direction")}</label><select name="facingDirection" className="form-select" value={form.facingDirection} onChange={h}><option value="">{tr("Select")}</option>{['North','South','East','West','North-East','North-West','South-East','South-West'].map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                <div className="form-group" style={{display:'flex',alignItems:'center',gap:'8px',paddingTop:'24px'}}><input type="checkbox" id="isCorner" name="isCornerUnit" checked={!!form.isCornerUnit} onChange={h} style={{width:'16px',height:'16px'}} /><label htmlFor="isCorner" style={{margin:0}}>{tr("Corner Unit")}</label></div>
              </div>

              <div className="section-heading"><i className="fa-solid fa-bangladeshi-taka-sign" />{tr("Pricing (BDT)")}</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">{tr("Rate per Sqft (৳)")}</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="pricePerSqftBdt" className="form-control" value={form.pricePerSqftBdt} onChange={h} placeholder={tr("e.g. 8000")} /><span className="input-group-text">{tr("/sqft")}</span></div></div>
                <div className="form-group"><label className="form-label">{tr("Flat Price (৳) Auto")}</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="totalPriceBdt" className="form-control" value={form.totalPriceBdt} onChange={h} /></div></div>
                <div className="form-group"><label className="form-label">{tr("Car Park Price (৳)")}</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="carParkPriceBdt" className="form-control" value={form.carParkPriceBdt} onChange={h} /></div></div>
                <div className="form-group"><label className="form-label">{tr("Utility Connection (৳)")}</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="utilityConnectionBdt" className="form-control" value={form.utilityConnectionBdt} onChange={h} /></div></div>
                <div className="form-group" style={{gridColumn:'span 2'}}><label className="form-label fw-bold text-success">{tr("Total Sale Price (৳) — Grand Total")}</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="totalSalePriceBdt" className="form-control fw-bold" value={form.totalSalePriceBdt} onChange={h} /></div></div>
              </div>

              <div className="section-heading"><i className="fa-solid fa-handshake" />{tr("Allocation")}</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">{tr("Allocation")}</label><select name="allocationType" className="form-select" value={form.allocationType} onChange={h}>{['Available','Developer Share','Land Owner Share','Sold','Reserved'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                {form.allocationType==='Land Owner Share' && <div className="form-group"><label className="form-label">{tr("Shareholder")}</label><select name="idShareholders" className="form-select" value={form.idShareholders} onChange={h}><option value="">{tr("Select")}</option>{shareholders.map((s:any)=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div>}
                {['Sold','Reserved'].includes(form.allocationType) && <>
                  <div className="form-group"><label className="form-label">{tr("Buyer Name")}</label><input type="text" name="buyerName" className="form-control" value={form.buyerName} onChange={h} /></div>
                  <div className="form-group"><label className="form-label">{tr("Buyer Phone")}</label><input type="text" name="buyerPhone" className="form-control" value={form.buyerPhone} onChange={h} /></div>
                </>}
                <div className="form-group"><label className="form-label">{tr("Status")}</label><select name="status" className="form-select" value={form.status} onChange={h}>{['Available','Booked','Sold','Under Construction','Handed Over'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              </div>
            </div>
            <div className="card-footer flex-between"><button type="button" className="btn btn-light" onClick={()=>{setShowForm(false);setEditId(null);}}>{tr("Cancel")}</button><button type="submit" className="btn btn-success" disabled={formLoading}>{formLoading?'Saving...':editId?'Update Unit':'Add Unit'}</button></div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-list text-success" />Units ({units.length})</h3>
          <select className="form-select" style={{width:'160px'}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">{tr("All Status")}</option>
            {['Available','Booked','Sold','Under Construction','Handed Over'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="card-body" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>{tr("Unit No.")}</th><th>{tr("Type")}</th><th>BHK</th><th>{tr("Carpet (sqft)")}</th><th>{tr("S.Built-up (sqft)")}</th><th>{tr("Car Parks")}</th><th>{tr("Sale Price (৳)")}</th><th>{tr("Allocation")}</th><th>{tr("Buyer/Owner")}</th><th>{tr("Status")}</th><th>{tr("Actions")}</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={11} style={{textAlign:'center',padding:'40px'}}><div className="flex-center gap-2"><div className="spinner" />{tr("Loading...")}</div></td></tr>
                : units.length===0 ? <tr><td colSpan={11}><div className="empty-state"><i className="fa-solid fa-home" /><h3>{tr("No Units")}</h3><p>{tr("Add units to this building")}</p></div></td></tr>
                : units.map(u => (
                  <tr key={u.id_units}>
                    <td className="fw-bold">{u.unit_no}</td>
                    <td><span className={`badge ${u.unit_type==='Residential Flat'?'badge-success':u.unit_type==='Commercial Space'?'badge-warning':'badge-info'}`}>{u.unit_type}</span></td>
                    <td>{u.bed_count||'—'}</td>
                    <td>{u.carpet_area_sqft ? `${Number(u.carpet_area_sqft).toLocaleString()} sqft` : '—'}</td>
                    <td>{u.super_built_up_area_sqft ? `${Number(u.super_built_up_area_sqft).toLocaleString()} sqft` : '—'}</td>
                    <td className="text-center">{u.car_park_count||0}</td>
                    <td><span className="fw-bold text-primary bdt-amount">{formatBDT(u.total_sale_price_bdt)}</span></td>
                    <td><span className={`badge ${u.allocation_type==='Available'?'badge-success':u.allocation_type==='Land Owner Share'?'badge-info':u.allocation_type==='Sold'?'badge-primary':'badge-gray'}`}>{u.allocation_type}</span></td>
                    <td className="text-sm">{u.buyer_name||u.shareholder_name||'—'}</td>
                    <td><span className={`badge ${statusColors[u.status]||'badge-gray'}`}>{u.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-warning btn-sm btn-icon" onClick={()=>handleEdit(u)}><i className="fa-solid fa-pen" /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={()=>handleDelete(u.id_units,u.unit_no)}><i className="fa-solid fa-trash" /></button>
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
