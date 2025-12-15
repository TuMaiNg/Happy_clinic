import React from 'react';
import { format, isPast } from 'date-fns';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { 
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AppointmentCardProps {
  appointment: any;
  onViewDetails?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  onCheckIn?: () => void;
}

const statusConfig: { [key: string]: { color: string; text: string; icon: any } } = {
  pending: {
    color: 'bg-status-warning text-white',
    text: 'Chờ xác nhận',
    icon: ClockIcon,
  },
  confirmed: {
    color: 'bg-status-success text-white',
    text: 'Đã xác nhận',
    icon: CheckCircleIcon,
  },
  'checked-in': {
    color: 'bg-primary-500 text-white',
    text: 'Đã check-in',
    icon: CheckCircleIcon,
  },
  completed: {
    color: 'bg-status-info text-white',
    text: 'Hoàn thành',
    icon: CheckCircleIcon,
  },
  cancelled: {
    color: 'bg-status-error text-white',
    text: 'Đã hủy',
    icon: XMarkIcon,
  },
  'no-show': {
    color: 'bg-neutral-medium text-white',
    text: 'Không đến',
    icon: XMarkIcon,
  },
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewDetails,
  onCancel,
  onReschedule,
  onCheckIn,
}) => {
  const status = statusConfig[appointment.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  // Kiểm tra xem lịch hẹn đã qua chưa
  const appointmentDate = new Date(appointment.appointmentDate);
  const isAppointmentPast = isPast(appointmentDate);
  
  // Chỉ hiện nút hủy nếu lịch chưa qua và status cho phép
  const canCancel = !isAppointmentPast && 
    (appointment.status === 'pending' || appointment.status === 'confirmed');

  return (
    <Card className="hover:shadow-medium transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
              <StatusIcon className="w-4 h-4" />
              {status.text}
            </span>
            <span className="text-sm text-neutral-medium">
              {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>

          {/* Doctor Info */}
          <h3 className="text-lg font-semibold text-neutral-dark mb-2">
            {(appointment as any).doctor_name || 'Bác sĩ'}
          </h3>

          {/* Service Info */}
          <p className="text-sm text-neutral-medium mb-1">
            Dịch vụ: {(appointment as any).service_name || 'N/A'}
          </p>

          {/* Symptoms */}
          {appointment.symptoms && (
            <p className="text-sm text-neutral-medium mt-2">
              <span className="font-medium">Triệu chứng:</span> {appointment.symptoms}
            </p>
          )}

          {/* Cancellation Fee Warning */}
          {appointment.cancellationFee && appointment.cancellationFee > 0 && (
            <div className="mt-3 p-2 bg-status-warning/10 border border-status-warning rounded-lg">
              <p className="text-xs text-status-warning">
                ⚠️ Phí hủy: {appointment.cancellationFee.toLocaleString('vi-VN')}₫
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          {appointment.status === 'confirmed' && onCheckIn && !isAppointmentPast && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCheckIn}
            >
              Check-in
            </Button>
          )}
          {canCancel && (
            <>
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-status-error border-status-error hover:bg-status-error/10"
                >
                  Hủy
                </Button>
              )}
              {onReschedule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReschedule}
                >
                  Đổi lịch
                </Button>
              )}
            </>
          )}
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
            >
              Chi tiết
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

