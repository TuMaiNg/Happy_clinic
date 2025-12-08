import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../config/api';

interface OTPVerificationProps {
  appointmentId: number;
  phone: string;
  onSuccess?: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  appointmentId,
  phone,
  onSuccess,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/appointments/${appointmentId}/verify-otp`, {
        otp: code,
      });

      if (response.data.verified) {
        // Success!
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/appointments`);
        }
      } else {
        setError(response.data.error || 'Mã không đúng');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setError(errorMsg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/appointments/${appointmentId}/resend-otp`);

      if (response.data.success) {
        setTimeLeft(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Show success message
        alert('✅ Mã mới đã được gửi đến số điện thoại của bạn');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Không thể gửi lại mã';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-neutral-dark mb-2">
          Xác nhận số điện thoại
        </h2>
        <p className="text-center text-neutral-medium mb-8">
          Nhập mã 6 số đã được gửi đến
          <br />
          <span className="font-semibold text-neutral-dark">{phone}</span>
        </p>

        {/* OTP Input */}
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-neutral-border rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-neutral-light disabled:cursor-not-allowed transition-all"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-status-error/10 border border-status-error rounded-lg p-4 mb-4">
            <p className="text-sm text-status-error text-center font-medium">{error}</p>
          </div>
        )}

        {/* Timer */}
        <div className="text-center mb-6">
          {timeLeft > 0 ? (
            <p className="text-sm text-neutral-medium">
              Mã có hiệu lực trong{' '}
              <span className="font-bold text-primary-500">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <p className="text-sm text-status-error font-semibold">Mã đã hết hạn</p>
          )}
        </div>

        {/* Resend Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleResend}
            disabled={!canResend || loading}
            className={`text-sm font-semibold transition-colors ${
              canResend && !loading
                ? 'text-primary-500 hover:text-primary-600 hover:underline'
                : 'text-neutral-medium cursor-not-allowed'
            }`}
          >
            {canResend ? 'Gửi lại mã' : 'Chưa nhận được mã?'}
          </button>
        </div>

        {/* Manual Submit Button */}
        <button
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.some((d) => d === '') || loading}
          className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:bg-neutral-light disabled:text-neutral-medium disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Đang xác nhận...
            </div>
          ) : (
            'Xác nhận'
          )}
        </button>

        {/* Help Text */}
        <p className="text-xs text-center text-neutral-medium mt-4">
          Nếu không nhận được mã, vui lòng kiểm tra tin nhắn hoặc liên hệ{' '}
          <span className="text-primary-500 font-medium">028 3334 4444</span>
        </p>
      </div>
    </div>
  );
};
