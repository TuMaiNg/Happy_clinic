import { notificationService } from '../notification.service';
import api from '../../config/api';
import { io } from 'socket.io-client';

jest.mock('../../config/api');
jest.mock('socket.io-client');

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to Socket.IO server', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      (io as jest.Mock).mockReturnValue(mockSocket);

      const socket = notificationService.connect(1, 'token123');

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: 'token123' },
        })
      );
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should join user room on connect', () => {
      const mockSocket = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') {
            callback();
          }
        }),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      (io as jest.Mock).mockReturnValue(mockSocket);

      notificationService.connect(1, 'token123');

      expect(mockSocket.emit).toHaveBeenCalledWith('join-user-room', 1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      (io as jest.Mock).mockReturnValue(mockSocket);

      notificationService.connect(1, 'token123');
      notificationService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('onNotification', () => {
    it('should register notification callback', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      (io as jest.Mock).mockReturnValue(mockSocket);

      notificationService.connect(1, 'token123');

      const callback = jest.fn();
      notificationService.onNotification(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('notification', callback);
    });
  });

  describe('getAll', () => {
    it('should fetch all notifications', async () => {
      const mockNotifications = [
        {
          id: 1,
          title: 'Test Notification',
          message: 'Test message',
          read: false,
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: mockNotifications,
        },
      });

      const result = await notificationService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotifications);
      expect(api.get).toHaveBeenCalledWith('/notifications');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      (api.put as jest.Mock).mockResolvedValue({
        data: { success: true },
      });

      await notificationService.markAsRead(1);

      expect(api.put).toHaveBeenCalledWith('/notifications/1/read');
    });
  });
});








