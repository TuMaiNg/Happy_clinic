import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { format } from 'date-fns';
import './styles.css';

interface DailyReportData {
  date: string;
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
    confirmedCount: number;
    cancelledCount: number;
  };
  revenue: {
    total: number;
    cash: number;
    credit: number;
    bankTransfer: number;
    online: number;
    paidCount: number;
    pendingPaymentCount: number;
  };
  appointments: Array<{
    id: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    symptoms?: string;
    notes?: string;
    visitType: string;
    confirmedAt?: string;
    cancelledAt?: string;
    reasonCancel?: string;
    cancellationFee?: number;
    checkedInAt?: string;
    completedAt?: string;
    patient: {
      id: number;
      name: string;
      phone: string;
      email?: string;
      gender?: number;
      birthday?: string;
    };
    doctor: {
      id: number;
      name: string;
      speciality: string;
    };
    service: {
      id: number;
      name: string;
      price: number;
    };
  }>;
  payments: Array<{
    id: number;
    appointmentId: number;
    amount: number;
    paymentMethod: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
    createdAt: string;
    appointmentStatus: string;
  }>;
  byDoctor: Array<{
    id: number;
    full_name: string;
    speciality: string;
    total_appointments: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  }>;
  cancelledAppointments: Array<{
    id: number;
    cancelled_at: string;
    reason_cancel?: string;
    cancellation_fee?: number;
    patient_name: string;
    patient_phone: string;
    doctor_name: string;
    service_name: string;
  }>;
  confirmedAppointments: Array<{
    id: number;
    confirmed_at: string;
    patient_name: string;
    patient_phone: string;
    doctor_name: string;
    service_name: string;
    start_time: string;
  }>;
}

export const DailyReport: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDailyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/reports/daily?date=${selectedDate}`);
      setReportData(response.data.data);
    } catch (err: any) {
      console.error('Failed to load daily report:', err);
      setError(err.response?.data?.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyReport();
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
      'no-show': 'Không đến',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo ngày</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(reportData.date), 'dd/MM/yyyy')}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Tổng lịch hẹn</p>
          <p className="text-2xl font-bold text-gray-900">{reportData.summary.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Đã xác nhận</p>
          <p className="text-2xl font-bold text-green-600">{reportData.summary.confirmed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Đã hủy</p>
          <p className="text-2xl font-bold text-red-600">{reportData.summary.cancelled}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Tổng doanh thu</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(reportData.revenue.total)}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Doanh thu theo phương thức</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tiền mặt</p>
            <p className="text-lg font-semibold">{formatCurrency(reportData.revenue.cash)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Thẻ tín dụng</p>
            <p className="text-lg font-semibold">{formatCurrency(reportData.revenue.credit)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Chuyển khoản</p>
            <p className="text-lg font-semibold">{formatCurrency(reportData.revenue.bankTransfer)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Online</p>
            <p className="text-lg font-semibold">{formatCurrency(reportData.revenue.online)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Đã thanh toán: {reportData.revenue.paidCount} | Chờ thanh toán:{' '}
            {reportData.revenue.pendingPaymentCount}
          </p>
        </div>
      </div>

      {/* By Doctor */}
      {reportData.byDoctor.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thống kê theo bác sĩ</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bác sĩ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chuyên khoa
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Tổng
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Đã xác nhận
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Đã hủy
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Hoàn thành
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.byDoctor.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {doctor.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doctor.speciality}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {doctor.total_appointments}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-green-600">
                      {doctor.confirmed}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-red-600">
                      {doctor.cancelled}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-blue-600">
                      {doctor.completed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancelled Appointments */}
      {reportData.cancelledAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Lịch hẹn đã hủy ({reportData.cancelledAppointments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian hủy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bệnh nhân
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bác sĩ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dịch vụ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Phí hủy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.cancelledAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(apt.cancelled_at), 'HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        <p className="text-gray-500 text-xs">{apt.patient_phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.doctor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.service_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {apt.reason_cancel || 'Không có'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {apt.cancellation_fee ? formatCurrency(apt.cancellation_fee) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmed Appointments */}
      {reportData.confirmedAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Lịch hẹn đã xác nhận ({reportData.confirmedAppointments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian xác nhận
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bệnh nhân
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bác sĩ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dịch vụ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Giờ hẹn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.confirmedAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(apt.confirmed_at), 'HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        <p className="text-gray-500 text-xs">{apt.patient_phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.doctor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.service_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{apt.start_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Appointments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Tất cả lịch hẹn trong ngày ({reportData.appointments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giờ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bệnh nhân
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bác sĩ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dịch vụ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tình trạng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Triệu chứng
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {apt.startTime} - {apt.endTime}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{apt.patient.name}</p>
                      <p className="text-gray-500 text-xs">{apt.patient.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>
                      <p>{apt.doctor.name}</p>
                      <p className="text-xs text-gray-500">{apt.doctor.speciality}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>
                      <p>{apt.service.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(apt.service.price)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        apt.status
                      )}`}
                    >
                      {getStatusLabel(apt.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {apt.symptoms ? (
                      <p className="truncate max-w-xs" title={apt.symptoms}>
                        {apt.symptoms}
                      </p>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments/Invoices */}
      {reportData.payments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Hóa đơn/Thanh toán ({reportData.payments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã lịch hẹn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phương thức
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã giao dịch
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">#{payment.appointmentId}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.paymentMethod === 'cash'
                        ? 'Tiền mặt'
                        : payment.paymentMethod === 'credit'
                        ? 'Thẻ tín dụng'
                        : payment.paymentMethod === 'bank_transfer'
                        ? 'Chuyển khoản'
                        : 'Online'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status === 'paid'
                          ? 'Đã thanh toán'
                          : payment.status === 'pending'
                          ? 'Chờ thanh toán'
                          : 'Thất bại'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.paidAt
                        ? format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm')
                        : format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.transactionId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


