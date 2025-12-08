import React from 'react';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal } from '../../../components/common/Modal';

interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
}

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: () => void;
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  onClose,
  onUpdate,
}) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Chi tiết lịch hẹn">
      <div className="appointment-details">
        <div className="details-section">
          <h3>Thông tin lịch hẹn</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Mã lịch hẹn:</span>
              <span className="detail-value">#{appointment.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngày:</span>
              <span className="detail-value">
                {format(
                  new Date(
                    (appointment as any).appointmentDate ||
                      appointment.appointment_date
                  ),
                  'dd/MM/yyyy'
                )}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Giờ:</span>
              <span className="detail-value">
                {(appointment as any).startTime || appointment.start_time}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Trạng thái:</span>
              <span className="detail-value">
                {appointment.status === 'pending'
                  ? 'Chờ xác nhận'
                  : appointment.status === 'confirmed'
                  ? 'Đã xác nhận'
                  : appointment.status === 'checked-in'
                  ? 'Đã check-in'
                  : appointment.status === 'completed'
                  ? 'Hoàn thành'
                  : appointment.status === 'cancelled'
                  ? 'Đã hủy'
                  : appointment.status === 'no-show'
                  ? 'Vắng mặt'
                  : appointment.status}
              </span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Thông tin bệnh nhân</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Tên:</span>
              <span className="detail-value">{appointment.patient_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Số điện thoại:</span>
              <span className="detail-value">{appointment.patient_phone}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Thông tin dịch vụ</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Bác sĩ:</span>
              <span className="detail-value">{appointment.doctor_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dịch vụ:</span>
              <span className="detail-value">{appointment.service_name}</span>
            </div>
          </div>
        </div>

        <div className="details-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

