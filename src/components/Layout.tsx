import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang, LanguageSelect } from '../i18n/LanguageContext';

export default function Layout() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();
  // Phone/tablet: the sidebar slides in over the page and closes after navigating.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setNavOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [navOpen]);

  // Flat-owner logins only get their own portal; the API refuses everything else anyway.
  const OWNER_PATHS = ['/apartment/owner-portal'];
  if (user && !isStaff && !OWNER_PATHS.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/apartment/owner-portal" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* ENTERPRISE MULTI-OWNER APARTMENT SYSTEM SIDEBAR */}
      <aside id="app-sidebar" className={`sidebar${navOpen ? ' open' : ''}`}>
        <div className="sidebar-brand" style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div className="brand-icon" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <i className="fa-solid fa-city"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Shopno Bilash</h2>
              <span style={{ fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 600 }}>স্বপ্ন বিলাস কনস্ট্রাকশন</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="fa-solid fa-circle-nodes text-emerald-400" style={{ marginRight: '4px' }}></i> {t('3 Towers • 108 Units', '৩ টাওয়ার • ১০৮ ইউনিট')}</span>
            <span style={{ background: '#059669', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>৳ BDT</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isStaff ? (<>
          <div className="nav-section">{t('Executive & Core')}</div>
          <NavLink to="/apartment/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-gauge-high"></i>
            <span>{t('Executive Dashboard')}</span>
          </NavLink>
          <NavLink to="/apartment/units" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-door-open"></i>
            <span>{t('Flats & Units (A–F)')}</span>
          </NavLink>
          <NavLink to="/apartment/owners" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-users"></i>
            <span>{t('Flat Owners & Shares')}</span>
          </NavLink>
          <NavLink to="/apartment/masters" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #0284c7' }}>
            <i className="fa-solid fa-database" style={{ color: '#0284c7' }}></i>
            <span style={{ fontWeight: 700 }}>{t('Universal Masters (13 Systems)')}</span>
          </NavLink>
          <NavLink to="/apartment/shopno-bilash" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #10b981' }}>
            <i className="fa-solid fa-circle-nodes" style={{ color: '#10b981' }}></i>
            <span style={{ fontWeight: 700 }}>{t('Shopno Bilash (108 Shares)')}</span>
          </NavLink>
          <NavLink to="/apartment/compliance" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #059669' }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: '#059669' }}></i>
            <span style={{ fontWeight: 700 }}>{t('BD Compliance (Land, JVA, RAJUK)')}</span>
          </NavLink>
          <NavLink to="/apartment/bd-toolkit" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #dc2626' }}>
            <i className="fa-solid fa-toolbox" style={{ color: '#f87171' }}></i>
            <span style={{ fontWeight: 700 }}>{t('BD Toolkit (Deed, bKash, VAT, Holding)')}</span>
          </NavLink>
          <NavLink to="/apartment/collections" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #f59e0b' }}>
            <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#fbbf24' }}></i>
            <span style={{ fontWeight: 700 }}>{t('Receipts, SMS & Online Pay')}</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">{t('Building Operations')}</div>
          <NavLink to="/operations/tenants" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-house-user"></i>
            <span>{t('Tenants & Rent')}</span>
          </NavLink>
          <NavLink to="/operations/billing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-file-invoice-dollar"></i>
            <span>{t('Service Charge Billing')}</span>
          </NavLink>
          <NavLink to="/operations/staff" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-user-shield"></i>
            <span>{t('Building Staff & Payroll')}</span>
          </NavLink>
          <NavLink to="/operations/gate" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-torii-gate"></i>
            <span>{t('Gate, Parking & Notices')}</span>
          </NavLink>
          <NavLink to="/operations/helpdesk" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-headset"></i>
            <span>{t('Resident Helpdesk', 'বাসিন্দা হেল্পডেস্ক')}</span>
          </NavLink>
          <NavLink to="/operations/automation" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-robot"></i>
            <span>{t('Automation', 'স্বয়ংক্রিয় কাজ')}</span>
          </NavLink>
          <hr className="nav-divider" />
          <div className="nav-section">{t('Engineering & Drawings')}</div>
          <NavLink to="/apartment/works" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-trowel-bricks"></i>
            <span>{t('Works & Allocations')}</span>
          </NavLink>
          <NavLink to="/apartment/drawings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-compass-drafting"></i>
            <span>{t('Blueprints & Revisions')}</span>
          </NavLink>
          <NavLink to="/apartment/boq" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-boxes-stacked"></i>
            <span>{t('BOQ & Materials')}</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">{t('Contractors & Site Operations')}</div>
          <NavLink to="/apartment/contractors" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-hard-hat"></i>
            <span>{t('Contractors & Billing')}</span>
          </NavLink>
          <NavLink to="/apartment/site-manager" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-mobile-screen-button"></i>
            <span>{t('Site Manager & Labour')}</span>
          </NavLink>
          <NavLink to="/apartment/procurement" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-truck-ramp-box"></i>
            <span>{t('Vendors & Invoices')}</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">{t('Financial Engine & Forecasting')}</div>
          <NavLink to="/apartment/cashflow" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-chart-line"></i>
            <span>{t('Cash Flow Forecast')}</span>
          </NavLink>
          <NavLink to="/apartment/cost-sft" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-ruler-combined"></i>
            <span>{t('Cost / SFT Analytics')}</span>
          </NavLink>
          <NavLink to="/apartment/room-costing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-layer-group"></i>
            <span>{t('Room-Level Costing')}</span>
          </NavLink>
          <NavLink to="/apartment/finances" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-coins"></i>
            <span>{t('Payments & Loans')}</span>
          </NavLink>
          <NavLink to="/apartment/facilities" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-elevator"></i>
            <span>{t('2 Lifts & Common Area')}</span>
          </NavLink>
          <NavLink to="/apartment/reports" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-file-invoice"></i>
            <span>{t('Financial Reports')}</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">{t('Governance & Handover')}</div>
          <NavLink to="/apartment/voting" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-check-to-slot"></i>
            <span>{t('Committee Decisions')}</span>
          </NavLink>
          <NavLink to="/apartment/maintenance" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-wrench"></i>
            <span>{t('Post-Handover Maintenance')}</span>
          </NavLink>
          <NavLink to="/apartment/owner-portal" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-user-shield"></i>
            <span>{t('My Flat Owner Portal')}</span>
          </NavLink>
          <NavLink to="/apartment/audit" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-shield-halved"></i>
            <span>{t('Approvals & Audit Log')}</span>
          </NavLink>

          <hr className="nav-divider" />
          </>) : (<>
          <div className="nav-section">{t('My Flat')}</div>
          <NavLink to="/apartment/owner-portal" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-user-shield"></i>
            <span>{t('My Flat Owner Portal')}</span>
          </NavLink>
          <hr className="nav-divider" />
          </>)}
          <div className="nav-section">{t('Account')}</div>
          <button className="nav-item" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className="fa-solid fa-sign-out-alt"></i>
            <span>{t('Logout')}</span>
          </button>
        </nav>
      </aside>

      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} aria-hidden />}

      {/* MAIN CONTENT AREA */}
      <div className="main-area">
        <header className="topbar">
          <button type="button" className="nav-toggle" aria-label={t('Open menu', 'মেনু খুলুন')} aria-expanded={navOpen} aria-controls="app-sidebar" onClick={() => setNavOpen(o => !o)}>
            <i className={navOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} />
          </button>
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <strong style={{ color: '#0f172a', fontSize: '1rem' }}>Shopno Bilash (স্বপ্ন বিলাস)</strong>
            </div>
            <span className="topbar-details" style={{ color: '#cbd5e1' }}>|</span>
            <div className="topbar-details" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
              <span><i className="fa-solid fa-building" style={{ marginRight: '4px', color: '#4f46e5' }}></i> {t('3 Connected Towers (Padma, Meghna, Jamuna)', '৩টি সংযুক্ত টাওয়ার (পদ্মা, মেঘনা, যমুনা)')}</span>
              <span>&bull;</span>
              <span style={{ color: '#059669', fontWeight: 600 }}><i className="fa-solid fa-certificate" style={{ marginRight: '4px' }}></i> {t('108 Shares (105 Personal + 3 Society Common)', '১০৮ শেয়ার (১০৫ ব্যক্তিগত + ৩ সমিতি)')}</span>
              <span>&bull;</span>
              <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{t('RAJUK • ৳ BDT Standard', 'রাজউক • ৳ টাকা')}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', marginRight: 16 }}><LanguageSelect compact /></div>
          <div className="user-menu">
            <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</div>
            <div className="user-meta" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="user-name">{user?.name || t('Administrator', 'প্রশাসক')}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
