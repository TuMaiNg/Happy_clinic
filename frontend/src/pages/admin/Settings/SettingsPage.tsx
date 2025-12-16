import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { useToast } from '../../../contexts/ToastContext';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import '../shared/styles.css';

interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  description: string;
}

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    working_hours: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);

  useEffect(() => {
    loadClinicInfo();
  }, []);

  const loadClinicInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/clinic');
      setClinicInfo(response.data.data || {
        name: '',
        address: '',
        phone: '',
        email: '',
        working_hours: '',
        description: '',
      });
    } catch (error) {
      console.error('Failed to load clinic info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClinicInfo = async () => {
    try {
      setSaving(true);
      await api.put('/config/clinic', clinicInfo);
      setShowClinicModal(false);
      success('Cập nhật thông tin phòng khám thành công');
      loadClinicInfo();
    } catch (err: any) {
      console.error('Failed to save clinic info:', err);
      error(err.response?.data?.message || 'Không thể lưu thông tin phòng khám');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="page-header">
          <div>
            <h1>Cài đặt hệ thống</h1>
            <p className="text-muted">Cấu hình hệ thống và thông tin phòng khám</p>
          </div>
        </div>
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Cài đặt hệ thống</h1>
          <p className="text-muted">Cấu hình hệ thống và thông tin phòng khám</p>
        </div>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>Thông tin phòng khám</h3>
              <p className="text-muted">Quản lý thông tin phòng khám</p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowClinicModal(true)}
            >
              Cấu hình
            </button>
          </div>
          <div className="settings-info-preview">
            <div className="info-item">
              <span className="info-label">Tên phòng khám:</span>
              <span className="info-value">{clinicInfo.name || 'Chưa cấu hình'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Địa chỉ:</span>
              <span className="info-value">{clinicInfo.address || 'Chưa cấu hình'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Số điện thoại:</span>
              <span className="info-value">{clinicInfo.phone || 'Chưa cấu hình'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{clinicInfo.email || 'Chưa cấu hình'}</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>Quản lý hệ thống</h3>
              <p className="text-muted">Các cấu hình hệ thống</p>
            </div>
          </div>
          <div className="settings-info-preview">
            <p className="text-muted">Tính năng đang được phát triển</p>
          </div>
        </div>
      </div>

      {showClinicModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowClinicModal(false)}
          title="Cấu hình thông tin phòng khám"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveClinicInfo();
            }}
            className="clinic-form"
          >
            <div className="form-group">
              <label className="label">Tên phòng khám *</label>
              <Input
                type="text"
                value={clinicInfo.name}
                onChange={(e) => setClinicInfo({ ...clinicInfo, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Địa chỉ</label>
              <textarea
                className="input-field"
                rows={2}
                value={clinicInfo.address}
                onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Số điện thoại</label>
                <Input
                  type="tel"
                  value={clinicInfo.phone}
                  onChange={(e) => setClinicInfo({ ...clinicInfo, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="label">Email</label>
                <Input
                  type="email"
                  value={clinicInfo.email}
                  onChange={(e) => setClinicInfo({ ...clinicInfo, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Giờ làm việc</label>
              <Input
                type="text"
                placeholder="VD: 8:00 - 17:00 (Thứ 2 - Thứ 6)"
                value={clinicInfo.working_hours}
                onChange={(e) => setClinicInfo({ ...clinicInfo, working_hours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">Mô tả</label>
              <textarea
                className="input-field"
                rows={4}
                value={clinicInfo.description}
                onChange={(e) => setClinicInfo({ ...clinicInfo, description: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClinicModal(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};








