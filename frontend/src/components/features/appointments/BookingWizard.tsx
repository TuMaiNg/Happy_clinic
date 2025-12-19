import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../../../services/doctor.service';
import { serviceService } from '../../../services/service.service';
import { timeslotService } from '../../../services/timeslot.service';
import { appointmentService } from '../../../services/appointment.service';
import { paymentService } from '../../../services/payment.service';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

import { Modal } from '../../common/Modal';
import { CheckCircleIcon, UserIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { SkeletonDoctorCard, SkeletonTimeSlot } from '../../common/Skeleton';
import { useDebounce } from '../../../hooks/useDebounce';

interface BookingWizardProps {
  onComplete?: () => void;
}

const steps = [
  { id: 1, name: 'Chọn bác sĩ', icon: UserIcon },
  { id: 2, name: 'Chọn dịch vụ', icon: CheckCircleIcon },
  { id: 3, name: 'Chọn ngày giờ', icon: CalendarIcon },
  { id: 4, name: 'Xác nhận', icon: ClockIcon },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'first-visit' | 'follow-up'>('first-visit');
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [creatingPayLink, setCreatingPayLink] = useState(false);

  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('');

  // Debounce specialty filter to avoid too many API calls
  const debouncedSpecialtyFilter = useDebounce(specialtyFilter, 300);

  const loadDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      const response = await doctorService.getAll({
        speciality: debouncedSpecialtyFilter || undefined,
      });
      setDoctors(response.data);
    } catch (err: any) {
      setError('Không thể tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(false);
    }
  }, [debouncedSpecialtyFilter]);

  const loadServices = useCallback(async (speciality?: string) => {
    try {
      const response = await serviceService.getAll({ 
        isActive: true,
        speciality: speciality || undefined
      });
      setServices(response.data);
    } catch (err: any) {
      setError('Không thể tải danh sách dịch vụ');
    } finally {

    }
  }, []);

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      setError('');
      const response = await timeslotService.getAvailable({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        serviceId: selectedService?.id,
      });
      setAvailableSlots(response.data || []);
    } catch (err: any) {
      console.error('Error loading slots:', err);
      setError('Không thể tải khung giờ trống. Vui lòng thử lại.');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctor, selectedDate, selectedService]);

  useEffect(() => {
    loadDoctors();
    // Load tất cả services ban đầu (chưa chọn doctor)
    loadServices();
  }, [loadDoctors, loadServices]);

  // Khi chọn doctor, reload services theo specialty của doctor đó
  useEffect(() => {
    if (selectedDoctor?.speciality) {
      loadServices(selectedDoctor.speciality);
      // Reset selectedService khi chọn doctor mới (vì services đã thay đổi)
      setSelectedService(null);
    }
  }, [selectedDoctor?.speciality, loadServices]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, selectedDate, selectedService, loadAvailableSlots]);

  // Tự động chọn slot đầu tiên có sẵn khi load xong (giúp người già không cần click)
  useEffect(() => {
    if (availableSlots.length > 0 && !selectedSlot && selectedDate) {
      // Tìm slot đầu tiên còn chỗ (không đầy)
      const firstAvailableSlot = availableSlots.find(
        slot => slot.capacity - slot.patientCount > 0
      );
      if (firstAvailableSlot) {
        setSelectedSlot(firstAvailableSlot);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSlots.length, selectedDate]); // Chỉ chạy khi số lượng slots hoặc selectedDate thay đổi

  const handleNext = () => {
    if (currentStep === 1 && !selectedDoctor) {
      setError('Vui lòng chọn bác sĩ');
      return;
    }
    if (currentStep === 2 && !selectedService) {
      setError('Vui lòng chọn dịch vụ');
      return;
    }
    if (currentStep === 3 && (!selectedDate || !selectedSlot)) {
      setError('Vui lòng chọn ngày và giờ');
      return;
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
    setLoading(false); // Đảm bảo loading state được reset khi quay lại
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!selectedSlot || !selectedDate) {
        setError('Vui lòng chọn ngày và giờ');
        setLoading(false);
        return;
      }

      // Nếu đã có appointmentId (đã tạo appointment trước đó), chỉ cần mở payment dialog
      if (appointmentId) {
        setLoading(false);
        setShowPaymentDialog(true);
        return;
      }

      const [hours, minutes] = selectedSlot.startTime.split(':');
      const appointmentDateTime = `${selectedDate}T${hours}:${minutes}:00`;

      const response = await appointmentService.create({
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        slotId: selectedSlot.id,
        appointmentDate: appointmentDateTime,
        visitType,
        symptoms: symptoms || undefined,
      });

      setAppointmentId(response.data.id);
      setShowPaymentDialog(true);

      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Đặt lịch hẹn thất bại. Vui lòng thử lại.';
      setError(errorMessage);

      // If slot is full, reload available slots
      if (errorMessage.includes('hết chỗ') || errorMessage.includes('đã hết')) {
        await loadAvailableSlots();
      }
    } finally {
      setLoading(false);
    }
  };

  const minDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const maxDate = useMemo(() => format(addDays(new Date(), 30), 'yyyy-MM-dd'), []);

  const filteredDoctors = useMemo(() => {
    if (!debouncedSpecialtyFilter) return doctors;
    return doctors.filter(d => d.speciality === debouncedSpecialtyFilter);
  }, [doctors, debouncedSpecialtyFilter]);

  const doctorSpecialties = useMemo(() => {
    return Array.from(new Set(doctors.map(d => d.speciality).filter(Boolean)));
  }, [doctors]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-dark mb-4">
            Đặt lịch khám dễ dàng
          </h1>
          <p className="text-lg text-neutral-medium">
            Chọn bác sĩ và thời gian phù hợp với bạn
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-secondary-500 text-white'
                          : isActive
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-light text-neutral-medium'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        isActive ? 'text-primary-500' : 'text-neutral-medium'
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-secondary-500' : 'bg-neutral-border'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-status-error/10 border border-status-error rounded-lg p-4">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Doctor */}
          {currentStep === 1 && (
            <div>
              {/* Filter Bar */}
              <div className="mb-6 flex flex-wrap gap-4">
                <select
                  value={specialtyFilter}
                  onChange={(e) => {
                    setSpecialtyFilter(e.target.value);
                  }}
                  className="input-field max-w-xs"
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {doctorSpecialties.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Grid */}
              {loadingDoctors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonDoctorCard key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
                    <Card
                      key={doctor.id}
                      hover
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setCurrentStep(2);
                      }}
                      className={`${
                        selectedDoctor?.id === doctor.id
                          ? 'ring-2 ring-primary-500 border-primary-500'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4 border-4 border-primary-100">
                          {doctor.avatar ? (
                            <img
                              src={doctor.avatar}
                              alt={doctor.fullName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-10 h-10 text-primary-500" />
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-dark mb-1">
                          {doctor.fullName}
                        </h3>
                        <p className="text-sm text-primary-500 font-medium mb-2">
                          {doctor.speciality}
                        </p>
                        <div className="flex items-center text-xs text-neutral-medium mb-4">
                          <span className="flex items-center mr-3">
                            ⭐ 4.8
                          </span>
                          <span>{doctor.experienceYears || 0} năm KN</span>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoctor(doctor);
                            setCurrentStep(2);
                          }}
                        >
                          Chọn bác sĩ →
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Service */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Chọn dịch vụ</h2>
              {selectedDoctor && (
                <p className="text-sm text-neutral-medium mb-4">
                  Dịch vụ cho chuyên khoa: <span className="font-semibold text-primary-600">{selectedDoctor.speciality}</span>
                </p>
              )}
              {services.length === 0 ? (
                <div className="bg-yellow-50 rounded-xl p-8 text-center border-2 border-yellow-200">
                  <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-yellow-800 font-medium text-lg mb-2">
                    Không có dịch vụ nào cho chuyên khoa này
                  </p>
                  <p className="text-yellow-600 text-sm mb-4">
                    Vui lòng chọn bác sĩ khác hoặc liên hệ quản trị viên để thêm dịch vụ
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCurrentStep(1);
                      setSelectedDoctor(null);
                    }}
                  >
                    Quay lại chọn bác sĩ
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                  <Card
                    key={service.id}
                    hover
                    onClick={() => setSelectedService(service)}
                    className={`cursor-pointer ${
                      selectedService?.id === service.id
                        ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50'
                        : 'bg-neutral-light'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          checked={selectedService?.id === service.id}
                          onChange={() => setSelectedService(service)}
                          className="w-5 h-5 text-primary-500"
                        />
                        <div>
                          <h3 className="font-semibold text-neutral-dark">
                            {service.name}
                          </h3>
                          <p className="text-sm text-neutral-medium">
                            {service.durationMinutes || service.duration} phút · {service.description || service.speciality || ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-primary-500">
                        {service.price.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {currentStep === 3 && (
            <Card className="p-6">
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-lg font-semibold text-neutral-dark mb-3">
                    Chọn ngày
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

                {/* Time Slots Selection */}
                <div>
                  <label className="block text-lg font-semibold text-neutral-dark mb-3">
                    Chọn giờ
                  </label>

                  {!selectedDate ? (
                    <div className="bg-neutral-light rounded-xl p-12 text-center border-2 border-dashed border-neutral-border">
                      <ClockIcon className="w-16 h-16 text-neutral-medium mx-auto mb-4 opacity-50" />
                      <p className="text-neutral-medium text-lg font-medium">
                        Vui lòng chọn ngày trước
                      </p>
                    </div>
                  ) : (
                    <>
                      {loadingSlots ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
                          {[...Array(8)].map((_, i) => (
                            <SkeletonTimeSlot key={i} />
                          ))}
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="bg-yellow-50 rounded-xl p-12 text-center border-2 border-yellow-200">
                          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-yellow-800 font-medium text-lg mb-2">
                            Không có khung giờ trống cho ngày này
                          </p>
                          <p className="text-yellow-600 text-sm">
                            Vui lòng chọn ngày khác hoặc bác sĩ khác
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
                          {availableSlots.map((slot) => {
                            const remaining = slot.capacity - slot.patientCount;
                            const isSelected = selectedSlot?.id === slot.id;
                            const isFull = remaining === 0;
                            const isLowCapacity = remaining > 0 && remaining <= slot.capacity * 0.3;

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
                                className={`
                                  p-5 rounded-xl border-3 transition-all duration-200 flex flex-col items-center justify-center min-h-[120px] text-lg
                                  ${isSelected
                                    ? 'bg-primary-500 text-white border-primary-600 shadow-xl transform scale-105 ring-4 ring-primary-200 font-semibold'
                                    : isFull
                                    ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed opacity-60'
                                    : isLowCapacity
                                    ? 'bg-yellow-50 text-yellow-800 border-yellow-400 hover:border-yellow-600 hover:shadow-lg hover:scale-105 border-3'
                                    : 'bg-white text-neutral-dark border-neutral-border hover:border-primary-500 hover:shadow-lg hover:scale-105 active:scale-100 border-2'
                                  }
                                `}
                              >
                                <div className={`text-2xl font-bold mb-2 ${isSelected ? 'text-white' : isLowCapacity ? 'text-yellow-800' : 'text-primary-600'}`}>
                                  {slot.startTime.substring(0, 5)}
                                </div>
                                <div className={`text-sm font-medium ${isSelected ? 'text-white opacity-90' : isLowCapacity ? 'text-yellow-700' : 'text-neutral-medium'}`}>
                                  {!isFull ? (
                                    <>
                                      <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                                      Còn {remaining}/{slot.capacity} chỗ
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                                      Đã đầy
                                    </>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedSlot && (
                        <div className="mt-4 p-4 bg-primary-50 border-l-4 border-primary-500 rounded-lg">
                          <p className="text-sm text-neutral-dark">
                            <span className="font-semibold">Khung giờ đã chọn:</span>{' '}
                            <span className="text-primary-700 font-bold text-lg">
                              {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}
                            </span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Details & Confirmation */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="label">Triệu chứng / Lý do khám (không bắt buộc)</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                    className="input-field"
                    placeholder="Mô tả triệu chứng hoặc lý do khám..."
                  />
                </div>

                <div>
                  <label className="label mb-4">Loại khám</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="first-visit"
                        checked={visitType === 'first-visit'}
                        onChange={(e) => setVisitType(e.target.value as 'first-visit' | 'follow-up')}
                        className="w-5 h-5 text-primary-500"
                      />
                      <span>Khám lần đầu</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="follow-up"
                        checked={visitType === 'follow-up'}
                        onChange={(e) => setVisitType(e.target.value as 'first-visit' | 'follow-up')}
                        className="w-5 h-5 text-primary-500"
                      />
                      <span>Tái khám</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="lg:col-span-1">
                <Card className="bg-warm-50 border-l-4 border-l-secondary-500 sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-secondary-500" />
                    <h3 className="text-lg font-semibold">Tóm tắt đặt lịch</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-neutral-medium mb-1">Bác sĩ</p>
                      <div className="flex items-center gap-2">
                        {selectedDoctor?.avatar && (
                          <img
                            src={selectedDoctor.avatar}
                            alt={selectedDoctor.fullName}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <p className="font-medium">{selectedDoctor?.fullName}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-medium mb-1">Dịch vụ</p>
                      <p className="font-medium">{selectedService?.name}</p>
                      <p className="text-sm text-neutral-medium">
                        {selectedService?.price.toLocaleString('vi-VN')}₫
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-medium mb-1">Ngày & Giờ</p>
                      <p className="font-semibold text-lg text-secondary-500">
                        {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy')}
                      </p>
                      {selectedSlot && (
                        <p className="font-semibold text-lg text-secondary-500">
                          {selectedSlot.startTime?.substring(0, 5) || selectedSlot.startTime} - {selectedSlot.endTime?.substring(0, 5) || selectedSlot.endTime}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-neutral-border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Tổng cộng</span>
                        <span className="text-2xl font-bold text-secondary-500">
                          {selectedService?.price.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={handleSubmit}
                      isLoading={loading}
                      disabled={loading}
                    >
                      {appointmentId ? 'Tiếp tục thanh toán' : 'Xác nhận đặt lịch'}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              ← Quay lại
            </Button>
            {currentStep < 4 && (
              <Button variant="primary" onClick={handleNext}>
                Tiếp theo →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Dialog Modal */}
      <Modal
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        title="Chọn hình thức thanh toán"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-neutral-medium">
            Số tiền dự kiến: <span className="font-semibold">{selectedService?.price?.toLocaleString('vi-VN')}₫</span>
          </p>
          <p className="text-sm text-neutral-medium">
            Lịch hẹn đã được tạo thành công. Bạn có thể thanh toán ngay hoặc thanh toán sau.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="primary"
              onClick={async () => {
                if (!appointmentId || !selectedService?.price) return;
                try {
                  setCreatingPayLink(true);
                  const res = await paymentService.createPayOSLink(
                    appointmentId,
                    selectedService.price,
                    `Thanh toán lịch hẹn #${appointmentId}`
                  );
                  try { sessionStorage.setItem('payos_order_code', res.data.orderCode); } catch {}
                  window.location.href = res.data.payUrl;
                } catch (err: any) {
                  setError(err?.response?.data?.message || err?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
                  setShowPaymentDialog(false);
                } finally {
                  setCreatingPayLink(false);
                }
              }}
              isLoading={creatingPayLink}
            >
              Thanh toán ngay (PayOS/QR Code)
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setShowSuccessModal(true);
              }}
            >
              Thanh toán sau khi điều trị
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                // Quay lại trang xác nhận (step 4) để user có thể xem lại thông tin
                // Không reset appointmentId để tránh tạo duplicate
                setCurrentStep(4);
                setError(''); // Clear any errors
                setLoading(false); // Đảm bảo loading state được reset
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại xem thông tin lịch hẹn
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/appointments');
        }}
        size="md"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-10 h-10 text-secondary-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-dark mb-2">
            Đặt lịch thành công!
          </h3>
          <p className="text-neutral-medium mb-4">
            Mã lịch hẹn: <span className="font-mono font-semibold text-primary-500">#{appointmentId}</span>
          </p>
          <div className="bg-neutral-light rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-neutral-medium mb-1">Bác sĩ: {selectedDoctor?.fullName}</p>
            <p className="text-sm text-neutral-medium mb-1">
              Ngày: {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy')}
            </p>
            <p className="text-sm text-neutral-medium">
              Giờ: {selectedSlot?.startTime?.substring(0, 5) || selectedSlot?.startTime} - {selectedSlot?.endTime?.substring(0, 5) || selectedSlot?.endTime}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/book-appointment');
              }}
            >
              Đặt lịch khác
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/appointments');
              }}
            >
              Xem lịch hẹn
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

