import React, { useState } from 'react';
import { api } from '../../../config/api';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

interface Service {
  id?: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  is_active: boolean;
}

interface ServiceFormProps {
  service?: Service;
  onClose: () => void;
  onSuccess: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Service>(
    service || {
      name: '',
      description: '',
      duration: 30,
      price: 0,
      is_active: true,
    }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (service?.id) {
        await api.put(`/services/${service.id}`, formData);
      } else {
        await api.post('/services', formData);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save service:', error);
      alert(error.response?.data?.message || 'Không thể lưu dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={service ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
    >
      <form onSubmit={handleSubmit} className="service-form">
        <div className="form-group">
          <label className="label">Tên dịch vụ *</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Mô tả</label>
          <textarea
            className="input-field"
            rows={3}
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Thời gian (phút) *</label>
            <Input
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setFormData({ ...formData, duration: value });
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Giá (VNĐ) *</label>
            <Input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setFormData({ ...formData, price: value });
              }}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            <span>Dịch vụ đang hoạt động</span>
          </label>
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
            {loading ? 'Đang lưu...' : service ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

