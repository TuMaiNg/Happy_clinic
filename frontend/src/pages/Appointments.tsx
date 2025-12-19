import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services/appointment.service';
import { paymentService, Payment } from '../services/payment.service';
import { useToast } from '../contexts/ToastContext';

import { Layout } from '../components/layout/Layout';
import { AppointmentCard } from '../components/features/appointments/AppointmentCard';
import { CancelAppointmentModal } from '../components/features/appointments/CancelAppointmentModal';
import { RescheduleAppointmentModal } from '../components/features/appointments/RescheduleAppointmentModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [paymentStatusMap, setPaymentStatusMap] = useState<Record<number, 'paid' | 'failed' | string>>({});

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        status: filter === 'all' ? undefined : filter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const list = response.data || [];
      setAllAppointments(list);
      
      // Apply search filter if any
      let filtered = list;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = list.filter(
          (apt: any) =>
            apt.doctor_name?.toLowerCase().includes(term) ||
            apt.service_name?.toLowerCase().includes(term) ||
            apt.doctor_speciality?.toLowerCase().includes(term) ||
            apt.patient_name?.toLowerCase().includes(term)
        );
      }
      
      setAppointments(filtered);

      // Load payments to determine payment status per appointment (latest payment wins)
      try {
        const payRes = await paymentService.getAll();
        const payments: Payment[] = payRes.data || [] as any;
        const latestByApt = new Map<number, Payment>();
        payments.forEach((p) => {
          const aptId = (p as any).appointmentId ?? (p as any).appointment_id; // fallback
          if (!aptId) return;
          const current = latestByApt.get(aptId);
          const curTime = current ? new Date(current.createdAt).getTime() : -1;
          const newTime = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
          if (!current || newTime >= curTime) {
            latestByApt.set(aptId, p);
          }
        });
        const map: Record<number, 'paid' | 'failed' | string> = {};
        latestByApt.forEach((p, aptId) => {
          map[aptId] = p.status as any;
        });
        setPaymentStatusMap(map);
      } catch (e) {
        console.warn('Load payments failed', e);
        setPaymentStatusMap({});
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, fromDate, toDate, searchTerm]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Bạn có chắc muốn xóa lịch hẹn này? Hành động không thể hoàn tác.');
    if (!ok) return;
    try {
      await appointmentService.delete(id);
      showSuccessToast('Xóa lịch hẹn thành công');
      await loadAppointments();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xóa lịch hẹn thất bại';
      showErrorToast(msg);
    }
  };

  const handleCancelClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCancelModalOpen(true);
  };

  const handleRescheduleClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleConfirm = async (slotId: number, appointmentDate: string, reason?: string) => {
    if (!selectedAppointment) return;
    
    try {
      await appointmentService.reschedule(selectedAppointment.id, slotId, appointmentDate, reason);
      showSuccessToast('Đổi lịch hẹn thành công! Lịch hẹn sẽ cần được xác nhận lại.');
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Đổi lịch thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedAppointment) return;

    try {
      await appointmentService.cancel(selectedAppointment.id, reason);
      setCancelModalOpen(false);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (err: any) {
      alert('Hủy lịch hẹn thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await appointmentService.checkIn(id);
      loadAppointments();
    } catch (err: any) {
      alert('Check-in thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã check-in',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      'no-show': 'Không đến',
    };
    return statusMap[status] || status;
  };

  return (
    <Layout>
      <div>
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-dark">Lịch hẹn của tôi</h2>
            <Link to="/book-appointment">
              <Button variant="primary">
                Đặt lịch mới
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bác sĩ, dịch vụ, chuyên khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-neutral-border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-dark mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-dark mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="px-4 py-2 text-sm text-neutral-medium hover:text-neutral-dark"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-light text-neutral-medium hover:bg-neutral-border'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : getStatusText(f)}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-medium mb-4">
                {searchTerm || fromDate || toDate 
                  ? 'Không tìm thấy lịch hẹn nào phù hợp với bộ lọc'
                  : 'Không có lịch hẹn nào'}
              </p>
              {(searchTerm || fromDate || toDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFromDate('');
                    setToDate('');
                  }}
                  className="text-primary-600 hover:text-primary-700 mb-4 block"
                >
                  Xóa bộ lọc
                </button>
              )}
              {!searchTerm && !fromDate && !toDate && (
                <Link to="/book-appointment">
                  <Button variant="primary">Đặt lịch hẹn đầu tiên</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  paymentStatus={paymentStatusMap[apt.id]}
                  onCancel={() => handleCancelClick(apt)}
                  onReschedule={() => handleRescheduleClick(apt)}
                  onCheckIn={() => handleCheckIn(apt.id)}
                  onDelete={() => handleDelete(apt.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Cancel Modal */}
      <CancelAppointmentModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onConfirm={handleCancelConfirm}
        cancellationFee={selectedAppointment?.cancellationFee || 0}
      />

      {selectedAppointment && (
        <RescheduleAppointmentModal
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onConfirm={handleRescheduleConfirm}
        />
      )}
    </Layout>
  );
};
