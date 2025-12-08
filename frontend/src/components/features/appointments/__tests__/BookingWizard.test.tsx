import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BookingWizard } from '../BookingWizard';
import { doctorService } from '../../../../services/doctor.service';
import { serviceService } from '../../../../services/service.service';
import { timeslotService } from '../../../../services/timeslot.service';
import { appointmentService } from '../../../../services/appointment.service';

// Mock services
jest.mock('../../../../services/doctor.service');
jest.mock('../../../../services/service.service');
jest.mock('../../../../services/timeslot.service');
jest.mock('../../../../services/appointment.service');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockDoctors = [
  {
    id: 1,
    fullName: 'BS. Nguyễn Văn A',
    specialty: 'Nhi khoa',
    experienceYears: 10,
    avatar: null,
  },
  {
    id: 2,
    fullName: 'BS. Trần Thị B',
    specialty: 'Tim mạch',
    experienceYears: 15,
    avatar: null,
  },
];

const mockServices = [
  {
    id: 1,
    name: 'Khám tổng quát',
    price: 200000,
    duration: 30,
    description: 'Khám sức khỏe tổng quát',
  },
  {
    id: 2,
    name: 'Khám chuyên khoa',
    price: 300000,
    duration: 45,
    description: 'Khám chuyên khoa',
  },
];

const mockTimeSlots = [
  {
    id: 1,
    startTime: '08:00',
    endTime: '08:30',
    capacity: 3,
    patientCount: 1,
  },
  {
    id: 2,
    startTime: '08:30',
    endTime: '09:00',
    capacity: 3,
    patientCount: 0,
  },
];

describe('BookingWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (doctorService.getAll as jest.Mock).mockResolvedValue({ data: mockDoctors });
    (serviceService.getAll as jest.Mock).mockResolvedValue({ data: mockServices });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BookingWizard />
      </BrowserRouter>
    );
  };

  it('should render step 1: select doctor', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Đặt lịch khám dễ dàng')).toBeInTheDocument();
      expect(screen.getByText('Chọn bác sĩ')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('BS. Trần Thị B')).toBeInTheDocument();
    });
  });

  it('should filter doctors by specialty', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    });

    const specialtySelect = screen.getByDisplayValue('Tất cả chuyên khoa');
    fireEvent.change(specialtySelect, { target: { value: 'Nhi khoa' } });

    await waitFor(() => {
      expect(doctorService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          specialty: 'Nhi khoa',
        })
      );
    });
  });

  it('should proceed to step 2 after selecting doctor', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    });

    const selectButton = screen.getAllByText('Chọn bác sĩ →')[0];
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('Chọn dịch vụ')).toBeInTheDocument();
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
    });
  });

  it('should proceed to step 3 after selecting service', async () => {
    renderComponent();

    // Step 1: Select doctor
    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('Chọn bác sĩ →')[0]);

    // Step 2: Select service
    await waitFor(() => {
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Khám tổng quát'));

    // Click next button
    const nextButton = screen.getByText('Tiếp theo →');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Chọn ngày')).toBeInTheDocument();
    });
  });

  it('should load available time slots when date is selected', async () => {
    (timeslotService.getAvailable as jest.Mock).mockResolvedValue({
      data: mockTimeSlots,
    });

    renderComponent();

    // Navigate to step 3
    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('Chọn bác sĩ →')[0]);

    await waitFor(() => {
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Khám tổng quát'));
    fireEvent.click(screen.getByText('Tiếp theo →'));

    // Select date
    await waitFor(() => {
      const dateInput = screen.getByLabelText(/ngày/i) || screen.getByPlaceholderText(/ngày/i);
      if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        fireEvent.change(dateInput, { target: { value: dateStr } });
      }
    });

    await waitFor(() => {
      expect(timeslotService.getAvailable).toHaveBeenCalled();
    });
  });

  it('should show error when required fields are missing', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    });

    // Try to proceed without selecting doctor
    const nextButton = screen.getByText('Tiếp theo →');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/vui lòng chọn bác sĩ/i)).toBeInTheDocument();
    });
  });

  it('should submit appointment successfully', async () => {
    (timeslotService.getAvailable as jest.Mock).mockResolvedValue({
      data: mockTimeSlots,
    });
    (appointmentService.create as jest.Mock).mockResolvedValue({
      data: { id: 1 },
    });

    renderComponent();

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('Chọn bác sĩ →')[0]);

    await waitFor(() => {
      expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Khám tổng quát'));
    fireEvent.click(screen.getByText('Tiếp theo →'));

    // Step 3: Select date and time
    await waitFor(() => {
      const dateInput = document.querySelector('input[type="date"]');
      if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        fireEvent.change(dateInput, { target: { value: dateStr } });
      }
    });

    await waitFor(() => {
      if (screen.queryByText('08:00')) {
        fireEvent.click(screen.getByText('08:00'));
      }
    });

    fireEvent.click(screen.getByText('Tiếp theo →'));

    // Step 4: Confirm
    await waitFor(() => {
      const confirmButton = screen.getByText('Xác nhận đặt lịch');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(appointmentService.create).toHaveBeenCalled();
    });
  });
});


