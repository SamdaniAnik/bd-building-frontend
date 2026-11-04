
import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const BD_DISTRICTS = ['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh','Gazipur','Narayanganj','Comilla',"Cox's Bazar",'Jessore','Bogra','Dinajpur','Tangail','Faridpur','Noakhali','Brahmanbaria','Pabna'];

const init = {
  buildingName:'', buildingCode:'', buildingType:'Residential',
  totalLandAreaKatha:'', totalLandAreaSqft:'', farRatio:'', totalBuildableAreaSqft:'',
  district:'', upazila:'', mouza:'', dagNo:'', khatianNo:'', address:'',
  totalFloors:'', basementFloors:'0', totalUnits:'',
  rajukApprovalNo:'', rajukApprovalDate:'', approvalAuthority:'',
  landPurchaseCost:'', estimatedConstructionCost:'',
  status:'Planning', startDate:'', completionDate:'', notes:'',
};

export default function CreateEditBuilding() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({...init});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      api.get(`/buildings/${id}`).then((res:any) => {
        const b = res.building;
        setForm({
          buildingName: b.building_name||'', buildingCode: b.building_code||'', buildingType: b.building_type||'Residential',
          totalLandAreaKatha: b.total_land_area||'', totalLandAreaSqft: b.total_land_area_sqft||'',
          farRatio: b.far_ratio||'', totalBuildableAreaSqft: b.total_buildable_area_sqft||'',
          district: b.district||'', upazila: b.upazila||'', mouza: b.mouza||'', dagNo: b.dag_no||'', khatianNo: b.khatian_no||'', address: b.address||'',
          totalFloors: b.total_floors||'', basementFloors: b.basement_floors||'0', totalUnits: b.total_units||'',
          rajukApprovalNo: b.rajuk_approval_no||'', rajukApprovalDate: b.rajuk_approval_date?b.rajuk_approval_date.split('T')[0]:'', approvalAuthority: b.approval_authority||'',
          landPurchaseCost: b.land_purchase_cost||'', estimatedConstructionCost: b.estimated_construction_cost||'',
          status: b.status||'Planning', startDate: b.start_date?b.start_date.split('T')[0]:'', completionDate: b.completion_date?b.completion_date.split('T')[0]:'', notes: b.notes||'',
        });
      }).catch(()=>setError('Failed to load building')).finally(()=>setFetching(false));
    }
  }, [id]);

  // Auto-calc sqft from katha (1 katha = 720 sqft)
  useEffect(() => {
    const k = parseFloat(form.totalLandAreaKatha);
    if (!isNaN(k) && k > 0) setForm(f=>({...f, totalLandAreaSqft: (k*720).toFixed(2)}));
  }, [form.totalLandAreaKatha]);

  const h = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f=>({...f, [e.target.name]: e.target.value}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload: any = {
        buildingName: form.buildingName, buildingCode: form.buildingCode||null, buildingType: form.buildingType,
        totalLandAreaKatha: parseFloat(form.totalLandAreaKatha),
        totalLandAreaSqft: form.totalLandAreaSqft ? parseFloat(form.totalLandAreaSqft) : null,
        farRatio: form.farRatio ? parseFloat(form.farRatio) : null,
        totalBuildableAreaSqft: form.totalBuildableAreaSqft ? parseFloat(form.totalBuildableAreaSqft) : null,
        district: form.district||null, upazila: form.upazila||null, mouza: form.mouza||null,
        dagNo: form.dagNo||null, khatianNo: form.khatianNo||null, address: form.address||null,
        totalFloors: form.totalFloors ? parseInt(form.totalFloors) : null,
        basementFloors: parseInt(form.basementFloors)||0,
        totalUnits: form.totalUnits ? parseInt(form.totalUnits) : null,
        rajukApprovalNo: form.rajukApprovalNo||null, rajukApprovalDate: form.rajukApprovalDate||null,
        approvalAuthority: form.approvalAuthority||null,
        landPurchaseCost: form.landPurchaseCost ? parseFloat(form.landPurchaseCost) : null,
        estimatedConstructionCost: form.estimatedConstructionCost ? parseFloat(form.estimatedConstructionCost) : null,
        status: form.status, startDate: form.startDate||null, completionDate: form.completionDate||null, notes: form.notes||null,
      };
      const res: any = isEdit ? await api.put(`/buildings/${id}`, payload) : await api.post('/buildings', payload);
      if (!res.success) { setError(res.message); return; }
      setSuccess(res.message);
      setTimeout(()=>navigate('/buildings'), 1500);
    } catch(e:any) { setError(e.message||'Server error'); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="loader-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="breadcrumb mb-3">
        <Link to="/buildings">{tr("Buildings")}</Link><span className="breadcrumb-sep">/</span>
        <span>{isEdit ? 'Edit Building' : 'New Building'}</span>
      </div>
      <h1 className="page-title mb-5"><i className={`fa-solid ${isEdit?'fa-pen-to-square text-warning':'fa-plus-circle text-primary'}`} />{isEdit ? 'Edit Building' : 'Create New Building'}</h1>

      {error && <div className="alert alert-danger mb-4"><i className="fa-solid fa-circle-exclamation" />{error}</div>}
      {success && <div className="alert alert-success mb-4"><i className="fa-solid fa-check-circle" />{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* BASIC INFO */}
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-info-circle text-primary" />{tr("Basic Information")}</h3></div>
          <div className="card-body">
            <div className="form-row cols-4">
              <div className="form-group" style={{gridColumn:'span 2'}}>
                <label className="form-label required">{tr("Building Name (ভবনের নাম)")}</label>
                <input type="text" name="buildingName" className="form-control" value={form.buildingName} onChange={h} required placeholder={tr("e.g. Green Valley Apartment")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Building Code")}</label>
                <input type="text" name="buildingCode" className="form-control" value={form.buildingCode} onChange={h} placeholder={tr("e.g. GVA-2024")} />
              </div>
              <div className="form-group">
                <label className="form-label required">{tr("Status")}</label>
                <select name="status" className="form-select" value={form.status} onChange={h}>
                  {['Planning','Under Construction','Completed','Cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label required">{tr("Building Type (ধরন)")}</label>
                <select name="buildingType" className="form-select" value={form.buildingType} onChange={h} required>
                  <option value="Residential">{tr("Residential (আবাসিক)")}</option>
                  <option value="Commercial">{tr("Commercial (বাণিজ্যিক)")}</option>
                  <option value="Mixed">{tr("Mixed (মিশ্র)")}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Start Date")}</label>
                <input type="date" name="startDate" className="form-control" value={form.startDate} onChange={h} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Expected Completion")}</label>
                <input type="date" name="completionDate" className="form-control" value={form.completionDate} onChange={h} />
              </div>
            </div>
          </div>
        </div>

        {/* LAND */}
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-map text-success" />{tr("Land Information (ভূমি তথ্য)")}</h3></div>
          <div className="card-body">
            <div className="form-row cols-4">
              <div className="form-group">
                <label className="form-label required">{tr("Land Area (কাঠা)")}</label>
                <div className="input-group">
                  <input type="number" step="0.0001" name="totalLandAreaKatha" className="form-control" value={form.totalLandAreaKatha} onChange={h} required placeholder={tr("e.g. 5.50")} />
                  <span className="input-group-text">কাঠা</span>
                </div>
                <div className="form-text">{tr("1 কাঠা = 720 sqft (Bangladesh standard)")}</div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Land Area (Sqft)")} <span className="text-muted">{tr("(Auto)")}</span></label>
                <div className="input-group">
                  <input type="number" name="totalLandAreaSqft" className="form-control" value={form.totalLandAreaSqft} onChange={h} />
                  <span className="input-group-text">{tr("sqft")}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr("FAR Ratio (RAJUK)")}</label>
                <input type="number" step="0.01" name="farRatio" className="form-control" value={form.farRatio} onChange={h} placeholder={tr("e.g. 3.5")} />
                <div className="form-text">{tr("Floor Area Ratio (DAP approved)")}</div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Total Buildable Area")}</label>
                <div className="input-group">
                  <input type="number" step="0.01" name="totalBuildableAreaSqft" className="form-control" value={form.totalBuildableAreaSqft} onChange={h} placeholder={tr("Land × FAR")} />
                  <span className="input-group-text">{tr("sqft")}</span>
                </div>
              </div>
            </div>
            <div className="section-heading"><i className="fa-solid fa-file-contract" />{tr("Legal Land Details")}</div>
            <div className="form-row cols-4">
              <div className="form-group">
                <label className="form-label">{tr("Mouza (মৌজা)")}</label>
                <input type="text" name="mouza" className="form-control" value={form.mouza} onChange={h} placeholder={tr("CS Mouza Name")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Dag No. (দাগ নং)")}</label>
                <input type="text" name="dagNo" className="form-control" value={form.dagNo} onChange={h} placeholder={tr("CS/RS Dag")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Khatian No. (খতিয়ান)")}</label>
                <input type="text" name="khatianNo" className="form-control" value={form.khatianNo} onChange={h} placeholder={tr("RS/BS Khatian")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("District (জেলা)")}</label>
                <select name="district" className="form-select" value={form.district} onChange={h}>
                  <option value="">{tr("Select District")}</option>
                  {BD_DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">{tr("Upazila (উপজেলা)")}</label>
                <input type="text" name="upazila" className="form-control" value={form.upazila} onChange={h} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Full Address")}</label>
                <input type="text" name="address" className="form-control" value={form.address} onChange={h} placeholder={tr("House/Plot, Road, Block, Area")} />
              </div>
            </div>
          </div>
        </div>

        {/* SPECS */}
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-layer-group text-warning" />{tr("Building Specifications")}</h3></div>
          <div className="card-body">
            <div className="form-row cols-4">
              <div className="form-group">
                <label className="form-label">{tr("Floors (Above Ground)")}</label>
                <input type="number" name="totalFloors" className="form-control" value={form.totalFloors} onChange={h} placeholder={tr("e.g. 10")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Basement Floors")}</label>
                <input type="number" name="basementFloors" className="form-control" value={form.basementFloors} onChange={h} placeholder={tr("e.g. 1")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Total Units")}</label>
                <input type="number" name="totalUnits" className="form-control" value={form.totalUnits} onChange={h} placeholder={tr("Total flats/shops")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Approval Authority")}</label>
                <select name="approvalAuthority" className="form-select" value={form.approvalAuthority} onChange={h}>
                  <option value="">{tr("Select")}</option>
                  {['RAJUK','KDA','CDA','RDA','Other'].map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label">{tr("Approval No.")}</label>
                <input type="text" name="rajukApprovalNo" className="form-control" value={form.rajukApprovalNo} onChange={h} placeholder={tr("RAJUK/KDA Plan Approval No.")} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Approval Date")}</label>
                <input type="date" name="rajukApprovalDate" className="form-control" value={form.rajukApprovalDate} onChange={h} />
              </div>
            </div>
          </div>
        </div>

        {/* FINANCIAL */}
        <div className="card mb-4">
          <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-bangladeshi-taka-sign text-danger" />{tr("Financial Information (BDT)")}</h3></div>
          <div className="card-body">
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">{tr("Land Purchase Cost (৳)")}</label>
                <div className="input-group input-group-prepend">
                  <span className="input-group-text">৳</span>
                  <input type="number" step="0.01" name="landPurchaseCost" className="form-control" value={form.landPurchaseCost} onChange={h} placeholder={tr("Total land cost in BDT")} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr("Estimated Construction Cost (৳)")}</label>
                <div className="input-group input-group-prepend">
                  <span className="input-group-text">৳</span>
                  <input type="number" step="0.01" name="estimatedConstructionCost" className="form-control" value={form.estimatedConstructionCost} onChange={h} placeholder={tr("Total estimated cost in BDT")} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">{tr("Notes / Remarks")}</label>
              <textarea name="notes" className="form-control" rows={3} value={form.notes} onChange={h} placeholder={tr("Any additional notes...")} />
            </div>
          </div>
        </div>

        <div className="card-footer flex-between">
          <Link to="/buildings" className="btn btn-light"><i className="fa-solid fa-arrow-left" /> {tr("Back to List")}</Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><div className="spinner" style={{width:'18px',height:'18px'}} />{tr("Saving...")}</> : <><i className={`fa-solid ${isEdit?'fa-floppy-disk':'fa-plus'}`} />{isEdit?'Update Building':'Create Building'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
