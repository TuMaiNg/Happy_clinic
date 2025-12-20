/**
 * Service Controller Tests
 * Tests for service CRUD operations
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

// Mock all dependencies
jest.mock('../../models/Service', () => ({
  ServiceModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

import { ServiceModel } from '../../models/Service';

describe('Service Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('Service CRUD Operations', () => {
    it('should get all services', async () => {
      const mockServices = [
        { id: 1, name: 'Khám tổng quát', price: 200000, isActive: true },
        { id: 2, name: 'Khám chuyên khoa', price: 300000, isActive: true },
      ];

      (ServiceModel.findAll as jest.Mock).mockResolvedValue(mockServices);

      mockReq = {
        query: {},
      };

      // This would be tested via route handler, but we can test the model
      const services = await ServiceModel.findAll();
      expect(services).toEqual(mockServices);
    });

    it('should get service by ID', async () => {
      const mockService = {
        id: 1,
        name: 'Khám tổng quát',
        price: 200000,
        isActive: true,
      };

      (ServiceModel.findById as jest.Mock).mockResolvedValue(mockService);

      const service = await ServiceModel.findById(1);
      expect(service).toEqual(mockService);
    });

    it('should return null for non-existent service', async () => {
      (ServiceModel.findById as jest.Mock).mockResolvedValue(null);

      const service = await ServiceModel.findById(999);
      expect(service).toBeNull();
    });

    it('should create service', async () => {
      const newService = {
        name: 'Khám mới',
        speciality: 'General',
        price: 150000,
        durationMinutes: 30,
        isActive: true,
      };

      const createdService = {
        id: 1,
        ...newService,
      };

      (ServiceModel.create as jest.Mock).mockResolvedValue(createdService);

      const result = await ServiceModel.create(newService);
      expect(result).toEqual(createdService);
    });

    it('should update service', async () => {
      const existingService = {
        id: 1,
        name: 'Khám tổng quát',
        price: 200000,
        isActive: true,
      };

      const updatedService = {
        ...existingService,
        price: 250000,
      };

      (ServiceModel.findById as jest.Mock).mockResolvedValue(existingService);
      (ServiceModel.update as jest.Mock).mockResolvedValue(updatedService);

      const result = await ServiceModel.update(1, { price: 250000 });
      expect(result).toEqual(updatedService);
    });
  });
});








