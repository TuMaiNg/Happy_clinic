import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ScheduleModel } from '../models/Schedule';
import { TimeSlotModel } from '../models/TimeSlot';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';
import pool from '../config/database';
import { scheduleGeneratorService } from '../services/schedule-generator.service';

// Generate time slots based on schedule
const generateTimeSlots = async (scheduleId: number, startTime: string, endTime: string, maxPatientsPerSlot: number = 1) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const slotDuration = config.businessRules.slotDurationMinutes;

  const slots: Array<{ startTime: string; endTime: string }> = [];

  for (let currentMinutes = startTotalMinutes; currentMinutes < endTotalMinutes; currentMinutes += slotDuration) {
    const slotStartHours = Math.floor(currentMinutes / 60);
    const slotStartMinutes = currentMinutes % 60;
    const slotEndMinutes = Math.min(currentMinutes + slotDuration, endTotalMinutes);
    const slotEndHours = Math.floor(slotEndMinutes / 60);
    const slotEndMins = slotEndMinutes % 60;

    slots.push({
      startTime: `${slotStartHours.toString().padStart(2, '0')}:${slotStartMinutes.toString().padStart(2, '0')}`,
      endTime: `${slotEndHours.toString().padStart(2, '0')}:${slotEndMins.toString().padStart(2, '0')}`,
    });
  }

  // Create time slots in database
  for (const slot of slots) {
    await TimeSlotModel.create({
      scheduleId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      patientCount: 0,
      capacity: maxPatientsPerSlot,
      isAvailable: true,
    });
  }
};

export const createSchedule = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const { date, startTime, endTime, maxPatientsPerSlot, isDayOff, doctorId: bodyDoctorId } = req.body;

  if (!date || !startTime || !endTime) {
    throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
  }

  let doctorId: number;
  
  // Admin/Staff có thể tạo lịch cho bất kỳ bác sĩ nào
  if (['admin', 'staff'].includes(req.user.role)) {
    if (!bodyDoctorId) {
      throw new AppError('Vui lòng chọn bác sĩ', 400);
    }
    doctorId = bodyDoctorId;
  } else if (req.user.role === 'doctor') {
    // Doctor chỉ tạo được lịch cho chính mình
    const { DoctorModel } = await import('../models/Doctor');
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (!doctor) {
      throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
    }
    doctorId = doctor.id!;
  } else {
    throw new AppError('Không có quyền tạo lịch làm việc', 403);
  }

  // Check if schedule already exists for this date
  const existing = await ScheduleModel.findByDoctorAndDate(doctorId, new Date(date));
  if (existing) {
    throw new AppError('Đã có lịch làm việc cho ngày này', 409);
  }

  // Create schedule
  const schedule = await ScheduleModel.create({
    doctorId,
    date: new Date(date),
    startTime,
    endTime,
    isDayOff: isDayOff || false,
    maxPatientsPerSlot: maxPatientsPerSlot || 1,
  });

  // Generate time slots only if not a day off
  if (!isDayOff) {
    await generateTimeSlots(schedule.id!, startTime, endTime, maxPatientsPerSlot || 1);
  }

  res.status(201).json({
    success: true,
    message: 'Tạo lịch làm việc thành công',
    data: schedule,
  });
};

export const getSchedules = async (req: AuthRequest, res: Response) => {
  const doctorId = req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined;
  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

  if (!doctorId) {
    throw new AppError('Vui lòng cung cấp doctorId', 400);
  }

  const schedules = await ScheduleModel.findByDoctor(doctorId, { fromDate, toDate });

  // Get time slots for each schedule
  const schedulesWithSlots = await Promise.all(
    schedules.map(async (schedule) => {
      const slots = await TimeSlotModel.findBySchedule(schedule.id!);
      return {
        ...schedule,
        timeSlots: slots,
      };
    })
  );

  res.json({
    success: true,
    data: schedulesWithSlots,
  });
};

