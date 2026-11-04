import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function ShopnoBilashHub() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'towers' | 'shares' | 'works' | 'multiOwners'>('towers');
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [ownerPortfolio, setOwnerPortfolio] = useState<any>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [newWork, setNewWork] = useState({
    work_name: '',
    work_category: 'FACILITIES_MEP',
    scope_level: 'PROJECT_COMMON',
    id_buildings: '',
    facility_tag: 'MOSQUE',
    description: '',
    estimated_cost: '',
    actual_cost: '',
    cost_allocation_method: 'EQUAL'
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/apartment/shopno-bilash/overview');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching Shopno Bilash data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenOwnerPortfolio = async (owner: any) => {
    setSelectedOwner(owner);
    setLoadingPortfolio(true);
    try {
      const res = await api.get(`/apartment/shopno-bilash/owner-portfolio/${owner.id_owners}`);
      if (res.data?.success) {
        setOwnerPortfolio(res.data);
      }
    } catch (err: any) {
      showToast('error', 'Failed to fetch owner portfolio');
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/apartment/shopno-bilash/works', newWork);
      if (res.data?.success) {
        showToast('success', res.data.message);
        setShowWorkModal(false);
        setNewWork({
          work_name: '',
          work_category: 'FACILITIES_MEP',
          scope_level: 'PROJECT_COMMON',
          id_buildings: '',
          facility_tag: 'MOSQUE',
          description: '',
          estimated_cost: '',
          actual_cost: '',
          cost_allocation_method: 'EQUAL'
        });
        fetchData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#4f46e5' }}></i>
        <p style={{ marginTop: '10px', color: '#64748b' }}>Loading Shopno Bilash Complex Matrix...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const buildings = data?.buildings || [];
  const commonShares = data?.commonSharesUnits || [];
  const multiOwners = data?.multiBuildingOwners || [];
  const campusWorks = data?.campusCommonWorks || [];
  const buildingWorks = data?.buildingSpecificWorks || [];
  const buildingCost = data?.buildingCostPerShare || {};

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Alert */}
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
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
              <i className="fa-solid fa-circle-nodes text-emerald-400"></i> 3 Connected Towers • 9 Floors • 108 Units
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '4px 0 8px 0', letterSpacing: '-0.5px' }}>
              Shopno Bilash (স্বপ্ন বিলাস)
            </h1>
            <p style={{ margin: 0, opacity: 0.85, maxWidth: '780px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Inter-connected luxury condominium campus with Central Podium, Juma Mosque, Executive Meeting Center & Rooftop Infinity Pool.
              Full multi-tower cost allocation across 108 total shares (105 Personal + 3 Society Common Shares).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowWorkModal(true)}
              style={{
                background: '#10b981', color: '#ffffff', border: 'none',
                padding: '10px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Common / Tower Work
            </button>
            <button
              onClick={fetchData}
              style={{
                background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none',
                padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Campus Units</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>108 Units</div>
          <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>3 Towers × 36 Units (9 Floors)</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Share Breakdown</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            105 <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>+ 3 Common</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>105 Personal • 3 Society Pool</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Campus Common Works</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>
            ৳{(stats.totalCampusCommonCost / 100000).toFixed(1)} L
          </div>
          <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>৳{Math.round(stats.campusCommonCostPerShare).toLocaleString()} / Share</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Building-Specific Works</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', margin: '4px 0' }}>
            ৳{(stats.totalBuildingWorksCost / 100000).toFixed(1)} L
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Tower A, B & C Exclusive</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Multi-Building Owners</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0' }}>
            {stats.multiBuildingOwnersCount} Members
          </div>
          <span style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>Shares in Multiple Towers</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        {[
          { key: 'towers', label: '3 Connected Towers (A, B, C)', icon: 'fa-solid fa-city', badge: '36 Units Each' },
          { key: 'shares', label: '108 Shares Structure', icon: 'fa-solid fa-users-viewfinder', badge: '105 Person + 3 Common' },
          { key: 'works', label: 'Common & Building Works', icon: 'fa-solid fa-kaaba', badge: 'Mosque, Pool, Meeting' },
          { key: 'multiOwners', label: 'Multi-Tower Owner Portfolios', icon: 'fa-solid fa-id-card-clip', badge: `${multiOwners.length} Owners` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #4f46e5' : '3px solid transparent',
              color: activeTab === tab.key ? '#4f46e5' : '#64748b',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className={tab.icon}></i>
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? '#e0e7ff' : '#f1f5f9',
              color: activeTab === tab.key ? '#3730a3' : '#64748b',
              padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
            }}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: 3 CONNECTED TOWERS MATRIX (A, B, C)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'towers' && (
        <div>
          {/* Inter-connectivity Architecture Diagram Banner */}
          <div style={{
            background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px',
            padding: '20px', marginBottom: '24px', textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
              <i className="fa-solid fa-bridge text-indigo-600" style={{ marginRight: '8px' }}></i>
              Connected Campus Architecture: Ground Podium & 5th Level Skywalks
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '800px', marginInline: 'auto' }}>
              All 3 towers share a <strong>Central Ground Plaza</strong> (reception, mosque, substation) and are connected via 
              <strong> Structural Sky-Bridges at Floor 5</strong> allowing pedestrian transit between Tower A (Padma), Tower B (Meghna), and Tower C (Jamuna).
            </p>
          </div>

          {/* 3 Towers Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {buildings.map((b: any) => {
              const bCost = buildingCost[b.building_code] || { totalCost: 0, costPerUnit: 0 };
              const towerSpecificWorks = buildingWorks.filter((w: any) => w.id_buildings === b.id_buildings);
              const towerPrefix = b.building_code.split('-')[1];

              return (
                <div
                  key={b.id_buildings}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '24px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    borderTop: `6px solid ${towerPrefix === 'A' ? '#4f46e5' : towerPrefix === 'B' ? '#059669' : '#d97706'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                        background: '#f1f5f9', color: '#475569'
                      }}>
                        {b.building_code}
                      </span>
                      <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.25rem', color: '#0f172a' }}>{b.building_name}</h3>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>9 Floors • 36 Total Units • 4 Units/Floor</span>
                    </div>

                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', color: '#4f46e5'
                    }}>
                      <i className="fa-solid fa-building"></i>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Tower Specific Works:</span>
                      <strong style={{ color: '#0f172a' }}>৳{bCost.totalCost.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Allocated per Flat (÷36):</span>
                      <strong style={{ color: '#2563eb' }}>৳{Math.round(bCost.costPerUnit).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                      <span style={{ color: '#64748b' }}>+ Campus Common Share:</span>
                      <strong style={{ color: '#d97706' }}>৳{Math.round(stats.campusCommonCostPerShare).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, marginTop: '8px', color: '#065f46' }}>
                      <span>Total Share Liability:</span>
                      <span>৳{Math.round(bCost.costPerUnit + stats.campusCommonCostPerShare).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Tower Works List */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Building-Specific Scope:
                    </h5>
                    {towerSpecificWorks.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No tower-exclusive works logged.</p>
                    ) : (
                      towerSpecificWorks.map((tw: any) => (
                        <div key={tw.id_works} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '6px', marginBottom: '6px', fontSize: '0.8rem'
                        }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{tw.work_name}</span>
                          <strong style={{ color: '#059669' }}>৳{Number(tw.actual_cost).toLocaleString()}</strong>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Unit Sample */}
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Unit Range: <strong>{towerPrefix}-101</strong> to <strong>{towerPrefix}-904</strong> (36 Units)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: 108 SHARES & 3 COMMON SHARES SPOTLIGHT
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'shares' && (
        <div>
          {/* Spotlight on 3 Common Shares */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '8px', height: '24px', background: '#059669', borderRadius: '4px' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                The 3 Common Shares (Owned in Trust by Shopno Bilash Owners Welfare Society)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {commonShares.map((cs: any) => {
                const isMosque = cs.common_share_type === 'MOSQUE_SUITE';
                const isMeeting = cs.common_share_type === 'MEETING_ROOM';
                const isPool = cs.common_share_type === 'SWIMMING_POOL_SUITE';

                return (
                  <div
                    key={cs.id_units}
                    style={{
                      background: '#ffffff',
                      border: '2px solid #a7f3d0',
                      borderRadius: '14px',
                      padding: '20px',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '10px',
                          background: isMosque ? '#ecfdf5' : isMeeting ? '#eff6ff' : '#fffbeb',
                          color: isMosque ? '#059669' : isMeeting ? '#2563eb' : '#d97706',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                        }}>
                          <i className={isMosque ? 'fa-solid fa-kaaba' : isMeeting ? 'fa-solid fa-handshake' : 'fa-solid fa-person-swimming'}></i>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                            COMMON SHARE #{isMosque ? '1' : isMeeting ? '2' : '3'}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Unit {cs.unit_number}</h4>
                        </div>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 700 }}>
                        Society Owned
                      </span>
                    </div>

                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                      {isMosque && 'Central Juma Mosque & Imam Residential Suite'}
                      {isMeeting && 'Society Executive Secretariat & Audio-Visual Hall'}
                      {isPool && 'Swimming Pool Club & Guest Hospitality Suite'}
                    </h5>

                    <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#64748b' }}>
                      {isMosque && 'Allocated permanently for the 350-capacity mosque, ablution zone, and resident Imam apartment.'}
                      {isMeeting && 'Dedicated 80-seat council chamber for committee meetings, AGM, and society administrative operations.'}
                      {isPool && 'Associated with rooftop infinity pool operations, locker rooms, and visiting guest hospitality.'}
                    </p>

                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Unit Floor Area:</span>
                        <strong>{cs.area_sqft} SFT</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Undivided Land Share:</span>
                        <strong style={{ color: '#059669' }}>{cs.land_share_katha} Katha ({cs.land_share_sqft} SQFT)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Operational Funding:</span>
                        <strong>Shared across 105 Personal Members</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 105 Personal Shares Overview */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  105 Personal Member Shares Directory
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Each share entitles the holder to 0.2083 Katha (150 SQFT) undivided land title.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '8px' }}>
              {Array.from({ length: 108 }).map((_, idx) => {
                const towerIdx = Math.floor(idx / 36);
                const towerCode = towerIdx === 0 ? 'A' : towerIdx === 1 ? 'B' : 'C';
                const floor = Math.floor((idx % 36) / 4) + 1;
                const slot = (idx % 4) + 1;
                const uNum = `${towerCode}-${floor}0${slot}`;
                const isCommon = uNum === 'A-101' || uNum === 'B-101' || uNum === 'C-101';

                return (
                  <div
                    key={uNum}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      background: isCommon ? '#dcfce7' : '#f8fafc',
                      border: isCommon ? '1px solid #10b981' : '1px solid #e2e8f0',
                      color: isCommon ? '#065f46' : '#334155'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{uNum}</div>
                    <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.8 }}>
                      {isCommon ? 'COMMON' : `Slot ${slot}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: COMMON & BUILDING-WISE WORKS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'works' && (
        <div>
          {/* Campus-Wide Works (Mosque, Meeting Room, Pool, Substation, Skywalks) */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '8px', height: '24px', background: '#4f46e5', borderRadius: '4px' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                Campus-Wide Common Facilities (Mosque, Pool, Meeting Hall, Substation)
              </h3>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
                <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px' }}>Facility</th>
                    <th style={{ padding: '12px' }}>Work Name & Scope</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actual Cost (BDT)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Per Share (÷108)</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Progress</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campusWorks.map((w: any) => (
                    <tr key={w.id_works} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: w.facility_tag === 'MOSQUE' ? '#ecfdf5' : w.facility_tag === 'SWIMMING_POOL' ? '#eff6ff' : '#fef3c7',
                          color: w.facility_tag === 'MOSQUE' ? '#065f46' : w.facility_tag === 'SWIMMING_POOL' ? '#1d4ed8' : '#92400e'
                        }}>
                          {w.facility_tag}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{w.work_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{w.description}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{w.work_category}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                        ৳{Number(w.actual_cost).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>
                        ৳{Math.round(w.actual_cost / 108).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${w.progress_percentage}%`, height: '100%', background: '#10b981' }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{w.progress_percentage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Building-Specific Works */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '8px', height: '24px', background: '#2563eb', borderRadius: '4px' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                Building-Specific Exclusive Works (Allocated strictly to that Tower's 36 Units)
              </h3>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: 0 }}>
                <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px' }}>Tower</th>
                    <th style={{ padding: '12px' }}>Work Description</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actual Cost (BDT)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Per Tower Flat (÷36)</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Progress</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buildingWorks.map((w: any) => (
                    <tr key={w.id_works} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: '#e0e7ff', color: '#3730a3'
                        }}>
                          {w.building_code || 'Tower'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{w.work_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{w.description}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{w.work_category}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                        ৳{Number(w.actual_cost).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        ৳{Math.round(w.actual_cost / 36).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{w.progress_percentage}%</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: MULTI-TOWER OWNER PORTFOLIOS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'multiOwners' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#0f172a' }}>
              Owners with Shares Across Multiple Towers
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              In Shopno Bilash, members can own multiple shares across Tower A (Padma), Tower B (Meghna), and Tower C (Jamuna).
              The system calculates combined liabilities, common shares, and consolidated land deeds.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {multiOwners.map((owner: any) => (
              <div
                key={owner.id_owners}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{owner.full_name}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{owner.phone} • {owner.email}</span>
                    </div>

                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800,
                      background: '#e0e7ff', color: '#3730a3'
                    }}>
                      {owner.shares_count} Shares
                    </span>
                  </div>

                  {/* Towers Badges */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    {owner.buildings.map((bCode: string) => (
                      <span key={bCode} style={{
                        padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', fontWeight: 700
                      }}>
                        <i className="fa-solid fa-building" style={{ marginRight: '4px', color: '#4f46e5' }}></i>
                        {bCode}
                      </span>
                    ))}
                  </div>

                  {/* Units List */}
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Owned Units & Shares:
                    </div>
                    {owner.units.map((u: any) => (
                      <div key={u.unit_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.82rem' }}>
                        <div>
                          <strong style={{ color: '#4f46e5', marginRight: '6px' }}>{u.unit_number}</strong>
                          <span style={{ color: '#64748b' }}>({u.building})</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 600 }}>{u.area_sqft} SFT</span>
                          <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block' }}>{u.land_share_katha} Katha</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Portfolio Totals */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Combined SFT:</span>
                      <strong>{owner.total_sft.toLocaleString()} SFT</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Total Land Share:</span>
                      <strong style={{ color: '#059669' }}>{owner.total_katha.toFixed(4)} Katha</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => handleOpenOwnerPortfolio(owner)}
                    style={{
                      width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #4f46e5',
                      background: '#ffffff', color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    View Cross-Building Ledger & Liability
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD NEW COMMON / TOWER WORK
      ───────────────────────────────────────────────────────────── */}
      {showWorkModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                Add New Campus Common or Tower-Specific Work
              </h3>
              <button onClick={() => setShowWorkModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleCreateWork}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Work / Facility Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newWork.work_name}
                    onChange={e => setNewWork({ ...newWork, work_name: e.target.value })}
                    placeholder="e.g. Mosque Air-Conditioning & Sound System Upgrade"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Allocation Scope</label>
                  <select
                    className="form-select"
                    value={newWork.scope_level}
                    onChange={e => setNewWork({ ...newWork, scope_level: e.target.value })}
                  >
                    <option value="PROJECT_COMMON">Campus-Wide Common (Split across 108 Shares)</option>
                    <option value="BUILDING_SPECIFIC">Building-Specific (Split across that Tower 36 Units)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Target Tower (if specific)</label>
                  <select
                    className="form-select"
                    value={newWork.id_buildings}
                    onChange={e => setNewWork({ ...newWork, id_buildings: e.target.value })}
                    disabled={newWork.scope_level === 'PROJECT_COMMON'}
                  >
                    <option value="">-- Select Tower --</option>
                    {buildings.map((b: any) => (
                      <option key={b.id_buildings} value={b.id_buildings}>
                        {b.building_name} ({b.building_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Facility Tag</label>
                  <select
                    className="form-select"
                    value={newWork.facility_tag}
                    onChange={e => setNewWork({ ...newWork, facility_tag: e.target.value })}
                  >
                    <option value="MOSQUE">Central Mosque (মসজিদ)</option>
                    <option value="MEETING_ROOM">Meeting / Conference Room</option>
                    <option value="SWIMMING_POOL">Swimming Pool & Club</option>
                    <option value="SUBSTATION">Power Substation / Generator</option>
                    <option value="CENTRAL_PODIUM">Podium & Connecting Skywalks</option>
                    <option value="ELEVATOR">Elevator / Lifts</option>
                    <option value="GENERAL">General Works</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Estimated Budget (BDT)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newWork.estimated_cost}
                    onChange={e => setNewWork({ ...newWork, estimated_cost: e.target.value, actual_cost: e.target.value })}
                    required
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Scope Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={newWork.description}
                    onChange={e => setNewWork({ ...newWork, description: e.target.value })}
                    placeholder="Technical specifications and allocation rationale..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowWorkModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create & Auto-Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MULTI-TOWER OWNER DETAILED PORTFOLIO DRILLDOWN
      ───────────────────────────────────────────────────────────── */}
      {selectedOwner && ownerPortfolio && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '750px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase' }}>
                  Cross-Tower Member Portfolio
                </span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>{selectedOwner.full_name}</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Owns {ownerPortfolio.totalSharesOwned} Shares Across Multiple Buildings
                </span>
              </div>
              <button onClick={() => { setSelectedOwner(null); setOwnerPortfolio(null); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Shares:</span>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{ownerPortfolio.totalSharesOwned} Units</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Land Share:</span>
                <strong style={{ fontSize: '1.1rem', color: '#059669' }}>
                  {(ownerPortfolio.totalSharesOwned * 0.2083).toFixed(4)} Katha
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Financial Liability:</span>
                <strong style={{ fontSize: '1.2rem', color: '#b91c1c' }}>
                  ৳{Math.round(ownerPortfolio.grandTotalLiability).toLocaleString()}
                </strong>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '12px' }}>
              Breakdown by Unit & Tower:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {ownerPortfolio.units.map((u: any) => (
                <div key={u.id_units} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#4f46e5', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>
                        {u.unit_number}
                      </span>
                      <strong style={{ color: '#0f172a' }}>{u.building_name}</strong>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {u.area_sqft} SFT • {u.land_share_katha} Katha
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Campus Common:</span>
                      <strong>৳{Math.round(u.campusCommonCost).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Tower Specific:</span>
                      <strong>৳{Math.round(u.buildingSpecificCost).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Unit Total:</span>
                      <strong style={{ color: '#b91c1c' }}>৳{Math.round(u.totalLiability).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => { setSelectedOwner(null); setOwnerPortfolio(null); }}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', borderRadius: '6px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
