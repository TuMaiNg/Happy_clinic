import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctor.service';
import { serviceService } from '../services/service.service';
import { timeslotService } from '../services/timeslot.service';
import { appointmentService } from '../services/appointment.service';
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

      await appointmentService.create({
        doctorId: selectedDoctor,
        serviceId: selectedService,
        slotId: selectedSlot,
        appointmentDate: appointmentDateTime,
        visitType,
        symptoms: symptoms || undefined,
      });

      navigate('/appointments', { state: { message: 'Đặt lịch hẹn thành công!' } });
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
        </div>
      </div>
    </div>
  );
};

