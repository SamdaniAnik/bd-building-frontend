import React, { useState, useEffect } from 'react';
import api from '../../api/client';

// -------------------------------------------------------------
// 12 UNIVERSAL MASTER DATA INTERFACES (ZERO HARDCODED DATA)
// -------------------------------------------------------------

export interface UnitTemplate {
  id_unit_templates: number;
  unit_slot: string;
  template_name: string;
  gross_area_sqft: string | number;
  carpet_area_sqft: string | number;
  common_area_sqft: string | number;
  default_land_share_sqft: string | number;
  default_land_share_katha: string | number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  facing_direction: string;
  is_corner_unit: boolean | number;
  description: string;
}

export interface MasterItem {
  id_master_items: number;
  item_code: string;
  item_name: string;
  category: string;
  sub_category: string;
  unit: string;
  standard_rate: string | number;
  minimum_stock_alert: string | number;
  reorder_quantity: string | number;
  technical_specification: string;
  is_active: boolean | number;
}

export interface ShareConfig {
  id_shares_master?: number;
  project_title?: string;
  total_land_katha?: string | number;
  total_land_sqft?: string | number;
  total_floors_count?: string | number;
  units_per_floor?: string | number;
  total_units_count?: string | number;
  personal_shares_count?: string | number;
  common_shares_count?: string | number;
  total_shares_count?: string | number;
  connected_buildings_count?: string | number;
  total_buildable_area_sqft?: string | number;
  common_space_percentage?: string | number;
  land_share_allocation_method?: string;
  common_area_allocation_method?: string;
  notes?: string;
}

export interface MasterWork {
  id_master_works: number;
  work_code: string;
  work_name: string;
  category: string;
  scope_level: string;
  default_allocation_rule: string;
  standard_budget_estimate: string | number;
  standard_scope_notes: string;
  is_active: boolean | number;
}

export interface VendorCategory {
  id_vendor_cat: number;
  category_code: string;
  category_name: string;
  trade_type: string;
  default_retention_percent: string | number;
  default_payment_terms: string;
}

export interface CommonFacility {
  id_common_facilities: number;
  facility_code: string;
  facility_name: string;
  category: string;
  capacity: string;
  default_cost_share_rule: string;
  maintenance_monthly_budget_bdt: string | number;
  allocated_unit_number: string;
  description: string;
  is_active: boolean | number;
}

export interface LabourTrade {
  id_labour_trades: number;
  trade_code: string;
  trade_name_en: string;
  trade_name_bn: string;
  standard_daily_wage_bdt: string | number;
  overtime_rate_per_hour_bdt: string | number;
  skill_level: string;
  is_active: boolean | number;
}

export interface UtilityService {
  id_utility_services: number;
  service_code: string;
  service_name: string;
  provider_authority: string;
  uom: string;
  standard_unit_rate_bdt: string | number;
  monthly_demand_charge_bdt: string | number;
  connection_type: string;
  is_active: boolean | number;
}

export interface ServiceChargeHead {
  id_charge_heads: number;
  head_code: string;
  head_name_en: string;
  head_name_bn: string;
  calculation_basis: string;
  default_rate_bdt: string | number;
  frequency: string;
  is_active: boolean | number;
}

export interface BankAccountMaster {
  id_bank_accounts: number;
  account_code: string;
  bank_name: string;
  branch_name: string;
  account_title: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  opening_balance_bdt: string | number;
  current_balance_bdt: string | number;
  is_active: boolean | number;
}

export interface TaxRuleMaster {
  id_tax_rules: number;
  rule_code: string;
  tax_name: string;
  tax_type: string;
  tax_rate_percent: string | number;
  is_withholding_mandatory: boolean | number;
  minimum_threshold_bdt: string | number;
  nbr_statutory_reference: string;
  is_active: boolean | number;
}

export interface SnagCategoryMaster {
  id_snag_cat: number;
  category_code: string;
  category_name_en: string;
  category_name_bn: string;
  default_remedy_sla_days: string;
  trade_responsible: string;
  is_active: boolean | number;
}

export type MasterTab = 
  | 'templates' 
  | 'shares' 
  | 'facilities' 
  | 'labour' 
  | 'utilities' 
  | 'charges' 
  | 'banks' 
  | 'tax' 
  | 'items' 
  | 'works' 
  | 'vendors' 
  | 'snags';

