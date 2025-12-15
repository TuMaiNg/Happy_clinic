import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../config/api';
import { format } from 'date-fns';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { StaffHeader } from './StaffHeader';
import { Modal } from '../../components/common/Modal';
import './styles.css';

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

export const StaffDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'pending'>('today');
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; appointment: Appointment | null }>({
    show: false,
    appointment: null,
  });
  const [rejectModal, setRejectModal] = useState<{ show: boolean; appointment: Appointment | null }>({
    show: false,
    appointment: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/appointments';
      if (filter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        url += `?fromDate=${today}&toDate=${today}`;
      } else {
        url += '?status=pending';
      }
      const response = await api.get(url);
      const rawAppointments = response?.data?.data || response?.data || [];
      setAppointments(
        (Array.isArray(rawAppointments) ? rawAppointments : [])
          .map((apt: any) => ({
            id: apt.id,
            patient_name: apt.patient_name || 'N/A',
            patient_phone: apt.patient_phone || 'N/A',
            doctor_name: apt.doctor_name || 'N/A',
            service_name: apt.service_name || 'N/A',
            appointment_date:
              apt.appointmentDate || apt.appointment_date || '',
            start_time: apt.startTime || apt.start_time || 'N/A',
            status: apt.status,
          }))
      );
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const openConfirmModal = (appointment: Appointment) => {
    setConfirmModal({ show: true, appointment });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, appointment: null });
  };

  const handleConfirm = async () => {
    if (!confirmModal.appointment) return;
    
    try {
      await api.put(`/appointments/${confirmModal.appointment.id}/confirm`);
      loadAppointments();
      closeConfirmModal();
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-toast';
      successMsg.textContent = '✅ Đã xác nhận lịch hẹn thành công!';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
    } catch (error: any) {
      console.error('Failed to confirm appointment:', error);
      alert(error.response?.data?.message || 'Không thể xác nhận lịch hẹn');
    }
  };

  const openRejectModal = (appointment: Appointment) => {
    setRejectModal({ show: true, appointment });
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectModal({ show: false, appointment: null });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal.appointment) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      await api.put(`/appointments/${rejectModal.appointment.id}/cancel`, { 
        reason: rejectReason.trim() || 'Lịch không phù hợp' 
      });
      loadAppointments();
      closeRejectModal();
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-toast';
      successMsg.textContent = '✅ Đã từ chối lịch hẹn';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
    } catch (error: any) {
      console.error('Failed to reject appointment:', error);
      alert(error.response?.data?.message || 'Không thể từ chối lịch hẹn');
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/check-in`);
      loadAppointments();
    } catch (error: any) {
      console.error('Failed to check in:', error);
      alert(error.response?.data?.message || 'Không thể check-in');
    }
  };

  return (
    <div className="staff-dashboard">
      <StaffHeader />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="filter-tabs">
            <button
              className={`tab ${filter === 'today' ? 'active' : ''}`}
              onClick={() => setFilter('today')}
            >
              Hôm nay
            </button>
            <button
              className={`tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Chờ xác nhận
            </button>
          </div>
        </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <p>Không có lịch hẹn nào</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appt) => (
            <div key={appt.id} className="appointment-card">
              <div className="card-header">
                <h3>{appt.patient_name}</h3>
                <span className={`status-badge status-${appt.status}`}>
                  {appt.status === 'pending'
                    ? 'Chờ xác nhận'
                    : appt.status === 'confirmed'
                    ? 'Đã xác nhận'
                    : appt.status === 'checked-in'
                    ? 'Đã check-in'
                    : appt.status === 'completed'
                    ? 'Hoàn thành'
                    : appt.status === 'cancelled'
                    ? 'Đã hủy'
                    : appt.status === 'no-show'
                    ? 'Vắng mặt'
                    : appt.status}
                </span>
              </div>
              <div className="card-body">
                <p>
                  <strong>Bác sĩ:</strong> {appt.doctor_name}
                </p>
                <p>
                  <strong>Dịch vụ:</strong> {appt.service_name}
                </p>
                <p>
                  <strong>Thời gian:</strong> {appt.start_time}
                </p>
                <p>
                  <strong>SĐT:</strong> {appt.patient_phone}
                </p>
              </div>
              <div className="card-actions">
                {appt.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => openConfirmModal(appt)}
                    >
                      <CheckCircleIcon className="btn-icon" />
                      Xác nhận
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => openRejectModal(appt)}
                    >
                      <XCircleIcon className="btn-icon" />
                      Từ chối
                    </button>
                  </>
                )}
                {appt.status === 'confirmed' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCheckIn(appt.id)}
                  >
                    Check-in
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && confirmModal.appointment && (
        <Modal
          isOpen={confirmModal.show}
          onClose={closeConfirmModal}
          title="Xác nhận lịch hẹn"
        >
          <div className="confirm-modal-content">
            <div className="confirm-info">
              <InformationCircleIcon className="info-icon" />
              <p className="confirm-message">
                Bạn có chắc chắn muốn xác nhận lịch hẹn này?
              </p>
            </div>
            
            <div className="appointment-details">
              <div className="detail-row">
                <span className="detail-label">Bệnh nhân:</span>
                <span className="detail-value">{confirmModal.appointment.patient_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số điện thoại:</span>
                <span className="detail-value">{confirmModal.appointment.patient_phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Bác sĩ:</span>
                <span className="detail-value">{confirmModal.appointment.doctor_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Dịch vụ:</span>
                <span className="detail-value">{confirmModal.appointment.service_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">
                  {confirmModal.appointment.appointment_date 
                    ? format(new Date(confirmModal.appointment.appointment_date), 'dd/MM/yyyy')
                    : 'N/A'} lúc {confirmModal.appointment.start_time}
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeConfirmModal}
              >
                Hủy
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirm}
              >
                <CheckCircleIcon className="btn-icon" />
                Xác nhận
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModal.show && rejectModal.appointment && (
        <Modal
          isOpen={rejectModal.show}
          onClose={closeRejectModal}
          title="Từ chối lịch hẹn"
        >
          <div className="reject-modal-content">
            <div className="confirm-info">
              <XCircleIcon className="info-icon warning" />
              <p className="confirm-message">
                Vui lòng nhập lý do từ chối lịch hẹn này
              </p>
            </div>
            
            <div className="appointment-details">
              <div className="detail-row">
                <span className="detail-label">Bệnh nhân:</span>
                <span className="detail-value">{rejectModal.appointment.patient_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Bác sĩ:</span>
                <span className="detail-value">{rejectModal.appointment.doctor_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">
                  {rejectModal.appointment.appointment_date 
                    ? format(new Date(rejectModal.appointment.appointment_date), 'dd/MM/yyyy')
                    : 'N/A'} lúc {rejectModal.appointment.start_time}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Lý do từ chối *</label>
              <textarea
                className="input-field"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối lịch hẹn..."
                required
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeRejectModal}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                <XCircleIcon className="btn-icon" />
                Từ chối
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
};

