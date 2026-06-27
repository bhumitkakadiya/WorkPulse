import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalSearch from './components/GlobalSearch';
import DashboardLayout from './components/DashboardLayout';
import SkeletonLoader from './components/SkeletonLoader';
import { Outlet } from 'react-router-dom';

// Eagerly load lightweight components
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';

// Lazy load all dashboard pages for faster initial bundle
const ManagerDashboard  = lazy(() => import('./pages/manager/ManagerDashboard'));
const EmployeeDrilldown = lazy(() => import('./pages/manager/EmployeeDrilldown'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const TeamActivity      = lazy(() => import('./pages/manager/TeamActivity'));
const PulseAIPage       = lazy(() => import('./pages/employee/PulseAIPage'));
const ScreenshotsPage   = lazy(() => import('./pages/employee/ScreenshotsPage'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCategories   = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrganization = lazy(() => import('./pages/admin/AdminOrganization'));
const AdminBilling      = lazy(() => import('./pages/admin/AdminBilling'));
const AdminRoles        = lazy(() => import('./pages/admin/AdminRoles'));
const AdminAuditLogs    = lazy(() => import('./pages/admin/AdminAuditLogs'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage'));
const OnboardingPage    = lazy(() => import('./pages/OnboardingPage'));
const TasksPage         = lazy(() => import('./pages/TasksPage'));
const LeavesPage        = lazy(() => import('./pages/LeavesPage'));
const GoalsPage         = lazy(() => import('./pages/GoalsPage'));
const ActivityTimeline  = lazy(() => import('./pages/ActivityTimeline'));
const MessagesPage      = lazy(() => import('./pages/MessagesPage'));
const PerformancePage   = lazy(() => import('./pages/PerformancePage'));

// Loading fallback
const PageLoader = () => (
  <div style={{ padding: 30 }}>
    <SkeletonLoader type="card" count={3} />
  </div>
);

const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ padding: 30 }}>
      <SkeletonLoader type="card" count={1} />
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



function DashboardLayoutWrapper() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
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
        <Route path="/manager/activity" element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <TeamActivity />
          </ProtectedRoute>
        } />

        <Route path="/manager/employee/:id" element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <EmployeeDrilldown />
          </ProtectedRoute>
        } />
        <Route path="/manager/employee/:id/activity" element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <ActivityTimeline />
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

      {/* 404 Catch-all */}
      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <ThemeProviderWrapper />
            <Toaster position="top-right" toastOptions={{ className: 'glass-toast', style: { background: '#1e293b', color: '#fff' } }} />
          </ToastProvider>
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
