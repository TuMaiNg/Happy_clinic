import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../config/api';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import './styles.css';

interface AppointmentStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byDoctor: { full_name: string; speciality: string; count: number }[];
  daily: { date: string; count: number }[];
}

interface RevenueStats {
  total: number;
  byMethod: { payment_method: string; total: number; count: number }[];
  daily: { date: string; total: number; count: number }[];
  byService: { name: string; speciality: string; total: number; count: number }[];
}

interface DoctorPerformance {
  id: number;
  full_name: string;
  speciality: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_show: number;
  completion_rate: number;
}

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'revenue' | 'doctors'>('appointments');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);

  const getDateRange = useCallback(() => {
    const today = new Date();
    switch (dateRange) {
      case 'today':
        return { fromDate: format(today, 'yyyy-MM-dd'), toDate: format(today, 'yyyy-MM-dd') };
      case 'week':
        return { fromDate: format(subDays(today, 7), 'yyyy-MM-dd'), toDate: format(today, 'yyyy-MM-dd') };
      case 'month':
        return { fromDate: format(startOfMonth(today), 'yyyy-MM-dd'), toDate: format(endOfMonth(today), 'yyyy-MM-dd') };
    }
  }, [dateRange]);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const { fromDate, toDate } = getDateRange();

      if (activeTab === 'appointments') {
        const response = await api.get(`/reports/appointments?fromDate=${fromDate}&toDate=${toDate}`);
        setAppointmentStats(response.data.data);
      } else if (activeTab === 'revenue') {
        const response = await api.get(`/reports/revenue?fromDate=${fromDate}&toDate=${toDate}`);
        setRevenueStats(response.data.data);
      } else if (activeTab === 'doctors') {
        const response = await api.get(`/reports/doctors?fromDate=${fromDate}&toDate=${toDate}`);
        setDoctorPerformance(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, getDateRange]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const renderAppointmentReport = () => {
    if (!appointmentStats) return null;
    return (
      <div className="report-content">
        <div className="stats-summary">
          <div className="stat-box">
            <span className="stat-value">{appointmentStats.total}</span>
            <span className="stat-label">Tổng lịch hẹn</span>
          </div>
          {appointmentStats.byStatus.map((item) => (
            <div key={item.status} className={`stat-box status-${item.status}`}>
              <span className="stat-value">{item.count}</span>
              <span className="stat-label">{item.status === 'completed' ? 'Hoàn thành' :
                item.status === 'cancelled' ? 'Đã hủy' :
                item.status === 'pending' ? 'Chờ xác nhận' :
                item.status === 'confirmed' ? 'Đã xác nhận' :
                item.status === 'checked-in' ? 'Đã check-in' :
                item.status === 'no-show' ? 'Vắng mặt' : item.status}</span>
            </div>
          ))}
        </div>

        <div className="report-section">
          <h3>Theo bác sĩ</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Chuyên khoa</th>
                <th>Số lịch hẹn</th>
              </tr>
            </thead>
            <tbody>
              {appointmentStats.byDoctor.map((doctor, index) => (
                <tr key={index}>
                  <td>{doctor.full_name}</td>
                  <td>{doctor.speciality}</td>
                  <td>{doctor.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRevenueReport = () => {
    if (!revenueStats) return null;
    return (
      <div className="report-content">
        <div className="stats-summary">
          <div className="stat-box revenue">
            <span className="stat-value">{revenueStats.total.toLocaleString('vi-VN')}₫</span>
            <span className="stat-label">Tổng doanh thu</span>
          </div>
          {revenueStats.byMethod.map((item) => (
            <div key={item.payment_method} className="stat-box">
              <span className="stat-value">{item.total.toLocaleString('vi-VN')}₫</span>
              <span className="stat-label">{item.payment_method === 'cash' ? 'Tiền mặt' :
                item.payment_method === 'bank' ? 'Chuyển khoản' :
                item.payment_method === 'card' ? 'Thẻ' : item.payment_method} ({item.count})</span>
            </div>
          ))}
        </div>

        <div className="report-section">
          <h3>Theo dịch vụ</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Chuyên khoa</th>
                <th>Số lượng</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {revenueStats.byService.map((service, index) => (
                <tr key={index}>
                  <td>{service.name}</td>
                  <td>{service.speciality}</td>
                  <td>{service.count}</td>
                  <td>{service.total.toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDoctorPerformance = () => {
    return (
      <div className="report-content">
        <table className="report-table">
          <thead>
            <tr>
              <th>Bác sĩ</th>
              <th>Chuyên khoa</th>
              <th>Tổng lịch hẹn</th>
              <th>Hoàn thành</th>
              <th>Đã hủy</th>
              <th>Vắng mặt</th>
              <th>Tỉ lệ hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {doctorPerformance.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.full_name}</td>
                <td>{doctor.speciality}</td>
                <td>{doctor.total_appointments}</td>
                <td className="text-success">{doctor.completed}</td>
                <td className="text-danger">{doctor.cancelled}</td>
                <td className="text-warning">{doctor.no_show}</td>
                <td>
                  <span className={`completion-rate ${doctor.completion_rate >= 80 ? 'high' : doctor.completion_rate >= 50 ? 'medium' : 'low'}`}>
                    {doctor.completion_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Báo cáo & Phân tích</h1>
          <p className="text-muted">Xem các báo cáo và thống kê</p>
        </div>
        <div className="date-range-selector">
          <button className={`btn ${dateRange === 'today' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDateRange('today')}>Hôm nay</button>
          <button className={`btn ${dateRange === 'week' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDateRange('week')}>7 ngày</button>
          <button className={`btn ${dateRange === 'month' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDateRange('month')}>Tháng này</button>
        </div>
      </div>

      <div className="report-tabs">
        <button className={`tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>Lịch hẹn</button>
        <button className={`tab ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>Doanh thu</button>
        <button className={`tab ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>Hiệu suất bác sĩ</button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {activeTab === 'appointments' && renderAppointmentReport()}
          {activeTab === 'revenue' && renderRevenueReport()}
          {activeTab === 'doctors' && renderDoctorPerformance()}
        </>
      )}
    </div>
  );
};







