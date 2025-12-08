import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { BookingWizard } from './components/features/appointments/BookingWizard';
import { Appointments } from './pages/Appointments';
import { AdminLayout } from './pages/admin/Layout/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard/AdminDashboard';
import { AppointmentList } from './pages/admin/Appointments/AppointmentList';
import { PatientList } from './pages/admin/Patients/PatientList';
import { DoctorList } from './pages/admin/Doctors/DoctorList';
import { ServiceList } from './pages/admin/Services/ServiceList';
import { PaymentList } from './pages/admin/Payments/PaymentList';
import { ReportsPage } from './pages/admin/Reports/ReportsPage';
import { SettingsPage } from './pages/admin/Settings/SettingsPage';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';

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
      <Router>
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
