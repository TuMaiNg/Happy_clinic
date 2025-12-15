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
    const { container } = render(<DoctorList />);
    // Component hiển thị loading spinner, không có text "đang tải"
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders doctors list', async () => {
    const mockDoctors = [
      { id: 1, fullName: 'Dr. Smith', speciality: 'Cardiology', email: 'smith@example.com', experienceYears: 5 },
      { id: 2, fullName: 'Dr. Jones', speciality: 'Dermatology', email: 'jones@example.com', experienceYears: 10 },
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
      { id: 1, fullName: 'Dr. Smith', speciality: 'Cardiology', email: 'smith@example.com', experienceYears: 5 },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockDoctors } });
    
    render(<DoctorList />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('smith@example.com')).toBeInTheDocument();
    });
  });
});



