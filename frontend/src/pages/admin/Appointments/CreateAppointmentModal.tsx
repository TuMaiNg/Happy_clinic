import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../config/api';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

interface CreateAppointmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Doctor {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  capacity: number;
  patientCount: number;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    doctor_id: '',
    service_id: '',
    appointment_date: '',
    start_time: '',
    slot_id: '',
    notes: '',
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [doctorsRes, servicesRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/services'),
      ]);
      setDoctors(doctorsRes.data.data || []);
      setServices(servicesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadAvailableSlots = useCallback(async () => {
    if (!formData.doctor_id || !formData.appointment_date) return;

    try {
      setLoadingSlots(true);
      const response = await api.get(
        `/time-slots/available?doctorId=${formData.doctor_id}&date=${formData.appointment_date}`
      );
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('Failed to load time slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [formData.doctor_id, formData.appointment_date]);

  useEffect(() => {
    if (formData.doctor_id && formData.appointment_date) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setFormData((prev) => ({ ...prev, slot_id: '', start_time: '' }));
    }
  }, [formData.doctor_id, formData.appointment_date, loadAvailableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slot_id) {
      alert('Vui lòng chọn khung giờ');
      return;
    }

    try {
      setLoading(true);
      
      // Find or create patient
      let patientId: number;
      try {
        // Try to find existing patient by phone
        const patientsRes = await api.get(`/patients?search=${encodeURIComponent(formData.patient_phone)}`);
        const existingPatients = patientsRes.data.data || [];
        if (existingPatients.length > 0) {
          patientId = existingPatients[0].id;
        } else {
          // Create new patient
          const newPatientRes = await api.post('/patients', {
            name: formData.patient_name,
            phone: formData.patient_phone,
          });
          patientId = newPatientRes.data.data.id;
        }
      } catch (error: any) {
        throw new Error('Không thể tìm hoặc tạo bệnh nhân: ' + (error.response?.data?.message || error.message));
      }

      // Prepare appointment data in camelCase format (as expected by backend)
      const appointmentDateTime = `${formData.appointment_date}T${formData.start_time}:00`;
      const submitData = {
        patientId,
        doctorId: parseInt(formData.doctor_id),
        serviceId: parseInt(formData.service_id),
        slotId: parseInt(formData.slot_id),
        appointmentDate: appointmentDateTime,
        visitType: 'first-visit' as const,
        symptoms: formData.notes || null,
      };

      await api.post('/appointments', submitData);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create appointment:', error);
      alert(error.response?.data?.message || error.message || 'Không thể tạo lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Tạo lịch hẹn">
        <div className="modal-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Tạo lịch hẹn">
      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label className="label">Tên bệnh nhân *</label>
          <Input
            type="text"
            value={formData.patient_name}
            onChange={(e) =>
              setFormData({ ...formData, patient_name: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Số điện thoại *</label>
          <Input
            type="tel"
            value={formData.patient_phone}
            onChange={(e) =>
              setFormData({ ...formData, patient_phone: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Bác sĩ *</label>
          <select
            className="input-field"
            value={formData.doctor_id}
            onChange={(e) =>
              setFormData({ ...formData, doctor_id: e.target.value })
            }
            required
          >
            <option value="">Chọn bác sĩ</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Dịch vụ *</label>
          <select
            className="input-field"
            value={formData.service_id}
            onChange={(e) =>
              setFormData({ ...formData, service_id: e.target.value })
            }
            required
          >
            <option value="">Chọn dịch vụ</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price.toLocaleString('vi-VN')}₫
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Ngày *</label>
          <Input
            type="date"
            value={formData.appointment_date}
            onChange={(e) =>
              setFormData({ ...formData, appointment_date: e.target.value, slot_id: '', start_time: '' })
            }
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {formData.doctor_id && formData.appointment_date && (
          <div className="form-group">
            <label className="label">Khung giờ *</label>
            {loadingSlots ? (
              <div className="slots-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải khung giờ...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-muted">Không có khung giờ trống</p>
            ) : (
              <select
                className="input-field"
                value={formData.slot_id}
                onChange={(e) => {
                  const selectedSlot = availableSlots.find(
                    (slot) => slot.id === parseInt(e.target.value)
                  );
                  setFormData({
                    ...formData,
                    slot_id: e.target.value,
                    start_time: selectedSlot?.startTime || '',
                  });
                }}
                required
              >
                <option value="">Chọn khung giờ</option>
                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.startTime} - {slot.endTime} ({slot.capacity - slot.patientCount} chỗ trống)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="label">Ghi chú</label>
          <textarea
            className="input-field"
            rows={3}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang tạo...' : 'Tạo lịch hẹn'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

