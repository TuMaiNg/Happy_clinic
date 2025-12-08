import api from '../config/api';

export interface Doctor {
  id: number;
  userId: number;
  fullName: string;
  speciality: string;
  description?: string;
  experienceYears?: number;
  licenseNumber?: string;
  avatar?: string;
}

export const doctorService = {
  async getAll(params?: { speciality?: string; search?: string }): Promise<{ success: boolean; data: Doctor[] }> {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  async getById(id: number): Promise<{ success: boolean; data: Doctor }> {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },
};

