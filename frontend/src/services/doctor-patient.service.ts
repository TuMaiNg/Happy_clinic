import api from '../config/api';

export interface DoctorPatient {
  id: number;
  doctorId: number;
  patientId: number;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  patient?: {
    id: number;
    fullName: string;
    phone: string;
    email?: string;
    birthday?: string;
    gender?: string;
  };
}

export const doctorPatientService = {
  // Bác sĩ chấp nhận bệnh nhân
  async acceptPatient(patientId: number, notes?: string): Promise<{ success: boolean; data: DoctorPatient }> {
    const response = await api.post(`/doctor-patients/accept/${patientId}`, { notes });
    return response.data;
  },

  // Bác sĩ từ chối bệnh nhân
  async rejectPatient(patientId: number, reason?: string): Promise<{ success: boolean; data: DoctorPatient }> {
    const response = await api.post(`/doctor-patients/reject/${patientId}`, { reason });
    return response.data;
  },

  // Bác sĩ xem danh sách bệnh nhân
  async getMyPatients(status?: 'pending' | 'accepted' | 'rejected'): Promise<{ success: boolean; data: DoctorPatient[]; meta?: any }> {
    const response = await api.get('/doctor-patients/my-patients', { params: { status } });
    return response.data;
  },

  // Bác sĩ xem yêu cầu chờ xử lý
  async getPendingRequests(): Promise<{ success: boolean; data: DoctorPatient[] }> {
    const response = await api.get('/doctor-patients/pending');
    return response.data;
  },

  // Bệnh nhân yêu cầu được bác sĩ nhận
  async requestAcceptance(doctorId: number, notes?: string): Promise<{ success: boolean; data: DoctorPatient }> {
    const response = await api.post(`/doctor-patients/request/${doctorId}`, { notes });
    return response.data;
  },

  // Bác sĩ xóa bệnh nhân
  async removePatient(patientId: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/doctor-patients/${patientId}`);
    return response.data;
  },
};


