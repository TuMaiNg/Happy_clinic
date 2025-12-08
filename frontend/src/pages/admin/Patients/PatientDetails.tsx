import React from 'react';
import { Modal } from '../../../components/common/Modal';

interface Patient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
}

interface PatientDetailsProps {
  patient: Patient;
  onClose: () => void;
}

export const PatientDetails: React.FC<PatientDetailsProps> = ({
  patient,
  onClose,
}) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Chi tiết bệnh nhân">
      <div className="patient-details">
        <div className="details-section">
          <h3>Thông tin cơ bản</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">#{patient.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Tên:</span>
              <span className="detail-value">{patient.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Số điện thoại:</span>
              <span className="detail-value">{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{patient.email}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="detail-item">
                <span className="detail-label">Ngày sinh:</span>
                <span className="detail-value">
                  {new Date(patient.date_of_birth).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
            {patient.address && (
              <div className="detail-item">
                <span className="detail-label">Địa chỉ:</span>
                <span className="detail-value">{patient.address}</span>
              </div>
            )}
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


