import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { timeslotService } from '../../../services/timeslot.service';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Appointment } from '../../../services/appointment.service';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onConfirm: (slotId: number, appointmentDate: string, reason?: string) => Promise<void>;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDate || !appointment.doctorId) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      setError('');
      const response = await timeslotService.getAvailable({
        doctorId: appointment.doctorId,
        date: selectedDate,
        serviceId: appointment.serviceId,
      });
      setAvailableSlots(response.data || []);
    } catch (err: any) {
      console.error('Error loading slots:', err);
      setError('Không thể tải khung giờ trống. Vui lòng thử lại.');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, appointment.doctorId, appointment.serviceId]);

  useEffect(() => {
    if (isOpen && selectedDate) {
      loadAvailableSlots();
    }
  }, [isOpen, selectedDate, loadAvailableSlots]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Vui lòng chọn ngày và giờ mới');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const [hours, minutes] = selectedSlot.startTime.split(':');
      const appointmentDateTime = `${selectedDate}T${hours}:${minutes}:00`;
      
      await onConfirm(selectedSlot.id, appointmentDateTime, reason || undefined);
      
      // Reset form
      setSelectedDate('');
      setSelectedSlot(null);
      setReason('');
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Đổi lịch thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedSlot(null);
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Đổi lịch hẹn"
      size="lg"
    >
      <div className="space-y-6">
        {/* Current Appointment Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Lịch hẹn hiện tại</h3>
          <p className="text-sm text-blue-800">
            Ngày: <strong>{format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', { locale: vi })}</strong>
          </p>
          <p className="text-sm text-blue-800">
            Giờ: <strong>{appointment.startTime?.substring(0, 5) || appointment.startTime}</strong>
          </p>
          <p className="text-sm text-blue-800">
            Bác sĩ: <strong>{appointment.doctor_name}</strong>
          </p>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-semibold text-neutral-dark mb-2">
            Chọn ngày mới
          </label>
          <div className="relative">
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
                setError('');
              }}
              className="w-full px-4 py-3 text-lg border-2 border-neutral-border rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all bg-white"
            />
            <CalendarIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-neutral-medium pointer-events-none" />
          </div>
          {selectedDate && (
            <p className="mt-2 text-sm text-primary-600 font-medium">
              {format(new Date(selectedDate), 'EEEE, dd MMMM yyyy', { locale: vi })}
            </p>
          )}
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-semibold text-neutral-dark mb-2">
              Chọn giờ mới
            </label>
            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-yellow-50 rounded-xl p-4 text-center border-2 border-yellow-200">
                <p className="text-yellow-800 font-medium">Không có khung giờ trống cho ngày này</p>
                <p className="text-yellow-600 text-sm mt-1">Vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableSlots.map((slot) => {
                  const remaining = slot.capacity - slot.patientCount;
                  const isSelected = selectedSlot?.id === slot.id;
                  const isFull = remaining === 0;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        if (!isFull) {
                          setSelectedSlot(slot);
                          setError('');
                        }
                      }}
                      disabled={isFull}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : isFull
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-neutral-border hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
                      }`}
                    >
                      <div className="font-semibold text-lg">
                        {slot.startTime?.substring(0, 5) || slot.startTime}
                      </div>
                      {!isFull && (
                        <div className="text-xs text-neutral-medium mt-1">
                          Còn {remaining} chỗ
                        </div>
                      )}
                      {isFull && (
                        <div className="text-xs text-gray-500 mt-1">Đã hết chỗ</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-neutral-dark mb-2">
            Lý do đổi lịch (tùy chọn)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do đổi lịch (nếu có)..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading || !selectedDate || !selectedSlot}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận đổi lịch'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};


