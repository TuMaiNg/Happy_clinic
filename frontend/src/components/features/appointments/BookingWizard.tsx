import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { doctorService } from '../../../services/doctor.service';
import { serviceService } from '../../../services/service.service';
import { timeslotService } from '../../../services/timeslot.service';
import { appointmentService } from '../../../services/appointment.service';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Modal } from '../../common/Modal';
import { Calendar } from '../../common/Calendar';
import { CheckCircleIcon, UserIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<'first-visit' | 'follow-up'>('first-visit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('');

  useEffect(() => {
    loadDoctors();
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctor, selectedDate, selectedService]);

  const loadDoctors = async () => {
    try {
      setError(''); // Clear previous errors
      const response = await doctorService.getAll({
        speciality: specialtyFilter || undefined,
      });
      
      if (response.success && Array.isArray(response.data)) {
        setDoctors(response.data);
      } else {
        setDoctors([]);
        setError('Không thể tải danh sách bác sĩ');
      }
    } catch (err: any) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
      setError('Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.');
    }
  };

  const loadServices = async () => {
    try {
      setError(''); // Clear previous errors
      const response = await serviceService.getAll({ isActive: true });
      
      if (response.success && Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        setServices([]);
        setError('Không thể tải danh sách dịch vụ');
      }
    } catch (err: any) {
      console.error('Error loading services:', err);
      setServices([]);
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setError(''); // Clear previous errors
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await timeslotService.getAvailable({
        doctorId: selectedDoctor.id,
        date: dateStr,
        serviceId: selectedService?.id,
      });
      
      if (response.success && Array.isArray(response.data)) {
        setAvailableSlots(response.data);
      } else {
        setAvailableSlots([]);
      }
    } catch (err: any) {
      console.error('Error loading available slots:', err);
      setAvailableSlots([]);
      // Don't set error here as it might be a temporary issue
      // Only show error if user tries to submit
    }
  };

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
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        setError('Bạn cần đăng nhập để đặt lịch hẹn');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Validate required fields
      if (!selectedDoctor) {
        setError('Vui lòng chọn bác sĩ');
        setLoading(false);
        return;
      }
      if (!selectedService) {
        setError('Vui lòng chọn dịch vụ');
        setLoading(false);
        return;
      }
      if (!selectedDate) {
        setError('Vui lòng chọn ngày');
        setLoading(false);
        return;
      }
      if (!selectedSlot) {
        setError('Vui lòng chọn khung giờ');
        setLoading(false);
        return;
      }

      // Validate slot is still available
      if (!selectedSlot.isAvailable || selectedSlot.patientCount >= selectedSlot.capacity) {
        setError('Khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác.');
        setLoading(false);
        // Reload available slots
        await loadAvailableSlots();
        return;
      }

      // Validate date is not in the past
      const now = new Date();
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      if (selectedDateTime < today) {
        setError('Không thể đặt lịch trong quá khứ. Vui lòng chọn ngày khác.');
        setLoading(false);
        return;
      }

      // Parse time slot
      const [hours, minutes] = selectedSlot.startTime.split(':');
      if (!hours || !minutes) {
        setError('Khung giờ không hợp lệ. Vui lòng chọn lại.');
        setLoading(false);
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const appointmentDateTime = `${dateStr}T${hours}:${minutes}:00`;
      
      // Validate appointment date is valid
      const appointmentDateObj = new Date(appointmentDateTime);
      if (isNaN(appointmentDateObj.getTime())) {
        setError('Ngày giờ không hợp lệ. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      const response = await appointmentService.create({
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        slotId: selectedSlot.id,
        appointmentDate: appointmentDateTime,
        visitType,
        symptoms: symptoms || undefined,
      });

      // Đặt lịch thành công
      if (response.success && response.data) {
        const appointmentData = response.data as { id: number };
        setAppointmentId(appointmentData.id);
        setShowSuccessModal(true);
        
        if (onComplete) {
          onComplete();
        }
      } else {
        setError(response.message || 'Đặt lịch hẹn thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      // Get error message from various sources
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 403) {
        errorMessage = 'Bạn cần đăng nhập để đặt lịch hẹn. Vui lòng đăng nhập và thử lại.';
      } else if (err.response?.status === 404) {
        if (err.response?.data?.message?.includes('bệnh nhân')) {
          errorMessage = 'Không tìm thấy thông tin bệnh nhân. Vui lòng liên hệ quản trị viên.';
        } else {
          errorMessage = err.response?.data?.message || 'Không tìm thấy thông tin. Vui lòng thử lại.';
        }
      } else if (err.response?.status === 409) {
        errorMessage = err.response?.data?.message || 'Khung giờ này không còn trống hoặc bạn đã có lịch hẹn vào thời gian này. Vui lòng chọn khung giờ khác.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
      }
      
      setError(errorMessage);
      console.error('Booking error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  const maxDate = addDays(new Date(), 30);

  const filteredDoctors = specialtyFilter
    ? doctors.filter(d => d.specialty === specialtyFilter)
    : doctors;

  const doctorSpecialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));

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
                    loadDoctors();
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
                        {doctor.specialty}
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
            </div>
          )}

          {/* Step 2: Select Service */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Chọn dịch vụ</h2>
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
                            {service.duration} phút · {service.description || service.specialty}
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
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Chọn ngày khám</h2>
                <Calendar
                  selectedDate={selectedDate || undefined}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  minDate={minDate}
                  maxDate={maxDate}
                />
                {selectedDate && (
                  <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                    <p className="text-sm text-neutral-dark">
                      <span className="font-medium">Ngày đã chọn:</span>{' '}
                      <span className="text-primary-500 font-semibold">
                        {format(selectedDate, 'dd/MM/yyyy, EEEE', { locale: vi })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Time Slots */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Chọn giờ khám
                  {selectedDate && (
                    <span className="text-sm font-normal text-neutral-medium ml-2">
                      ({availableSlots.length} khung giờ trống)
                    </span>
                  )}
                </h2>
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-medium">
                    <CalendarIcon className="w-16 h-16 mb-4 text-neutral-border" />
                    <p className="text-center">Vui lòng chọn ngày khám ở bên trái</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {availableSlots.map((slot) => {
                      const remaining = slot.capacity - slot.patientCount;
                      const isSelected = selectedSlot?.id === slot.id;
                      const isFull = remaining === 0;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => !isFull && setSelectedSlot(slot)}
                          disabled={isFull}
                          className={`
                            p-4 rounded-xl border-2 transition-all duration-200
                            ${isSelected
                              ? 'bg-primary-500 text-white border-primary-500 shadow-medium transform scale-105'
                              : isFull
                              ? 'bg-neutral-light text-neutral-medium border-neutral-border cursor-not-allowed opacity-60'
                              : 'bg-white text-neutral-dark border-neutral-border hover:border-primary-500 hover:shadow-soft hover:scale-102'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <div className={`text-lg font-bold mb-1 ${isSelected ? 'text-white' : 'text-primary-500'}`}>
                              {slot.startTime.substring(0, 5)}
                            </div>
                            {!isFull ? (
                              <div className={`text-xs ${isSelected ? 'text-white opacity-90' : 'text-neutral-medium'}`}>
                                Còn {remaining}/{slot.capacity} chỗ
                              </div>
                            ) : (
                              <div className="text-xs font-medium text-status-error">
                                Đã đầy
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-medium">
                    <ClockIcon className="w-16 h-16 mb-4 text-neutral-border" />
                    <p className="text-center font-medium">Không có khung giờ trống</p>
                    <p className="text-sm text-center mt-2">Vui lòng chọn ngày khác</p>
                  </div>
                )}

                {selectedSlot && (
                  <div className="mt-4 p-4 bg-secondary-50 border-l-4 border-secondary-500 rounded-lg">
                    <p className="text-sm text-neutral-dark">
                      <span className="font-medium">Giờ khám:</span>{' '}
                      <span className="text-secondary-500 font-bold text-lg">
                        {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
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
                        {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
                      </p>
                      <p className="font-semibold text-lg text-secondary-500">
                        {selectedSlot?.startTime?.substring(0, 5)} - {selectedSlot?.endTime?.substring(0, 5)}
                      </p>
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
                    >
                      Xác nhận đặt lịch
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

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/');
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
          <div className="bg-warm-50 border-l-4 border-l-secondary-500 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-secondary-600 mb-2">📋 Lịch hẹn đang chờ xác nhận</p>
            <p className="text-sm text-neutral-medium mb-3">
              Chúng tôi sẽ liên hệ với bạn trong vòng 2 giờ tới để xác nhận lịch hẹn.
            </p>
            <div className="bg-white rounded-lg p-3 mt-3">
              <p className="text-sm text-neutral-medium mb-1">
                <span className="font-medium">Bác sĩ:</span> {selectedDoctor?.fullName}
              </p>
              <p className="text-sm text-neutral-medium mb-1">
                <span className="font-medium">Ngày:</span> {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
              </p>
              <p className="text-sm text-neutral-medium">
                <span className="font-medium">Giờ:</span> {selectedSlot?.startTime?.substring(0, 5)} - {selectedSlot?.endTime?.substring(0, 5)}
              </p>
            </div>
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
                navigate('/');
              }}
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

