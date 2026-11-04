import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { LanguageProvider } from './i18n/LanguageContext';

// Apartment System Core Modules
const ExecutiveDashboard = lazy(() => import('./pages/Apartment/ExecutiveDashboard'));
const UnitsList = lazy(() => import('./pages/Apartment/UnitsList'));
const OwnersList = lazy(() => import('./pages/Apartment/OwnersList'));
const WorksManagement = lazy(() => import('./pages/Apartment/WorksManagement'));
const BOQMaterials = lazy(() => import('./pages/Apartment/BOQMaterials'));
const ProcurementVendors = lazy(() => import('./pages/Apartment/ProcurementVendors'));
const FinanceManagement = lazy(() => import('./pages/Apartment/FinanceManagement'));
const FacilitiesLifts = lazy(() => import('./pages/Apartment/FacilitiesLifts'));
const FinancialReports = lazy(() => import('./pages/Apartment/FinancialReports'));
const OwnerPortal = lazy(() => import('./pages/Apartment/OwnerPortal'));
const AuditApprovals = lazy(() => import('./pages/Apartment/AuditApprovals'));

// Advanced Enterprise Additions (Sections 1-38)
const CashFlowForecasting = lazy(() => import('./pages/Apartment/CashFlowForecasting'));
const CostPerSftAnalytics = lazy(() => import('./pages/Apartment/CostPerSftAnalytics'));
const RoomLevelCosting = lazy(() => import('./pages/Apartment/RoomLevelCosting'));
const DrawingsRevisionControl = lazy(() => import('./pages/Apartment/DrawingsRevisionControl'));
const ContractorManagement = lazy(() => import('./pages/Apartment/ContractorManagement'));
const SiteManagerMobile = lazy(() => import('./pages/Apartment/SiteManagerMobile'));
const CommitteeVoting = lazy(() => import('./pages/Apartment/CommitteeVoting'));
const PostHandoverMaintenance = lazy(() => import('./pages/Apartment/PostHandoverMaintenance'));
const MasterManagement = lazy(() => import('./pages/Apartment/MasterManagement'));
const ShopnoBilashHub = lazy(() => import('./pages/Apartment/ShopnoBilashHub'));
const BangladeshComplianceHub = lazy(() => import('./pages/Apartment/BangladeshComplianceHub'));
const BangladeshToolkit = lazy(() => import('./pages/Apartment/BangladeshToolkit'));
const CollectionsCenter = lazy(() => import('./pages/Apartment/CollectionsCenter'));
const ReceiptPrint = lazy(() => import('./pages/Apartment/ReceiptPrint'));

// Building operations (after handover)
const TenantsRent = lazy(() => import('./pages/Operations/TenantsRent'));
const TenantFormPrint = lazy(() => import('./pages/Operations/TenantFormPrint'));
const ServiceBilling = lazy(() => import('./pages/Operations/ServiceBilling'));
const BuildingStaff = lazy(() => import('./pages/Operations/BuildingStaff'));
const GateParking = lazy(() => import('./pages/Operations/GateParking'));
const Helpdesk = lazy(() => import('./pages/Operations/Helpdesk'));
const Automation = lazy(() => import('./pages/Operations/Automation'));

// Auth & Classic
const Login = lazy(() => import('./pages/Login'));
const ListBuilding = lazy(() => import('./pages/Building/ListBuilding'));
const CreateEditBuilding = lazy(() => import('./pages/Building/CreateEditBuilding'));
const BuildingDetails = lazy(() => import('./pages/Building/BuildingDetails'));

const Loader = () => (
  <div className="loader-overlay">
    <div className="loader-spinner">
      <i className="fa-solid fa-building fa-spin" style={{ fontSize: '2rem', color: '#4f46e5' }}></i>
      <p className="mt-2 text-muted fw-semibold">Loading Apartment Management Platform...</p>
    </div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const HomeRedirect = () => {
  const { user, isStaff } = useAuth();
  if (!user) return <Loader />;
  return <Navigate to={isStaff ? '/apartment/dashboard' : '/apartment/owner-portal'} replace />;
};

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Print view sits outside the app shell so the page prints cleanly */}
            <Route path="/print/receipt/:id" element={<PrivateRoute><ReceiptPrint /></PrivateRoute>} />
            <Route path="/print/tenant-form/:id" element={<PrivateRoute><TenantFormPrint /></PrivateRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<HomeRedirect />} />
              
              {/* CORE APARTMENT MODULES */}
              <Route path="apartment/dashboard" element={<ExecutiveDashboard />} />
              <Route path="apartment/units" element={<UnitsList />} />
              <Route path="apartment/units/:id" element={<UnitsList />} />
              <Route path="apartment/owners" element={<OwnersList />} />
              <Route path="apartment/works" element={<WorksManagement />} />
              <Route path="apartment/boq" element={<BOQMaterials />} />
              <Route path="apartment/procurement" element={<ProcurementVendors />} />
              <Route path="apartment/finances" element={<FinanceManagement />} />
              <Route path="apartment/facilities" element={<FacilitiesLifts />} />
              <Route path="apartment/reports" element={<FinancialReports />} />
              <Route path="apartment/owner-portal" element={<OwnerPortal />} />
              <Route path="apartment/audit" element={<AuditApprovals />} />

              {/* ADVANCED EXPANSIONS (Sections 1-38) */}
              <Route path="apartment/cashflow" element={<CashFlowForecasting />} />
              <Route path="apartment/cost-sft" element={<CostPerSftAnalytics />} />
              <Route path="apartment/room-costing" element={<RoomLevelCosting />} />
              <Route path="apartment/drawings" element={<DrawingsRevisionControl />} />
              <Route path="apartment/contractors" element={<ContractorManagement />} />
              <Route path="apartment/site-manager" element={<SiteManagerMobile />} />
              <Route path="apartment/voting" element={<CommitteeVoting />} />
              <Route path="apartment/maintenance" element={<PostHandoverMaintenance />} />
              <Route path="apartment/masters" element={<MasterManagement />} />
              <Route path="apartment/shopno-bilash" element={<ShopnoBilashHub />} />
              <Route path="apartment/compliance" element={<BangladeshComplianceHub />} />
              <Route path="apartment/bd-toolkit" element={<BangladeshToolkit />} />
              <Route path="apartment/collections" element={<CollectionsCenter />} />
              <Route path="operations/tenants" element={<TenantsRent />} />
              <Route path="operations/billing" element={<ServiceBilling />} />
              <Route path="operations/staff" element={<BuildingStaff />} />
              <Route path="operations/gate" element={<GateParking />} />
              <Route path="operations/helpdesk" element={<Helpdesk />} />
              <Route path="operations/automation" element={<Automation />} />

              {/* ORIGINAL GENERAL MODULES */}
              <Route path="buildings" element={<ListBuilding />} />
              <Route path="buildings/create" element={<CreateEditBuilding />} />
              <Route path="buildings/edit/:id" element={<CreateEditBuilding />} />
              <Route path="buildings/details/:id" element={<BuildingDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}
