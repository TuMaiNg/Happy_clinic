import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { DoctorDashboard } from '../DoctorDashboard';
import { api } from '../../../config/api';
import { format } from 'date-fns';

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));

const mockAppointments = [
  {
    id: 1,
    patient_name: 'Nguyễn Văn A',
    patient_phone: '0912345678',
    service_name: 'Khám tổng quát',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    status: 'confirmed',
  },
  {
    id: 2,
    patient_name: 'Lê Thị B',
    patient_phone: '0987654321',
    service_name: 'Khám chuyên khoa',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    status: 'checked-in',
  },
];

describe('DoctorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockAppointments },
    });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('renders today appointments', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lịch hẹn hôm nay')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays appointment details correctly', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('marks appointment as completed', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lê Thị B')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Tìm button với text "Hoàn thành khám"
    const completeButton = screen.getByRole('button', { 
      name: /hoàn thành khám/i 
    });
    
    expect(completeButton).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(completeButton);
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/2/complete');
    });
  });

  it('shows empty state when no appointments', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: [] },
    });

    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Không có lịch hẹn nào hôm nay')
      ).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

