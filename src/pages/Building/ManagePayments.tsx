
import React, { useState, useEffect, useCallback } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const formatBDT = (v:any) => v ? `৳ ${Number(v).toLocaleString('en-BD')}` : '—';
const EMPTY = { idUnits:'', installmentType:'Booking', amountBdt:'', paymentDate:'', paymentMethod:'Cash', chequeNo:'', bankName:'', transactionId:'', status:'Received', remarks:'' };

export default function ManagePayments() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const { id: buildingId } = useParams<{id:string}>();
  const [payments, setPayments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [buildingName, setBuildingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...EMPTY});
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments?id_buildings=${buildingId}&limit=100`) as any;
      setPayments(res.data||[]);
      setTotal(res.data?.reduce((s:number,p:any)=>p.status==='Received'?s+Number(p.amount_bdt):s, 0)||0);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [buildingId]);

  useEffect(() => {
    fetchData();
    (api.get(`/buildings/${buildingId}`) as any).then((r:any) => setBuildingName(r.building?.building_name||'')).catch(()=>{});
    (api.get(`/units?id_buildings=${buildingId}&limit=200`) as any).then((r:any) => setUnits(r.data||[])).catch(()=>{});
  }, [buildingId]);

  const h = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError('');
    try {
      const payload = { idUnits:parseInt(form.idUnits), idBuildings:parseInt(buildingId!), installmentType:form.installmentType, amountBdt:parseFloat(form.amountBdt), paymentDate:form.paymentDate, paymentMethod:form.paymentMethod, chequeNo:form.chequeNo||null, bankName:form.bankName||null, transactionId:form.transactionId||null, status:form.status, remarks:form.remarks||null };
      const res: any = await api.post('/payments', payload);
      if (!res.success) { setError(res.message); return; }
      setForm({...EMPTY}); setShowForm(false); fetchData();
    } catch(e:any) { setError(e.message||'Server error'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payment record?')) return;
    await api.delete(`/payments/${id}`);
    fetchData();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb mb-2">
            <Link to="/buildings">{tr("Buildings")}</Link><span className="breadcrumb-sep">/</span>
            <Link to={`/buildings/details/${buildingId}`}>{buildingName}</Link><span className="breadcrumb-sep">/</span>
            <span>{tr("Payments")}</span>
          </div>
          <h1 className="page-title"><i className="fa-solid fa-money-bills text-success" />{tr("Unit Payments")} — {buildingName}</h1>
        </div>
        <button className="btn btn-success" onClick={()=>setShowForm(true)}><i className="fa-solid fa-plus" /> {tr("Record Payment")}</button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card stat-success"><div className="stat-value" style={{fontSize:'1.1rem'}}>{formatBDT(total)}</div><div className="stat-label">{tr("Total Received")}</div></div>
        <div className="stat-card stat-primary"><div className="stat-value">{payments.filter(p=>p.status==='Received').length}</div><div className="stat-label">{tr("Payments")}</div></div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-money-bill-wave text-success" />{tr("Record Payment")}</h3><button className="btn btn-light btn-sm" onClick={()=>setShowForm(false)}><i className="fa-solid fa-times" /></button></div>
          {error && <div className="alert alert-danger" style={{margin:'0 20px'}}><i className="fa-solid fa-circle-exclamation" />{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="form-row cols-3">
                <div className="form-group"><label className="form-label required">{tr("Unit")}</label><select name="idUnits" className="form-select" value={form.idUnits} onChange={h} required><option value="">{tr("Select Unit")}</option>{units.map(u=><option key={u.id_units} value={u.id_units}>{u.unit_no} — {u.buyer_name||'Available'}</option>)}</select></div>
                <div className="form-group"><label className="form-label required">{tr("Installment Type")}</label><select name="installmentType" className="form-select" value={form.installmentType} onChange={h}>{['Booking','Down Payment','Installment 1','Installment 2','Installment 3','Installment 4','Final Payment','Registration'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label required">{tr("Amount (৳)")}</label><div className="input-group input-group-prepend"><span className="input-group-text">৳</span><input type="number" step="0.01" name="amountBdt" className="form-control" value={form.amountBdt} onChange={h} required /></div></div>
                <div className="form-group"><label className="form-label required">{tr("Payment Date")}</label><input type="date" name="paymentDate" className="form-control" value={form.paymentDate} onChange={h} required /></div>
                <div className="form-group"><label className="form-label required">{tr("Method")}</label><select name="paymentMethod" className="form-select" value={form.paymentMethod} onChange={h}>{['Cash','Cheque','Bank Transfer','bKash','Nagad','Rocket','Other'].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                <div className="form-group"><label className="form-label">{tr("Status")}</label><select name="status" className="form-select" value={form.status} onChange={h}>{['Pending','Received','Bounced','Cancelled'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                {form.paymentMethod==='Cheque' && <div className="form-group"><label className="form-label">{tr("Cheque No.")}</label><input type="text" name="chequeNo" className="form-control" value={form.chequeNo} onChange={h} /></div>}
                {form.paymentMethod==='Bank Transfer' && <><div className="form-group"><label className="form-label">{tr("Bank Name")}</label><input type="text" name="bankName" className="form-control" value={form.bankName} onChange={h} /></div><div className="form-group"><label className="form-label">{tr("Transaction ID")}</label><input type="text" name="transactionId" className="form-control" value={form.transactionId} onChange={h} /></div></>}
                {['bKash','Nagad','Rocket'].includes(form.paymentMethod) && <div className="form-group"><label className="form-label">{tr("Transaction ID")}</label><input type="text" name="transactionId" className="form-control" value={form.transactionId} onChange={h} /></div>}
              </div>
            </div>
            <div className="card-footer flex-between"><button type="button" className="btn btn-light" onClick={()=>setShowForm(false)}>{tr("Cancel")}</button><button type="submit" className="btn btn-success" disabled={formLoading}>{formLoading?'Saving...':'Record Payment'}</button></div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>{tr("Unit")}</th><th>{tr("Type")}</th><th>{tr("Amount (৳)")}</th><th>{tr("Date")}</th><th>{tr("Method")}</th><th>{tr("Reference")}</th><th>{tr("Status")}</th><th>{tr("Actions")}</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} style={{textAlign:'center',padding:'40px'}}><div className="flex-center gap-2"><div className="spinner" />{tr("Loading...")}</div></td></tr>
                : payments.length===0 ? <tr><td colSpan={9}><div className="empty-state"><i className="fa-solid fa-money-bill" /><h3>{tr("No Payments")}</h3></div></td></tr>
                : payments.map((p,i) => (
                  <tr key={p.id_payments}>
                    <td>{i+1}</td>
                    <td className="fw-bold">{p.unit_no||'—'}</td>
                    <td><span className="badge badge-info">{p.installment_type}</span></td>
                    <td className="fw-bold text-success bdt-amount">{formatBDT(p.amount_bdt)}</td>
                    <td>{p.payment_date?.split('T')[0]}</td>
                    <td>{p.payment_method}</td>
                    <td className="text-sm text-muted">{p.cheque_no||p.transaction_id||'—'}</td>
                    <td><span className={`badge ${p.status==='Received'?'badge-success':p.status==='Bounced'?'badge-danger':p.status==='Cancelled'?'badge-gray':'badge-warning'}`}>{p.status}</span></td>
                    <td><button className="btn btn-danger btn-sm btn-icon" onClick={()=>handleDelete(p.id_payments)}><i className="fa-solid fa-trash" /></button></td>
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
