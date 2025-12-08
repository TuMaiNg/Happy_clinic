import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../Dashboard/AdminDashboard';
import { api } from '../../../config/api';

// Mock the API
jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/appointments') {
        return Promise.resolve({
          data: { data: [] },
        });
      }
      if (url === '/patients') {
        return Promise.resolve({
          data: { data: [] },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('renders dashboard with title', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    });
  });
});

