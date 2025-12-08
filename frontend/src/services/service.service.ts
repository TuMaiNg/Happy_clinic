import api from '../config/api';

export interface Service {
  id: number;
  name: string;
  speciality: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export const serviceService = {
  async getAll(params?: { speciality?: string; isActive?: boolean; search?: string }): Promise<{ success: boolean; data: Service[] }> {
    const response = await api.get('/services', { params });
    return response.data;
  },

  async getById(id: number): Promise<{ success: boolean; data: Service }> {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
};

