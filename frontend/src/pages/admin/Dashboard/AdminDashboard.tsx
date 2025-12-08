import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { AppointmentChart } from './AppointmentChart';
import { RecentActivities } from './RecentActivities';
import { api } from '../../../config/api';
import './styles.css';
import '../shared/styles.css';

interface DashboardStats {
  todayAppointments: number;
  pendingAppointments: number;
  todayRevenue: number;
  totalPatients: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    todayRevenue: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Get dashboard data from multiple endpoints
      const [appointmentsRes, patientsRes, paymentsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/payments').catch(() => ({ data: { data: [] } })),
      ]);

      const appointments = appointmentsRes.data.data || [];
      const patients = patientsRes.data.data || [];
      const payments = paymentsRes.data.data || [];

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter((apt: any) => {
        const aptDate = apt.appointmentDate 
          ? new Date(apt.appointmentDate).toISOString().split('T')[0]
          : apt.appointment_date;
        return aptDate === today;
      });
      const pendingAppointments = appointments.filter(
        (apt: any) => apt.status === 'pending'
      );

      // Calculate today's revenue from payments
      const todayRevenue = payments
        .filter((payment: any) => {
          const paymentDate = payment.payment_date 
            ? new Date(payment.payment_date).toISOString().split('T')[0]
            : null;
          return paymentDate === today && payment.status === 'completed';
        })
        .reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);

      setStats({
        todayAppointments: todayAppointments.length,
        pendingAppointments: pendingAppointments.length,
        todayRevenue: todayRevenue,
        totalPatients: patients.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tổng quan</h1>
        <p className="text-muted">Thống kê tổng quan hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Lịch hẹn hôm nay"
          value={stats.todayAppointments}
          icon="calendar"
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="Chờ xác nhận"
          value={stats.pendingAppointments}
          icon="clock"
          color="orange"
        />
        <StatsCard
          title="Doanh thu hôm nay"
          value={`${stats.todayRevenue.toLocaleString('vi-VN')}₫`}
          icon="money"
          color="green"
          trend="+8%"
        />
        <StatsCard
          title="Tổng bệnh nhân"
          value={stats.totalPatients}
          icon="users"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Lịch hẹn 7 ngày qua</h3>
          <AppointmentChart />
        </div>

        <div className="dashboard-card">
          <h3>Hoạt động gần đây</h3>
          <RecentActivities />
        </div>
      </div>
    </div>
  );
};

