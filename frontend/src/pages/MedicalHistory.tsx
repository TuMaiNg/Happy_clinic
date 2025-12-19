import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, Appointment } from '../services/appointment.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CheckCircleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const MedicalHistory: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        status: filter === 'all' ? undefined : filter,
      });
      
      // Filter for completed and cancelled appointments (medical history)
      const historyAppointments = (response.data || []).filter(
        (apt: Appointment) => apt.status === 'completed' || apt.status === 'cancelled'
      );
      
      // Apply search filter if any
      let filtered = historyAppointments;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = historyAppointments.filter(
          (apt: Appointment) =>
            apt.doctor_name?.toLowerCase().includes(term) ||
            apt.service_name?.toLowerCase().includes(term) ||
            apt.doctor_speciality?.toLowerCase().includes(term)
        );
      }
      
      setAppointments(filtered);
    } catch (err: any) {
      console.error('Error loading medical history:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon;
      case 'cancelled':
        return XMarkIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">Lịch sử khám bệnh</h1>
            <p className="text-neutral-medium mt-2">Xem lại các lịch hẹn đã hoàn thành hoặc đã hủy</p>
          </div>
          <Link to="/appointments">
            <Button variant="secondary">Quay lại lịch hẹn</Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bác sĩ, dịch vụ, chuyên khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-neutral-border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {['all', 'completed', 'cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-light text-neutral-medium hover:bg-neutral-border'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-neutral-medium">Đang tải lịch sử...</p>
          </div>
        ) : appointments.length === 0 ? (
          <Card className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-neutral-medium mx-auto mb-4" />
            <p className="text-neutral-medium text-lg mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử khám bệnh'}
            </p>
            {!searchTerm && (
              <Link to="/book-appointment">
                <Button variant="primary" className="mt-4">
                  Đặt lịch hẹn đầu tiên
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const StatusIcon = getStatusIcon(appointment.status);
              return (
                <Card
                  key={appointment.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {getStatusText(appointment.status)}
                        </div>
                        <span className="text-sm text-neutral-medium">
                          Mã: #{appointment.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-neutral-dark mb-2">
                            {appointment.doctor_name || 'Bác sĩ'}
                          </h3>
                          <p className="text-sm text-neutral-medium mb-1">
                            <span className="font-medium">Chuyên khoa:</span>{' '}
                            {appointment.doctor_speciality || 'N/A'}
                          </p>
                          <p className="text-sm text-neutral-medium">
                            <span className="font-medium">Dịch vụ:</span> {appointment.service_name || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-neutral-medium mb-2">
                            <span className="font-medium">Ngày khám:</span>{' '}
                            <span className="text-neutral-dark">
                              {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', { locale: vi })}
                            </span>
                          </p>
                          <p className="text-sm text-neutral-medium mb-2">
                            <span className="font-medium">Giờ:</span>{' '}
                            <span className="text-neutral-dark">
                              {appointment.startTime?.substring(0, 5) || appointment.startTime} -{' '}
                              {appointment.endTime?.substring(0, 5) || appointment.endTime}
                            </span>
                          </p>
                          {appointment.service_price && (
                            <p className="text-sm text-neutral-medium">
                              <span className="font-medium">Giá dịch vụ:</span>{' '}
                              <span className="text-primary-600 font-semibold">
                                {appointment.service_price.toLocaleString('vi-VN')}₫
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {appointment.symptoms && (
                        <div className="mt-4 pt-4 border-t border-neutral-border">
                          <p className="text-sm">
                            <span className="font-medium text-neutral-dark">Triệu chứng:</span>{' '}
                            <span className="text-neutral-medium">{appointment.symptoms}</span>
                          </p>
                        </div>
                      )}

                      {appointment.notes && appointment.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-neutral-border bg-blue-50 rounded-lg p-4">
                          <p className="text-sm">
                            <span className="font-medium text-blue-900">Ghi chú từ bác sĩ:</span>{' '}
                            <span className="text-blue-800">{appointment.notes}</span>
                          </p>
                        </div>
                      )}

                      {appointment.reasonCancel && appointment.status === 'cancelled' && (
                        <div className="mt-4 pt-4 border-t border-neutral-border">
                          <p className="text-sm">
                            <span className="font-medium text-neutral-dark">Lý do hủy:</span>{' '}
                            <span className="text-neutral-medium">{appointment.reasonCancel}</span>
                          </p>
                        </div>
                      )}

                      {appointment.completedAt && (
                        <p className="text-xs text-neutral-medium mt-4">
                          Hoàn thành: {format(new Date(appointment.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      )}
                      {appointment.cancelledAt && (
                        <p className="text-xs text-neutral-medium mt-4">
                          Hủy lúc: {format(new Date(appointment.cancelledAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};


