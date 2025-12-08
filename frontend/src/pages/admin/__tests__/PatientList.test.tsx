import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PatientList } from '../Patients/PatientList';
import { api } from '../../../config/api';

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
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
  {
    id: 2,
    name: 'Lê Thị B',
    phone: '0987654321',
    email: 'lethib@example.com',
    date_of_birth: '1995-05-15',
    address: '456 Đường XYZ',
  },
];

describe('PatientList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockPatients },
    });
  });

  it('renders patient list', async () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quản lý bệnh nhân')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
  });

  it('searches patients by name', async () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm bệnh nhân...');
    fireEvent.change(searchInput, { target: { value: 'Nguyễn' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('search=Nguyễn')
      );
    });
  });

  it('opens add patient form', async () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    const addButton = screen.getByText('+ Thêm bệnh nhân');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Thêm bệnh nhân')).toBeInTheDocument();
    });
  });

  it('opens edit patient form', async () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sửa')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Sửa');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Sửa bệnh nhân')).toBeInTheDocument();
    });
  });

  it('opens patient details', async () => {
    render(
      <BrowserRouter>
        <PatientList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chi tiết')).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByText('Chi tiết');
    fireEvent.click(detailButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Chi tiết bệnh nhân')).toBeInTheDocument();
    });
  });
});

