import api from '../config/api';

export interface CreateAppointmentRequest {
  doctorId: number;
  serviceId: number;
  slotId: number;
  appointmentDate: string;
  visitType: 'first-visit' | 'follow-up';
  symptoms?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  serviceId: number;
  slotId: number;
  scheduleId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  visitType: string;
  symptoms?: string;
  status: string;
  confirmedBy?: number;
  confirmedAt?: string;
  cancelledBy?: number;
  cancelledAt?: string;
  reasonCancel?: string;
  cancellationFee?: number;
  checkedInAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from JOIN queries
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_speciality?: string;
  service_name?: string;
  service_price?: number;
  slot_start_time?: string;
  slot_end_time?: string;
}

export interface CreateAppointmentResponse {
  success: boolean;
  message: string;
  data: Appointment;
}

export const appointmentService = {
  async create(data: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    try {
      const response = await api.post('/appointments', data);
      
      // Validate response format
      if (!response.data) {
        throw new Error('Phản hồi từ server không hợp lệ');
      }
      
      // If response has success: false, throw error
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Đặt lịch hẹn thất bại');
      }
      
      return response.data;
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const errorData = error.response.data;
        // Backend returns { success: false, message: ... }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      }
      
      // If it's already an Error with message, re-throw it
      if (error.message) {
        throw error;
      }
      
      throw new Error('Đặt lịch hẹn thất bại. Vui lòng thử lại.');
    }
  },

  async getAll(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Appointment[] }> {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  async getById(id: number): Promise<{ success: boolean; data: Appointment }> {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // OTP verification removed - appointments are confirmed by staff

  async confirm(id: number): Promise<{ success: boolean; data: Appointment }> {
    const response = await api.put(`/appointments/${id}/confirm`);
    return response.data;
  },

  async cancel(id: number, reason?: string): Promise<{ success: boolean; data: Appointment }> {
    const response = await api.put(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  async checkIn(id: number): Promise<{ success: boolean; data: Appointment }> {
    const response = await api.put(`/appointments/${id}/check-in`);
    return response.data;
  },

  async complete(id: number, notes?: string): Promise<{ success: boolean; data: Appointment }> {
    const response = await api.put(`/appointments/${id}/complete`, { notes });
    return response.data;
  },

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
};

