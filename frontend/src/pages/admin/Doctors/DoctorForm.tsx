import React, { useState } from 'react';
import { api } from '../../../config/api';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

interface DoctorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    speciality: '',
    description: '',
    experienceYears: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.fullName || !formData.speciality) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);
      await api.post('/doctors', {
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        speciality: formData.speciality.trim(),
        description: formData.description.trim() || undefined,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined,
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        speciality: '',
        description: '',
        experienceYears: '',
        licenseNumber: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo tài khoản bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo tài khoản bác sĩ" size="lg">
      <form onSubmit={handleSubmit} className="doctor-form">
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="label">Email *</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="doctor@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Mật khẩu *</label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ít nhất 6 ký tự"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Họ và tên *</label>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Chuyên khoa *</label>
          <Input
            type="text"
            name="speciality"
            value={formData.speciality}
            onChange={handleChange}
            placeholder="Ví dụ: Nhi khoa, Tim mạch, Da liễu..."
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Mô tả</label>
          <textarea
            className="input-field"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Mô tả về bác sĩ..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Số năm kinh nghiệm</label>
            <Input
              type="number"
              name="experienceYears"
              value={formData.experienceYears}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="label">Số giấy phép hành nghề</label>
            <Input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="VD: BS-12345"
            />
          </div>
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
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  );
};













