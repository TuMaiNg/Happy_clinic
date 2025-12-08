import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { PatientForm } from './PatientForm';
import { PatientDetails } from './PatientDetails';
import '../shared/styles.css';

interface Patient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
}

export const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadPatients();
  }, [search]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/patients${params}`);
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patients-page">
      <div className="page-header">
        <div>
          <h1>Quản lý bệnh nhân</h1>
          <p className="text-muted">Danh sách tất cả bệnh nhân</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Thêm bệnh nhân
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="Tìm bệnh nhân..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-search"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="table-empty">
            <p>Không có bệnh nhân nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Ngày sinh</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>#{patient.id}</td>
                  <td>{patient.name}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.email || '-'}</td>
                  <td>
                    {patient.date_of_birth
                      ? new Date(patient.date_of_birth).toLocaleDateString('vi-VN')
                      : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => setEditingPatient(patient)}
                      >
                        Sửa
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
        <PatientForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadPatients();
          }}
        />
      )}

      {editingPatient && (
        <PatientForm
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSuccess={() => {
            setEditingPatient(null);
            loadPatients();
          }}
        />
      )}

      {selectedPatient && (
        <PatientDetails
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};

