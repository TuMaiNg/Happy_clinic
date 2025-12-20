import React, { useState, useEffect } from 'react';
import { doctorPatientService, DoctorPatient } from '../../services/doctor-patient.service';
import { useToast } from '../../contexts/ToastContext';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const PatientManagement: React.FC = () => {
  const { success, error } = useToast();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [pendingPatients, setPendingPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    loadPatients();
  }, [activeTab]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const response = await doctorPatientService.getPendingRequests();
        setPendingPatients(response.data);
      } else {
        const response = await doctorPatientService.getMyPatients(activeTab === 'all' ? undefined : activeTab);
        setPatients(response.data);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (patientId: number) => {
    if (!window.confirm('Bạn có chắc muốn chấp nhận bệnh nhân này?')) return;
    
    try {
      await doctorPatientService.acceptPatient(patientId);
      success('Đã chấp nhận bệnh nhân thành công!');
      loadPatients();
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể chấp nhận bệnh nhân');
    }
  };

  const handleReject = async (patientId: number) => {
    const reason = window.prompt('Nhập lý do từ chối (tùy chọn):');
    if (reason === null) return; // User cancelled
    
    try {
      await doctorPatientService.rejectPatient(patientId, reason || undefined);
      success('Đã từ chối bệnh nhân');
      loadPatients();
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể từ chối bệnh nhân');
    }
  };

  const handleRemove = async (patientId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bệnh nhân này khỏi danh sách?')) return;
    
    try {
      await doctorPatientService.removePatient(patientId);
      success('Đã xóa bệnh nhân khỏi danh sách');
      loadPatients();
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể xóa bệnh nhân');
    }
  };

  const displayPatients = activeTab === 'pending' ? pendingPatients : patients;

  return (
    <div className="patient-management">
      <div className="management-header">
        <h2>Quản lý bệnh nhân</h2>
        <p className="text-muted">Chấp nhận hoặc từ chối bệnh nhân muốn được bạn nhận</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <ClockIcon className="w-5 h-5" />
          Chờ xử lý ({pendingPatients.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          <CheckCircleIcon className="w-5 h-5" />
          Đã chấp nhận
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <UserGroupIcon className="w-5 h-5" />
          Tất cả
        </button>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : displayPatients.length === 0 ? (
        <div className="empty-state">
          <UserIcon className="empty-icon" />
          <p>Không có bệnh nhân nào</p>
        </div>
      ) : (
        <div className="patients-list">
          {displayPatients.map((item) => (
            <div key={item.id} className="patient-card">
              <div className="patient-info">
                <div className="patient-avatar">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div className="patient-details">
                  <h3>{item.patient?.fullName || 'N/A'}</h3>
                  <p className="patient-phone">📞 {item.patient?.phone || 'N/A'}</p>
                  {item.patient?.email && (
                    <p className="patient-email">✉️ {item.patient.email}</p>
                  )}
                  {item.notes && (
                    <p className="patient-notes">📝 {item.notes}</p>
                  )}
                  <div className="patient-meta">
                    {item.status === 'accepted' && item.acceptedAt && (
                      <span className="meta-item">
                        Đã chấp nhận: {format(new Date(item.acceptedAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                    {item.status === 'rejected' && item.rejectedAt && (
                      <span className="meta-item">
                        Đã từ chối: {format(new Date(item.rejectedAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="meta-item">
                        Yêu cầu: {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="patient-actions">
                {item.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleAccept(item.patientId)}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Chấp nhận
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(item.patientId)}
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Từ chối
                    </button>
                  </>
                )}
                {item.status === 'accepted' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => handleRemove(item.patientId)}
                  >
                    Xóa khỏi danh sách
                  </button>
                )}
                {item.status === 'rejected' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAccept(item.patientId)}
                  >
                    Chấp nhận lại
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


