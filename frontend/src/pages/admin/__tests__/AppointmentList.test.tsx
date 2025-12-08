import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppointmentList } from '../Appointments/AppointmentList';
import { api } from '../../../config/api';

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
  });

  it('renders appointment list with filters', async () => {
    render(
      <BrowserRouter>
        <AppointmentList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quản lý lịch hẹn')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
  });

  it('filters appointments by status', async () => {
    render(
      <BrowserRouter>
        <AppointmentList />
      </BrowserRouter>
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
      <BrowserRouter>
        <AppointmentList />
      </BrowserRouter>
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
    window.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <AppointmentList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hủy')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Hủy');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.put).toHaveBeenCalledWith('/appointments/1/cancel');
    });
  });

  it('opens create appointment modal', async () => {
    render(
      <BrowserRouter>
        <AppointmentList />
      </BrowserRouter>
    );

    const createButton = screen.getByText('+ Tạo lịch hẹn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
  });
});

