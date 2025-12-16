import React, { useState } from 'react';
import { api } from '../../../config/api';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

interface Patient {
  id?: number;
  fullName: string;
  phone: string;
  email?: string;
  birthday?: string;
  date_of_birth?: string;
  address?: string;
  name?: string; // For backward compatibility
}

interface PatientFormProps {
  patient?: Patient;
  onClose: () => void;
  onSuccess: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Patient>(
    patient ? {
      ...patient,
      fullName: patient.fullName || '',
      birthday: patient.birthday || patient.date_of_birth || '',
    } : {
      fullName: '',
      phone: '',
      email: '',
      birthday: '',
      address: '',
    }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        birthday: formData.birthday || formData.date_of_birth || null,
        address: formData.address || null,
      };
      
      if (patient?.id) {
        await api.put(`/patients/${patient.id}`, payload);
      } else {
        await api.post('/patients', payload);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save patient:', error);
      alert(error.response?.data?.message || 'Không thể lưu bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={patient ? 'Sửa bệnh nhân' : 'Thêm bệnh nhân'}
    >
      <form onSubmit={handleSubmit} className="patient-form">
        <div className="form-group">
          <label className="label">Tên *</label>
          <Input
            type="text"
            value={formData.fullName || ''}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Số điện thoại *</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="label">Ngày sinh</label>
          <Input
            type="date"
            value={formData.birthday || formData.date_of_birth || ''}
            onChange={(e) =>
              setFormData({ ...formData, birthday: e.target.value, date_of_birth: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="label">Địa chỉ</label>
          <textarea
            className="input-field"
            rows={3}
            value={formData.address || ''}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : patient ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  );
};








