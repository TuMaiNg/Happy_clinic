import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AdminLayout } from '../../pages/admin/Layout/AdminLayout';
import { DoctorDashboard } from '../../pages/doctor/DoctorDashboard';
import { StaffDashboard } from '../../pages/staff/StaffDashboard';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');
jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Role-Based Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin can access admin panel', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Happy Care')).toBeInTheDocument();
  });

  it('doctor can access doctor dashboard', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, email: 'doctor@example.com', role: 'doctor' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Lịch hẹn hôm nay')).toBeInTheDocument();
  });

  it('staff can access staff dashboard', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 3, email: 'staff@example.com', role: 'staff' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Quản lý lịch hẹn')).toBeInTheDocument();
  });

  it('prevents unauthorized access', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'patient@example.com', role: 'patient' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    // Should redirect or show error
    expect(container.firstChild).not.toHaveTextContent('Happy Care');
  });
});

