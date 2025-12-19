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
      // Xử lý lỗi authentication - không redirect, chỉ hiển thị thông báo
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem kết quả thanh toán.');
      } else {
        setError(err?.message || 'Không thể xác thực trạng thái thanh toán.');
      }
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
      } catch (e: any) {
        // Nếu lỗi authentication, không retry
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          // Skip và chỉ fetch status
        }
        // ignore other errors, fallback to polling status
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
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
              <p className="font-semibold mb-2">{error}</p>
              {(error.includes('Phiên đăng nhập') || error.includes('401') || error.includes('403')) && (
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { returnTo: `/payment/success?orderCode=${orderCode}` } })}
                    className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm"
                  >
                    Đăng nhập lại
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 rounded-md border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                  >
                    Về trang chủ
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-4">
              {data.status === 'paid' && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Thanh toán thành công!</h3>
                    <p className="text-gray-600 text-sm">Lịch hẹn của bạn đã được xác nhận</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <span className="font-semibold text-gray-700">Mã đơn:</span>{' '}
                  <span className="font-mono text-primary-600">{data.orderCode}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Trạng thái:</span>{' '}
                  <span className={
                    data.status === 'paid' 
                      ? 'text-green-600 font-semibold' 
                      : data.status === 'pending' 
                        ? 'text-yellow-600 font-semibold' 
                        : 'text-red-600 font-semibold'
                  }>
                    {data.status === 'paid' ? 'Đã thanh toán' : data.status === 'pending' ? 'Đang xử lý' : data.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Số tiền:</span>{' '}
                  <span className="text-lg font-bold text-primary-600">{data.amount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                {data.transactionId && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Mã giao dịch:</span>{' '}
                    <span className="font-mono text-gray-600">{data.transactionId}</span>
                  </div>
                )}
                {data.paidAt && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Thời gian thanh toán:</span>{' '}
                    <span className="text-gray-600">{new Date(data.paidAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>

              {data.status === 'pending' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-yellow-800 text-sm">
                    Thanh toán đang chờ xác thực từ cổng PayOS. Trang sẽ tự động cập nhật...
                  </p>
                </div>
              )}

              {data.status === 'paid' && (
                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-800 font-semibold text-lg mb-1">Thanh toán thành công!</p>
                      <p className="text-green-700 text-sm">
                        Lịch hẹn của bạn đã được xác nhận. Vui lòng đến đúng giờ hẹn.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/appointments')}
                  className="px-6 py-3 rounded-md bg-primary-600 text-white hover:bg-primary-700 font-medium text-base flex-1"
                >
                  Xem danh sách lịch hẹn
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-md border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-base flex-1"
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

