import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../../test-utils';
import { AdminLayout } from '../Layout/AdminLayout';
import { useAuth } from '../../../contexts/AuthContext';

// Mock useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock api
jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AdminLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'admin@test.com', role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('renders admin layout with sidebar and header', () => {
    render(<AdminLayout />);

    expect(screen.getByText('Happy Care')).toBeInTheDocument();
    expect(screen.getByText('Quản trị hệ thống')).toBeInTheDocument();
  });
});



