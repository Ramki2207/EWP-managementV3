import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Verdelers from "./pages/Verdelers";
import VerdelerDetails from "./pages/VerdelerDetails";
import Uploads from "./pages/Uploads";
import CreateProject from "./pages/CreateProject";
import CreateDistributor from "./pages/CreateDistributor";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import Account from "./pages/Account";
import Insights from "./pages/Insights";
import Meldingen from "./pages/Meldingen";
import MaintenanceReport from "./pages/MaintenanceReport";
import AccessCodes from "./pages/AccessCodes";
import Sidebar from "./components/Sidebar";
import Loader from "./components/Loader";
import PermissionRoute from "./components/PermissionRoute";
import { useEnhancedPermissions } from "./hooks/useEnhancedPermissions";
import Help from "./pages/Help";
import ClientPortal from "./pages/ClientPortal";
import ClientPortalManagement from "./pages/ClientPortalManagement";
import { requestNotificationPermission, subscribeToNotifications } from "./lib/notifications";
import { projectLockManager } from "./lib/projectLocks";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const showSidebar = isLoggedIn && location.pathname !== "/login" && location.pathname !== "/client-portal";

  useEffect(() => {
    if (isLoggedIn) {
      const userId = localStorage.getItem("currentUserId");
      if (userId) {
        // Request notification permission
        requestNotificationPermission().then((granted) => {
          if (granted) {
            // Subscribe to notifications
            subscribeToNotifications(userId);
          }
        });
      }
      
      // Initialize project lock manager
      projectLockManager.initialize();
    }
  }, [isLoggedIn]);

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className={`flex-1 ${showSidebar ? 'ml-0 md:ml-64' : ''}`}>
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <React.Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/" element={<PermissionRoute requiredPermission={{ module: 'dashboard', permission: 'read' }}><Dashboard /></PermissionRoute>} />
            <Route path="/dashboard" element={<PermissionRoute requiredPermission={{ module: 'dashboard', permission: 'read' }}><Dashboard /></PermissionRoute>} />
            <Route path="/insights" element={<PermissionRoute requiredPermission={{ module: 'insights', permission: 'read' }}><Insights /></PermissionRoute>} />
            <Route path="/projects" element={<PermissionRoute requiredPermission={{ module: 'projects', permission: 'read' }}><Projects /></PermissionRoute>} />
            <Route path="/project/:projectId" element={<PermissionRoute requiredPermission={{ module: 'projects', permission: 'read' }}><ProjectDetails /></PermissionRoute>} />
            <Route path="/create-project" element={<PermissionRoute requiredPermission={{ module: 'projects', permission: 'create' }}><CreateProject /></PermissionRoute>} />
            <Route path="/clients" element={<PermissionRoute requiredPermission={{ module: 'clients', permission: 'read' }}><Clients /></PermissionRoute>} />
            <Route path="/client/:clientId" element={<PermissionRoute requiredPermission={{ module: 'clients', permission: 'read' }}><ClientDetails /></PermissionRoute>} />
            <Route path="/verdelers" element={<PermissionRoute requiredPermission={{ module: 'verdelers', permission: 'read' }}><Verdelers /></PermissionRoute>} />
            <Route path="/verdelers/:id" element={<PermissionRoute requiredPermission={{ module: 'verdelers', permission: 'read' }}><VerdelerDetails /></PermissionRoute>} />
            <Route path="/create-distributor" element={<PermissionRoute requiredPermission={{ module: 'verdelers', permission: 'create' }}><CreateDistributor /></PermissionRoute>} />
            <Route path="/uploads" element={<PermissionRoute requiredPermission={{ module: 'uploads', permission: 'read' }}><Uploads /></PermissionRoute>} />
            <Route path="/gebruikers" element={<PermissionRoute requiredPermission={{ module: 'gebruikers', permission: 'read' }}><Users /></PermissionRoute>} />
            <Route path="/access-codes" element={<PermissionRoute requiredPermission={{ module: 'access_codes', permission: 'read' }}><AccessCodes /></PermissionRoute>} />
            <Route path="/client-portals" element={<PermissionRoute requiredPermission={{ module: 'client_portals', permission: 'read' }}><ClientPortalManagement /></PermissionRoute>} />
            <Route path="/account" element={<PermissionRoute><Account /></PermissionRoute>} />
            <Route path="/meldingen" element={<PermissionRoute><Meldingen /></PermissionRoute>} />
            <Route path="/help" element={<PermissionRoute><Help /></PermissionRoute>} />
            <Route path="/maintenance-report" element={<MaintenanceReport />} />
            <Route path="/client-portal/:accessCode" element={<ClientPortal />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </React.Suspense>
      </Layout>
    </Router>
  );
};

export default App;