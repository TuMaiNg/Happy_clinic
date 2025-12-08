import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppointmentList } from '../../pages/admin/Appointments/AppointmentList';
import { StaffDashboard } from '../../pages/staff/StaffDashboard';
import { DoctorDashboard } from '../../pages/doctor/DoctorDashboard';
import { api } from '../../config/api';

jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
  }),
}));

const mockAppointment = {
  id: 1,
  patient_name: 'Nguyễn Văn A',
  patient_phone: '0912345678',
  doctor_name: 'BS. Trần Thị B',
  service_name: 'Khám tổng quát',
  appointment_date: '2024-12-20',
  start_time: '08:00',
  status: 'pending',
};

describe('Appointment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: [mockAppointment] },
    });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('admin can view and confirm appointment', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AppointmentList />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Xác nhận');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/confirm');
    });
  });

  it('staff can confirm and check-in appointment', async () => {
    // First confirm
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ ...mockAppointment, status: 'pending' }] },
    });

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Xác nhận'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/confirm');
    });

    // Then check-in
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ ...mockAppointment, status: 'confirmed' }] },
    });

    rerender(
      <BrowserRouter>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Check-in')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Check-in'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/check-in');
    });
  });

  it('doctor can view and complete appointment', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: [
          {
            ...mockAppointment,
            appointment_date: new Date().toISOString().split('T')[0],
            status: 'checked-in',
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const completeButton = screen.getByText('Hoàn thành');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/complete');
    });
  });
});

