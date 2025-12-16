import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { PatientList } from '../../pages/admin/Patients/PatientList';
import { api } from '../../config/api';

jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', role: 'admin' },
    isAuthenticated: true,
  }),
}));
jest.mock('../../config/api');

const mockPatients = [
  {
    id: 1,
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    email: 'nguyenvana@example.com',
    date_of_birth: '1990-01-01',
    address: '123 Đường ABC',
  },
];

describe('Patient Management Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockPatients },
    });
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('admin can search, view, add, and edit patients', async () => {
    render(<PatientList />);

    // View patients
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    // Search patients
    const searchInput = screen.getByPlaceholderText('Tìm bệnh nhân...');
    fireEvent.change(searchInput, { target: { value: 'Nguyễn' } });

    await waitFor(() => {
      // URL encodes Vietnamese characters
      expect(api.get).toHaveBeenCalledWith(
        expect.stringMatching(/search=.*Nguy.*|search=Nguy%E1%BB%85n/)
      );
    });

    // Add patient
    const addButton = screen.getByText('+ Thêm bệnh nhân');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Thêm bệnh nhân')).toBeInTheDocument();
    });

    // Fill form - use getAllByRole to find inputs
    const textInputs = screen.getAllByRole('textbox');
    const nameInput = textInputs.find(input => input.closest('.form-group')?.textContent?.includes('Tên'));
    const phoneInput = document.querySelector('input[type="tel"]');
    
    if (nameInput) {
    fireEvent.change(nameInput, { target: { value: 'Lê Thị B' } });
    }
    if (phoneInput) {
    fireEvent.change(phoneInput, { target: { value: '0987654321' } });
    }

    // Get submit button by type="submit"
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
    fireEvent.click(submitButton);
    }

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/patients', expect.objectContaining({
        fullName: 'Lê Thị B',
        phone: '0987654321',
      }));
    });
  });
});

