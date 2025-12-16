import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

export const getClinicInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM clinic_info LIMIT 1'
    ) as any[];

    if (rows.length === 0) {
      // Return default values if no clinic info exists
      res.json({
        success: true,
        data: {
          name: 'Happy Care Clinic',
          address: '',
          phone: '',
          email: '',
          working_hours: '',
          description: '',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Không thể lấy thông tin phòng khám', 500);
  }
};

export const updateClinicInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Chỉ quản trị viên mới có thể cập nhật thông tin phòng khám', 403);
  }

  const { name, address, phone, email, working_hours, description } = req.body;

  try {
    // Check if clinic info exists
    const [existing] = await pool.query(
      'SELECT id FROM clinic_info LIMIT 1'
    ) as any[];

    if (existing.length === 0) {
      // Create new clinic info
      await pool.query(
        `INSERT INTO clinic_info (name, address, phone, email, working_hours, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name || '', address || '', phone || '', email || '', working_hours || '', description || '']
      );
    } else {
      // Update existing clinic info
      await pool.query(
        `UPDATE clinic_info 
         SET name = ?, address = ?, phone = ?, email = ?, working_hours = ?, description = ?, updated_at = NOW()
         WHERE id = ?`,
        [name || '', address || '', phone || '', email || '', working_hours || '', description || '', existing[0].id]
      );
    }

    // Fetch updated info
    const [updated] = await pool.query(
      'SELECT * FROM clinic_info LIMIT 1'
    ) as any[];

    res.json({
      success: true,
      message: 'Cập nhật thông tin phòng khám thành công',
      data: updated[0],
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Không thể cập nhật thông tin phòng khám', 500);
  }
};

export const getSystemConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Chỉ quản trị viên mới có thể xem cấu hình hệ thống', 403);
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM system_config ORDER BY `key`'
    ) as any[];

    const config: Record<string, any> = {};
    rows.forEach((row: any) => {
      config[row.key] = {
        value: row.value,
        description: row.description,
      };
    });

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Không thể lấy cấu hình hệ thống', 500);
  }
};

export const updateSystemConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Chỉ quản trị viên mới có thể cập nhật cấu hình hệ thống', 403);
  }

  const { key, value } = req.body;

  if (!key) {
    throw new AppError('Thiếu thông tin key', 400);
  }

  try {
    // Check if config exists
    const [existing] = await pool.query(
      'SELECT id FROM system_config WHERE `key` = ?',
      [key]
    ) as any[];

    if (existing.length === 0) {
      // Create new config
      await pool.query(
        'INSERT INTO system_config (`key`, value, description) VALUES (?, ?, ?)',
        [key, value || '', '']
      );
    } else {
      // Update existing config
      await pool.query(
        'UPDATE system_config SET value = ?, updated_at = NOW() WHERE `key` = ?',
        [value || '', key]
      );
    }

    res.json({
      success: true,
      message: 'Cập nhật cấu hình thành công',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Không thể cập nhật cấu hình hệ thống', 500);
  }
};
