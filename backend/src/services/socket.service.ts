import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../middleware/auth';

let io: SocketServer | null = null;

export const setupSocketIO = (socketServer: SocketServer) => {
  io = socketServer;

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const userRole = (socket as any).userRole;

    console.log(`🔌 Client connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // Join user's personal room for notifications
    socket.join(`user-${userId}`);

    // Join role-based rooms
    socket.join(`role-${userRole}`);

    // Handle custom events
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`👤 User ${userId} joined room: ${room}`);
    });

    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      console.log(`👤 User ${userId} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id} (User: ${userId})`);
    });
  });
};

export const emitNotification = (userId: number, notification: any) => {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
    console.log(`📨 Notification sent to user ${userId}:`, notification.type);
  }
};

export const emitAppointmentUpdate = (userId: number, appointment: any) => {
  if (io) {
    io.to(`user-${userId}`).emit('appointment-updated', appointment);
  }
};

export const broadcastToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role-${role}`).emit(event, data);
  }
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};
