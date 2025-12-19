import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../config/api';
import { format, startOfDay, endOfDay } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { DoctorHeader } from './DoctorHeader';
import { useToast } from '../../contexts/ToastContext';
import { StatsCard } from '../../components/common/StatsCard';
import { PatientManagement } from './PatientManagement';
import './styles.css';

interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
  symptoms?: string;
}

export const DoctorDashboard: React.FC = () => {
  const { success, error } = useToast();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'appointments' | 'patients'>('appointments');
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
  });

  const loadTodayAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get(`/appointments?fromDate=${today}&toDate=${today}`);
      const appointments = response?.data?.data || response?.data || [];
      const mappedAppointments = (Array.isArray(appointments) ? appointments : [])
        .filter((apt: any) => apt.status !== 'cancelled')
        .map((apt: any) => ({
          id: apt.id,
          patient_name: apt.patient_name || 'N/A',
          patient_phone: apt.patient_phone || 'N/A',
          service_name: apt.service_name || 'N/A',
          appointment_date: apt.appointmentDate || apt.appointment_date || today,
          start_time: apt.startTime || apt.start_time || apt.slot_start_time || 'N/A',
          status: apt.status,
          symptoms: apt.symptoms,
        }));
      
      setAllAppointments(mappedAppointments);
      
      // Calculate stats
      setStats({
        total: mappedAppointments.length,
        confirmed: mappedAppointments.filter(a => a.status === 'confirmed').length,
        checkedIn: mappedAppointments.filter(a => a.status === 'checked-in').length,
        completed: mappedAppointments.filter(a => a.status === 'completed').length,
      });
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setAllAppointments([]);
      setTodayAppointments([]);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách lịch hẹn hôm nay';
      error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadTodayAppointments();
  }, [loadTodayAppointments]);

  // Filter appointments
  useEffect(() => {
    let filtered = allAppointments;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient_name.toLowerCase().includes(term) ||
        apt.patient_phone.includes(term) ||
        apt.service_name.toLowerCase().includes(term)
      );
    }
    
    // Sort by time
    filtered.sort((a, b) => {
      const timeA = a.start_time.split(':').map(Number);
      const timeB = b.start_time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    setTodayAppointments(filtered);
  }, [allAppointments, statusFilter, searchTerm]);

  const handleComplete = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/complete`);
      loadTodayAppointments();
      success('Hoàn thành lịch hẹn thành công!');
    } catch (err: any) {
      console.error('Failed to complete appointment:', err);
      error(err.response?.data?.message || 'Không thể hoàn thành lịch hẹn');
    }
  };

  const getStatusText = (status: string) => {
    const map: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã check-in',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      'no-show': 'Vắng mặt',
    };
    return map[status] || status;
  };

  return (
    <div className="doctor-dashboard fade-in">
      <DoctorHeader />
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>
              {activeView === 'appointments' ? 'Lịch hẹn hôm nay' : 'Quản lý bệnh nhân'}
            </h1>
            <p className="text-muted">
              {activeView === 'appointments' 
                ? `${format(new Date(), 'dd/MM/yyyy')} - ${stats.total} lịch hẹn`
                : 'Chấp nhận hoặc từ chối bệnh nhân'}
            </p>
          </div>
          <div className="view-switcher">
            <button
              className={`view-btn ${activeView === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveView('appointments')}
            >
              Lịch hẹn
            </button>
            <button
              className={`view-btn ${activeView === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveView('patients')}
            >
              Bệnh nhân
            </button>
          </div>
        </div>

        {activeView === 'patients' ? (
          <PatientManagement />
        ) : (
          <>
        {/* Stats Cards */}
        <div className="stats-grid">
          <StatsCard
            title="Tổng lịch hẹn"
            value={stats.total}
            icon={<CalendarIcon className="w-6 h-6" />}
            color="primary"
          />
          <StatsCard
            title="Đã xác nhận"
            value={stats.confirmed}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="info"
          />
          <StatsCard
            title="Đã check-in"
            value={stats.checkedIn}
            icon={<UserGroupIcon className="w-6 h-6" />}
            color="success"
          />
          <StatsCard
            title="Đã hoàn thành"
            value={stats.completed}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="success"
          />
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT, dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="status-filters">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${statusFilter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('confirmed')}
            >
              Đã xác nhận
            </button>
            <button
              className={`filter-btn ${statusFilter === 'checked-in' ? 'active' : ''}`}
              onClick={() => setStatusFilter('checked-in')}
            >
              Đã check-in
            </button>
            <button
              className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Hoàn thành
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon className="empty-icon" />
            <p>Không có lịch hẹn nào</p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                style={{ marginTop: '1rem' }}
              >
                Xóa bộ lọc
              </button>
            ) : null}
          </div>
        ) : (
          <div className="appointments-list">
            {todayAppointments.map((appt, index) => (
              <div 
                key={appt.id} 
                className="appointment-card slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="appointment-time">
                  <ClockIcon className="time-icon" />
                  <span>{appt.start_time}</span>
                </div>
                <div className="appointment-content">
                  <div className="appointment-header">
                    <h3>{appt.patient_name}</h3>
                    <span className={`status-badge status-${appt.status}`}>
                      {getStatusText(appt.status)}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <p className="appointment-service">
                      <strong>Dịch vụ:</strong> {appt.service_name}
                    </p>
                    <p className="appointment-phone">
                      <strong>SĐT:</strong> {appt.patient_phone}
                    </p>
                    {appt.symptoms && (
                      <p className="appointment-symptoms">
                        <strong>Triệu chứng:</strong> {appt.symptoms}
                      </p>
                    )}
                  </div>
                </div>
                <div className="appointment-actions">
                  {appt.status === 'checked-in' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleComplete(appt.id)}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
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
          </>
        )}
      </div>
    </div>
  );
};
