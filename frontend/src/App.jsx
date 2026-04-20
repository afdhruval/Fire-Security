import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { initializeStorage } from './services/storage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Guards from './pages/Guards';
import Equipment from './pages/Equipment';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import CreateReport from './pages/CreateReport';
import ReportDetail from './pages/ReportDetail';
import Analytics from './pages/Analytics';
import Patrol from './pages/Patrol';
import AuditLogs from './pages/AuditLogs';
import Billing from './pages/Billing';
import Feedback from './pages/Feedback';
import GuardTracker from './pages/GuardTracker';

const RoleRoute = ({ routeId, children }) => (
  <ProtectedRoute routeId={routeId}>{children}</ProtectedRoute>
);

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition:   true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* All nested routes require authentication */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* ── Available to ALL roles ── */}
            <Route path="dashboard"     element={<RoleRoute routeId="dashboard"><Dashboard /></RoleRoute>} />
            <Route path="equipment"     element={<RoleRoute routeId="equipment"><Equipment /></RoleRoute>} />
            <Route path="attendance"    element={<RoleRoute routeId="attendance"><Attendance /></RoleRoute>} />
            <Route path="chat"          element={<RoleRoute routeId="chat"><Chat /></RoleRoute>} />
            <Route path="feedback"      element={<RoleRoute routeId="feedback"><Feedback /></RoleRoute>} />
            <Route path="guard-tracker" element={<RoleRoute routeId="guard-tracker"><GuardTracker /></RoleRoute>} />

            {/* ── CEO + HR only ── */}
            <Route path="clients"        element={<RoleRoute routeId="clients"><Clients /></RoleRoute>} />
            <Route path="guards"         element={<RoleRoute routeId="guards"><Guards /></RoleRoute>} />
            <Route path="salary"         element={<RoleRoute routeId="salary"><Salary /></RoleRoute>} />
            <Route path="billing"        element={<RoleRoute routeId="billing"><Billing /></RoleRoute>} />
            <Route path="reports"        element={<RoleRoute routeId="reports"><Reports /></RoleRoute>} />
            <Route path="reports/create" element={<RoleRoute routeId="reports"><CreateReport /></RoleRoute>} />
            <Route path="reports/:id"    element={<RoleRoute routeId="reports"><ReportDetail /></RoleRoute>} />

            {/* ── CEO ONLY ── */}
            <Route path="analytics"  element={<RoleRoute routeId="analytics"><Analytics /></RoleRoute>} />
            <Route path="patrol"     element={<RoleRoute routeId="patrol"><Patrol /></RoleRoute>} />
            <Route path="audit-logs" element={<RoleRoute routeId="audit-logs"><AuditLogs /></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;