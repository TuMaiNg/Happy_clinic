import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentList } from '../PaymentList';
import { api } from '../../../../config/api';
import { ToastProvider } from '../../../../contexts/ToastContext';

jest.mock('../../../../config/api');

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

describe('PaymentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { container } = render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    // Component hiển thị loading spinner, không có text "đang tải"
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders payments list', async () => {
    const mockPayments = [
      {
        id: 1,
        appointment_id: 100,
        amount: 200000,
        status: 'paid',
        payment_method: 'cash',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        appointment_id: 101,
        amount: 300000,
        status: 'pending',
        payment_method: 'bank',
        created_at: '2024-01-02T11:00:00Z',
      },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockPayments } });
    
    render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('#100')).toBeInTheDocument();
      expect(screen.getByText('#101')).toBeInTheDocument();
    });
  });

  it('renders empty state when no payments', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Không có thanh toán nào')).toBeInTheDocument();
    });
  });

  it('shows confirm button for pending payments', async () => {
    const mockPayments = [
      {
        id: 1,
        appointment_id: 100,
        amount: 200000,
        status: 'pending',
        payment_method: 'cash',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockPayments } });
    
    render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });
  });

  it('does not show confirm button for paid payments', async () => {
    const mockPayments = [
      {
        id: 1,
        appointment_id: 100,
        amount: 200000,
        status: 'paid',
        payment_method: 'cash',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockPayments } });
    
    render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Xác nhận')).not.toBeInTheDocument();
    });
  });

  it('handles confirm payment', async () => {
    const mockPayments = [
      {
        id: 1,
        appointment_id: 100,
        amount: 200000,
        status: 'pending',
        payment_method: 'cash',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockPayments } });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });
    
    await userEvent.click(screen.getByText('Xác nhận'));
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/payments/1/confirm');
    });
  });

  it('handles API error on confirm', async () => {
    const mockPayments = [
      {
        id: 1,
        appointment_id: 100,
        amount: 200000,
        status: 'pending',
        payment_method: 'cash',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockPayments } });
    (api.put as jest.Mock).mockRejectedValue({ response: { data: { message: 'Error' } } });
    
    render(
      <ToastProvider>
        <PaymentList />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    });
    
    await userEvent.click(screen.getByText('Xác nhận'));
    
    // Wait for API call to be made (error is handled via toast, not alert)
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/payments/1/confirm');
    }, { timeout: 3000 });
  });
});



