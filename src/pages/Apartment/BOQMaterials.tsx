import React, { useState, useEffect } from 'react';
import { tr, useLang } from '../../i18n/LanguageContext';
import api from '../../api/client';

export default function BOQMaterials() {
  useLang(); // re-render (without remounting) when the language changes, so tr() text updates and form state is kept
  const [materials, setMaterials] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(null);
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Material Modal
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matForm, setMatForm] = useState({
    material_name: '',
    category: 'Structural',
    unit: 'Bags',
    current_rate: '',
    supplier: '',
  });

  // New BOQ Item Form
  const [boqForm, setBoqForm] = useState({
    item_name: '',
    quantity: '',
    unit: 'Bags',
    rate: '',
    discount: '0',
    tax: '0'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, wRes]: any = await Promise.all([
        api.get('/apartment/materials'),
        api.get('/apartment/works')
      ]);
      if (mRes.success) setMaterials(mRes.data);
      if (wRes.success) {
        setWorks(wRes.data);
        if (wRes.data.length > 0 && !selectedWorkId) {
          setSelectedWorkId(wRes.data[0].id_works);
          fetchBOQ(wRes.data[0].id_works);
        }
      }
    } catch (err) {
      console.error('Error fetching BOQ/materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBOQ = async (workId: number) => {
    try {
      const res: any = await api.get(`/apartment/boq/${workId}`);
      if (res.success) setBoqItems(res.data);
    } catch (err) {
      console.error('Error fetching boq:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectWork = (workId: number) => {
    setSelectedWorkId(workId);
    fetchBOQ(workId);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/apartment/materials', matForm);
      if (res.success) {
        alert('Material added to master catalogue');
        setShowMaterialModal(false);
        setMatForm({ material_name: '', category: 'Structural', unit: 'Bags', current_rate: '', supplier: '' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Error adding material');
    }
  };

  const handleAddBOQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId) return;
    try {
      const res: any = await api.post('/apartment/boq', {
        ...boqForm,
        id_works: selectedWorkId
      });
      if (res.success) {
        alert('BOQ item recorded');
        setBoqForm({ item_name: '', quantity: '', unit: 'Bags', rate: '', discount: '0', tax: '0' });
        fetchBOQ(selectedWorkId);
      }
    } catch (err: any) {
      alert(err.message || 'Error saving BOQ');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>{tr("Apartment System")}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{tr("Procurement & BOQ")}</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-boxes-stacked text-primary"></i> {tr("BOQ & Material Database")}
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowMaterialModal(true)}>
          <i className="fa-solid fa-plus-circle"></i> {tr("Add Master Material")}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* BOQ GENERATOR PER WORK */}
        <div className="card">
          <div className="card-header flex-between">
            <div className="card-title">
              <i className="fa-solid fa-file-invoice text-primary"></i> {tr("Bill of Quantities (BOQ) Schedule")}
            </div>
          </div>
          <div className="card-body">
            <div className="form-group mb-3">
              <label className="form-label fw-bold">{tr("Select Construction Work")}</label>
              <select
                className="form-select"
                value={selectedWorkId || ''}
                onChange={e => handleSelectWork(Number(e.target.value))}
              >
                {works.map(w => (
                  <option key={w.id_works} value={w.id_works}>
                    {w.work_name} (৳{parseFloat(w.actual_cost).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* BOQ Table */}
            <div className="table-wrapper mb-3">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Item / Material")}</th>
                    <th>{tr("Qty")}</th>
                    <th>{tr("Unit")}</th>
                    <th className="text-right">{tr("Rate (৳)")}</th>
                    <th className="text-right">{tr("Total (৳)")}</th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">{tr("No BOQ items added for this work yet.")}</td>
                    </tr>
                  ) : (
                    boqItems.map(item => (
                      <tr key={item.id_boq}>
                        <td className="fw-semibold">{item.item_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td className="text-right">৳{item.rate}</td>
                        <td className="text-right fw-bold text-primary">৳{parseFloat(item.total).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>{tr("Subtotal BOQ Items")}</td>
                    <td className="text-right fw-bold text-success">৳{boqItems.reduce((s, i) => s + parseFloat(i.total || 0), 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Quick Add BOQ Item Form */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div className="text-xs text-muted uppercase fw-bold mb-2">
                <i className="fa-solid fa-plus"></i> {tr("Add Item to this BOQ")}
              </div>
              <form onSubmit={handleAddBOQ}>
                <div className="form-row cols-2 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("Material or Work Item Name")}
                    value={boqForm.item_name}
                    onChange={e => setBoqForm({ ...boqForm, item_name: e.target.value })}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder={tr("Qty")}
                      value={boqForm.quantity}
                      onChange={e => setBoqForm({ ...boqForm, quantity: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={tr("Unit (Bags/Tons)")}
                      value={boqForm.unit}
                      onChange={e => setBoqForm({ ...boqForm, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row cols-2 mb-2">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder={tr("Unit Rate (৳)")}
                    value={boqForm.rate}
                    onChange={e => setBoqForm({ ...boqForm, rate: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn btn-primary w-100">
                    {tr("Add to BOQ (Qty × Rate = Amount)")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* MASTER MATERIALS DATABASE */}
        <div className="card">
          <div className="card-header flex-between">
            <div className="card-title">
              <i className="fa-solid fa-layer-group text-primary"></i> {tr("Master Construction Materials Catalogue")}
            </div>
            <span className="badge badge-primary">{materials.length} {tr("Master Items")}</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{tr("Material Name")}</th>
                  <th>{tr("Category")}</th>
                  <th>{tr("Unit")}</th>
                  <th className="text-right">{tr("Current Rate (৳)")}</th>
                  <th>{tr("Preferred Supplier")}</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id_materials}>
                    <td className="fw-semibold">{m.material_name}</td>
                    <td><span className="badge badge-info">{m.category}</span></td>
                    <td>{m.unit}</td>
                    <td className="text-right fw-bold text-primary">৳{parseFloat(m.current_rate).toFixed(2)}</td>
                    <td className="text-muted text-sm">{m.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE MASTER MATERIAL MODAL */}
      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleAddMaterial}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tr("Add Master Construction Material")}</h3>
                <button type="button" className="btn btn-light btn-sm" onClick={() => setShowMaterialModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">{tr("Material Name")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tr("e.g. Berger WeatherCoat All Guard")}
                    value={matForm.material_name}
                    onChange={e => setMatForm({ ...matForm, material_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Category")}</label>
                    <select
                      className="form-select"
                      value={matForm.category}
                      onChange={e => setMatForm({ ...matForm, category: e.target.value })}
                    >
                      <option value="Structural">{tr("Structural (Cement/Steel/Sand)")}</option>
                      <option value="Finishing">{tr("Finishing (Tiles/Paint/Doors)")}</option>
                      <option value="Electrical">{tr("Electrical (Cables/DB/Lights)")}</option>
                      <option value="Plumbing">{tr("Plumbing (Pipes/Fittings)")}</option>
                      <option value="Sanitary">{tr("Sanitary (Toilets/Basins)")}</option>
                      <option value="Other">{tr("Other")}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">{tr("Standard Unit")}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={tr("Bags / Tons / SFT")}
                      value={matForm.unit}
                      onChange={e => setMatForm({ ...matForm, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label required">{tr("Current Unit Rate (৳)")}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder={tr("e.g. 10.50")}
                      value={matForm.current_rate}
                      onChange={e => setMatForm({ ...matForm, current_rate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr("Preferred Supplier")}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={tr("e.g. Shah Cement / BSRM")}
                      value={matForm.supplier}
                      onChange={e => setMatForm({ ...matForm, supplier: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowMaterialModal(false)}>{tr("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{tr("Save to Catalogue")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
