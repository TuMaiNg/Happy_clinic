import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load components for code splitting
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard').then(m => ({ default: m.PatientDashboard })));
const BookingWizard = lazy(() => import('./components/features/appointments/BookingWizard').then(m => ({ default: m.BookingWizard })));
const Appointments = lazy(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess').then(m => ({ default: m.PaymentSuccess })));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel').then(m => ({ default: m.PaymentCancel })));
const AdminLayout = lazy(() => import('./pages/admin/Layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AppointmentList = lazy(() => import('./pages/admin/Appointments/AppointmentList').then(m => ({ default: m.AppointmentList })));
const PatientList = lazy(() => import('./pages/admin/Patients/PatientList').then(m => ({ default: m.PatientList })));
const DoctorList = lazy(() => import('./pages/admin/Doctors/DoctorList').then(m => ({ default: m.DoctorList })));
const ServiceList = lazy(() => import('./pages/admin/Services/ServiceList').then(m => ({ default: m.ServiceList })));
const PaymentList = lazy(() => import('./pages/admin/Payments/PaymentList').then(m => ({ default: m.PaymentList })));
const ReportsPage = lazy(() => import('./pages/admin/Reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/admin/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard').then(m => ({ default: m.StaffDashboard })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }
  
  if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }
  
  if (user?.role === 'staff') {
    return <StaffDashboard />;
  }
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book-appointment"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <BookingWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="appointments" element={<AppointmentList />} />
                <Route path="patients" element={<PatientList />} />
                <Route path="doctors" element={<DoctorList />} />
                <Route path="services" element={<ServiceList />} />
                <Route path="payments" element={<PaymentList />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              {/* Doctor Routes */}
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/payment/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
