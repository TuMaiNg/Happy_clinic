import React, { useState, useEffect, useCallback } from 'react';
import { appointmentService, Appointment } from '../../../services/appointment.service';
import { format } from 'date-fns';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { AppointmentDetails } from './AppointmentDetails';
import { useToast } from '../../../contexts/ToastContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { success, error } = useToast();

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      const data = response.data || [];
      setAppointments(data);
      setFilteredAppointments(data);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      error(err.message || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, error]);

  // Filter appointments by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = appointments.filter((apt) => {
      return (
        apt.patient_name?.toLowerCase().includes(term) ||
        apt.doctor_name?.toLowerCase().includes(term) ||
        apt.service_name?.toLowerCase().includes(term) ||
        apt.patient_phone?.includes(term) ||
        apt.id?.toString().includes(term)
      );
    });
    setFilteredAppointments(filtered);
  }, [searchTerm, appointments]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleConfirm = async (id: number) => {
    try {
      await appointmentService.confirm(id);
      success('Đã xác nhận lịch hẹn thành công');
      loadAppointments();
    } catch (err: any) {
      error(err.message || 'Không thể xác nhận lịch hẹn');
    }
  };

  const handleCancel = async (id: number, reason?: string) => {
    try {
      await appointmentService.cancel(id, reason);
      success('Đã hủy lịch hẹn thành công');
      loadAppointments();
    } catch (err: any) {
      error(err.message || 'Không thể hủy lịch hẹn');
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await appointmentService.checkIn(id);
      success('Đã check-in thành công');
      loadAppointments();
    } catch (err: any) {
      error(err.message || 'Không thể check-in');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã check-in',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      'no-show': 'Vắng mặt',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'warning',
      confirmed: 'info',
      'checked-in': 'success',
      completed: 'primary',
      cancelled: 'error',
      'no-show': 'warning',
    };
    return colorMap[status] || 'primary';
  };

  return (
    <div className="p-6 fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">Quản lý lịch hẹn</h1>
          <p className="text-sm text-neutral-medium">Quản lý và theo dõi tất cả lịch hẹn khám bệnh</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo lịch hẹn mới
        </button>
      </div>

      {/* Filter Section */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-medium" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, số điện thoại, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="form-label mb-0">Lọc theo trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="checked-in">Đã check-in</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-end">
            <div className="text-sm text-neutral-medium">
              Hiển thị: <span className="font-semibold text-neutral-dark">
                {searchTerm ? filteredAppointments.length : appointments.length}
              </span> / {appointments.length} lịch hẹn
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-neutral-medium">Đang tải dữ liệu...</p>
        </div>
      ) : (searchTerm ? filteredAppointments : appointments).length === 0 ? (
        <div className="card empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="empty-state-title">Không có lịch hẹn nào</h3>
          <p className="empty-state-description">
            {statusFilter === 'all' 
              ? 'Chưa có lịch hẹn nào trong hệ thống. Hãy tạo lịch hẹn mới.'
              : `Không có lịch hẹn nào với trạng thái "${getStatusText(statusFilter)}"`}
          </p>
        </div>
      ) : (
        <div className="table-container fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Dịch vụ</th>
                <th>Ngày giờ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(searchTerm ? filteredAppointments : appointments).map((apt, index) => (
                <tr key={apt.id} className="slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="font-semibold">#{apt.id}</td>
                  <td>
                    <div className="font-medium text-neutral-dark">{apt.patient_name || 'N/A'}</div>
                    {apt.patient_phone && (
                      <div className="text-xs text-neutral-medium">{apt.patient_phone}</div>
                    )}
                  </td>
                  <td>
                    <div className="font-medium text-neutral-dark">{apt.doctor_name || 'N/A'}</div>
                    {apt.doctor_speciality && (
                      <div className="text-xs text-neutral-medium">{apt.doctor_speciality}</div>
                    )}
                  </td>
                  <td>
                    <div className="font-medium text-neutral-dark">{apt.service_name || 'N/A'}</div>
                    {apt.service_price && (
                      <div className="text-xs text-neutral-medium">
                        {apt.service_price.toLocaleString('vi-VN')} VNĐ
                      </div>
                    )}
                  </td>
                  <td>
                    {apt.appointmentDate 
                      ? (
                        <div>
                          <div className="font-medium">{format(new Date(apt.appointmentDate), 'dd/MM/yyyy')}</div>
                          <div className="text-xs text-neutral-medium">
                            {apt.startTime ? `${apt.startTime} - ${apt.endTime || ''}` : format(new Date(apt.appointmentDate), 'HH:mm')}
                          </div>
                        </div>
                      )
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`badge badge-${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="btn btn-ghost btn-sm"
                        title="Xem chi tiết"
                      >
                        Chi tiết
                      </button>
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(apt.id!)}
                          className="btn btn-secondary btn-sm"
                          title="Xác nhận lịch hẹn"
                        >
                          Xác nhận
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(apt.id!)}
                          className="btn btn-primary btn-sm"
                          title="Check-in bệnh nhân"
                        >
                          Check-in
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(apt.status) && (
                        <button
                          onClick={() => handleCancel(apt.id!)}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                          title="Hủy lịch hẹn"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createModalOpen && (
        <CreateAppointmentModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            loadAppointments();
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={loadAppointments}
        />
      )}
    </div>
  );
};
