import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StaffDashboard } from '../StaffDashboard';
import { api } from '../../../config/api';
import { format } from 'date-fns';

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

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
      expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
    });
  });

  it('switches between today and pending tabs', async () => {
    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const pendingTab = screen.getByText('Chờ xác nhận');
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

    const confirmButton = screen.getByText('Xác nhận');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/confirm');
    });
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

