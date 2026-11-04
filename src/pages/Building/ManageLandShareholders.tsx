
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const EMPTY = { shareholderName:'', fatherName:'', nidNo:'', phone:'', email:'', address:'', landShareKatha:'', landSharePercent:'', landShareSqft:'', entitledFlatAreaSqft:'', entitledFlatCount:'', entitledCarParkCount:'', agreementNo:'', agreementDate:'', paymentMode:'Flat', cashAmountBdt:'', powerOfAttorneyNo:'', powerOfAttorneyDate:'', status:'Active', notes:'' };

export default function ManageLandShareholders() {
  const { id: buildingId } = useParams<{id:string}>();
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [buildingName, setBuildingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...EMPTY});
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get(`/shareholders?id_buildings=${buildingId}&limit=100`) as any,
        api.get(`/shareholders/summary?id_buildings=${buildingId}`) as any,
      ]);
      setRows(listRes.data || []);
      setSummary(sumRes.data || {});
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [buildingId]);

  useEffect(() => {
    fetchData();
    (api.get(`/buildings/${buildingId}`) as any).then((r:any) => setBuildingName(r.building?.building_name||'')).catch(()=>{});
  }, [buildingId]);

  // Auto-calc sqft
  useEffect(() => {
    const k = parseFloat(form.landShareKatha);
    if (!isNaN(k) && k > 0) setForm(f=>({...f, landShareSqft:(k*720).toFixed(2)}));
  }, [form.landShareKatha]);

  const h = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f=>({...f, [e.target.name]: e.target.value}));

  const remaining = Math.max(0, 100 - parseFloat(summary.total_share_percent||'0'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError('');
    try {
      const payload = {
        idBuildings: parseInt(buildingId!),
        shareholderName: form.shareholderName, fatherName: form.fatherName||null,
        nidNo: form.nidNo||null, phone: form.phone||null, email: form.email||null, address: form.address||null,
        landShareKatha: parseFloat(form.landShareKatha), landSharePercent: parseFloat(form.landSharePercent),
        landShareSqft: form.landShareSqft ? parseFloat(form.landShareSqft) : null,
        entitledFlatAreaSqft: form.entitledFlatAreaSqft ? parseFloat(form.entitledFlatAreaSqft) : null,
        entitledFlatCount: form.entitledFlatCount ? parseInt(form.entitledFlatCount) : null,
        entitledCarParkCount: form.entitledCarParkCount ? parseFloat(form.entitledCarParkCount) : null,
        agreementNo: form.agreementNo||null, agreementDate: form.agreementDate||null,
        paymentMode: form.paymentMode||null, cashAmountBdt: form.cashAmountBdt ? parseFloat(form.cashAmountBdt) : null,
        powerOfAttorneyNo: form.powerOfAttorneyNo||null, powerOfAttorneyDate: form.powerOfAttorneyDate||null,
        status: form.status, notes: form.notes||null,
      };
      const res: any = editId ? await api.put(`/shareholders/${editId}`, payload) : await api.post('/shareholders', payload);
      if (!res.success) { setError(res.message); return; }
      setForm({...EMPTY}); setEditId(null); setShowForm(false);
      fetchData();
    } catch(e:any) { setError(e.message||'Server error'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (s: any) => {
    setForm({ shareholderName:s.shareholder_name||'', fatherName:s.father_name||'', nidNo:s.nid_no||'', phone:s.phone||'', email:s.email||'', address:s.address||'', landShareKatha:s.land_share_katha||'', landSharePercent:s.land_share_percent||'', landShareSqft:s.land_share_sqft||'', entitledFlatAreaSqft:s.entitled_flat_area_sqft||'', entitledFlatCount:s.entitled_flat_count?.toString()||'', entitledCarParkCount:s.entitled_car_park_count||'', agreementNo:s.agreement_no||'', agreementDate:s.agreement_date?s.agreement_date.split('T')[0]:'', paymentMode:s.payment_mode||'Flat', cashAmountBdt:s.cash_amount_bdt||'', powerOfAttorneyNo:s.power_of_attorney_no||'', powerOfAttorneyDate:s.power_of_attorney_date?s.power_of_attorney_date.split('T')[0]:'', status:s.status||'Active', notes:s.notes||'' });
    setEditId(s.id_shareholders); setShowForm(true);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove shareholder "${name}"?`)) return;
    try {
      const res: any = await api.delete(`/shareholders/${id}`);
      if (!res.success) { alert(res.message); return; }
      fetchData();
    } catch(e:any) { alert(e.message); }
  };

  const pct = parseFloat(summary.total_share_percent||'0');

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb mb-2">
            <Link to="/buildings">Buildings</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to={`/buildings/details/${buildingId}`}>{buildingName}</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Shareholders</span>
          </div>
          <h1 className="page-title"><i className="fa-solid fa-users text-info" />Land Shareholders — {buildingName}</h1>
        </div>
        <button className="btn btn-primary" onClick={()=>{setShowForm(true);setEditId(null);setForm({...EMPTY});}}>
          <i className="fa-solid fa-plus" /> Add Shareholder
        </button>
      </div>

      {/* Share Summary */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="stats-grid" style={{marginBottom:'16px'}}>
            <div className="stat-card stat-info"><div className="stat-value">{summary.shareholder_count||0}</div><div className="stat-label">Shareholders</div></div>
            <div className="stat-card stat-primary"><div className="stat-value">{Number(summary.total_share_katha||0).toFixed(2)}</div><div className="stat-label">Total Share (কাঠা)</div></div>
            <div className={`stat-card ${pct>100?'stat-danger':pct>=100?'stat-success':'stat-warning'}`}><div className="stat-value">{pct.toFixed(2)}%</div><div className="stat-label">Allocated (%)</div></div>
            <div className={`stat-card ${remaining===0?'stat-success':'stat-warning'}`}><div className="stat-value">{remaining.toFixed(2)}%</div><div className="stat-label">Remaining</div></div>
          </div>
          <div style={{marginBottom:'4px',display:'flex',justifyContent:'space-between',fontSize:'0.8rem'}}>
            <span className="text-muted">Share Allocation Progress</span>
            <span className={`fw-bold ${pct>=100?'text-success':'text-warning'}`}>{pct.toFixed(2)}% / 100%</span>
          </div>
          <div className="progress">
            <div className={`progress-bar ${pct>100?'danger':pct>=100?'success':'warning'}`} style={{width:`${Math.min(100,pct)}%`}} />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title"><i className={`fa-solid ${editId?'fa-pen-to-square text-warning':'fa-user-plus text-success'}`} />{editId?'Edit Shareholder':'Add New Shareholder'}</h3>
            <button className="btn btn-light btn-sm" onClick={()=>{setShowForm(false);setEditId(null);}}><i className="fa-solid fa-times" /></button>
          </div>
          {error && <div className="alert alert-danger" style={{margin:'0 20px'}}><i className="fa-solid fa-circle-exclamation" />{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="section-heading"><i className="fa-solid fa-person" />Personal Information</div>
              <div className="form-row cols-3">
                <div className="form-group"><label className="form-label required">Full Name (পূর্ণ নাম)</label><input type="text" name="shareholderName" className="form-control" value={form.shareholderName} onChange={h} required /></div>
                <div className="form-group"><label className="form-label">Father's Name (পিতার নাম)</label><input type="text" name="fatherName" className="form-control" value={form.fatherName} onChange={h} /></div>
                <div className="form-group"><label className="form-label">NID No. (জাতীয় পরিচয়পত্র)</label><input type="text" name="nidNo" className="form-control" value={form.nidNo} onChange={h} placeholder="17-digit NID" /></div>
                <div className="form-group"><label className="form-label">Phone</label><input type="text" name="phone" className="form-control" value={form.phone} onChange={h} placeholder="01XXXXXXXXX" /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" name="email" className="form-control" value={form.email} onChange={h} /></div>
                <div className="form-group"><label className="form-label">Address</label><input type="text" name="address" className="form-control" value={form.address} onChange={h} /></div>
              </div>

              <div className="section-heading"><i className="fa-solid fa-map" />Land Share (ভূমির অংশ)</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label required">Share (কাঠা)</label><div className="input-group"><input type="number" step="0.0001" name="landShareKatha" className="form-control" value={form.landShareKatha} onChange={h} required /><span className="input-group-text">কাঠা</span></div></div>
                <div className="form-group"><label className="form-label required">Share (%)</label><div className="input-group"><input type="number" step="0.01" name="landSharePercent" className="form-control" value={form.landSharePercent} onChange={h} min="0" max="100" required placeholder={`Available: ${remaining.toFixed(2)}%`} /><span className="input-group-text">%</span></div><div className="form-text">Remaining: {remaining.toFixed(2)}%</div></div>
                <div className="form-group"><label className="form-label">Share (Sqft) Auto</label><div className="input-group"><input type="number" name="landShareSqft" className="form-control" value={form.landShareSqft} onChange={h} /><span className="input-group-text">sqft</span></div></div>
                <div className="form-group"><label className="form-label">Payment Mode</label><select name="paymentMode" className="form-select" value={form.paymentMode} onChange={h}>{['Cash','Flat','Cash + Flat','Plot'].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
              </div>

              <div className="section-heading"><i className="fa-solid fa-home" />Flat Entitlement</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">Entitled Flat Area</label><div className="input-group"><input type="number" step="0.01" name="entitledFlatAreaSqft" className="form-control" value={form.entitledFlatAreaSqft} onChange={h} /><span className="input-group-text">sqft</span></div></div>
                <div className="form-group"><label className="form-label">No. of Flats</label><input type="number" name="entitledFlatCount" className="form-control" value={form.entitledFlatCount} onChange={h} /></div>
                <div className="form-group"><label className="form-label">Car Parks</label><input type="number" step="0.5" name="entitledCarParkCount" className="form-control" value={form.entitledCarParkCount} onChange={h} /></div>
                {(form.paymentMode==='Cash'||form.paymentMode==='Cash + Flat') && <div className="form-group"><label className="form-label">Cash Amount (৳)</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="cashAmountBdt" className="form-control" value={form.cashAmountBdt} onChange={h} /></div></div>}
              </div>

              <div className="section-heading"><i className="fa-solid fa-file-signature" />Agreement Details</div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">Agreement No.</label><input type="text" name="agreementNo" className="form-control" value={form.agreementNo} onChange={h} /></div>
                <div className="form-group"><label className="form-label">Agreement Date</label><input type="date" name="agreementDate" className="form-control" value={form.agreementDate} onChange={h} /></div>
                <div className="form-group"><label className="form-label">Power of Attorney No.</label><input type="text" name="powerOfAttorneyNo" className="form-control" value={form.powerOfAttorneyNo} onChange={h} /></div>
                <div className="form-group"><label className="form-label">POA Date</label><input type="date" name="powerOfAttorneyDate" className="form-control" value={form.powerOfAttorneyDate} onChange={h} /></div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label">Status</label><select name="status" className="form-select" value={form.status} onChange={h}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={h} /></div>
              </div>
            </div>
            <div className="card-footer flex-between">
              <button type="button" className="btn btn-light" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? <><div className="spinner" style={{width:'16px',height:'16px'}} />Saving...</> : <><i className={`fa-solid ${editId?'fa-floppy-disk':'fa-user-plus'}`} />{editId?'Update':'Add Shareholder'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-list text-info" />Shareholders ({rows.length})</h3></div>
        <div className="card-body" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>NID</th><th>Phone</th><th>Share (কাঠা)</th><th>Share (%)</th><th>Flats</th><th>Flat Area</th><th>Payment Mode</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={11} style={{textAlign:'center',padding:'40px'}}><div className="flex-center gap-2"><div className="spinner" />Loading...</div></td></tr>
                : rows.length===0 ? <tr><td colSpan={11}><div className="empty-state"><i className="fa-solid fa-users" /><h3>No Shareholders</h3><p>Click "Add Shareholder" to add land shareholders</p></div></td></tr>
                : rows.map((s, i) => (
                  <tr key={s.id_shareholders}>
                    <td>{i+1}</td>
                    <td><div className="fw-bold">{s.shareholder_name}</div>{s.father_name&&<div className="text-xs text-muted">S/O {s.father_name}</div>}</td>
                    <td className="text-sm">{s.nid_no||'—'}</td>
                    <td>{s.phone||'—'}</td>
                    <td className="fw-semibold">{Number(s.land_share_katha).toFixed(4)} কাঠা</td>
                    <td><span className="badge badge-primary">{Number(s.land_share_percent).toFixed(2)}%</span></td>
                    <td className="text-center">{s.entitled_flat_count||'—'}</td>
                    <td>{s.entitled_flat_area_sqft ? `${Number(s.entitled_flat_area_sqft).toLocaleString()} sqft` : '—'}</td>
                    <td><span className="badge badge-info">{s.payment_mode||'—'}</span></td>
                    <td><span className={`badge ${s.status==='Active'?'badge-success':'badge-danger'}`}>{s.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-warning btn-sm btn-icon" onClick={()=>handleEdit(s)}><i className="fa-solid fa-pen" /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={()=>handleDelete(s.id_shareholders,s.shareholder_name)}><i className="fa-solid fa-trash" /></button>
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