export const updateSchedule = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const scheduleId = parseInt(req.params.id);
  const schedule = await ScheduleModel.findById(scheduleId);

  if (!schedule) {
    throw new AppError('Không tìm thấy lịch làm việc', 404);
  }

  // Admin/Staff có thể cập nhật bất kỳ lịch nào
  // Doctor chỉ cập nhật được lịch của mình
  if (req.user.role === 'doctor') {
    const { DoctorModel } = await import('../models/Doctor');
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (doctor?.id !== schedule.doctorId) {
      throw new AppError('Không có quyền cập nhật lịch làm việc này', 403);
    }
  } else if (!['admin', 'staff'].includes(req.user.role)) {
    throw new AppError('Không có quyền cập nhật lịch làm việc', 403);
  }

  const updated = await ScheduleModel.update(scheduleId, req.body);

  res.json({
    success: true,
    message: 'Cập nhật lịch làm việc thành công',
    data: updated,
  });
};

export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const scheduleId = parseInt(req.params.id);
  const schedule = await ScheduleModel.findById(scheduleId);

  if (!schedule) {
    throw new AppError('Không tìm thấy lịch làm việc', 404);
  }

  // Admin/Staff có thể xóa bất kỳ lịch nào
  // Doctor chỉ xóa được lịch của mình
  if (req.user.role === 'doctor') {
    const { DoctorModel } = await import('../models/Doctor');
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (doctor?.id !== schedule.doctorId) {
      throw new AppError('Không có quyền xóa lịch làm việc này', 403);
    }
  } else if (!['admin', 'staff'].includes(req.user.role)) {
    throw new AppError('Không có quyền xóa lịch làm việc', 403);
  }

  // Delete time slots first
  await pool.query('DELETE FROM time_slots WHERE schedule_id = ?', [scheduleId]);

  // Delete schedule
  await ScheduleModel.delete(scheduleId);

  res.json({
    success: true,
    message: 'Xóa lịch làm việc thành công',
  });
};

/**
 * POST /api/schedules/generate
 * Admin endpoint to generate schedules for all doctors
 */
export const generateSchedules = async (req: AuthRequest, res: Response) => {
  // Check admin authorization
  if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
    throw new AppError('Không có quyền thực hiện', 403);
  }
  
  const { daysAhead = 30 } = req.body;
  
  try {
    const results = await scheduleGeneratorService.generateAllDoctorSchedules(daysAhead);
    
    res.json({
      success: true,
      message: `Đã tạo lịch làm việc cho ${daysAhead} ngày tới`,
      data: results
    });
  } catch (error) {
    console.error('Schedule generation error:', error);
    throw new AppError('Không thể tạo lịch làm việc', 500);
  }
};

/**
 * POST /api/schedules/generate/:doctorId
 * Generate schedules for specific doctor
 */
export const generateDoctorSchedule = async (req: AuthRequest, res: Response) => {
  const { doctorId } = req.params;
  const { daysAhead = 30, pattern } = req.body;
  
  // Check authorization (admin/staff can generate for any doctor, doctor can only generate for themselves)
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const isStaffOrAdmin = ['admin', 'staff'].includes(req.user.role);
  
  if (req.user.role === 'doctor') {
    // Doctor chỉ được generate schedule cho chính mình
    const { DoctorModel } = await import('../models/Doctor');
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (!doctor || doctor.id !== parseInt(doctorId)) {
      throw new AppError('Bạn chỉ có thể tạo lịch làm việc cho chính mình', 403);
    }
  } else if (!isStaffOrAdmin) {
    throw new AppError('Không có quyền thực hiện', 403);
  }
  
  try {
    const schedules = await scheduleGeneratorService.generateDoctorSchedules(
      parseInt(doctorId),
      daysAhead,
      pattern
    );
    
    res.json({
      success: true,
      message: 'Đã tạo lịch làm việc',
      data: {
        schedulesCreated: schedules.length,
        schedules
      }
    });
  } catch (error) {
    console.error('Doctor schedule generation error:', error);
    throw new AppError('Không thể tạo lịch làm việc', 500);
  }
};

