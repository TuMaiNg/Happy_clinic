import api from '../config/api';

export interface TimeSlot {
  id: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  patientCount: number;
  capacity: number;
  isAvailable: boolean;
}

export const timeslotService = {
  async getAvailable(params: {
    doctorId: number;
    date: string;
    serviceId?: number;
  }): Promise<{ success: boolean; data: TimeSlot[] }> {
    const response = await api.get('/time-slots/available', { params });
    return response.data;
  },
};

