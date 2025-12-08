import api from '../config/api';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: number;
  appointmentId?: number;
  type: string;
  title: string;
  message: string;
  recipient: string;
  status: string;
  read?: boolean;
  createdAt: string;
}

let socket: Socket | null = null;

export const notificationService = {
  connect(userId: number, token: string) {
    if (socket) {
      socket.disconnect();
    }

    socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket?.emit('join-user-room', userId);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  onNotification(callback: (notification: Notification) => void) {
    if (socket) {
      socket.on('notification', callback);
    }
  },

  offNotification(callback: (notification: Notification) => void) {
    if (socket) {
      socket.off('notification', callback);
    }
  },

  async getAll(): Promise<{ success: boolean; data: Notification[] }> {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markAsRead(id: number): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },
};