export default function MasterManagement() {
  const [activeTab, setActiveTab] = useState<MasterTab>('templates');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 12 Masters State Datasets
  const [templates, setTemplates] = useState<UnitTemplate[]>([]);
  const [shareConfig, setShareConfig] = useState<ShareConfig>({});
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<CommonFacility[]>([]);
  const [labourTrades, setLabourTrades] = useState<LabourTrade[]>([]);
  const [utilityServices, setUtilityServices] = useState<UtilityService[]>([]);
  const [chargeHeads, setChargeHeads] = useState<ServiceChargeHead[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountMaster[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRuleMaster[]>([]);
  const [items, setItems] = useState<MasterItem[]>([]);
  const [works, setWorks] = useState<MasterWork[]>([]);
  const [vendorCats, setVendorCats] = useState<VendorCategory[]>([]);
  const [snagCategories, setSnagCategories] = useState<SnagCategoryMaster[]>([]);

  // Modals & Selected Objects for CRUD
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<UnitTemplate>>({});

  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Partial<CommonFacility>>({});

  const [showLabourModal, setShowLabourModal] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState<Partial<LabourTrade>>({});

  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<Partial<UtilityService>>({});

  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Partial<ServiceChargeHead>>({});

  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Partial<BankAccountMaster>>({});

  const [showTaxModal, setShowTaxModal] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Partial<TaxRuleMaster>>({});

  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<MasterItem>>({});

  const [showWorkModal, setShowWorkModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Partial<MasterWork>>({});

  const [showVendorCatModal, setShowVendorCatModal] = useState(false);
  const [selectedVendorCat, setSelectedVendorCat] = useState<Partial<VendorCategory>>({});

  const [showSnagModal, setShowSnagModal] = useState(false);
  const [selectedSnag, setSelectedSnag] = useState<Partial<SnagCategoryMaster>>({});

  const [newFloorNum, setNewFloorNum] = useState<number>(7);

  // Helper toast notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Central fetch for ALL 12 masters (Zero static data)
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [univRes, shareRes] = await Promise.all([
        api.get('/apartment/universal-masters'),
        api.get('/apartment/masters/shares')
      ]);

      if (univRes.data?.success && univRes.data.data) {
        const d = univRes.data.data;
        setTemplates(d.unitTemplates || []);
        setShareConfig(d.sharesConfig || {});
        setFacilities(d.commonFacilities || []);
        setLabourTrades(d.labourTrades || []);
        setUtilityServices(d.utilityServices || []);
        setChargeHeads(d.serviceChargeHeads || []);
        setBankAccounts(d.bankAccounts || []);
        setTaxRules(d.taxRules || []);
        setItems(d.materialsCatalogue || []);
        setWorks(d.worksWbs || []);
        setVendorCats(d.vendorCategories || []);
        setSnagCategories(d.snagCategories || []);
      }

      if (shareRes.data?.success) {
        if (shareRes.data.allUnits) setAllUnits(shareRes.data.allUnits);
      }
    } catch (err: any) {
      console.error('Error fetching master data:', err);
      showToast('error', 'Failed to load master repositories from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // -------------------------------------------------------------
  // CRUD HANDLERS FOR ALL MASTERS
  // -------------------------------------------------------------

  // 1. Templates
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/unit-templates', selectedTemplate);
      if (res.data?.success) {
        showToast('success', 'Master Unit Template saved successfully!');
        setShowTemplateModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 2. Shares Config
  const handleUpdateShareConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/shares', shareConfig);
      if (res.data?.success) {
        showToast('success', 'Master Shares configuration saved in database!');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleRecalculateShares = async () => {
    if (!window.confirm('Recalculate Undivided Land Share (Katha & SQFT) across all 108 units based on updated master formula?')) return;
    try {
      const res = await api.post('/apartment/masters/recalculate-shares');
      if (res.data?.success) {
        showToast('success', res.data.message);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleGenerateFloor6Units = async () => {
    try {
      const res = await api.post('/apartment/masters/generate-floor-6-units', {
        floor_number: newFloorNum,
        floor_name: `Floor ${newFloorNum} (Standard 6 Units)`
      });
      if (res.data?.success) {
        showToast('success', res.data.message);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 3. Common Facilities
  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/common-facilities', selectedFacility);
      if (res.data?.success) {
        showToast('success', 'Common Facility Master saved successfully!');
        setShowFacilityModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteFacility = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this common facility?')) return;
    try {
      const res = await api.delete(`/apartment/masters/common-facilities/${id}`);
      if (res.data?.success) {
        showToast('success', 'Facility deleted from master database.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 4. Labour Trades
  const handleSaveLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/labour-trades', selectedLabour);
      if (res.data?.success) {
        showToast('success', 'Labour Trade Master saved successfully!');
        setShowLabourModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteLabour = async (id: number) => {
    if (!window.confirm('Delete this labour trade from master repository?')) return;
    try {
      const res = await api.delete(`/apartment/masters/labour-trades/${id}`);
      if (res.data?.success) {
        showToast('success', 'Labour trade deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 5. Utilities
  const handleSaveUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/utility-services', selectedUtility);
      if (res.data?.success) {
        showToast('success', 'Utility Service Master saved!');
        setShowUtilityModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUtility = async (id: number) => {
    if (!window.confirm('Delete this utility service from database?')) return;
    try {
      const res = await api.delete(`/apartment/masters/utility-services/${id}`);
      if (res.data?.success) {
        showToast('success', 'Utility service removed.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 6. Service Charge Heads
  const handleSaveCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/service-charge-heads', selectedCharge);
      if (res.data?.success) {
        showToast('success', 'Service Charge Head saved in database!');
        setShowChargeModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteCharge = async (id: number) => {
    if (!window.confirm('Delete this service charge head?')) return;
    try {
      const res = await api.delete(`/apartment/masters/service-charge-heads/${id}`);
      if (res.data?.success) {
        showToast('success', 'Service charge head deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 7. Bank Accounts
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/bank-accounts', selectedBank);
      if (res.data?.success) {
        showToast('success', 'Bank Account Master saved!');
        setShowBankModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteBank = async (id: number) => {
    if (!window.confirm('Delete this bank account master?')) return;
    try {
      const res = await api.delete(`/apartment/masters/bank-accounts/${id}`);
      if (res.data?.success) {
        showToast('success', 'Bank account deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 8. Tax Rules
  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/tax-rules', selectedTax);
      if (res.data?.success) {
        showToast('success', 'Tax/VAT Rule saved successfully!');
        setShowTaxModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTax = async (id: number) => {
    if (!window.confirm('Delete this Tax/VAT rule?')) return;
    try {
      const res = await api.delete(`/apartment/masters/tax-rules/${id}`);
      if (res.data?.success) {
        showToast('success', 'Tax rule deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 9. Items Catalogue
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/items', selectedItem);
      if (res.data?.success) {
        showToast('success', 'Item Catalogue Master saved successfully!');
        setShowItemModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Delete this item from catalogue master?')) return;
    try {
      const res = await api.delete(`/apartment/masters/items/${id}`);
      if (res.data?.success) {
        showToast('success', 'Item deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 10. Works WBS
  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/works', selectedWork);
      if (res.data?.success) {
        showToast('success', 'Work WBS Master saved successfully!');
        setShowWorkModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteWork = async (id: number) => {
    if (!window.confirm('Delete this Work WBS entry?')) return;
    try {
      const res = await api.delete(`/apartment/masters/works/${id}`);
      if (res.data?.success) {
        showToast('success', 'Work item deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 11. Vendor Categories
  const handleSaveVendorCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/vendor-categories', selectedVendorCat);
      if (res.data?.success) {
        showToast('success', 'Vendor Category Master saved!');
        setShowVendorCatModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteVendorCat = async (id: number) => {
    if (!window.confirm('Delete this vendor category?')) return;
    try {
      const res = await api.delete(`/apartment/masters/vendor-categories/${id}`);
      if (res.data?.success) {
        showToast('success', 'Vendor category deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // 12. Snag Categories
  const handleSaveSnag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/masters/snag-categories', selectedSnag);
      if (res.data?.success) {
        showToast('success', 'Snag Inspection Category saved!');
        setShowSnagModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteSnag = async (id: number) => {
    if (!window.confirm('Delete this snag category?')) return;
    try {
      const res = await api.delete(`/apartment/masters/snag-categories/${id}`);
      if (res.data?.success) {
        showToast('success', 'Snag category deleted.');
        fetchAllData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  // Total summary count across all masters
  const totalMasterRecords = 
    templates.length + 
    (shareConfig.id_shares_master ? 1 : 0) + 
    facilities.length + 
    labourTrades.length + 
    utilityServices.length + 
    chargeHeads.length + 
    bankAccounts.length + 
    taxRules.length + 
    items.length + 
    works.length + 
    vendorCats.length + 
    snagCategories.length;

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 24px', borderRadius: '10px',
          background: notification.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <i className={notification.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}></i>
          {notification.message}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}>
              <i className="fa-solid fa-database"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Universal Master Control Center
                </h1>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i>
                  100% Database Driven
                </span>
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
                সার্বিক মাস্টার ডাটাবেজ: 12 System Master Repositories • 0 Hardcoded / 0 Static Values • Real Bangladeshi Currency (৳)
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Master Records</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{totalMasterRecords} Active Entries</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Active Modules</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>12 Repositories</div>
            </div>
          </div>

          <button
            onClick={fetchAllData}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1' }}
            title="Refresh All Database Masters"
          >
            <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`} style={{ marginRight: '6px' }}></i>
            Sync DB
          </button>
        </div>
      </div>

      {/* Search & Master Domain Bar */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '280px' }}>
          <i className="fa-solid fa-magnifying-glass text-muted"></i>
          <input
            type="text"
            placeholder={`Search across ${activeTab.toUpperCase()} master entries...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.92rem' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Standard Land Rule:</span>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
            1 Katha = 720 SQFT
          </span>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
            Currency = BDT (৳)
          </span>
        </div>
      </div>

      {/* Master Tabs Horizontal Navigator (All 12 Masters) */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px'
      }}>
        {[
          { key: 'templates', label: '6-Unit Floor Architecture', icon: 'fa-table-cells-large', badge: `${templates.length} Slots (A–F)` },
          { key: 'shares', label: 'Land & Shares Formula', icon: 'fa-chart-pie', badge: '108 Shares' },
          { key: 'facilities', label: 'Common Facilities', icon: 'fa-mosque', badge: `${facilities.length} Amenities` },
          { key: 'labour', label: 'Labour Trades & Wages', icon: 'fa-person-digging', badge: `${labourTrades.length} Trades` },
          { key: 'utilities', label: 'Utility Tariffs', icon: 'fa-bolt', badge: `${utilityServices.length} Services` },
          { key: 'charges', label: 'Service Charge Heads', icon: 'fa-hand-holding-dollar', badge: `${chargeHeads.length} Heads` },
          { key: 'banks', label: 'Bank & Society Accounts', icon: 'fa-building-columns', badge: `${bankAccounts.length} A/Cs` },
          { key: 'tax', label: 'Tax & VAT Withholding', icon: 'fa-scale-balanced', badge: `${taxRules.length} Rules` },
          { key: 'items', label: 'Materials Catalogue', icon: 'fa-boxes-stacked', badge: `${items.length} Items` },
          { key: 'works', label: 'WBS & Scope Works', icon: 'fa-trowel-bricks', badge: `${works.length} Works` },
          { key: 'vendors', label: 'Vendor Categories', icon: 'fa-handshake', badge: `${vendorCats.length} Trades` },
          { key: 'snags', label: 'Handover Snags & SLA', icon: 'fa-clipboard-check', badge: `${snagCategories.length} Types` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as MasterTab); setSearchTerm(''); }}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeTab === tab.key ? '#f0fdf4' : 'transparent',
              borderRadius: '8px 8px 0 0',
              borderBottom: activeTab === tab.key ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === tab.key ? '#065f46' : '#64748b',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? '#bbf7d0' : '#f1f5f9',
              color: activeTab === tab.key ? '#14532d' : '#64748b',
              padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700
            }}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PER-FLOOR 6-UNIT MASTER ARCHITECTURE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc, #edf2f7)', border: '1px solid #cbd5e1', borderRadius: '12px',
            padding: '18px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#1e293b' }}>
                <i className="fa-solid fa-layer-group text-primary" style={{ marginRight: '8px' }}></i>
                6-Units Per Floor Standard Master Architecture (Slots A through F)
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', maxWidth: '780px' }}>
                Database templates defining gross SQFT, carpet SQFT, and undivided land share in Katha. Any new floor generated pulls directly from these master slot rules.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Auto-Generate Floor:</span>
              <input
                type="number"
                min="1"
                max="25"
                value={newFloorNum}
                onChange={e => setNewFloorNum(parseInt(e.target.value) || 1)}
                style={{ width: '55px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}
              />
              <button
                onClick={handleGenerateFloor6Units}
                className="btn btn-primary"
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <i className="fa-solid fa-plus-circle" style={{ marginRight: '6px' }}></i>
                Create 6 Units
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {templates
              .filter(t => !searchTerm || t.unit_slot.toLowerCase().includes(searchTerm.toLowerCase()) || t.template_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(tmpl => (
                <div
                  key={tmpl.id_unit_templates}
                  style={{
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: tmpl.is_corner_unit ? '#eff6ff' : '#f8fafc',
                          color: tmpl.is_corner_unit ? '#2563eb' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem', fontWeight: 800, border: '2px solid',
                          borderColor: tmpl.is_corner_unit ? '#93c5fd' : '#cbd5e1'
                        }}>
                          {tmpl.unit_slot}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{tmpl.template_name}</h4>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Facing: <strong>{tmpl.facing_direction}</strong> {tmpl.is_corner_unit ? '• Corner Unit' : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedTemplate(tmpl); setShowTemplateModal(true); }}
                        className="btn btn-sm btn-outline-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Gross SFT</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{tmpl.gross_area_sqft}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Carpet SFT</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669' }}>{tmpl.carpet_area_sqft}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Common SFT</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d97706' }}>{tmpl.common_area_sqft}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>Undivided Land Share:</span>
                      <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 800 }}>
                        {Number(tmpl.default_land_share_katha).toFixed(4)} Katha ({Number(tmpl.default_land_share_sqft).toFixed(2)} SQFT)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
                      <span><i className="fa-solid fa-bed" style={{ marginRight: '4px', color: '#6366f1' }}></i>{tmpl.bedrooms} Beds</span>
                      <span><i className="fa-solid fa-bath" style={{ marginRight: '4px', color: '#06b6d4' }}></i>{tmpl.bathrooms} Baths</span>
                      <span><i className="fa-solid fa-door-open" style={{ marginRight: '4px', color: '#10b981' }}></i>{tmpl.balconies} Balconies</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                      {tmpl.description}
                    </p>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: LAND & COMMON SHARES MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'shares' && (
        <div>
          <div style={{
            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Project Land Ownership & Ratio Configurations (বাংলাদেশ ভূমি ও হিস্যা নীতি)
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Standard formula configured in database: Total Katha × 720 = Total SQFT. Distributed across 108 shares (105 Personal + 3 Campus Common).
                </p>
              </div>
              <button onClick={handleRecalculateShares} className="btn btn-outline-primary" style={{ fontWeight: 600 }}>
                <i className="fa-solid fa-calculator" style={{ marginRight: '6px' }}></i>
                Recalculate 108 Unit Allocations
              </button>
            </div>

            <form onSubmit={handleUpdateShareConfig}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Project Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shareConfig.project_title || ''}
                    onChange={e => setShareConfig({ ...shareConfig, project_title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Total Land Area (কাঠা / Katha)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={shareConfig.total_land_katha || ''}
                    onChange={e => {
                      const katha = parseFloat(e.target.value) || 0;
                      setShareConfig({
                        ...shareConfig,
                        total_land_katha: katha,
                        total_land_sqft: (katha * 720).toFixed(2)
                      });
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Total Land Area (SQFT @ 720 sqft/katha)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={shareConfig.total_land_sqft || ''}
                    readOnly
                    style={{ background: '#f1f5f9' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Total Connected Buildings</label>
                  <input
                    type="number"
                    className="form-control"
                    value={shareConfig.connected_buildings_count || 3}
                    onChange={e => setShareConfig({ ...shareConfig, connected_buildings_count: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Total Project Shares</label>
                  <input
                    type="number"
                    className="form-control"
                    value={shareConfig.total_shares_count || 108}
                    onChange={e => setShareConfig({ ...shareConfig, total_shares_count: parseInt(e.target.value) || 108 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Personal Shares</label>
                  <input
                    type="number"
                    className="form-control"
                    value={shareConfig.personal_shares_count || 105}
                    onChange={e => setShareConfig({ ...shareConfig, personal_shares_count: parseInt(e.target.value) || 105 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Common Shares (Mosque, Pool, Hall)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={shareConfig.common_shares_count || 3}
                    onChange={e => setShareConfig({ ...shareConfig, common_shares_count: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Common Space Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={shareConfig.common_space_percentage || ''}
                    onChange={e => setShareConfig({ ...shareConfig, common_space_percentage: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontWeight: 600 }}>
                  <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i> Save Land Master Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: COMMON FACILITIES & AMENITIES MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'facilities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Campus Common Facilities & Amenities Master (ক্যাম্পাস কমন সুবিধাসমূহ)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Configurable master for tri-tower shared spaces: Central Mosque, Community Hall, Swimming Pool, Substation, Skywalk Bridges, Gym.
              </p>
            </div>
            <button
              onClick={() => { setSelectedFacility({}); setShowFacilityModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add New Common Facility
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Facility Code</th>
                  <th style={{ padding: '12px 16px' }}>Facility Name</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Capacity</th>
                  <th style={{ padding: '12px 16px' }}>Allocated Unit</th>
                  <th style={{ padding: '12px 16px' }}>Monthly Budget (৳)</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities
                  .filter(f => !searchTerm || f.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) || f.facility_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(f => (
                    <tr key={f.id_common_facilities} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>{f.facility_code}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{f.facility_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{f.description}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600 }}>
                          {f.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{f.capacity || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#4f46e5' }}>{f.allocated_unit_number || 'General Campus'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        ৳ {Number(f.maintenance_monthly_budget_bdt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: f.is_active ? '#dcfce7' : '#fee2e2',
                          color: f.is_active ? '#166534' : '#991b1b',
                          padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 700
                        }}>
                          {f.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedFacility(f); setShowFacilityModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteFacility(f.id_common_facilities)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: LABOUR TRADES & WAGES MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'labour' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Labour Trades & Standard Daily Wages Master (শ্রমিক ট্রেড ও দৈনিক মজুরি মাস্টার)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Pre-configured Bangladeshi construction trade daily wages and overtime rates in ৳ (রাজমিস্ত্রি, রড মিস্ত্রি, শাটারিং, ইলেকট্রিশিয়ান, প্লাম্বার, যোগালী).
              </p>
            </div>
            <button
              onClick={() => { setSelectedLabour({}); setShowLabourModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Labour Trade
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Trade Code</th>
                  <th style={{ padding: '12px 16px' }}>Trade Name (English)</th>
                  <th style={{ padding: '12px 16px' }}>বাংলা পদবী</th>
                  <th style={{ padding: '12px 16px' }}>Skill Level</th>
                  <th style={{ padding: '12px 16px' }}>Daily Wage (দৈনিক মজুরি)</th>
                  <th style={{ padding: '12px 16px' }}>Overtime (ওভারটাইম/ঘণ্টা)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labourTrades
                  .filter(l => !searchTerm || l.trade_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || l.trade_name_bn.includes(searchTerm) || l.trade_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(l => (
                    <tr key={l.id_labour_trades} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{l.trade_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{l.trade_name_en}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#065f46' }}>{l.trade_name_bn}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: l.skill_level === 'HEAD_MISTRY' ? '#fef3c7' : l.skill_level === 'SKILLED' ? '#dbeafe' : '#f1f5f9',
                          color: l.skill_level === 'HEAD_MISTRY' ? '#92400e' : l.skill_level === 'SKILLED' ? '#1e40af' : '#475569',
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700
                        }}>
                          {l.skill_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                        ৳ {Number(l.standard_daily_wage_bdt).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#d97706' }}>
                        ৳ {Number(l.overtime_rate_per_hour_bdt).toFixed(2)} / hr
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedLabour(l); setShowLabourModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteLabour(l.id_labour_trades)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: UTILITY SERVICES & TARIFFS MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'utilities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Utility Services & Tariffs Master (ইউটিলিটি ও ট্যারিফ মাস্টার)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Authority utility tariffs: DESCO 3-Phase Grid Electricity, Dhaka WASA Water & Sewerage, Central Reticulated LPG, Standby Cummins DG.
              </p>
            </div>
            <button
              onClick={() => { setSelectedUtility({}); setShowUtilityModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Utility Service
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Service Code</th>
                  <th style={{ padding: '12px 16px' }}>Service Name</th>
                  <th style={{ padding: '12px 16px' }}>Provider Authority</th>
                  <th style={{ padding: '12px 16px' }}>Unit (UOM)</th>
                  <th style={{ padding: '12px 16px' }}>Tariff Rate (৳ / Unit)</th>
                  <th style={{ padding: '12px 16px' }}>Demand Charge (৳ / Mo)</th>
                  <th style={{ padding: '12px 16px' }}>Connection Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilityServices
                  .filter(u => !searchTerm || u.service_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.service_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(u => (
                    <tr key={u.id_utility_services} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>{u.service_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{u.service_name}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{u.provider_authority}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600 }}>
                          {u.uom}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        ৳ {Number(u.standard_unit_rate_bdt).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>
                        ৳ {Number(u.monthly_demand_charge_bdt).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569' }}>{u.connection_type}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedUtility(u); setShowUtilityModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteUtility(u.id_utility_services)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: SERVICE CHARGE HEADS MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'charges' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Service Charge & Maintenance Heads Master (সার্ভিস চার্জ ও রক্ষণাবেক্ষণ খাত)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Formula heads for flat owners association monthly bill: Security, Cleaning, Lift AMC, Generator, Common Electricity, Sinking Reserve.
              </p>
            </div>
            <button
              onClick={() => { setSelectedCharge({}); setShowChargeModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Charge Head
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Head Code</th>
                  <th style={{ padding: '12px 16px' }}>Head Description (English)</th>
                  <th style={{ padding: '12px 16px' }}>বাংলা খাত বিবরণ</th>
                  <th style={{ padding: '12px 16px' }}>Calculation Basis</th>
                  <th style={{ padding: '12px 16px' }}>Default Rate (৳)</th>
                  <th style={{ padding: '12px 16px' }}>Frequency</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chargeHeads
                  .filter(c => !searchTerm || c.head_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || c.head_name_bn.includes(searchTerm))
                  .map(c => (
                    <tr key={c.id_charge_heads} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{c.head_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{c.head_name_en}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#065f46' }}>{c.head_name_bn}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: c.calculation_basis === 'FLAT_EQUAL' ? '#e0e7ff' : '#fef3c7',
                          color: c.calculation_basis === 'FLAT_EQUAL' ? '#3730a3' : '#92400e',
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700
                        }}>
                          {c.calculation_basis}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        ৳ {Number(c.default_rate_bdt).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{c.frequency}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedCharge(c); setShowChargeModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCharge(c.id_charge_heads)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: BANK ACCOUNTS & MFS MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'banks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Bank & Society Collection Accounts Master (ব্যাংক ও এমএফএস হিসাব মাস্টার)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                DBBL Construction Master CD, IBBL Escrow Reserve, BRAC Owners Collection, City Bank Procurement, bKash Merchant.
              </p>
            </div>
            <button
              onClick={() => { setSelectedBank({}); setShowBankModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Bank Account
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {bankAccounts
              .filter(b => !searchTerm || b.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) || b.account_title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(b => (
                <div
                  key={b.id_bank_accounts}
                  style={{
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>{b.account_code}</span>
                        <h4 style={{ margin: '2px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{b.bank_name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Branch: {b.branch_name}</span>
                      </div>
                      <span style={{
                        background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700
                      }}>
                        {b.account_type}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Account Title:</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>{b.account_title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b' }}>A/C Number:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{b.account_number}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b' }}>Routing No:</span>
                        <span style={{ fontWeight: 600, color: '#475569' }}>{b.routing_number || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>Current Ledger Balance:</span>
                      <span style={{ fontSize: '1.1rem', color: '#065f46', fontWeight: 900 }}>
                        ৳ {Number(b.current_balance_bdt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button
                      onClick={() => { setSelectedBank(b); setShowBankModal(true); }}
                      className="btn btn-sm btn-outline-secondary"
                      style={{ padding: '4px 12px' }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBank(b.id_bank_accounts)}
                      className="btn btn-sm btn-outline-danger"
                      style={{ padding: '4px 12px' }}
                    >
                      <i className="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 8: TAX & VAT WITHHOLDING RULES MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'tax' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Tax & VAT Withholding Rules Master (এনবিআর ভ্যাট ও উৎসে কর বিধিমালা)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                NBR Statutory compliance rules: Real Estate Flat Sales VAT (7.5%), Registration AIT (5%), Stamp Duty (1.5%), City Corp (2%), Construction VDS (7.5%).
              </p>
            </div>
            <button
              onClick={() => { setSelectedTax({}); setShowTaxModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Tax Rule
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Rule Code</th>
                  <th style={{ padding: '12px 16px' }}>Tax / Duty Name</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Rate (%)</th>
                  <th style={{ padding: '12px 16px' }}>Withholding Mandatory</th>
                  <th style={{ padding: '12px 16px' }}>Min Threshold (৳)</th>
                  <th style={{ padding: '12px 16px' }}>Statutory Reference</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRules
                  .filter(t => !searchTerm || t.tax_name.toLowerCase().includes(searchTerm.toLowerCase()) || t.rule_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(t => (
                    <tr key={t.id_tax_rules} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{t.rule_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{t.tax_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                          {t.tax_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#dc2626', fontSize: '0.95rem' }}>
                        {t.tax_rate_percent}%
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: t.is_withholding_mandatory ? '#dcfce7' : '#f1f5f9',
                          color: t.is_withholding_mandatory ? '#166534' : '#64748b',
                          padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 700
                        }}>
                          {t.is_withholding_mandatory ? 'YES (বাধ্যতামূলক)' : 'NO'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>
                        ৳ {Number(t.minimum_threshold_bdt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748b', maxWidth: '280px' }}>
                        {t.nbr_statutory_reference}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedTax(t); setShowTaxModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTax(t.id_tax_rules)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 9: MATERIALS CATALOGUE MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'items' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Standard Materials Catalogue & Standard Rates Master (নির্মাণ সামগ্রী মাস্টার)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Catalogued materials: Cement, Steel 72.5G Rebar, Sylhet Sand, Stone Chips, Bricks, RAK Tiles, BBS Cables with standard rates in ৳.
              </p>
            </div>
            <button
              onClick={() => { setSelectedItem({}); setShowItemModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Catalogue Item
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Item Code</th>
                  <th style={{ padding: '12px 16px' }}>Item Name</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Unit</th>
                  <th style={{ padding: '12px 16px' }}>Standard Rate (৳)</th>
                  <th style={{ padding: '12px 16px' }}>Min Stock Alert</th>
                  <th style={{ padding: '12px 16px' }}>Technical Specs</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter(it => !searchTerm || it.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || it.item_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(it => (
                    <tr key={it.id_master_items} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{it.item_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{it.item_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                          {it.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>{it.unit}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        ৳ {Number(it.standard_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#d97706' }}>
                        {it.minimum_stock_alert} {it.unit}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748b', maxWidth: '250px' }}>
                        {it.technical_specification}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedItem(it); setShowItemModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(it.id_master_items)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 10: WORKS & WBS BREAKDOWN MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'works' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Works Breakdown Structure (WBS) Master (কাজের ধাপ ও বিভাজন মাস্টার)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Civil & Finishing WBS activities: Piling, Substructure, Superstructure, Masonry, Finishing, Electrical & Sanitary with allocation rules.
              </p>
            </div>
            <button
              onClick={() => { setSelectedWork({}); setShowWorkModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Master Work
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>WBS Code</th>
                  <th style={{ padding: '12px 16px' }}>Work Description</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Scope Level</th>
                  <th style={{ padding: '12px 16px' }}>Allocation Rule</th>
                  <th style={{ padding: '12px 16px' }}>Standard Budget (৳)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {works
                  .filter(w => !searchTerm || w.work_name.toLowerCase().includes(searchTerm.toLowerCase()) || w.work_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(w => (
                    <tr key={w.id_master_works} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{w.work_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{w.work_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                          {w.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: w.scope_level === 'COMBINED' ? '#e0f2fe' : '#fef3c7',
                          color: w.scope_level === 'COMBINED' ? '#0369a1' : '#92400e',
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700
                        }}>
                          {w.scope_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569' }}>{w.default_allocation_rule}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        ৳ {Number(w.standard_budget_estimate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedWork(w); setShowWorkModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteWork(w.id_master_works)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 11: VENDOR & TRADE CATEGORIES MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'vendors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Vendor & Contractor Trade Categories Master (ভেন্ডর ও সরবরাহকারী ক্যাটাগরি)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Trade categories: Steel mills, Ready-mix batching plants, Ceramic tiles, Substation MEP, Lift vendors with default retention & credit terms.
              </p>
            </div>
            <button
              onClick={() => { setSelectedVendorCat({}); setShowVendorCatModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Vendor Category
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Category Code</th>
                  <th style={{ padding: '12px 16px' }}>Category Name</th>
                  <th style={{ padding: '12px 16px' }}>Trade Type</th>
                  <th style={{ padding: '12px 16px' }}>Default Retention (%)</th>
                  <th style={{ padding: '12px 16px' }}>Payment Terms</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorCats
                  .filter(v => !searchTerm || v.category_name.toLowerCase().includes(searchTerm.toLowerCase()) || v.category_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(v => (
                    <tr key={v.id_vendor_cat} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{v.category_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{v.category_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                          {v.trade_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        {v.default_retention_percent}%
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.82rem' }}>{v.default_payment_terms}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedVendorCat(v); setShowVendorCatModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteVendorCat(v.id_vendor_cat)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 12: HANDOVER SNAG & DEFECT SLA CATEGORIES MASTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'snags' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Handover Snag & Defect Inspection Master (হ্যান্ডওভার ত্রুটি ও ওয়ারেন্টি মাস্টার)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Apartment handover defect inspection checklist: Carpentry, Hollow Tiles, Plumbing Leakage, Electrical Breaker, Thai Sliding Windows, Paint with SLA days.
              </p>
            </div>
            <button
              onClick={() => { setSelectedSnag({}); setShowSnagModal(true); }}
              className="btn btn-primary"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Snag Category
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Category Code</th>
                  <th style={{ padding: '12px 16px' }}>Defect Scope (English)</th>
                  <th style={{ padding: '12px 16px' }}>বাংলা ত্রুটি বিবরণ</th>
                  <th style={{ padding: '12px 16px' }}>Remedy SLA</th>
                  <th style={{ padding: '12px 16px' }}>Responsible Trade Contractor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {snagCategories
                  .filter(s => !searchTerm || s.category_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || s.category_name_bn.includes(searchTerm))
                  .map(s => (
                    <tr key={s.id_snag_cat} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{s.category_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{s.category_name_en}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#065f46' }}>{s.category_name_bn}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800 }}>
                          <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i> {s.default_remedy_sla_days}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>{s.trade_responsible}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setSelectedSnag(s); setShowSnagModal(true); }}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteSnag(s.id_snag_cat)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS SECTION (CRUD FOR EVERY MASTER REPOSITORY)
      ───────────────────────────────────────────────────────────── */}

      {/* 1. Modal: Unit Template */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '620px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedTemplate.id_unit_templates ? `Edit Slot ${selectedTemplate.unit_slot} Template` : 'Add New Unit Slot Template'}
              </h3>
              <button onClick={() => setShowTemplateModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveTemplate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unit Slot (A to F)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedTemplate.unit_slot || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, unit_slot: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Template Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedTemplate.template_name || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, template_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Gross Area (SQFT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedTemplate.gross_area_sqft || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, gross_area_sqft: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Carpet Area (SQFT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedTemplate.carpet_area_sqft || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, carpet_area_sqft: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Undivided Land Share (Katha)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    value={selectedTemplate.default_land_share_katha || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, default_land_share_katha: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Facing Direction</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedTemplate.facing_direction || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, facing_direction: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowTemplateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Common Facility */}
      {showFacilityModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '620px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedFacility.id_common_facilities ? 'Edit Common Facility' : 'Add New Common Facility'}
              </h3>
              <button onClick={() => setShowFacilityModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveFacility}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Facility Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedFacility.facility_code || ''}
                    onChange={e => setSelectedFacility({ ...selectedFacility, facility_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Facility Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedFacility.facility_name || ''}
                    onChange={e => setSelectedFacility({ ...selectedFacility, facility_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                  <select
                    className="form-control"
                    value={selectedFacility.category || 'COMMUNITY'}
                    onChange={e => setSelectedFacility({ ...selectedFacility, category: e.target.value })}
                  >
                    <option value="WORSHIP">Worship (মসজিদ)</option>
                    <option value="COMMUNITY">Community (কমিউনিটি)</option>
                    <option value="WELLNESS">Wellness & Sports (সুইমিং/জিম)</option>
                    <option value="INFRASTRUCTURE">Infrastructure (সাবস্টেশন/লিংক)</option>
                    <option value="SECURITY">Security & Admin (গেটহাউস)</option>
                    <option value="RECREATION_COMMUNITY">Recreation (ছাদ বাগান)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Allocated Unit Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. A-101, B-101, C-101"
                    value={selectedFacility.allocated_unit_number || ''}
                    onChange={e => setSelectedFacility({ ...selectedFacility, allocated_unit_number: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Capacity</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 350 Musallis, 120 Persons"
                    value={selectedFacility.capacity || ''}
                    onChange={e => setSelectedFacility({ ...selectedFacility, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Monthly Budget (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={selectedFacility.maintenance_monthly_budget_bdt || ''}
                    onChange={e => setSelectedFacility({ ...selectedFacility, maintenance_monthly_budget_bdt: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    value={selectedFacility.description || ''}
                    onChange={e => setSelectedFacility({ ...selectedFacility, description: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowFacilityModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Labour Trade */}
      {showLabourModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedLabour.id_labour_trades ? 'Edit Labour Trade' : 'Add Construction Labour Trade'}
              </h3>
              <button onClick={() => setShowLabourModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveLabour}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trade Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedLabour.trade_code || ''}
                    onChange={e => setSelectedLabour({ ...selectedLabour, trade_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>English Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedLabour.trade_name_en || ''}
                    onChange={e => setSelectedLabour({ ...selectedLabour, trade_name_en: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>বাংলা পদবী</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="যেমন: প্রধান রাজমিস্ত্রি"
                    value={selectedLabour.trade_name_bn || ''}
                    onChange={e => setSelectedLabour({ ...selectedLabour, trade_name_bn: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Skill Level</label>
                  <select
                    className="form-control"
                    value={selectedLabour.skill_level || 'SKILLED'}
                    onChange={e => setSelectedLabour({ ...selectedLabour, skill_level: e.target.value })}
                  >
                    <option value="HEAD_MISTRY">Head Mistry (প্রধান মিস্ত্রি)</option>
                    <option value="SKILLED">Skilled (দক্ষ)</option>
                    <option value="SEMI_SKILLED">Semi-Skilled (আধা-দক্ষ)</option>
                    <option value="HELPER_JOGALI">Helper / Jogali (যোগালী)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Standard Daily Wage (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedLabour.standard_daily_wage_bdt || ''}
                    onChange={e => setSelectedLabour({ ...selectedLabour, standard_daily_wage_bdt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Overtime Rate (৳ / hour)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedLabour.overtime_rate_per_hour_bdt || ''}
                    onChange={e => setSelectedLabour({ ...selectedLabour, overtime_rate_per_hour_bdt: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowLabourModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Trade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Utility Service */}
      {showUtilityModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedUtility.id_utility_services ? 'Edit Utility Service' : 'Add Utility Service'}
              </h3>
              <button onClick={() => setShowUtilityModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveUtility}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Service Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedUtility.service_code || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, service_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Service Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedUtility.service_name || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, service_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Provider Authority</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. DESCO, Dhaka WASA, Reticulated LPG"
                    value={selectedUtility.provider_authority || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, provider_authority: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. kWh, 1000 Litres, m³"
                    value={selectedUtility.uom || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, uom: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tariff Rate (৳ / Unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedUtility.standard_unit_rate_bdt || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, standard_unit_rate_bdt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Monthly Demand Charge (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={selectedUtility.monthly_demand_charge_bdt || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, monthly_demand_charge_bdt: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Connection Type</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 3-Phase 400V LT / Commercial WASA 2-inch"
                    value={selectedUtility.connection_type || ''}
                    onChange={e => setSelectedUtility({ ...selectedUtility, connection_type: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowUtilityModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Utility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Service Charge Head */}
      {showChargeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedCharge.id_charge_heads ? 'Edit Service Charge Head' : 'Add Service Charge Head'}
              </h3>
              <button onClick={() => setShowChargeModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveCharge}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Head Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedCharge.head_code || ''}
                    onChange={e => setSelectedCharge({ ...selectedCharge, head_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Head Name (English)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedCharge.head_name_en || ''}
                    onChange={e => setSelectedCharge({ ...selectedCharge, head_name_en: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>বাংলা খাত নাম</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="যেমন: নিরাপত্তা প্রহরী ও সিসিটিভি"
                    value={selectedCharge.head_name_bn || ''}
                    onChange={e => setSelectedCharge({ ...selectedCharge, head_name_bn: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Calculation Basis</label>
                  <select
                    className="form-control"
                    value={selectedCharge.calculation_basis || 'FLAT_EQUAL'}
                    onChange={e => setSelectedCharge({ ...selectedCharge, calculation_basis: e.target.value })}
                  >
                    <option value="FLAT_EQUAL">Equal Per Flat (সমান বণ্টন)</option>
                    <option value="SFT_PROPORTIONAL">Proportional by SQFT (বর্গফুট অনুপাতে)</option>
                    <option value="METER_CONSUMPTION">Meter Consumption (মিটার রিডিং)</option>
                    <option value="FIXED">Fixed Amount (নির্দিষ্ট)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Default Rate (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedCharge.default_rate_bdt || ''}
                    onChange={e => setSelectedCharge({ ...selectedCharge, default_rate_bdt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Billing Frequency</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedCharge.frequency || 'Monthly (মাসিক)'}
                    onChange={e => setSelectedCharge({ ...selectedCharge, frequency: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowChargeModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Charge Head</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Bank Account */}
      {showBankModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '640px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedBank.id_bank_accounts ? 'Edit Bank Account' : 'Register New Bank / MFS Account'}
              </h3>
              <button onClick={() => setShowBankModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveBank}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedBank.account_code || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, account_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Dutch-Bangla Bank PLC"
                    value={selectedBank.bank_name || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, bank_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedBank.branch_name || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, branch_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Type</label>
                  <select
                    className="form-control"
                    value={selectedBank.account_type || 'CURRENT'}
                    onChange={e => setSelectedBank({ ...selectedBank, account_type: e.target.value })}
                  >
                    <option value="CURRENT">Current Account (চলতি হিসাব)</option>
                    <option value="ESCROW_JVA">Escrow / JVA Account (যৌথ একাউন্ট)</option>
                    <option value="SOCIETY_COLLECTION">Owners Society Collection (সোসাইটি ফান্ড)</option>
                    <option value="RESERVE_FUND">Reserve / Sinking Fund (জরুরী তহবিল)</option>
                    <option value="SAVINGS">Savings Account (সঞ্চয়ী)</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedBank.account_title || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, account_title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedBank.account_number || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Routing Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedBank.routing_number || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, routing_number: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Opening Balance (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={selectedBank.opening_balance_bdt || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, opening_balance_bdt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Current Balance (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={selectedBank.current_balance_bdt || ''}
                    onChange={e => setSelectedBank({ ...selectedBank, current_balance_bdt: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowBankModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Tax Rule */}
      {showTaxModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedTax.id_tax_rules ? 'Edit Tax / VAT Rule' : 'Add Tax / VAT Withholding Rule'}
              </h3>
              <button onClick={() => setShowTaxModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveTax}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rule Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedTax.rule_code || ''}
                    onChange={e => setSelectedTax({ ...selectedTax, rule_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tax / Duty Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedTax.tax_name || ''}
                    onChange={e => setSelectedTax({ ...selectedTax, tax_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tax Type</label>
                  <select
                    className="form-control"
                    value={selectedTax.tax_type || 'VAT_MUSHAK'}
                    onChange={e => setSelectedTax({ ...selectedTax, tax_type: e.target.value })}
                  >
                    <option value="VAT_MUSHAK">VAT (মূসক)</option>
                    <option value="AIT_INCOME_TAX">Advance Income Tax (AIT)</option>
                    <option value="STAMP_DUTY">Stamp Duty (স্ট্যাম্প ডিউটি)</option>
                    <option value="HOLDING_TAX">City Corporation / Holding Tax</option>
                    <option value="OTHER">Other Statutory</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedTax.tax_rate_percent || ''}
                    onChange={e => setSelectedTax({ ...selectedTax, tax_rate_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Minimum Threshold (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={selectedTax.minimum_threshold_bdt || 0}
                    onChange={e => setSelectedTax({ ...selectedTax, minimum_threshold_bdt: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedTax.is_withholding_mandatory ?? true)}
                      onChange={e => setSelectedTax({ ...selectedTax, is_withholding_mandatory: e.target.checked })}
                    />
                    Withholding Mandatory (উৎস কর্তন বাধ্যতামূলক)
                  </label>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>NBR / Legal Reference</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. NBR SRO 186-AIN/2021 / Income Tax Act 2023 Sec 125"
                    value={selectedTax.nbr_statutory_reference || ''}
                    onChange={e => setSelectedTax({ ...selectedTax, nbr_statutory_reference: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowTaxModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Tax Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Master Item */}
      {showItemModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '640px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedItem.id_master_items ? 'Edit Materials Catalogue Item' : 'Add New Materials Catalogue Item'}
              </h3>
              <button onClick={() => setShowItemModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Item Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedItem.item_code || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, item_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Item Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedItem.item_name || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, item_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. CEMENT, STEEL_REBAR, TILES"
                    value={selectedItem.category || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, category: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unit of Measure</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Bag, Ton, CFT, SQFT"
                    value={selectedItem.unit || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Standard Rate (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedItem.standard_rate || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, standard_rate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Min Stock Alert</label>
                  <input
                    type="number"
                    className="form-control"
                    value={selectedItem.minimum_stock_alert || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, minimum_stock_alert: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Technical Specification / Brand</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. Shah Cement Special 50kg bag BDS EN 197-1"
                    value={selectedItem.technical_specification || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, technical_specification: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowItemModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Catalogue Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal: Work WBS */}
      {showWorkModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedWork.id_master_works ? 'Edit Work WBS Item' : 'Add Work WBS Item'}
              </h3>
              <button onClick={() => setShowWorkModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveWork}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Work Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedWork.work_code || ''}
                    onChange={e => setSelectedWork({ ...selectedWork, work_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Work Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedWork.work_name || ''}
                    onChange={e => setSelectedWork({ ...selectedWork, work_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. SUBSTRUCTURE, SUPERSTRUCTURE"
                    value={selectedWork.category || ''}
                    onChange={e => setSelectedWork({ ...selectedWork, category: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Scope Level</label>
                  <select
                    className="form-control"
                    value={selectedWork.scope_level || 'COMBINED'}
                    onChange={e => setSelectedWork({ ...selectedWork, scope_level: e.target.value })}
                  >
                    <option value="COMBINED">Combined / Campus Shared</option>
                    <option value="BUILDING_SPECIFIC">Building Specific Tower</option>
                    <option value="INDIVIDUAL_FLAT">Individual Flat Scope</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Default Allocation Rule</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedWork.default_allocation_rule || 'ALL_UNITS_AREA_BASED'}
                    onChange={e => setSelectedWork({ ...selectedWork, default_allocation_rule: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Standard Budget (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={selectedWork.standard_budget_estimate || ''}
                    onChange={e => setSelectedWork({ ...selectedWork, standard_budget_estimate: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowWorkModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Work Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal: Vendor Category */}
      {showVendorCatModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedVendorCat.id_vendor_cat ? 'Edit Vendor Category' : 'Add Vendor Category'}
              </h3>
              <button onClick={() => setShowVendorCatModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveVendorCat}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedVendorCat.category_code || ''}
                    onChange={e => setSelectedVendorCat({ ...selectedVendorCat, category_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedVendorCat.category_name || ''}
                    onChange={e => setSelectedVendorCat({ ...selectedVendorCat, category_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trade Type</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. MATERIAL_SUPPLIER, CONTRACTOR"
                    value={selectedVendorCat.trade_type || ''}
                    onChange={e => setSelectedVendorCat({ ...selectedVendorCat, trade_type: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Default Retention (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={selectedVendorCat.default_retention_percent || 5.0}
                    onChange={e => setSelectedVendorCat({ ...selectedVendorCat, default_retention_percent: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Default Payment Terms</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 30 Days Baki / 50% Cheque on Delivery"
                    value={selectedVendorCat.default_payment_terms || ''}
                    onChange={e => setSelectedVendorCat({ ...selectedVendorCat, default_payment_terms: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowVendorCatModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Modal: Snag Category */}
      {showSnagModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedSnag.id_snag_cat ? 'Edit Snag Inspection Category' : 'Add Handover Snag Category'}
              </h3>
              <button onClick={() => setShowSnagModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveSnag}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category Code</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedSnag.category_code || ''}
                    onChange={e => setSelectedSnag({ ...selectedSnag, category_code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Scope Name (English)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={selectedSnag.category_name_en || ''}
                    onChange={e => setSelectedSnag({ ...selectedSnag, category_name_en: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>বাংলা ত্রুটি নাম</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="যেমন: স্যানিটারি ফিটিংস ও পাইপলাইন"
                    value={selectedSnag.category_name_bn || ''}
                    onChange={e => setSelectedSnag({ ...selectedSnag, category_name_bn: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Remedy SLA Duration</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. 3 Days, 7 Days"
                    value={selectedSnag.default_remedy_sla_days || '7 Days'}
                    onChange={e => setSelectedSnag({ ...selectedSnag, default_remedy_sla_days: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trade Contractor Responsible</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Sanitary Plumbing Contractor, Berger Paints Applicator"
                    value={selectedSnag.trade_responsible || ''}
                    onChange={e => setSelectedSnag({ ...selectedSnag, trade_responsible: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowSnagModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Snag Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
