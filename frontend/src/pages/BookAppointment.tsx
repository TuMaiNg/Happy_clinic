import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctor.service';
import { serviceService } from '../services/service.service';
import { timeslotService } from '../services/timeslot.service';
import { appointmentService } from '../services/appointment.service';
import { paymentService } from '../services/payment.service';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'first-visit' | 'follow-up'>('first-visit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<{ id: number; amount: number } | null>(null);
  const [creatingPayLink, setCreatingPayLink] = useState(false);


  useEffect(() => {
    loadDoctors();
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, selectedDate, selectedService]);

  const loadDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      setDoctors(response.data);
    } catch (err: any) {
      setError('Không thể tải danh sách bác sĩ');
    }
  };

  const loadServices = async () => {
    try {
      const response = await serviceService.getAll({ isActive: true });
      setServices(response.data);
    } catch (err: any) {
      setError('Không thể tải danh sách dịch vụ');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    try {
      const response = await timeslotService.getAvailable({
        doctorId: selectedDoctor,
        date: selectedDate,
        serviceId: selectedService || undefined,
      });
      setAvailableSlots(response.data);
    } catch (err: any) {
      setError('Không thể tải khung giờ trống');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedDoctor || !selectedService || !selectedDate || !selectedSlot) {
      setError('Vui lòng điền đầy đủ thông tin');
      setLoading(false);
      return;
    }

    try {
      // Combine date and time slot
      const [hours, minutes] = availableSlots.find(s => s.id === selectedSlot)?.startTime.split(':') || ['09', '00'];
      const appointmentDateTime = `${selectedDate}T${hours}:${minutes}:00`;

      const createRes = await appointmentService.create({
        doctorId: selectedDoctor,
        serviceId: selectedService,
        slotId: selectedSlot,
        appointmentDate: appointmentDateTime,
        visitType,
        symptoms: symptoms || undefined,
      });

      // Lấy giá dịch vụ từ danh sách services hiện có
      const chosenService = services.find((s) => s.id === selectedService);
      const amount = chosenService?.price || 0;

      setCreatedAppointment({ id: createRes.data.id, amount });
      setPaymentDialogOpen(true);
      return;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt lịch hẹn thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Đặt lịch hẹn</h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn bác sĩ *
              </label>
              <select
                required
                value={selectedDoctor || ''}
                onChange={(e) => {
                  setSelectedDoctor(parseInt(e.target.value) || null);
                  setSelectedSlot(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName} - {doctor.speciality}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn dịch vụ *
              </label>
              <select
                required
                value={selectedService || ''}
                onChange={(e) => {
                  setSelectedService(parseInt(e.target.value) || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.price.toLocaleString('vi-VN')} VNĐ
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ngày *
              </label>
              <input
                type="date"
                required
                min={minDate}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Time Slot Selection */}
            {availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn khung giờ *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`px-4 py-2 rounded-md border ${
                        selectedSlot === slot.id
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Visit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại khám *
              </label>
              <select
                required
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as 'first-visit' | 'follow-up')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="first-visit">Khám lần đầu</option>
                <option value="follow-up">Tái khám</option>
              </select>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Triệu chứng / Lý do khám
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Mô tả triệu chứng hoặc lý do khám..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !selectedDoctor || !selectedService || !selectedDate || !selectedSlot}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Đặt lịch hẹn'}
              </button>
            </div>
          </form>

          {/* Payment Choice Dialog */}
          <Transition appear show={paymentDialogOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setPaymentDialogOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Chọn hình thức thanh toán
                      </Dialog.Title>
                      <div className="mt-2 text-sm text-gray-600">
                        {createdAppointment && (
                          <p>
                            Số tiền dự kiến: <span className="font-semibold">{createdAppointment.amount.toLocaleString('vi-VN')} VNĐ</span>
                          </p>
                        )}
                        <p className="mt-1">Bạn có thể thanh toán ngay hoặc thanh toán sau khi điều trị.</p>
                      </div>

                      <div className="mt-6 flex flex-col gap-3">
                        <button
                          type="button"
                          disabled={creatingPayLink}
                          onClick={async () => {
                            if (!createdAppointment) return;
                            try {
                              setCreatingPayLink(true);
                              const res = await paymentService.createPayOSLink(
                                createdAppointment.id,
                                createdAppointment.amount,
                                `Thanh toán lịch hẹn #${createdAppointment.id}`
                              );
                              // Lưu orderCode để trang success/cancel có thể dùng nếu gateway không trả orderCode trên URL
                              try { sessionStorage.setItem('payos_order_code', res.data.orderCode); } catch {}
                              // Redirect to PayOS checkout
                              window.location.href = res.data.payUrl;
                            } catch (err: any) {
                              setError(err.response?.data?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
                              setPaymentDialogOpen(false);
                            } finally {
                              setCreatingPayLink(false);
                            }
                          }}
                          className="w-full inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {creatingPayLink ? 'Đang tạo link thanh toán...' : 'Thanh toán ngay'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentDialogOpen(false);
                            navigate('/appointments', { state: { message: 'Đặt lịch thành công. Bạn có thể thanh toán sau khi điều trị.' } });
                          }}
                          className="w-full inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Thanh toán sau khi điều trị
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentDialogOpen(false)}
                          className="w-full inline-flex justify-center rounded-md px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                          Đóng
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>
    </div>
  );
};

