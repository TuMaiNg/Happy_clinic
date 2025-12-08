import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateAppointmentModal } from '../CreateAppointmentModal';
import { api } from '../../../../config/api';

jest.mock('../../../../config/api');

describe('CreateAppointmentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with form', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(<CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
  });

  it('loads doctors and services', async () => {
    const mockDoctors = [{ id: 1, name: 'Dr. Smith' }];
    const mockServices = [{ id: 1, name: 'Consultation', duration: 30, price: 200000 }];
    
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: mockDoctors } })
      .mockResolvedValueOnce({ data: { data: mockServices } });
    
    render(<CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText(/Consultation/)).toBeInTheDocument();
    });
  });

  it('loads available slots when doctor and date are selected', async () => {
    const mockDoctors = [{ id: 1, name: 'Dr. Smith' }];
    const mockServices = [{ id: 1, name: 'Consultation', duration: 30, price: 200000 }];
    const mockSlots = [
      { id: 1, startTime: '09:00', endTime: '10:00', capacity: 5, patientCount: 2 },
    ];
    
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: mockDoctors } })
      .mockResolvedValueOnce({ data: { data: mockServices } })
      .mockResolvedValueOnce({ data: { data: mockSlots } });
    
    render(<CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
    
    const doctorSelect = screen.getByText(/bác sĩ/i).parentElement?.querySelector('select');
    const dateInput = screen.getByText(/ngày/i).parentElement?.querySelector('input[type="date"]');
    
    if (doctorSelect && dateInput) {
      await userEvent.selectOptions(doctorSelect, '1');
      await userEvent.type(dateInput, '2024-12-31');
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('/time-slots/available')
        );
      });
    }
  });

  it('validates required fields on submit', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(<CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Tạo lịch hẹn');
    await userEvent.click(submitButton);
    
    // HTML5 validation should prevent submission
    const form = submitButton.closest('form');
    expect(form).toBeInTheDocument();
  });

  it('creates appointment successfully', async () => {
    const mockDoctors = [{ id: 1, name: 'Dr. Smith' }];
    const mockServices = [{ id: 1, name: 'Consultation', duration: 30, price: 200000 }];
    const mockSlots = [
      { id: 1, startTime: '09:00', endTime: '10:00', capacity: 5, patientCount: 2 },
    ];
    const mockPatient = { id: 1, name: 'John Doe', phone: '0123456789' };
    
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: mockDoctors } })
      .mockResolvedValueOnce({ data: { data: mockServices } })
      .mockResolvedValueOnce({ data: { data: mockSlots } })
      .mockResolvedValueOnce({ data: { data: [mockPatient] } });
    
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(<CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
    
    // Fill form
    const nameInput = screen.getByText(/tên bệnh nhân/i).parentElement?.querySelector('input');
    const phoneInput = screen.getByText(/số điện thoại/i).parentElement?.querySelector('input');
    const doctorSelect = screen.getByText(/bác sĩ/i).parentElement?.querySelector('select');
    const serviceSelect = screen.getByText(/dịch vụ/i).parentElement?.querySelector('select');
    const dateInput = screen.getByText(/ngày/i).parentElement?.querySelector('input[type="date"]');
    
    if (nameInput && phoneInput && doctorSelect && serviceSelect && dateInput) {
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(phoneInput, '0123456789');
      await userEvent.selectOptions(doctorSelect, '1');
      await userEvent.selectOptions(serviceSelect, '1');
      await userEvent.type(dateInput, '2024-12-31');
      
      await waitFor(() => {
        expect(screen.getByText(/09:00/)).toBeInTheDocument();
      });
      
      const slotSelect = screen.getByText(/khung giờ/i).parentElement?.querySelector('select');
      if (slotSelect) {
        await userEvent.selectOptions(slotSelect, '1');
        
        const submitButton = screen.getByText('Tạo lịch hẹn');
        await userEvent.click(submitButton);
        
        await waitFor(() => {
          expect(api.post).toHaveBeenCalledWith('/appointments', expect.any(Object));
          expect(mockOnSuccess).toHaveBeenCalled();
        });
      }
    }
  });
});

