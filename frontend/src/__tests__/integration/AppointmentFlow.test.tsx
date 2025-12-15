import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { AppointmentList } from '../../pages/admin/Appointments/AppointmentList';
import { StaffDashboard } from '../../pages/staff/StaffDashboard';
import { DoctorDashboard } from '../../pages/doctor/DoctorDashboard';
import { api } from '../../config/api';

jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
  }),
}));

// Mock CreateAppointmentModal to avoid issues
jest.mock('../../pages/admin/Appointments/CreateAppointmentModal', () => ({
  CreateAppointmentModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
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
    // Mock window.confirm and window.alert
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  it('admin can view and confirm appointment', async () => {
    render(<AppointmentList />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Xác nhận');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/confirm');
    });
  });

  it('staff can confirm pending appointment', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: [{ ...mockAppointment, status: 'pending' }] },
    });

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });

    // Click button to open modal
    const confirmButtons = screen.getAllByText('Xác nhận');
    fireEvent.click(confirmButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Xác nhận lịch hẹn')).toBeInTheDocument();
    });

    // Find confirm button in modal
    await waitFor(() => {
      const modalActions = document.querySelector('.modal-actions');
      if (modalActions) {
        const modalConfirmButton = modalActions.querySelector('button.btn-success');
        if (modalConfirmButton) {
          fireEvent.click(modalConfirmButton);
        }
      }
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/confirm');
    }, { timeout: 3000 });
  });

  it('staff can check-in confirmed appointment', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: [{ ...mockAppointment, status: 'confirmed' }] },
    });

    render(<StaffDashboard />);

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

    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const completeButton = screen.getByRole('button', { name: /hoàn thành khám/i });
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/complete');
    });
  });
});

