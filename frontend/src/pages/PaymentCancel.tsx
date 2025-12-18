import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/payment.service';

export const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'failed' | 'paid' | 'refunded' | string>('failed');

  const orderCode = useMemo(() => {
    const urlCode = params.get('orderCode') || params.get('order_code') || params.get('order');
    if (urlCode) return urlCode;
    try {
      const cached = sessionStorage.getItem('payos_order_code');
      return cached || '';
    } catch {
      return '';
    }
  }, [params]);

  useEffect(() => {
    const check = async () => {
      if (!orderCode) {
        setLoading(false);
        return;
      }
      try {
        const res = await paymentService.getPayOSStatus(orderCode);
        setStatus(res.data.status);
      } catch (err: any) {
        setError(err?.message || 'Không thể kiểm tra trạng thái thanh toán.');
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [orderCode]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán đã hủy</h2>
          {loading && <div>Đang kiểm tra trạng thái...</div>}
          {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>}
          {!loading && !error && (
            <>
              <p className="text-gray-700 mb-3">Bạn đã hủy giao dịch hoặc quay lại từ cổng thanh toán.</p>
              {status === 'paid' ? (
                <p className="text-green-700">Hệ thống ghi nhận giao dịch đã thanh toán thành công. Bạn có thể xem trong danh sách lịch hẹn.</p>
              ) : (
                <p className="text-gray-600">Lịch hẹn vẫn được lưu. Bạn có thể thanh toán sau khi điều trị hoặc thanh toán lại trong phần chi tiết lịch hẹn.</p>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/appointments')}
                  className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
                >
                  Về danh sách lịch hẹn
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Về trang chủ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;

