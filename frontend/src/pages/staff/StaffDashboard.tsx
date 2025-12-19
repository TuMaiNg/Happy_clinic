import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../config/api';
import { format } from 'date-fns';
import { 
  CheckCircleIcon, 
  CurrencyDollarIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StaffHeader } from './StaffHeader';
import { SkeletonAppointmentCard } from '../../components/common/Skeleton';
import { PaymentModal } from './PaymentModal';
import './styles.css';

interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  service_name: string;
  service_price?: number;
  appointment_date: string;
  start_time: string;
  status: string;
}

export const StaffDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'pending' | 'payment'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/appointments';
      if (filter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        url += `?fromDate=${today}&toDate=${today}`;
      } else if (filter === 'pending') {
        url += '?status=pending';
      } else if (filter === 'payment') {
        // Load appointments that need payment (confirmed, checked-in, completed)
        url += '?status=confirmed,checked-in,completed';
      }
      const response = await api.get(url);
      const rawAppointments = response.data.data || [];
      const mappedAppointments = rawAppointments.map((apt: any) => ({
        id: apt.id,
        patient_name: apt.patient_name || 'N/A',
        patient_phone: apt.patient_phone || 'N/A',
        doctor_name: apt.doctor_name || 'N/A',
        service_name: apt.service_name || 'N/A',
        service_price: apt.service_price || 0,
        appointment_date:
          apt.appointmentDate || apt.appointment_date || '',
        start_time: apt.startTime || apt.start_time || 'N/A',
        status: apt.status,
      }));
      
      setAllAppointments(mappedAppointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Filter appointments
  useEffect(() => {
    let filtered = allAppointments;
    
    // Filter by payment tab
    if (filter === 'payment') {
      filtered = filtered.filter(apt => 
        ['confirmed', 'checked-in', 'completed'].includes(apt.status)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient_name.toLowerCase().includes(term) ||
        apt.patient_phone.includes(term) ||
        apt.doctor_name.toLowerCase().includes(term) ||
        apt.service_name.toLowerCase().includes(term)
      );
    }
    
    setAppointments(filtered);
  }, [allAppointments, filter, statusFilter, searchTerm]);

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
      <StaffHeader />
      <div className="dashboard-content">
        {/* Main Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`tab ${filter === 'today' ? 'active' : ''}`}
            onClick={() => {
              setFilter('today');
              setStatusFilter('all');
              setSearchTerm('');
            }}
          >
            Hôm nay
          </button>
          <button
            className={`tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setFilter('pending');
              setStatusFilter('all');
              setSearchTerm('');
            }}
          >
            Chờ xác nhận
          </button>
          <button
            className={`tab ${filter === 'payment' ? 'active' : ''}`}
            onClick={() => {
              setFilter('payment');
              setStatusFilter('all');
              setSearchTerm('');
            }}
          >
            <CurrencyDollarIcon className="btn-icon" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            Cần thanh toán
          </button>
        </div>

        {/* Advanced Filters */}
        {(filter === 'today' || filter === 'payment') && (
          <div className="advanced-filters">
            <div className="search-box">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, SĐT, bác sĩ, dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="clear-search"
                  title="Xóa tìm kiếm"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="status-filter-group">
              <FunnelIcon className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="checked-in">Đã check-in</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="appointments-grid">
            {[...Array(6)].map((_, i) => (
              <SkeletonAppointmentCard key={i} />
            ))}
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
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleCheckIn(appt.id)}
                      >
                        Check-in
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedAppointment(appt);
                          setPaymentModalOpen(true);
                        }}
                        title="Làm hóa đơn và thanh toán"
                      >
                        <CurrencyDollarIcon className="btn-icon" />
                        Làm hóa đơn
                      </button>
                    </>
                  )}
                  {(appt.status === 'checked-in' || appt.status === 'completed') && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedAppointment(appt);
                        setPaymentModalOpen(true);
                      }}
                      title="Làm hóa đơn và thanh toán"
                    >
                      <CurrencyDollarIcon className="btn-icon" />
                      Làm hóa đơn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedAppointment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={{
            id: selectedAppointment.id,
            patient_name: selectedAppointment.patient_name,
            patient_phone: selectedAppointment.patient_phone,
            doctor_name: selectedAppointment.doctor_name,
            service_name: selectedAppointment.service_name,
            service_price: selectedAppointment.service_price || 0,
            appointmentDate: selectedAppointment.appointment_date,
            startTime: selectedAppointment.start_time,
          }}
          onSuccess={() => {
            loadAppointments();
          }}
        />
      )}
    </div>
  );
};

