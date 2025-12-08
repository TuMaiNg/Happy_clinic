import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DoctorDashboard } from '../DoctorDashboard';
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
    });
  });

  it('displays appointment details correctly', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
    });
  });

  it('marks appointment as completed', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });

    const completeButton = screen.getByText('Hoàn thành');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/appointments/1/complete');
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
    });
  });
});

