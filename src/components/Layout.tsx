import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* ENTERPRISE MULTI-OWNER APARTMENT SYSTEM SIDEBAR */}
      <aside className="sidebar">
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
            <span><i className="fa-solid fa-circle-nodes text-emerald-400" style={{ marginRight: '4px' }}></i> 3 Towers • 108 Units</span>
            <span style={{ background: '#059669', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>৳ BDT</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Executive & Core</div>
          <NavLink to="/apartment/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-gauge-high"></i>
            <span>Executive Dashboard</span>
          </NavLink>
          <NavLink to="/apartment/units" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-door-open"></i>
            <span>Flats & Units (A–F)</span>
          </NavLink>
          <NavLink to="/apartment/owners" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-users"></i>
            <span>Flat Owners & Shares</span>
          </NavLink>
          <NavLink to="/apartment/masters" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #0284c7' }}>
            <i className="fa-solid fa-database" style={{ color: '#0284c7' }}></i>
            <span style={{ fontWeight: 700 }}>Universal Masters (12 Systems)</span>
          </NavLink>
          <NavLink to="/apartment/shopno-bilash" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #10b981' }}>
            <i className="fa-solid fa-circle-nodes" style={{ color: '#10b981' }}></i>
            <span style={{ fontWeight: 700 }}>Shopno Bilash (108 Shares)</span>
          </NavLink>
          <NavLink to="/apartment/compliance" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ borderLeft: '3px solid #059669' }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: '#059669' }}></i>
            <span style={{ fontWeight: 700 }}>BD Compliance (Land, JVA, RAJUK)</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">Engineering & Drawings</div>
          <NavLink to="/apartment/works" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-trowel-bricks"></i>
            <span>Works & Allocations</span>
          </NavLink>
          <NavLink to="/apartment/drawings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-compass-drafting"></i>
            <span>Blueprints & Revisions</span>
          </NavLink>
          <NavLink to="/apartment/boq" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-boxes-stacked"></i>
            <span>BOQ & Materials</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">Contractors & Site Operations</div>
          <NavLink to="/apartment/contractors" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-hard-hat"></i>
            <span>Contractors & Billing</span>
          </NavLink>
          <NavLink to="/apartment/site-manager" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-mobile-screen-button"></i>
            <span>Site Manager & Labour</span>
          </NavLink>
          <NavLink to="/apartment/procurement" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-truck-ramp-box"></i>
            <span>Vendors & Invoices</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">Financial Engine & Forecasting</div>
          <NavLink to="/apartment/cashflow" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-chart-line"></i>
            <span>Cash Flow Forecast</span>
          </NavLink>
          <NavLink to="/apartment/cost-sft" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-ruler-combined"></i>
            <span>Cost / SFT Analytics</span>
          </NavLink>
          <NavLink to="/apartment/room-costing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-layer-group"></i>
            <span>Room-Level Costing</span>
          </NavLink>
          <NavLink to="/apartment/finances" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-coins"></i>
            <span>Payments & Loans</span>
          </NavLink>
          <NavLink to="/apartment/facilities" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-elevator"></i>
            <span>2 Lifts & Common Area</span>
          </NavLink>
          <NavLink to="/apartment/reports" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-file-invoice"></i>
            <span>Financial Reports</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">Governance & Handover</div>
          <NavLink to="/apartment/voting" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-check-to-slot"></i>
            <span>Committee Decisions</span>
          </NavLink>
          <NavLink to="/apartment/maintenance" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-wrench"></i>
            <span>Post-Handover Maintenance</span>
          </NavLink>
          <NavLink to="/apartment/owner-portal" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-user-shield"></i>
            <span>My Flat Owner Portal</span>
          </NavLink>
          <NavLink to="/apartment/audit" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-shield-halved"></i>
            <span>Approvals & Audit Log</span>
          </NavLink>

          <hr className="nav-divider" />
          <div className="nav-section">Account</div>
          <button className="nav-item" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className="fa-solid fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <strong style={{ color: '#0f172a', fontSize: '1rem' }}>Shopno Bilash (স্বপ্ন বিলাস)</strong>
            </div>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
              <span><i className="fa-solid fa-building" style={{ marginRight: '4px', color: '#4f46e5' }}></i> 3 Connected Towers (Padma, Meghna, Jamuna)</span>
              <span>&bull;</span>
              <span style={{ color: '#059669', fontWeight: 600 }}><i className="fa-solid fa-certificate" style={{ marginRight: '4px' }}></i> 108 Shares (105 Personal + 3 Society Common)</span>
              <span>&bull;</span>
              <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>RAJUK &bull; ৳ BDT Standard</span>
            </div>
          </div>
          <div className="user-menu">
            <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="user-name">{user?.name || 'Administrator'}</span>
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
