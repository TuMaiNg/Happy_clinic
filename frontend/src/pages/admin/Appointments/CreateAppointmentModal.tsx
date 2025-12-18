import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { doctorService } from '../../../services/doctor.service';
import { serviceService } from '../../../services/service.service';
import { timeslotService } from '../../../services/timeslot.service';

import { api } from '../../../config/api';
import { useToast } from '../../../contexts/ToastContext';

interface CreateAppointmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    doctorId: '',
    serviceId: '',
    date: '',
    slotId: '',
    visitType: 'first-visit' as 'first-visit' | 'follow-up',
    symptoms: '',
  });

  const [searchPhone, setSearchPhone] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const { success, error } = useToast();

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [doctorsRes, servicesRes] = await Promise.all([
        doctorService.getAll(),
        serviceService.getAll({ isActive: true }),
      ]);
      setDoctors(doctorsRes.data);
      setServices(servicesRes.data);
    } catch (err: any) {
      error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const loadAvailableSlots = useCallback(async () => {
    if (!formData.doctorId || !formData.date) return;

    try {
      const response = await timeslotService.getAvailable({
        doctorId: parseInt(formData.doctorId),
        date: formData.date,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : undefined,
      });
      setAvailableSlots(response.data);
    } catch (err: any) {
      error('Không thể tải khung giờ trống');
    }
  }, [formData.doctorId, formData.date, formData.serviceId, error]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      loadAvailableSlots();
    }
  }, [formData.doctorId, formData.date, loadAvailableSlots]);

  const searchPatient = async () => {
    if (!searchPhone.trim()) return;
    
    try {
      setSearchingPatient(true);
      const response = await api.get(`/patients?search=${searchPhone}`);
      setPatients(response.data.data || []);
    } catch (err: any) {
      error('Không thể tìm kiếm bệnh nhân');
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setFormData({
      ...formData,
      patientId: patient.id.toString(),
      patientName: patient.full_name || patient.fullName,
      patientPhone: patient.phone,
    });
    setPatients([]);
    setSearchPhone('');
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId && (!formData.patientName || !formData.patientPhone)) {
      error('Vui lòng chọn hoặc tạo bệnh nhân');
      return;
    }
    
    if (!formData.doctorId || !formData.serviceId || !formData.date || !formData.slotId) {
      error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      
      let patientId = parseInt(formData.patientId);
      if (!patientId) {
        // Create patient first
        const patientRes = await api.post('/patients', {
          fullName: formData.patientName,
          phone: formData.patientPhone,
        });
        patientId = patientRes.data.data.id;
      }

      const selectedSlot = availableSlots.find(s => s.id === parseInt(formData.slotId));
      const [hours, minutes] = selectedSlot.startTime.split(':');
      const appointmentDateTime = `${formData.date}T${hours}:${minutes}:00`;

      // For staff/admin, send patientId directly in request body
      await api.post('/appointments', {
        patientId,
        doctorId: parseInt(formData.doctorId),
        serviceId: parseInt(formData.serviceId),
        slotId: parseInt(formData.slotId),
        appointmentDate: appointmentDateTime,
        visitType: formData.visitType,
        symptoms: formData.symptoms || undefined,
      });

      success('Tạo lịch hẹn thành công');
      onSuccess();
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể tạo lịch hẹn');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Tạo lịch hẹn">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Tạo lịch hẹn">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tìm bệnh nhân (theo số điện thoại)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={searchPatient}
              disabled={searchingPatient}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Tìm
            </button>
          </div>
          
          {patients.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                >
                  {patient.full_name || patient.fullName} - {patient.phone}
                </button>
              ))}
            </div>
          )}

          {formData.patientId && (
            <div className="mt-2 p-2 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                Đã chọn: {formData.patientName} - {formData.patientPhone}
              </p>
            </div>
          )}

          {!formData.patientId && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hoặc tạo bệnh nhân mới
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="Tên bệnh nhân"
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                  placeholder="Số điện thoại"
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bác sĩ *
          </label>
          <select
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Chọn bác sĩ</option>
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
            Dịch vụ *
          </label>
          <select
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Chọn dịch vụ</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price?.toLocaleString('vi-VN')}₫
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Time Slot Selection */}
        {formData.doctorId && formData.date && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khung giờ *
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500">Không có khung giờ trống</p>
            ) : (
              <select
                value={formData.slotId}
                onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Chọn khung giờ</option>
                {availableSlots
                  .filter(slot => slot.patientCount < slot.capacity)
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime} (Còn {slot.capacity - slot.patientCount}/{slot.capacity} chỗ)
                    </option>
                  ))}
              </select>
            )}
          </div>
        )}

        {/* Visit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại khám *
          </label>
          <select
            value={formData.visitType}
            onChange={(e) => setFormData({ ...formData, visitType: e.target.value as any })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="first-visit">Khám lần đầu</option>
            <option value="follow-up">Tái khám</option>
          </select>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Triệu chứng
          </label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            placeholder="Mô tả triệu chứng (nếu có)"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo lịch hẹn'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
