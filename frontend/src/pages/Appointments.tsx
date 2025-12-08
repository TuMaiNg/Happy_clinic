import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services/appointment.service';
import { Layout } from '../components/layout/Layout';
import { AppointmentCard } from '../components/features/appointments/AppointmentCard';
import { CancelAppointmentModal } from '../components/features/appointments/CancelAppointmentModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        status: filter === 'all' ? undefined : filter,
      });
      setAppointments(response.data);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCancelModalOpen(true);
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

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
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

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-medium mb-4">Không có lịch hẹn nào</p>
              <Link to="/book-appointment">
                <Button variant="primary">Đặt lịch hẹn đầu tiên</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onCancel={() => handleCancelClick(apt)}
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
    </Layout>
  );
};
