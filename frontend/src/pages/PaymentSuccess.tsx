import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/payment.service';

interface StatusData {
  orderCode: string;
  status: string;
  amount: number;
  paymentMethod: string;
  gateway: string | null;
  transactionId: string | null;
  paidAt: string | null;
}

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatusData | null>(null);
  const [pollCount, setPollCount] = useState(0);

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

  const fetchStatus = async () => {
    if (!orderCode) {
      setError('Không tìm thấy orderCode để xác thực thanh toán.');
      setLoading(false);
      return;
    }
    try {
      const res = await paymentService.getPayOSStatus(orderCode);
      setData(res.data);
      setError(null);
      // Nếu vẫn pending thì tiếp tục poll trong vài lần
      if (res.data.status === 'pending' && pollCount < 15) {
        setTimeout(() => setPollCount((c) => c + 1), 2000);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể xác thực trạng thái thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  // Khi người dùng quay về trang thành công, chủ động mark paid nếu còn pending (phòng webhook chậm)
  useEffect(() => {
    const run = async () => {
      if (!orderCode) return;
      try {
        await paymentService.successPayOS(orderCode);
      } catch (e) {
        // ignore, fallback to polling status
      } finally {
        fetchStatus();
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode, pollCount]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kết quả thanh toán</h2>

          {loading && <div>Đang kiểm tra trạng thái...</div>}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
          )}

          {!loading && !error && data && (
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Mã đơn (orderCode):</span> {data.orderCode}
              </div>
              <div>
                <span className="font-semibold">Trạng thái:</span>{' '}
                <span className={
                  data.status === 'paid' ? 'text-green-600 font-semibold' : data.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'
                }>
                  {data.status}
                </span>
              </div>
              <div>
                <span className="font-semibold">Số tiền:</span> {data.amount.toLocaleString('vi-VN')} VNĐ
              </div>
              {data.transactionId && (
                <div>
                  <span className="font-semibold">Transaction ID:</span> {data.transactionId}
                </div>
              )}
              {data.paidAt && (
                <div>
                  <span className="font-semibold">Thanh toán lúc:</span> {new Date(data.paidAt).toLocaleString('vi-VN')}
                </div>
              )}

              {data.status === 'pending' && (
                <div className="text-sm text-gray-600">Thanh toán đang chờ xác thực từ cổng PayOS. Trang sẽ tự cập nhật vài giây một lần...</div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

