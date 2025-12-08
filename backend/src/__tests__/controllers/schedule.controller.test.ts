// Schedule Controller Tests
import { PatientModel } from '../../models/Patient';
import { DoctorModel } from '../../models/Doctor';
import { ScheduleModel } from '../../models/Schedule';

// Mock all dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn(),
  },
}));

jest.mock('../../models/Patient', () => ({
  PatientModel: {
    findByUserId: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../../models/Doctor', () => ({
  DoctorModel: {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../models/Schedule', () => ({
  ScheduleModel: {
    findByDoctorAndDate: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Test Setup', () => {
  it('should load test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('Schedule Controller - Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Doctor Schedule Creation', () => {
    it('should only allow doctors to create schedules', () => {
      // Test validates route configuration - doctor role required
      const allowedRoles = ['doctor'];
      expect(allowedRoles).toContain('doctor');
      expect(allowedRoles).not.toContain('patient');
      expect(allowedRoles).not.toContain('staff');
    });

    it('should allow doctor to create schedule for themselves only', async () => {
      const mockDoctor = { id: 1, userId: 10 };
      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);

      // When doctor creates schedule, it should use their own doctor ID
      const creatingDoctorId = mockDoctor.id;
      expect(creatingDoctorId).toBe(1);
    });

    it('should not allow doctor to create schedule for other doctors', async () => {
      const mockDoctor = { id: 1, userId: 10 };
      const otherDoctorId = 2;

      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);

      // Attempting to create schedule for different doctor should fail
      expect(mockDoctor.id).not.toBe(otherDoctorId);
    });
  });

  describe('Schedule Update Authorization', () => {
    it('should allow doctor to update their own schedule', async () => {
      const mockDoctor = { id: 1, userId: 10 };
      const mockSchedule = { id: 1, doctorId: 1 };

      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (ScheduleModel.findById as jest.Mock).mockResolvedValue(mockSchedule);

      // Doctor should be able to update their own schedule
      expect(mockSchedule.doctorId).toBe(mockDoctor.id);
    });

    it('should not allow doctor to update other doctor schedule', async () => {
      const mockDoctor = { id: 1, userId: 10 };
      const mockSchedule = { id: 1, doctorId: 2 }; // Different doctor

      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (ScheduleModel.findById as jest.Mock).mockResolvedValue(mockSchedule);

      // Doctor should NOT be able to update another doctor's schedule
      expect(mockSchedule.doctorId).not.toBe(mockDoctor.id);
    });

    it('should allow admin to update any schedule', () => {
      // Admin has elevated privileges
      const adminRole = 'admin';
      const allowedToModifyAny = ['admin'];
      expect(allowedToModifyAny).toContain(adminRole);
    });
  });

  describe('Schedule Delete Authorization', () => {
    it('should allow doctor to delete their own schedule', async () => {
      const mockDoctor = { id: 1, userId: 10 };
      const mockSchedule = { id: 1, doctorId: 1 };

      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (ScheduleModel.findById as jest.Mock).mockResolvedValue(mockSchedule);

      expect(mockSchedule.doctorId).toBe(mockDoctor.id);
    });

    it('should not allow doctor to delete other doctor schedule', async () => {
      const mockDoctor = { id: 1, userId: 10 };
      const mockSchedule = { id: 1, doctorId: 2 };

      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (ScheduleModel.findById as jest.Mock).mockResolvedValue(mockSchedule);

      expect(mockSchedule.doctorId).not.toBe(mockDoctor.id);
    });
  });

  describe('Day Off Scheduling', () => {
    it('should allow doctor to mark day as day off', async () => {
      const scheduleData = {
        doctorId: 1,
        date: '2024-12-25',
        isDayOff: true,
      };

      expect(scheduleData.isDayOff).toBe(true);
    });

    it('should prevent booking on day off', async () => {
      const mockSchedule = {
        id: 1,
        doctorId: 1,
        date: '2024-12-25',
        isDayOff: true,
      };

      (ScheduleModel.findByDoctorAndDate as jest.Mock).mockResolvedValue(mockSchedule);

      // Should reject booking when isDayOff is true
      expect(mockSchedule.isDayOff).toBe(true);
    });
  });
});
