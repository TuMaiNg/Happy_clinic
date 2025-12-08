import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentCard } from '../AppointmentCard';
import { format } from 'date-fns';

const mockAppointment = {
  id: 1,
  appointmentDate: new Date('2025-12-10T08:00:00'),
  status: 'confirmed',
  symptoms: 'Sốt cao',
  doctor_name: 'BS. Nguyễn Văn A',
  service_name: 'Khám tổng quát',
  cancellationFee: 0,
};

describe('AppointmentCard Component', () => {
  it('should render appointment details', () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Khám tổng quát')).toBeInTheDocument();
    expect(screen.getByText('Sốt cao')).toBeInTheDocument();
  });

  it('should display correct status badge for confirmed', () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
  });

  it('should display cancellation fee warning when fee > 0', () => {
    const appointmentWithFee = {
      ...mockAppointment,
      cancellationFee: 40000,
    };

    render(<AppointmentCard appointment={appointmentWithFee} />);

    expect(screen.getByText(/phí hủy/i)).toBeInTheDocument();
    expect(screen.getByText(/40,000/i)).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const handleCancel = jest.fn();
    render(<AppointmentCard appointment={mockAppointment} onCancel={handleCancel} />);

    const cancelButton = screen.getByText('Hủy');
    fireEvent.click(cancelButton);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCheckIn when check-in button is clicked', () => {
    const handleCheckIn = jest.fn();
    render(
      <AppointmentCard appointment={mockAppointment} onCheckIn={handleCheckIn} />
    );

    const checkInButton = screen.getByText('Check-in');
    fireEvent.click(checkInButton);

    expect(handleCheckIn).toHaveBeenCalledTimes(1);
  });

  it('should show check-in button only for confirmed appointments', () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText('Check-in')).toBeInTheDocument();
  });

  it('should not show check-in button for pending appointments', () => {
    const pendingAppointment = {
      ...mockAppointment,
      status: 'pending',
    };

    render(<AppointmentCard appointment={pendingAppointment} />);

    expect(screen.queryByText('Check-in')).not.toBeInTheDocument();
  });

  it('should display different status colors', () => {
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    statuses.forEach((status) => {
      const { container } = render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status }}
        />
      );
      expect(container.querySelector('.bg-')).toBeInTheDocument();
    });
  });
});


