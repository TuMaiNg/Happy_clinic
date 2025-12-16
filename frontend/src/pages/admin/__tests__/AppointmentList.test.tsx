import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../../test-utils';
import { AppointmentList } from '../Appointments/AppointmentList';
import { api } from '../../../config/api';
import { ToastProvider } from '../../../contexts/ToastContext';

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@test.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock CreateAppointmentModal to avoid issues with its internal state
jest.mock('../Appointments/CreateAppointmentModal', () => ({
  CreateAppointmentModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-modal">
      <h3>Tạo lịch hẹn</h3>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const mockAppointments = [
  {
    id: 1,
    patient_name: 'Nguyễn Văn A',
    patient_phone: '0912345678',
    doctor_name: 'BS. Trần Thị B',
    service_name: 'Khám tổng quát',
    appointment_date: '2024-12-20',
    start_time: '08:00',
    status: 'pending',
  },
  {
    id: 2,
    patient_name: 'Lê Thị C',
    patient_phone: '0987654321',
    doctor_name: 'BS. Phạm Văn D',
    service_name: 'Khám chuyên khoa',
    appointment_date: '2024-12-20',
    start_time: '09:00',
    status: 'confirmed',
  },
];

describe('AppointmentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockAppointments },
    });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    // Mock window functions (not used anymore, but keep for compatibility)
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  it('renders appointment list with filters', async () => {
    render(
      <ToastProvider>
        <AppointmentList />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Quản lý lịch hẹn')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
  });

  it('filters appointments by status', async () => {
    render(
      <ToastProvider>
        <AppointmentList />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('Tất cả trạng thái');
    fireEvent.change(statusSelect, { target: { value: 'pending' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('status=pending')
      );
    });
  });

  it('confirms pending appointment', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <ToastProvider>
        <AppointmentList />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Xác nhận');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/confirm');
    });
  });

  it('cancels appointment with confirmation', async () => {
    render(
      <ToastProvider>
        <AppointmentList />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hủy')).toBeInTheDocument();
    });

    // Get all "Hủy" buttons - the first one is the cancel button in the table
    const cancelButtons = screen.getAllByText('Hủy');
    const tableCancelButton = cancelButtons[0]; // First one is the table action button
    fireEvent.click(tableCancelButton);

    // Wait for ConfirmDialog to appear - look for the confirm button with text "Hủy lịch hẹn"
    await waitFor(() => {
      // The confirm button in dialog has text "Hủy lịch hẹn" (from confirmText prop)
      const confirmButton = screen.queryByRole('button', { name: /hủy lịch hẹn/i });
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
    }, { timeout: 3000 });

    // Wait for API call
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/cancel');
    });
  });

  it('opens create appointment modal', async () => {
    render(
      <ToastProvider>
        <AppointmentList />
      </ToastProvider>
    );

    const createButton = screen.getByText('+ Tạo lịch hẹn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
  });
});

