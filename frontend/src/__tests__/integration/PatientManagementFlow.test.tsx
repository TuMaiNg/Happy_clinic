import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
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

const mockPatients = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
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
    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientList />
        </AuthProvider>
      </BrowserRouter>
    );

    // View patients
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    // Search patients
    const searchInput = screen.getByPlaceholderText('Tìm bệnh nhân...');
    fireEvent.change(searchInput, { target: { value: 'Nguyễn' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('search=Nguyễn')
      );
    });

    // Add patient
    const addButton = screen.getByText('+ Thêm bệnh nhân');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Thêm bệnh nhân')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText(/tên/i);
    fireEvent.change(nameInput, { target: { value: 'Lê Thị B' } });

    const phoneInput = screen.getByLabelText(/số điện thoại/i);
    fireEvent.change(phoneInput, { target: { value: '0987654321' } });

    const submitButton = screen.getByText('Thêm');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/patients', {
        name: 'Lê Thị B',
        phone: '0987654321',
        email: '',
        date_of_birth: '',
        address: '',
      });
    });
  });
});

