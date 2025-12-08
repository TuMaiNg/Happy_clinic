import React, { useState } from 'react';
import { api } from '../../../config/api';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

interface Patient {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
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
    patient || {
      name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      address: '',
    }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (patient?.id) {
        await api.put(`/patients/${patient.id}`, formData);
      } else {
        await api.post('/patients', formData);
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
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            value={formData.date_of_birth || ''}
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value })
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


