import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationModel } from '../models/Notification';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  // Get user email/phone
  const [users] = await pool.query(
    'SELECT email FROM users WHERE id = ?',
    [req.user.id]
  ) as any[];

  if (!users || users.length === 0) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  const userEmail = users[0].email;

  const notifications = await NotificationModel.findByRecipient(userEmail, {
    limit: parseInt(req.query.limit as string) || 50,
  });

  res.json({
    success: true,
    data: notifications,
  });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  // In a real implementation, you might want a read_status field
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Đã đánh dấu đã đọc',
  });
};

