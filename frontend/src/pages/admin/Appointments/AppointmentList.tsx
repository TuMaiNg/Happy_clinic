import React, { useState, useEffect, useCallback } from 'react';
import { appointmentService, Appointment } from '../../../services/appointment.service';
import { format } from 'date-fns';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { AppointmentDetails } from './AppointmentDetails';
import { useToast } from '../../../contexts/ToastContext';

export const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { success, error } = useToast();

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setAppointments(response.data || []);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      error(err.message || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, error]);

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
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'checked-in': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-orange-100 text-orange-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Tạo lịch hẹn mới
        </button>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="checked-in">Đã check-in</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Không có lịch hẹn nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bệnh nhân</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bác sĩ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dịch vụ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày giờ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apt.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apt.patient_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apt.doctor_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apt.service_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(apt.appointmentDate), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedAppointment(apt)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Chi tiết
                    </button>
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(apt.id!)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Xác nhận
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleCheckIn(apt.id!)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Check-in
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button
                        onClick={() => handleCancel(apt.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hủy
                      </button>
                    )}
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
