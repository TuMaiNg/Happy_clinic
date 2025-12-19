/**
 * Payment Modal for Staff
 * Allows staff to create and process payments for appointments
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { paymentService } from '../../services/payment.service';
import { useToast } from '../../contexts/ToastContext';
import { XMarkIcon, CurrencyDollarIcon, PrinterIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    patient_name?: string;
    patient_phone?: string;
    doctor_name?: string;
    service_name?: string;
    service_price?: number;
    appointmentDate?: string;
    startTime?: string;
  };
  onSuccess: () => void;
}

interface PaymentInfo {
  amount: number;
  paymentMethod: 'cash' | 'credit' | 'bank_transfer' | 'online';
  notes?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    amount: appointment.service_price || 0,
    paymentMethod: 'cash',
    notes: '',
  });
  const [existingPayments, setExistingPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && appointment.id) {
      loadAppointmentDetails();
      loadPaymentHistory();
    }
  }, [isOpen, appointment.id]);

  useEffect(() => {
    const paid = existingPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    setTotalPaid(paid);
    
    const servicePrice = appointmentDetails?.service_price || appointment.service_price || 0;
    const remainingAmount = Math.max(0, servicePrice - paid);
    setRemaining(remainingAmount);
    
    if (remainingAmount > 0) {
      setPaymentInfo(prev => ({
        ...prev,
        amount: remainingAmount,
      }));
    }
  }, [existingPayments, appointment.service_price, appointmentDetails]);

  const loadAppointmentDetails = async () => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/appointments/${appointment.id}`);
      // Handle response structure: response.data.data or response.data
      const details = response.data?.data || response.data;
      if (!details) {
        throw new Error('Không nhận được thông tin lịch hẹn từ server');
      }
      setAppointmentDetails(details);
      
      // Update payment info with service price
      if (details.service_price) {
        setPaymentInfo(prev => ({
          ...prev,
          amount: details.service_price - totalPaid,
        }));
      }
    } catch (err: any) {
      console.error('Error loading appointment details:', err);
      error('Không thể tải thông tin lịch hẹn');
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await api.get(`/payments?appointmentId=${appointment.id}`);
      // Handle response structure: response.data.data or response.data
      const payments = response.data?.data || response.data || [];
      setExistingPayments(Array.isArray(payments) ? payments : []);
    } catch (err: any) {
      console.error('Error loading payment history:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentInfo.amount <= 0) {
      error('Số tiền phải lớn hơn 0');
      return;
    }

    if (paymentInfo.amount > remaining) {
      error(`Số tiền không được vượt quá số tiền còn lại: ${remaining.toLocaleString('vi-VN')} VNĐ`);
      return;
    }

    setLoading(true);
    try {
      // For online payment (PayOS), create link and redirect
      if (paymentInfo.paymentMethod === 'online') {
        try {
          const payOSResponse = await paymentService.createPayOSLink(
            appointment.id,
            paymentInfo.amount,
            `Thanh toán lịch hẹn #${appointment.id} - ${appointment.service_name || 'Dịch vụ'}`
          );
          
          if (payOSResponse.success && payOSResponse.data.payUrl) {
            success('Đang chuyển đến cổng thanh toán PayOS...');
            // Redirect to PayOS
            window.location.href = payOSResponse.data.payUrl;
            return; // Don't close modal yet, let PayOS handle redirect
          } else {
            throw new Error('Không thể tạo link thanh toán PayOS');
          }
        } catch (payOSError: any) {
          console.error('PayOS error:', payOSError);
          const errorMsg = payOSError.response?.data?.message || payOSError.message || 'Không thể tạo link thanh toán PayOS';
          error(errorMsg);
          throw payOSError; // Re-throw to prevent closing modal
        }
      }

      // For other payment methods, create payment normally
      const createResponse = await api.post('/payments', {
        appointmentId: appointment.id,
        amount: paymentInfo.amount,
        paymentMethod: paymentInfo.paymentMethod,
        notes: paymentInfo.notes || undefined,
      });

      // Handle response structure: response.data.data or response.data
      const paymentData = createResponse.data?.data || createResponse.data;
      if (!paymentData || !paymentData.id) {
        throw new Error('Không nhận được thông tin thanh toán từ server');
      }
      const paymentId = paymentData.id;

      // For cash payments, automatically confirm
      if (paymentInfo.paymentMethod === 'cash') {
        await api.put(`/payments/${paymentId}/confirm`, {
          transactionId: `CASH-${Date.now()}`,
        });
        success('Thanh toán tiền mặt đã được xác nhận thành công!');
        onSuccess();
        onClose();
      } else if (paymentInfo.paymentMethod === 'credit') {
        // For credit card, might need manual confirmation
        success('Đã tạo thanh toán thành công. Vui lòng xác nhận sau khi nhận được thanh toán.');
        onSuccess();
        onClose();
      } else if (paymentInfo.paymentMethod === 'bank_transfer') {
        success('Đã tạo thanh toán chuyển khoản. Vui lòng xác nhận sau khi nhận được thanh toán.');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Không thể tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    // Print receipt functionality - simple and professional design
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const servicePrice = appointmentDetails?.service_price || appointment.service_price || 0;
      const paidPayments = existingPayments.filter(p => p.status === 'paid');
      const paymentMethodNames: Record<string, string> = {
        'cash': 'Tiền mặt',
        'credit': 'Thẻ tín dụng',
        'bank_transfer': 'Chuyển khoản',
        'online': 'Online (PayOS)'
      };

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Hóa đơn thanh toán - #${appointment.id}</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 15mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Times New Roman', Times, serif;
                padding: 20px;
                color: #000;
                line-height: 1.5;
              }
              
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border: 2px solid #000;
                padding: 30px;
              }
              
              /* Header */
              .invoice-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 25px;
              }
              
              .invoice-header h1 {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .invoice-header .clinic-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              
              .invoice-header .clinic-info {
                font-size: 14px;
                margin-top: 8px;
              }
              
              /* Info Section */
              .info-section {
                margin-bottom: 25px;
              }
              
              .info-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                margin-bottom: 20px;
              }
              
              .info-table td {
                padding: 10px 15px;
                border: 1px solid #000;
                font-size: 14px;
              }
              
              .info-table td:first-child {
                width: 30%;
                background: #f5f5f5;
                font-weight: bold;
              }
              
              .info-table td:last-child {
                width: 70%;
              }
              
              /* Payment Table */
              .payment-table {
                width: 100%;
                border-collapse: collapse;
                border: 2px solid #000;
                margin: 25px 0;
              }
              
              .payment-table th {
                padding: 12px 15px;
                border: 1px solid #000;
                background: #f5f5f5;
                font-weight: bold;
                text-align: left;
                font-size: 14px;
              }
              
              .payment-table th:last-child {
                text-align: right;
              }
              
              .payment-table td {
                padding: 12px 15px;
                border: 1px solid #000;
                font-size: 14px;
              }
              
              .payment-table td:last-child {
                text-align: right;
                font-weight: bold;
              }
              
              .payment-table tbody tr:last-child {
                background: #f5f5f5;
                font-weight: bold;
              }
              
              .payment-table tbody tr:last-child td {
                font-size: 16px;
              }
              
              /* Summary Box */
              .summary-box {
                border: 2px solid #000;
                padding: 15px;
                margin-top: 20px;
                background: #fafafa;
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #ddd;
                font-size: 14px;
              }
              
              .summary-row:last-child {
                border-bottom: none;
                border-top: 2px solid #000;
                margin-top: 10px;
                padding-top: 12px;
                font-weight: bold;
                font-size: 16px;
              }
              
              /* Footer */
              .invoice-footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #000;
                text-align: center;
              }
              
              .footer-thanks {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              
              .footer-date {
                font-size: 14px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <!-- Header -->
              <div class="invoice-header">
                <h1>HÓA ĐƠN THANH TOÁN</h1>
                <div class="clinic-name">Phòng khám Happy Care</div>
              </div>
              
              <!-- Appointment Info -->
              <div class="info-section">
                <table class="info-table">
                  <tr>
                    <td>Mã lịch hẹn:</td>
                    <td>#${appointment.id}</td>
                  </tr>
                  <tr>
                    <td>Ngày khám:</td>
                    <td>${appointmentDetails?.appointmentDate || appointment.appointmentDate ? format(new Date(appointmentDetails?.appointmentDate || appointment.appointmentDate), 'dd/MM/yyyy') : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Bệnh nhân:</td>
                    <td>${appointment.patient_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Số điện thoại:</td>
                    <td>${appointment.patient_phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Bác sĩ:</td>
                    <td>${appointment.doctor_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Dịch vụ:</td>
                    <td>${appointmentDetails?.service_name || appointment.service_name || 'N/A'}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Payment Details Table -->
              <table class="payment-table">
                <thead>
                  <tr>
                    <th>Mô tả</th>
                    <th>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${appointmentDetails?.service_name || appointment.service_name || 'Dịch vụ khám'}</strong></td>
                    <td>${servicePrice.toLocaleString('vi-VN')} VNĐ</td>
                  </tr>
                  ${paidPayments.map(p => `
                    <tr>
                      <td>Đã thanh toán (${paymentMethodNames[p.paymentMethod] || p.paymentMethod})</td>
                      <td>-${p.amount.toLocaleString('vi-VN')} VNĐ</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td><strong>${remaining === 0 ? 'Đã thanh toán đầy đủ' : 'Còn lại'}</strong></td>
                    <td><strong>${remaining === 0 ? '0' : remaining.toLocaleString('vi-VN')} VNĐ</strong></td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Summary -->
              <div class="summary-box">
                <div class="summary-row">
                  <span>Tổng tiền dịch vụ:</span>
                  <span>${servicePrice.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                ${totalPaid > 0 ? `
                  <div class="summary-row">
                    <span>Đã thanh toán:</span>
                    <span>-${totalPaid.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                ` : ''}
                <div class="summary-row">
                  <span>Còn lại:</span>
                  <span>${remaining === 0 ? '0' : remaining.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="invoice-footer">
                <div class="footer-thanks">Cảm ơn quý khách!</div>
                <div class="footer-date">Ngày in: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 rounded-lg p-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-dark">Thanh toán</h3>
                  <p className="text-sm text-neutral-medium">Lịch hẹn #{appointment.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-medium hover:text-neutral-dark"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Appointment Info */}
            {loadingDetails ? (
              <div className="card mb-6 bg-neutral-light p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <div className="card mb-6 bg-neutral-light">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-medium mb-1">Bệnh nhân</p>
                    <p className="font-semibold text-neutral-dark">
                      {appointmentDetails?.patient_name || appointment.patient_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-medium mb-1">Số điện thoại</p>
                    <p className="font-semibold text-neutral-dark">
                      {appointmentDetails?.patient_phone || appointment.patient_phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-medium mb-1">Bác sĩ</p>
                    <p className="font-semibold text-neutral-dark">
                      {appointmentDetails?.doctor_name || appointment.doctor_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-medium mb-1">Dịch vụ</p>
                    <p className="font-semibold text-neutral-dark">
                      {appointmentDetails?.service_name || appointment.service_name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="mb-6">
              <h4 className="font-semibold text-neutral-dark mb-3">Tóm tắt thanh toán</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-medium">Tổng tiền dịch vụ:</span>
                  <span className="font-semibold text-neutral-dark">
                    {(appointmentDetails?.service_price || appointment.service_price || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-medium">Đã thanh toán:</span>
                    <span className="font-semibold text-status-success">
                      -{totalPaid.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base pt-2 border-t border-neutral-border">
                  <span className="font-semibold text-neutral-dark">Còn lại:</span>
                  <span className="font-bold text-primary-600 text-lg">
                    {remaining.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {existingPayments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-neutral-dark mb-3">Lịch sử thanh toán</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {existingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-2 bg-neutral-light rounded text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {payment.paymentMethod === 'cash' ? 'Tiền mặt' :
                           payment.paymentMethod === 'credit' ? 'Thẻ tín dụng' :
                           payment.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Online'}
                        </span>
                        <span className={`badge badge-${payment.status === 'paid' ? 'success' : 'warning'} ml-2`}>
                          {payment.status === 'paid' ? 'Đã thanh toán' : 'Chờ xác nhận'}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {payment.amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="form-label">Số tiền thanh toán (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    max={remaining}
                    step="1000"
                    value={paymentInfo.amount}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      amount: parseFloat(e.target.value) || 0,
                    })}
                    className="form-input"
                    required
                    disabled={remaining === 0}
                  />
                  {remaining > 0 && (
                    <p className="form-help">
                      Số tiền tối đa: {remaining.toLocaleString('vi-VN')} VNĐ
                    </p>
                  )}
                  {remaining === 0 && (
                    <p className="form-help text-status-success">
                      Lịch hẹn này đã được thanh toán đầy đủ
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="form-label">Phương thức thanh toán</label>
                  <select
                    value={paymentInfo.paymentMethod}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      paymentMethod: e.target.value as any,
                    })}
                    className="form-input"
                    required
                    disabled={remaining === 0}
                  >
                    <option value="cash">💵 Tiền mặt</option>
                    <option value="credit">💳 Thẻ tín dụng</option>
                    <option value="bank_transfer">🏦 Chuyển khoản</option>
                    <option value="online">🌐 Online (PayOS) - Tự động redirect</option>
                  </select>
                  {paymentInfo.paymentMethod === 'online' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 flex items-center gap-2">
                        <ArrowRightIcon className="w-4 h-4" />
                        <strong>Lưu ý:</strong> Khi chọn PayOS, hệ thống sẽ tự động chuyển đến cổng thanh toán PayOS để bệnh nhân thanh toán.
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="form-label">Ghi chú (tùy chọn)</label>
                  <textarea
                    value={paymentInfo.notes}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      notes: e.target.value,
                    })}
                    className="form-input"
                    rows={3}
                    placeholder="Ghi chú về thanh toán..."
                    disabled={remaining === 0}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="btn btn-outline flex-1"
                  disabled={appointment.service_price === 0}
                >
                  <PrinterIcon className="w-5 h-5" />
                  In hóa đơn
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading || remaining === 0 || paymentInfo.amount <= 0}
                >
                  {loading ? (
                    'Đang xử lý...'
                  ) : paymentInfo.paymentMethod === 'online' ? (
                    <>
                      <ArrowRightIcon className="w-5 h-5" />
                      Thanh toán PayOS
                    </>
                  ) : (
                    'Xác nhận thanh toán'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

