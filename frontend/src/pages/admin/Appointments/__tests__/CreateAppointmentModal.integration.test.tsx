import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { CreateAppointmentModal } from '../CreateAppointmentModal';
import { api } from '../../../../config/api';
// Mock ToastContext
jest.mock('../../../../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

// Mock API
jest.mock('../../../../config/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock data
const mockDoctors = [
  { id: 1, fullName: 'BS. Nguyễn Văn A', speciality: 'Tim mạch' },
  { id: 2, fullName: 'BS. Trần Thị B', speciality: 'Nhi khoa' },
];

const mockServices = [
  { id: 1, name: 'Khám tổng quát', price: 200000, duration: 30 },
  { id: 2, name: 'Khám chuyên khoa', price: 500000, duration: 60 },
];

const mockTimeSlots = [
  { id: 1, startTime: '08:00', endTime: '08:05', capacity: 1, patientCount: 0 },
  { id: 2, startTime: '08:05', endTime: '08:10', capacity: 1, patientCount: 0 },
  { id: 3, startTime: '08:10', endTime: '08:15', capacity: 1, patientCount: 0 },
];

const mockPatient = { id: 1, fullName: 'Nguyễn Văn Test', phone: '0901234567' };

describe('CreateAppointmentModal Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/doctors') {
        return Promise.resolve({ data: { success: true, data: mockDoctors } });
      }
      if (url === '/services') {
        return Promise.resolve({ data: { success: true, data: mockServices } });
      }
      if (url.includes('/time-slots/available')) {
        return Promise.resolve({ data: { success: true, data: mockTimeSlots } });
      }
      if (url.includes('/patients')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    mockedApi.post.mockImplementation((url: string, data?: any) => {
      if (url === '/patients') {
        return Promise.resolve({ data: { success: true, data: mockPatient } });
      }
      if (url === '/appointments') {
        return Promise.resolve({ data: { success: true, message: 'Tạo lịch hẹn thành công' } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('should load doctors and services on mount', async () => {
    await act(async () => {
      render(
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
    });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/doctors');
      expect(mockedApi.get).toHaveBeenCalledWith('/services');
    });

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A - Tim mạch')).toBeInTheDocument();
      expect(screen.getByText('Khám tổng quát - 200.000₫')).toBeInTheDocument();
    });
  });

  it('should load available time slots when doctor and date are selected', async () => {
    await act(async () => {
      render(
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A - Tim mạch')).toBeInTheDocument();
    });

    // Select doctor
    const doctorSelect = screen.getByLabelText(/Bác sĩ/i) || screen.getByDisplayValue('');
    await act(async () => {
      fireEvent.change(doctorSelect, { target: { value: '1' } });
    });

    // Select date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = screen.getByLabelText(/Ngày/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: today } });
    });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/time-slots/available')
      );
    });
  });

  it('should create appointment successfully', async () => {
    await act(async () => {
      render(
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A - Tim mạch')).toBeInTheDocument();
    });

    // Fill form
    const patientNameInput = screen.getByLabelText(/Tên bệnh nhân/i);
    const patientPhoneInput = screen.getByLabelText(/Số điện thoại/i);
    const doctorSelect = screen.getByLabelText(/Bác sĩ/i) || screen.getByDisplayValue('');
    const serviceSelect = screen.getByLabelText(/Dịch vụ/i) || screen.getByDisplayValue('');
    const today = new Date().toISOString().split('T')[0];
    const dateInput = screen.getByLabelText(/Ngày/i) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(patientNameInput, { target: { value: 'Nguyễn Văn Test' } });
      fireEvent.change(patientPhoneInput, { target: { value: '0901234567' } });
      fireEvent.change(doctorSelect, { target: { value: '1' } });
      fireEvent.change(serviceSelect, { target: { value: '1' } });
      fireEvent.change(dateInput, { target: { value: today } });
    });

    // Wait for time slots to load
    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/time-slots/available')
      );
    });

    // Select time slot
    const slotSelect = screen.getByLabelText(/Khung giờ/i) || screen.getByDisplayValue('');
    await act(async () => {
      fireEvent.change(slotSelect, { target: { value: '1' } });
    });

    // Submit form
    const form = screen.getByRole('form') || screen.getByTestId('appointment-form') || document.querySelector('form');
    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/patients', expect.any(Object));
      expect(mockedApi.post).toHaveBeenCalledWith('/appointments', expect.objectContaining({
        patientId: 1,
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
      }));
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle rate limiting error gracefully', async () => {
    mockedApi.get.mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          success: false,
          message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
        },
      },
    });

    await act(async () => {
      render(
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Quá nhiều yêu cầu/i)).toBeInTheDocument();
    });
  });

  it('should handle patient creation error', async () => {
    mockedApi.post.mockImplementationOnce((url: string) => {
      if (url === '/patients') {
        return Promise.reject({
          response: {
            status: 500,
            data: { message: 'Không thể tạo bệnh nhân' },
          },
        });
      }
      return Promise.resolve({ data: { success: true } });
    });

    await act(async () => {
      render(
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
    });

    // Fill and submit form
    const patientNameInput = screen.getByLabelText(/Tên bệnh nhân/i);
    const patientPhoneInput = screen.getByLabelText(/Số điện thoại/i);
    const doctorSelect = screen.getByLabelText(/Bác sĩ/i) || screen.getByDisplayValue('');
    const serviceSelect = screen.getByLabelText(/Dịch vụ/i) || screen.getByDisplayValue('');
    const today = new Date().toISOString().split('T')[0];
    const dateInput = screen.getByLabelText(/Ngày/i) as HTMLInputElement;

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A - Tim mạch')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(patientNameInput, { target: { value: 'Nguyễn Văn Test' } });
      fireEvent.change(patientPhoneInput, { target: { value: '0901234567' } });
      fireEvent.change(doctorSelect, { target: { value: '1' } });
      fireEvent.change(serviceSelect, { target: { value: '1' } });
      fireEvent.change(dateInput, { target: { value: today } });
    });

    await waitFor(() => {
      const slotSelect = screen.getByLabelText(/Khung giờ/i) || screen.getByDisplayValue('');
      fireEvent.change(slotSelect, { target: { value: '1' } });
    });

    const form = screen.getByRole('form') || document.querySelector('form');
    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      expect(screen.getByText(/Không thể tìm hoặc tạo bệnh nhân/i)).toBeInTheDocument();
    });
  });
});

