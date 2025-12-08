import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { ServiceForm } from './ServiceForm';
import '../shared/styles.css';

interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  is_active: boolean;
}

export const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/services/${id}`, { is_active: !isActive });
      loadServices();
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  };

  return (
    <div className="services-page">
      <div className="page-header">
        <div>
          <h1>Quản lý dịch vụ</h1>
          <p className="text-muted">Danh sách tất cả dịch vụ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Thêm dịch vụ
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="table-empty">
            <p>Không có dịch vụ nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên dịch vụ</th>
                <th>Mô tả</th>
                <th>Thời gian (phút)</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>#{service.id}</td>
                  <td>{service.name}</td>
                  <td>{service.description || '-'}</td>
                  <td>{service.duration}</td>
                  <td>{service.price.toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span
                      className={`badge ${
                        service.is_active ? 'badge-success' : 'badge-secondary'
                      }`}
                    >
                      {service.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => setEditingService(service)}
                      >
                        Sửa
                      </button>
                      <button
                        className={`btn-sm ${
                          service.is_active ? 'btn-warning' : 'btn-success'
                        }`}
                        onClick={() =>
                          handleToggleActive(service.id, service.is_active)
                        }
                      >
                        {service.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ServiceForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadServices();
          }}
        />
      )}

      {editingService && (
        <ServiceForm
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={() => {
            setEditingService(null);
            loadServices();
          }}
        />
      )}
    </div>
  );
};

