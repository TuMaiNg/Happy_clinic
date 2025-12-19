import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, Appointment } from '../services/appointment.service';
import { format } from 'date-fns';
import { Layout } from '../components/layout/Layout';
import { StatsCard } from '../components/common/StatsCard';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

export const PatientDashboard: React.FC = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    loadUpcomingAppointments();
    loadStats();
  }, []);

  const loadUpcomingAppointments = async () => {
    try {
      const response = await appointmentService.getAll({
        status: 'confirmed',
        limit: 5,
      });
      setUpcomingAppointments(response.data);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
    }
  };

  const loadStats = async () => {
    try {
      const allResponse = await appointmentService.getAll({});
      const upcomingResponse = await appointmentService.getAll({ status: 'confirmed' });
      const completedResponse = await appointmentService.getAll({ status: 'completed' });

      setStats({
        total: allResponse.data.length,
        upcoming: upcomingResponse.data.length,
        completed: completedResponse.data.length,
      });
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  return (
    <Layout>
      <div className="fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">Dashboard - Bệnh nhân</h1>
          <p className="text-sm text-neutral-medium">Chào mừng trở lại! Đây là tổng quan lịch hẹn của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Tổng lịch hẹn"
            value={stats.total}
            icon={<CalendarIcon className="w-6 h-6" />}
            color="primary"
          />
          <StatsCard
            title="Sắp tới"
            value={stats.upcoming}
            icon={<ClockIcon className="w-6 h-6" />}
            color="info"
          />
          <StatsCard
            title="Đã hoàn thành"
            value={stats.completed}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="card-title mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/book-appointment"
              className="card card-hover p-4 text-center"
            >
              <div className="bg-primary-50 rounded-lg p-3 w-fit mx-auto mb-3">
                <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-semibold text-neutral-dark mb-1">Đặt lịch hẹn mới</p>
              <p className="text-xs text-neutral-medium">Đặt lịch hẹn với bác sĩ</p>
            </Link>

            <Link
              to="/appointments"
              className="card card-hover p-4 text-center"
            >
              <div className="bg-secondary-50 rounded-lg p-3 w-fit mx-auto mb-3">
                <svg className="h-8 w-8 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-semibold text-neutral-dark mb-1">Xem lịch hẹn</p>
              <p className="text-xs text-neutral-medium">Quản lý lịch hẹn của bạn</p>
            </Link>

            <Link
              to="/medical-history"
              className="card card-hover p-4 text-center"
            >
              <div className="bg-accent-50 rounded-lg p-3 w-fit mx-auto mb-3">
                <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold text-neutral-dark mb-1">Lịch sử khám bệnh</p>
              <p className="text-xs text-neutral-medium">Xem lịch sử khám của bạn</p>
            </Link>

            <Link
              to="/favorite-doctors"
              className="card card-hover p-4 text-center"
            >
              <div className="bg-warm-200 rounded-lg p-3 w-fit mx-auto mb-3">
                <HeartIcon className="h-8 w-8 text-status-error" />
              </div>
              <p className="font-semibold text-neutral-dark mb-1">Bác sĩ yêu thích</p>
              <p className="text-xs text-neutral-medium">Xem bác sĩ yêu thích</p>
            </Link>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="card-title mb-1">Lịch hẹn sắp tới</h2>
              <p className="text-sm text-neutral-medium">Các lịch hẹn đã được xác nhận</p>
            </div>
            <Link to="/appointments" className="btn btn-outline btn-sm">
              Xem tất cả
            </Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <div className="empty-state py-8">
              <CalendarIcon className="empty-state-icon" />
              <h3 className="empty-state-title">Không có lịch hẹn sắp tới</h3>
              <p className="empty-state-description">Bạn chưa có lịch hẹn nào đã được xác nhận</p>
              <Link to="/book-appointment" className="btn btn-primary mt-4">
                Đặt lịch hẹn ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, index) => (
                <div
                  key={apt.id}
                  className="card card-hover p-4 slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary-50 rounded-lg p-2">
                          <CalendarIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-dark">
                            {apt.doctor_name || 'Bác sĩ'}
                          </p>
                          {apt.doctor_speciality && (
                            <p className="text-xs text-neutral-medium">{apt.doctor_speciality}</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-12 space-y-1">
                        <p className="text-sm text-neutral-dark">
                          <span className="font-medium">Ngày:</span>{' '}
                          {format(new Date(apt.appointmentDate), 'dd/MM/yyyy')} lúc{' '}
                          {apt.startTime || format(new Date(apt.appointmentDate), 'HH:mm')}
                        </p>
                        <p className="text-sm text-neutral-medium">
                          <span className="font-medium">Dịch vụ:</span> {apt.service_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-info">Đã xác nhận</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
