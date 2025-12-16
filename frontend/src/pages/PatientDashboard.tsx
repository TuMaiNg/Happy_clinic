import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, Appointment } from '../services/appointment.service';
import { format } from 'date-fns';
import { Layout } from '../components/layout/Layout';

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard - Bệnh nhân</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng lịch hẹn</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sắp tới</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Đã hoàn thành</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/book-appointment"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Đặt lịch hẹn mới</p>
              <p className="text-sm text-gray-500">Đặt lịch hẹn với bác sĩ</p>
            </div>
          </Link>

          <Link
            to="/appointments"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Xem lịch hẹn</p>
              <p className="text-sm text-gray-500">Quản lý lịch hẹn của bạn</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Lịch hẹn sắp tới</h2>
          <Link to="/appointments" className="text-primary-600 hover:text-primary-700 text-sm">
            Xem tất cả
          </Link>
        </div>
        {upcomingAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Không có lịch hẹn sắp tới</p>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {apt.doctor_name || 'Bác sĩ'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(apt.appointmentDate), 'dd/MM/yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {apt.service_name || 'Dịch vụ'}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Đã xác nhận
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
