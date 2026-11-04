
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const formatBDT = (v:any) => v ? `৳ ${Number(v).toLocaleString('en-BD')}` : '—';
const CATEGORIES = ['Land Cost','Land Registration','Stamp Duty & Legal','RAJUK/Authority Approval','Foundation & Piling','RCC Frame Structure','Brick Work & Masonry','Plastering & Finishing','Doors & Windows','Electrical Work','Plumbing & Sanitary','Gas Line','Lift Installation','Roofing & Waterproofing','Tiles & Flooring','Paint Work','Security System & CCTV','Generator & Backup','Landscaping','Car Park Construction','Common Area Finishing','Utility Connection (WASA, PDB, Gas)','Project Management','Contingency','Other'];
const EMPTY = { costCategory:'', description:'', quantity:'', unit:'sqft', rateBdt:'', amountBdt:'', vatPercent:'0', vatAmountBdt:'0', totalWithVatBdt:'', costType:'Construction', costDate:'', paymentStatus:'Budgeted', paidAmountBdt:'0', remarks:'' };

export default function ManageBuildingCosting() {
  const { id: buildingId } = useParams<{id:string}>();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [buildingName, setBuildingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...EMPTY});
  const [bdRates, setBdRates] = useState<any>({});
  const [showRates, setShowRates] = useState(false);
  const [activeView, setActiveView] = useState<'table'|'summary'>('table');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get(`/costing?id_buildings=${buildingId}&limit=200`) as any,
        api.get(`/costing/summary?id_buildings=${buildingId}`) as any,
      ]);
      setEntries(listRes.data||[]);
      setSummary(sumRes);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [buildingId]);

  useEffect(() => {
    fetchData();
    (api.get(`/buildings/${buildingId}`) as any).then((r:any)=>setBuildingName(r.building?.building_name||'')).catch(()=>{});
    (api.get('/costing/bd-rates') as any).then((r:any)=>setBdRates(r.data||{})).catch(()=>{});
  }, [buildingId]);

  const h = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f=>({...f,[e.target.name]:e.target.value}));

  // Auto-calc amount
  useEffect(() => {
    const qty = parseFloat(form.quantity);
    const rate = parseFloat(form.rateBdt);
    if (!isNaN(qty) && !isNaN(rate) && qty>0 && rate>0) setForm(f=>({...f, amountBdt:(qty*rate).toFixed(2)}));
  }, [form.quantity, form.rateBdt]);

  // Auto-calc VAT
  useEffect(() => {
    const amount = parseFloat(form.amountBdt)||0;
    const vatPct = parseFloat(form.vatPercent)||0;
    const vatAmt = (amount*vatPct/100).toFixed(2);
    setForm(f=>({...f, vatAmountBdt:vatAmt, totalWithVatBdt:(amount+parseFloat(vatAmt)).toFixed(2)}));
  }, [form.amountBdt, form.vatPercent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError('');
    try {
      const payload = {
        idBuildings:parseInt(buildingId!), costCategory:form.costCategory, description:form.description||null,
        quantity:form.quantity?parseFloat(form.quantity):null, unit:form.unit||null,
        rateBdt:form.rateBdt?parseFloat(form.rateBdt):null, amountBdt:parseFloat(form.amountBdt),
        vatPercent:parseFloat(form.vatPercent)||0, vatAmountBdt:parseFloat(form.vatAmountBdt)||0,
        totalWithVatBdt:parseFloat(form.totalWithVatBdt)||null, costType:form.costType,
        costDate:form.costDate||null, paymentStatus:form.paymentStatus,
        paidAmountBdt:parseFloat(form.paidAmountBdt)||0, remarks:form.remarks||null,
      };
      const res: any = editId ? await api.put(`/costing/${editId}`, payload) : await api.post('/costing', payload);
      if (!res.success) { setError(res.message); return; }
      setForm({...EMPTY}); setEditId(null); setShowForm(false); fetchData();
    } catch(e:any) { setError(e.message||'Server error'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (entry: any) => {
    setForm({ costCategory:entry.cost_category||'', description:entry.description||'', quantity:entry.quantity||'', unit:entry.unit||'sqft', rateBdt:entry.rate_bdt||'', amountBdt:entry.amount_bdt||'', vatPercent:entry.vat_percent||'0', vatAmountBdt:'0', totalWithVatBdt:entry.total_with_vat_bdt||'', costType:entry.cost_type||'Construction', costDate:entry.cost_date?entry.cost_date.split('T')[0]:'', paymentStatus:entry.payment_status||'Budgeted', paidAmountBdt:entry.paid_amount_bdt||'0', remarks:entry.remarks||'' });
    setEditId(entry.id_costing); setShowForm(true);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleDelete = async (id:number, category:string) => {
    if (!confirm(`Delete cost entry "${category}"?`)) return;
    await api.delete(`/costing/${id}`);
    fetchData();
  };

  const gt = summary.grandTotal || {};
  const payColors: Record<string,string> = { Budgeted:'badge-info', 'Partially Paid':'badge-warning', Paid:'badge-success' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb mb-2"><Link to="/buildings">Buildings</Link><span className="breadcrumb-sep">/</span><Link to={`/buildings/details/${buildingId}`}>{buildingName}</Link><span className="breadcrumb-sep">/</span><span>Costing</span></div>
          <h1 className="page-title"><i className="fa-solid fa-calculator text-primary" />Construction Costing — {buildingName}</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-light" onClick={()=>setShowRates(!showRates)}><i className="fa-solid fa-book" /> BD Rate Ref.</button>
          <button className="btn btn-primary" onClick={()=>{setShowForm(true);setEditId(null);setForm({...EMPTY});}}><i className="fa-solid fa-plus" /> Add Entry</button>
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="stats-grid mb-4">
        <div className="stat-card stat-primary"><div className="stat-value" style={{fontSize:'1.1rem'}}>{formatBDT(gt.total_budget_bdt)}</div><div className="stat-label">Total Budget</div></div>
        <div className="stat-card stat-success"><div className="stat-value" style={{fontSize:'1.1rem'}}>{formatBDT(gt.total_paid_bdt)}</div><div className="stat-label">Total Paid</div></div>
        <div className="stat-card stat-warning"><div className="stat-value" style={{fontSize:'1.1rem'}}>{formatBDT(Math.max(0,Number(gt.total_budget_bdt)-Number(gt.total_paid_bdt)))}</div><div className="stat-label">Remaining</div></div>
        <div className="stat-card stat-info"><div className="stat-value">{summary.costPerSqft ? `৳ ${Number(summary.costPerSqft).toLocaleString()}/sqft` : 'N/A'}</div><div className="stat-label">Cost/Sqft</div></div>
        <div className="stat-card stat-danger"><div className="stat-value">{gt.entry_count||0}</div><div className="stat-label">Total Entries</div></div>
      </div>

      {/* BD Rate Reference */}
      {showRates && (
        <div className="card mb-4" style={{borderColor:'var(--primary)'}}>
          <div className="card-header" style={{background:'var(--primary-light)'}}>
            <h3 className="card-title text-primary"><i className="fa-solid fa-book" />Bangladesh Construction Reference Rates (2025-26)</h3>
            <button className="btn btn-light btn-sm" onClick={()=>setShowRates(false)}><i className="fa-solid fa-times" /></button>
          </div>
          <div className="card-body">
            <div className="grid grid-2">
              {Object.entries(bdRates).filter(([,v])=>typeof v==='object'&&v!==null&&!Array.isArray(v)).map(([section, items]) => (
                <div key={section}>
                  <h6 className="section-heading">{section.replace(/([A-Z])/g,' $1').trim()}</h6>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Item</th><th>Unit</th><th>Min (৳)</th><th>Max (৳)</th></tr></thead>
                      <tbody>
                        {Object.entries(items as Record<string,any>).map(([item,data]) => (
                          <tr key={item}>
                            <td style={{fontSize:'0.78rem'}}>{item}</td>
                            <td>{data.unit||'ls'}</td>
                            <td style={{color:'var(--success)'}}>{data.minRate ? formatBDT(data.minRate) : data.note||'—'}</td>
                            <td style={{color:'var(--danger)'}}>{data.maxRate ? formatBDT(data.maxRate) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <div className="alert alert-warning mt-4 mb-0"><i className="fa-solid fa-triangle-exclamation" /><span>Approximate rates for Bangladesh 2025-26. Verify with local contractors before budgeting.</span></div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className={`fa-solid ${editId?'fa-pen-to-square text-warning':'fa-plus-circle text-primary'}`} />{editId?'Edit Cost Entry':'Add Cost Entry'}</h3><button className="btn btn-light btn-sm" onClick={()=>{setShowForm(false);setEditId(null);}}><i className="fa-solid fa-times" /></button></div>
          {error && <div className="alert alert-danger" style={{margin:'0 20px'}}><i className="fa-solid fa-circle-exclamation" />{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="form-row cols-3">
                <div className="form-group"><label className="form-label required">Cost Category</label><select name="costCategory" className="form-select" value={form.costCategory} onChange={h} required><option value="">Select Category</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Cost Type</label><select name="costType" className="form-select" value={form.costType} onChange={h}>{['Land','Construction','Approval','Utility','Administrative','Other'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group" style={{gridColumn:'span 1'}}><label className="form-label">Description</label><input type="text" name="description" className="form-control" value={form.description} onChange={h} placeholder="e.g. 10-storey RCC structure" /></div>
              </div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">Quantity</label><input type="number" step="0.0001" name="quantity" className="form-control" value={form.quantity} onChange={h} /></div>
                <div className="form-group"><label className="form-label">Unit</label><select name="unit" className="form-select" value={form.unit} onChange={h}>{['sqft','rft','cft','nos','kg','ton','litre','ls','month','day'].map(u=><option key={u} value={u}>{u}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Rate (৳/unit)</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="rateBdt" className="form-control" value={form.rateBdt} onChange={h} /></div></div>
                <div className="form-group"><label className="form-label required">Amount (৳) Auto</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="amountBdt" className="form-control fw-bold" value={form.amountBdt} onChange={h} required /></div></div>
              </div>
              <div className="form-row cols-4">
                <div className="form-group"><label className="form-label">VAT (%)</label><div className="input-group"><input type="number" step="0.01" name="vatPercent" className="form-control" value={form.vatPercent} onChange={h} /><span className="input-group-text">%</span></div></div>
                <div className="form-group"><label className="form-label">Total with VAT (৳)</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="totalWithVatBdt" className="form-control" value={form.totalWithVatBdt} readOnly style={{background:'var(--gray-50)'}} /></div></div>
                <div className="form-group"><label className="form-label">Cost Date</label><input type="date" name="costDate" className="form-control" value={form.costDate} onChange={h} /></div>
                <div className="form-group"><label className="form-label">Payment Status</label><select name="paymentStatus" className="form-select" value={form.paymentStatus} onChange={h}>{['Budgeted','Partially Paid','Paid'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="form-row cols-3">
                <div className="form-group"><label className="form-label">Paid Amount (৳)</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="paidAmountBdt" className="form-control" value={form.paidAmountBdt} onChange={h} /></div></div>
                <div className="form-group" style={{gridColumn:'span 2'}}><label className="form-label">Remarks</label><input type="text" name="remarks" className="form-control" value={form.remarks} onChange={h} /></div>
              </div>
            </div>
            <div className="card-footer flex-between"><button type="button" className="btn btn-light" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</button><button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading?'Saving...':editId?'Update Entry':'Add Entry'}</button></div>
          </form>
        </div>
      )}

      {/* Table/Summary toggle */}
      <div className="card">
        <div className="card-header">
          <div className="flex gap-2">
            <button className={`btn ${activeView==='table'?'btn-primary':'btn-light'} btn-sm`} onClick={()=>setActiveView('table')}><i className="fa-solid fa-table" /> Entries</button>
            <button className={`btn ${activeView==='summary'?'btn-primary':'btn-light'} btn-sm`} onClick={()=>setActiveView('summary')}><i className="fa-solid fa-chart-pie" /> Summary</button>
          </div>
        </div>
        <div className="card-body" style={{padding:activeView==='table'?0:'20px'}}>
          {activeView==='table' ? (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Category</th><th>Type</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate (৳)</th><th>Amount (৳)</th><th>Paid (৳)</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={12} style={{textAlign:'center',padding:'40px'}}><div className="flex-center gap-2"><div className="spinner" />Loading...</div></td></tr>
                  : entries.length===0 ? <tr><td colSpan={12}><div className="empty-state"><i className="fa-solid fa-calculator" /><h3>No Cost Entries</h3><p>Add your first cost entry</p></div></td></tr>
                  : entries.map((e,i) => (
                    <tr key={e.id_costing}>
                      <td>{i+1}</td>
                      <td className="fw-semibold" style={{fontSize:'0.8rem'}}>{e.cost_category}</td>
                      <td><span className="badge badge-gray" style={{fontSize:'0.68rem'}}>{e.cost_type}</span></td>
                      <td className="text-muted" style={{fontSize:'0.8rem',maxWidth:'180px'}}>{e.description||'—'}</td>
                      <td>{e.quantity||'—'}</td>
                      <td>{e.unit||'—'}</td>
                      <td>{e.rate_bdt ? formatBDT(e.rate_bdt) : '—'}</td>
                      <td className="fw-bold">{formatBDT(e.amount_bdt)}</td>
                      <td style={{color:'var(--success)'}}>{formatBDT(e.paid_amount_bdt)}</td>
                      <td><span className={`badge ${payColors[e.payment_status]||'badge-gray'}`}>{e.payment_status}</span></td>
                      <td style={{fontSize:'0.78rem'}}>{e.cost_date?.split('T')[0]||'—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-warning btn-sm btn-icon" onClick={()=>handleEdit(e)}><i className="fa-solid fa-pen" /></button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={()=>handleDelete(e.id_costing,e.cost_category)}><i className="fa-solid fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {entries.length > 0 && (
                  <tfoot><tr><td colSpan={7} className="text-right">TOTAL:</td><td>{formatBDT(gt.total_budget_bdt)}</td><td>{formatBDT(gt.total_paid_bdt)}</td><td colSpan={3}></td></tr></tfoot>
                )}
              </table>
            </div>
          ) : (
            <div className="grid grid-2">
              <div>
                <h5 className="section-heading"><i className="fa-solid fa-tags" />By Cost Type</h5>
                <table><thead><tr><th>Type</th><th>Budget (৳)</th><th>Paid (৳)</th></tr></thead>
                <tbody>{(summary.byType||[]).map((t:any)=><tr key={t.cost_type}><td className="fw-semibold">{t.cost_type}</td><td>{formatBDT(t.total_bdt)}</td><td style={{color:'var(--success)'}}>{formatBDT(t.total_paid)}</td></tr>)}</tbody></table>
              </div>
              <div>
                <h5 className="section-heading"><i className="fa-solid fa-list-check" />Top Categories</h5>
                <table><thead><tr><th>Category</th><th>Budget (৳)</th><th>Paid (৳)</th></tr></thead>
                <tbody>{(summary.byCategory||[]).slice(0,12).map((c:any)=><tr key={c.cost_category}><td style={{fontSize:'0.78rem'}}>{c.cost_category}</td><td className="fw-bold">{formatBDT(c.total_bdt)}</td><td style={{color:'var(--success)'}}>{formatBDT(c.total_paid)}</td></tr>)}</tbody></table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
