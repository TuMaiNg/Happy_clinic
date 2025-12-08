import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onConfirm: (reason: string) => void;
  cancellationFee?: number;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
  cancellationFee = 0,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }

    onConfirm(reason);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hủy lịch hẹn"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning */}
        {cancellationFee > 0 && (
          <div className="bg-status-warning/10 border border-status-warning rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-status-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-status-warning mb-1">
                  Phí hủy lịch hẹn
                </p>
                <p className="text-sm text-neutral-dark">
                  Bạn hủy lịch hẹn trong vòng 24 giờ trước giờ khám. 
                  Phí hủy là <strong>{cancellationFee.toLocaleString('vi-VN')}₫</strong> 
                  (20% phí dịch vụ).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Info */}
        <div className="bg-neutral-light rounded-lg p-4">
          <p className="text-sm text-neutral-medium mb-1">Bác sĩ</p>
          <p className="font-medium">{(appointment as any)?.doctor_name || 'N/A'}</p>
          
          <p className="text-sm text-neutral-medium mb-1 mt-3">Ngày giờ</p>
          <p className="font-medium">
            {appointment?.appointmentDate 
              ? new Date(appointment.appointmentDate).toLocaleString('vi-VN')
              : 'N/A'}
          </p>
        </div>

        {/* Reason Input */}
        <div>
          <Input
            label="Lý do hủy lịch hẹn *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vui lòng nhập lý do hủy lịch hẹn..."
            error={error}
            as="textarea"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Không hủy
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-status-error hover:bg-status-error/90"
            onClick={handleConfirm}
          >
            Xác nhận hủy
          </Button>
        </div>
      </div>
    </Modal>
  );
};

