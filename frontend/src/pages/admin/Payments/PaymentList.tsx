import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { format } from 'date-fns';
import { useToast } from '../../../contexts/ToastContext';

interface Payment {
  id: number;
  appointment_id: number;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
}

export const PaymentList: React.FC = () => {
  const { success, error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments');
      setPayments(response?.data?.data || response?.data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
      setPayments([]);
      error('Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.put(`/payments/${id}/confirm`);
      loadPayments();
      success('Xác nhận thanh toán thành công!');
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể xác nhận thanh toán');
    }
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Quản lý thanh toán</h1>
          <p className="text-muted">Danh sách tất cả thanh toán</p>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="table-empty">
            <p>Không có thanh toán nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lịch hẹn</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>#{payment.appointment_id}</td>
                  <td>{payment.amount.toLocaleString('vi-VN')}₫</td>
                  <td>{payment.payment_method || '-'}</td>
                  <td>
                    <span
                      className={`badge ${
                        payment.status === 'paid'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {payment.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </span>
                  </td>
                  <td>
                    {payment.created_at
                      ? format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')
                      : 'N/A'}
                  </td>
                  <td>
                    {payment.status !== 'paid' && (
                      <button
                        className="btn-sm btn-success"
                        onClick={() => handleConfirm(payment.id)}
                      >
                        Xác nhận
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

