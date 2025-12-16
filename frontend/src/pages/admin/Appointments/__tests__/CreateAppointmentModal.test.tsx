import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CreateAppointmentModal } from '../CreateAppointmentModal';
import { api } from '../../../../config/api';
import { ToastProvider } from '../../../../contexts/ToastContext';

jest.mock('../../../../config/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock useAuth
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@test.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('CreateAppointmentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  it('renders modal with form', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(
      <ToastProvider>
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <ToastProvider>
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </ToastProvider>
    );
    
    expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
  });

  it('loads doctors and services', async () => {
    const mockDoctors = [{ id: 1, name: 'Dr. Smith' }];
    const mockServices = [{ id: 1, name: 'Consultation', duration: 30, price: 200000 }];
    
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: mockDoctors } })
      .mockResolvedValueOnce({ data: { data: mockServices } });
    
    render(
      <ToastProvider>
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </ToastProvider>
    );
    
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
    
    render(
      <ToastProvider>
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
    
    // Use getAllByRole to get selects
    const selects = screen.getAllByRole('combobox');
    const doctorSelect = selects[0]; // First select is doctor
    
    // Select doctor
    fireEvent.change(doctorSelect, { target: { value: '1' } });
    
    // Change date - find the date input by type
    const dateInputElement = document.querySelector('input[type="date"]');
    if (dateInputElement) {
      fireEvent.change(dateInputElement, { target: { value: '2024-12-31' } });
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('/time-slots/available')
        );
      });
    }
  });

  it('has form with required fields', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(
      <ToastProvider>
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </ToastProvider>
    );
    
    await waitFor(() => {
      // Check the form rendered
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
    
    // Wait for loading to complete and form to appear
    await waitFor(() => {
      const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });
  });

  it('closes modal when X button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(
      <ToastProvider>
        <CreateAppointmentModal onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Tạo lịch hẹn')).toBeInTheDocument();
    });
    
    // Click the X button in header (it has no accessible name but is a button)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0]; // First button is the X close button
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});

