import api from '../config/api';

export interface FavoriteDoctor {
  id: number;
  patientId: number;
  doctorId: number;
  createdAt: string;
  doctor?: {
    id: number;
    fullName: string;
    speciality: string;
    experienceYears?: number;
    avatar?: string;
  };
}

export const favoriteDoctorService = {
  async getAll(): Promise<{ success: boolean; data: FavoriteDoctor[] }> {
    const response = await api.get('/favorite-doctors');
    return response.data;
  },

  async add(doctorId: number): Promise<{ success: boolean; message: string; data: FavoriteDoctor }> {
    const response = await api.post('/favorite-doctors', { doctorId });
    return response.data;
  },

  async remove(doctorId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/favorite-doctors/${doctorId}`);
    return response.data;
  },

  async check(doctorId: number): Promise<{ success: boolean; data: { isFavorite: boolean } }> {
    const response = await api.get(`/favorite-doctors/check/${doctorId}`);
    return response.data;
  },
};


