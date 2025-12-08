import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '../../../config/api';
import { AppointmentDetails } from './AppointmentDetails';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import '../shared/styles.css';

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

interface Filters {
  status: string;
  date: string;
  doctorId: string;
  search: string;
}

export const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    date: '',
    doctorId: '',
    search: '',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.date, filters.doctorId, filters.search]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      if (filters.doctorId) params.append('doctorId', filters.doctorId);
      if (filters.search) params.append('search', encodeURIComponent(filters.search));

      const queryString = params.toString();
      const url = queryString ? `/appointments?${queryString}` : '/appointments';
      const response = await api.get(url);
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/confirm`);
      loadAppointments();
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      alert('Không thể xác nhận lịch hẹn');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
      return;
    }
    try {
      await api.put(`/appointments/${id}/cancel`);
      loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Không thể hủy lịch hẹn');
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã check-in',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      'no-show': 'Vắng mặt',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      'checked-in': 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      'no-show': 'badge-secondary',
    };
    return classes[status] || 'badge-secondary';
  };

  return (
    <div className="appointments-page">
      <div className="page-header">
        <div>
          <h1>Quản lý lịch hẹn</h1>
          <p className="text-muted">Xem và quản lý tất cả lịch hẹn</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Tạo lịch hẹn
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="filter-input"
        />

        <input
          type="search"
          placeholder="Tìm bệnh nhân..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="filter-search"
        />
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="table-empty">
            <p>Không có lịch hẹn nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã LH</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Dịch vụ</th>
                <th>Ngày giờ</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>#{appt.id}</td>
                  <td>
                    <div className="patient-cell">
                      <div className="patient-name">
                        {appt.patient_name || 'N/A'}
                      </div>
                      <div className="patient-phone">
                        {appt.patient_phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td>{appt.doctor_name || 'N/A'}</td>
                  <td>{appt.service_name || 'N/A'}</td>
                  <td>
                    <div>
                      {appt.appointment_date
                        ? format(new Date(appt.appointment_date), 'dd/MM/yyyy')
                        : 'N/A'}
                    </div>
                    <div className="text-muted">
                      {appt.start_time || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusClass(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {appt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirm(appt.id)}
                            className="btn-sm btn-success"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="btn-sm btn-danger"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => setSelectedAppointment(appt)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={loadAppointments}
        />
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
};

