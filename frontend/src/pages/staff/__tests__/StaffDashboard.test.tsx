import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StaffDashboard } from '../StaffDashboard';
import { api } from '../../../config/api';
import { format } from 'date-fns';
import { AuthProvider } from '../../../contexts/AuthContext';

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 1, email: 'staff@example.com', role: 'staff' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

// Mock window.confirm
const mockConfirm = jest.fn(() => true);
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

const mockAppointments = [
  {
    id: 1,
    patient_name: 'Nguyễn Văn A',
    patient_phone: '0912345678',
    doctor_name: 'BS. Trần Thị B',
    service_name: 'Khám tổng quát',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    status: 'pending',
  },
  {
    id: 2,
    patient_name: 'Lê Thị C',
    patient_phone: '0987654321',
    doctor_name: 'BS. Phạm Văn D',
    service_name: 'Khám chuyên khoa',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    status: 'confirmed',
  },
];

describe('StaffDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockAppointments },
    });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('renders staff dashboard with tabs', async () => {
    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quản lý lịch hẹn')).toBeInTheDocument();
      expect(screen.getByText('Hôm nay')).toBeInTheDocument();
      // Use getByRole to specifically target the tab button
      expect(screen.getByRole('button', { name: 'Chờ xác nhận' })).toBeInTheDocument();
    });
  });

  it('switches between today and pending tabs', async () => {
    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    // Use getByRole to specifically target the tab button, not the status badge
    const pendingTab = screen.getByRole('button', { name: 'Chờ xác nhận' });
    fireEvent.click(pendingTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('status=pending')
      );
    });
  });

  it('confirms pending appointment', async () => {
    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });

    // Get all "Xác nhận" buttons - first one is the card button, we'll click it
    const confirmButtons = screen.getAllByText('Xác nhận');
    const cardConfirmButton = confirmButtons[0];
    fireEvent.click(cardConfirmButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Xác nhận lịch hẹn')).toBeInTheDocument();
    });

    // Find confirm button in modal (should be in modal-actions)
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

  it('checks in confirmed appointment', async () => {
    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Check-in')).toBeInTheDocument();
    });

    const checkInButton = screen.getByText('Check-in');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/2/check-in');
    });
  });

  it('displays appointment information correctly', async () => {
    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('BS. Trần Thị B')).toBeInTheDocument();
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
    });
  });
});

