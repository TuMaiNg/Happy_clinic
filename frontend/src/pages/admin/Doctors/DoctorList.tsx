import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { DoctorForm } from './DoctorForm';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Doctor {
  id: number;
  fullName: string;
  speciality: string;
  email?: string;
  description?: string;
  experienceYears?: number;
  licenseNumber?: string;
}

export const DoctorList: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors');
      setDoctors(response.data.data || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctors-page">
      <div className="page-header">
        <div>
          <h1>Quản lý bác sĩ</h1>
          <p className="text-muted">Danh sách tất cả bác sĩ</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <PlusIcon className="btn-icon" />
          Tạo tài khoản bác sĩ
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="table-empty">
            <p>Không có bác sĩ nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Chuyên khoa</th>
                <th>Email</th>
                <th>Kinh nghiệm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>#{doctor.id}</td>
                  <td>{doctor.fullName}</td>
                  <td>{doctor.speciality || '-'}</td>
                  <td>{doctor.email || '-'}</td>
                  <td>{doctor.experienceYears ? `${doctor.experienceYears} năm` : '-'}</td>
                  <td>
                    <button className="btn-sm btn-secondary">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DoctorForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          loadDoctors();
        }}
      />
    </div>
  );
};







