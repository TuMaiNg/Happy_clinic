import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../../test-utils';
import { ServiceList } from '../Services/ServiceList';
import { api } from '../../../config/api';

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockServices = [
  {
    id: 1,
    name: 'Khám tổng quát',
    description: 'Khám sức khỏe tổng quát',
    duration: 30,
    price: 200000,
    is_active: true,
  },
  {
    id: 2,
    name: 'Khám chuyên khoa',
    description: 'Khám chuyên khoa',
    duration: 45,
    price: 300000,
    is_active: false,
  },
];

describe('ServiceList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockServices },
    });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('renders service list', async () => {
    render(<ServiceList />);

    await waitFor(() => {
      expect(screen.getByText('Quản lý dịch vụ')).toBeInTheDocument();
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
    });
  });

  it('toggles service active status', async () => {
    render(<ServiceList />);

    await waitFor(() => {
      // Use getAllByRole to find buttons, the "Tạm dừng" button
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find(btn => btn.textContent === 'Tạm dừng');
      expect(toggleButton).toBeTruthy();
    });

    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons.find(btn => btn.textContent === 'Tạm dừng');
    if (toggleButton) {
    fireEvent.click(toggleButton);
    }

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/services/1', {
        is_active: false,
      });
    });
  });

  it('opens add service form', async () => {
    render(<ServiceList />);

    const addButton = screen.getByText('+ Thêm dịch vụ');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Thêm dịch vụ')).toBeInTheDocument();
    });
  });
});

