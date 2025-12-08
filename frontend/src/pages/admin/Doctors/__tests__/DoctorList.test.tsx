import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DoctorList } from '../DoctorList';
import { api } from '../../../../config/api';

jest.mock('../../../../config/api');

describe('DoctorList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<DoctorList />);
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('renders doctors list', async () => {
    const mockDoctors = [
      { id: 1, name: 'Dr. Smith', specialization: 'Cardiology', phone: '0123456789', email: 'smith@example.com' },
      { id: 2, name: 'Dr. Jones', specialization: 'Dermatology', phone: '0987654321', email: 'jones@example.com' },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockDoctors } });
    
    render(<DoctorList />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
    });
  });

  it('renders empty state when no doctors', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    render(<DoctorList />);
    
    await waitFor(() => {
      expect(screen.getByText('Không có bác sĩ nào')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<DoctorList />);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    
    consoleError.mockRestore();
  });

  it('displays doctor information correctly', async () => {
    const mockDoctors = [
      { id: 1, name: 'Dr. Smith', specialization: 'Cardiology', phone: '0123456789', email: 'smith@example.com' },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockDoctors } });
    
    render(<DoctorList />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('0123456789')).toBeInTheDocument();
      expect(screen.getByText('smith@example.com')).toBeInTheDocument();
    });
  });
});

