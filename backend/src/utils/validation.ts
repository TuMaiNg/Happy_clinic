/**
 * Validation utilities for request parameters
 */
import { AppError } from '../middleware/errorHandler';

/**
 * Parse and validate integer from request parameter
 * @param value - The value to parse
 * @param paramName - Name of the parameter for error message
 * @returns Validated integer
 * @throws AppError if value is invalid
 */
export const validateIntParam = (value: string | undefined, paramName: string = 'id'): number => {
  if (!value) {
    throw new AppError(`${paramName} là bắt buộc`, 400);
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed) || parsed <= 0) {
    throw new AppError(`${paramName} phải là số nguyên dương`, 400);
  }

  return parsed;
};

/**
 * Parse and validate integer from query parameter (optional)
 * @param value - The value to parse
 * @param defaultValue - Default value if not provided
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (optional)
 * @returns Validated integer or default
 */
export const validateIntQuery = (
  value: string | undefined,
  defaultValue: number = 0,
  min: number = 0,
  max?: number
): number => {
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed) || parsed < min) {
    return defaultValue;
  }

  if (max !== undefined && parsed > max) {
    return max;
  }

  return parsed;
};

/**
 * Validate email format
 */
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Vietnamese)
 */
export const validatePhoneFormat = (phone: string): boolean => {
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
};

