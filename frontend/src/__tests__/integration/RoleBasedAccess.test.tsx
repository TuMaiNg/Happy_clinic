import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils';
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

    render(<AdminLayout />);

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

    render(<DoctorDashboard />);

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

    render(<StaffDashboard />);

    expect(screen.getByText('Quản lý lịch hẹn')).toBeInTheDocument();
  });
});

