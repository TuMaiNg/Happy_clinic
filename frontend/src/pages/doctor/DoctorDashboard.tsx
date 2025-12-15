import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { DoctorHeader } from './DoctorHeader';
import './styles.css';

interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
}

export const DoctorDashboard: React.FC = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAppointments();
  }, []);

  const loadTodayAppointments = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get(`/appointments?date=${today}`);
      const appointments = response?.data?.data || response?.data || [];
      setTodayAppointments(
        (Array.isArray(appointments) ? appointments : [])
          .filter((apt: any) => apt.status !== 'cancelled')
          .map((apt: any) => ({
            id: apt.id,
            patient_name: apt.patient_name || 'N/A',
            patient_phone: apt.patient_phone || 'N/A',
            service_name: apt.service_name || 'N/A',
            appointment_date:
              apt.appointmentDate || apt.appointment_date || today,
            start_time: apt.startTime || apt.start_time || 'N/A',
            status: apt.status,
          }))
      );
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setTodayAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/complete`);
      loadTodayAppointments();
    } catch (error: any) {
      console.error('Failed to complete appointment:', error);
      alert(error.response?.data?.message || 'Không thể hoàn thành lịch hẹn');
    }
  };

  return (
    <div className="doctor-dashboard">
      <DoctorHeader />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Lịch hẹn hôm nay</h1>
          <p className="text-muted">
            {format(new Date(), 'dd/MM/yyyy')} - {todayAppointments.length} lịch hẹn
          </p>
        </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : todayAppointments.length === 0 ? (
        <div className="empty-state">
          <CalendarIcon className="empty-icon" />
          <p>Không có lịch hẹn nào hôm nay</p>
        </div>
      ) : (
        <div className="appointments-list">
          {todayAppointments.map((appt) => (
            <div key={appt.id} className="appointment-card">
              <div className="appointment-time">
                <ClockIcon className="time-icon" />
                <span>{appt.start_time}</span>
              </div>
              <div className="appointment-content">
                <h3>{appt.patient_name}</h3>
                <p className="appointment-service">{appt.service_name}</p>
                <p className="appointment-phone">{appt.patient_phone}</p>
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
              <div className="appointment-actions">
                {appt.status === 'checked-in' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleComplete(appt.id)}
                  >
                    Hoàn thành khám
                  </button>
                )}
                {appt.status === 'confirmed' && (
                  <span className="status-hint">Chờ bệnh nhân check-in</span>
                )}
                {appt.status === 'pending' && (
                  <span className="status-hint">Chờ xác nhận</span>
                )}
                {appt.status === 'completed' && (
                  <span className="status-done">✓ Đã hoàn thành</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

