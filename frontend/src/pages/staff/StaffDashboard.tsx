import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { format } from 'date-fns';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
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

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
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
      const rawAppointments = response.data.data || [];
      setAppointments(
        rawAppointments.map((apt: any) => ({
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
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    if (!window.confirm('Xác nhận lịch hẹn này?')) return;
    try {
      await api.put(`/appointments/${id}/confirm`);
      loadAppointments();
      alert('✅ Đã xác nhận lịch hẹn thành công!');
    } catch (error: any) {
      console.error('Failed to confirm appointment:', error);
      alert(error.response?.data?.message || 'Không thể xác nhận lịch hẹn');
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Nhập lý do từ chối:');
    if (reason === null) return; // User cancelled
    
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: reason || 'Lịch không phù hợp' });
      loadAppointments();
      alert('✅ Đã từ chối lịch hẹn');
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
      <div className="dashboard-header">
        <h1>Quản lý lịch hẹn</h1>
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
                      onClick={() => handleConfirm(appt.id)}
                    >
                      <CheckCircleIcon className="btn-icon" />
                      Xác nhận
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(appt.id)}
                    >
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
    </div>
  );
};

