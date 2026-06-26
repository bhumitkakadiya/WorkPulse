import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthLayout from './layouts/AuthLayout';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EmployeeDrilldown from './pages/manager/EmployeeDrilldown';

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import PulseAIPage from './pages/employee/PulseAIPage';
import ScreenshotsPage from './pages/employee/ScreenshotsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrganization from './pages/admin/AdminOrganization';
import AdminBilling from './pages/admin/AdminBilling';
import AdminRoles from './pages/admin/AdminRoles';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import TasksPage from './pages/TasksPage';
import LeavesPage from './pages/LeavesPage';
import GoalsPage from './pages/GoalsPage';
import ActivityTimeline from './pages/ActivityTimeline';
import MessagesPage from './pages/MessagesPage';
import PerformancePage from './pages/PerformancePage';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalSearch from './components/GlobalSearch';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
}

import DashboardLayout from './components/DashboardLayout';
import { Outlet } from 'react-router-dom';

function DashboardLayoutWrapper() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <GlobalSearch />
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<DashboardLayoutWrapper />}>
        {/* Manager routes */}
        <Route path="/manager" element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/manager/activity" element={<Navigate to="/manager" replace />} />

        <Route path="/manager/employee/:id" element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <EmployeeDrilldown />
          </ProtectedRoute>
        } />
        <Route path="/manager/team/:id/activity" element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <ActivityTimeline />
          </ProtectedRoute>
        } />

        {/* Employee routes */}
        <Route path="/employee" element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employee/activity" element={
          <ProtectedRoute>
            <ActivityTimeline />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/roles" element={
          <ProtectedRoute roles={['admin']}>
            <AdminRoles />
          </ProtectedRoute>
        } />
        <Route path="/admin/users/:id/activity" element={
          <ProtectedRoute roles={['admin']}>
            <ActivityTimeline />
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute roles={['admin']}>
            <AdminCategories />
          </ProtectedRoute>
        } />
        <Route path="/admin/organization" element={
          <ProtectedRoute roles={['admin']}>
            <AdminOrganization />
          </ProtectedRoute>
        } />
        <Route path="/admin/billing" element={
          <ProtectedRoute roles={['admin']}>
            <AdminBilling />
          </ProtectedRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute roles={['admin']}>
            <AdminAuditLogs />
          </ProtectedRoute>
        } />

        {/* Shared routes */}
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        } />
        <Route path="/leaves" element={
          <ProtectedRoute>
            <LeavesPage />
          </ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="/performance" element={
          <ProtectedRoute>
            <PerformancePage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProviderWrapper />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function ThemeProviderWrapper() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
