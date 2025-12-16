import validator from 'validator';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  // Minimum length
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  } else {
    score += 1;
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ cái in hoa');
  } else {
    score += 1;
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ cái thường');
  } else {
    score += 1;
  }

  // Number
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một số');
  } else {
    score += 1;
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%^&*...)');
  } else {
    score += 1;
  }

  // No common patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', 'password123'];
  const lowerPassword = password.toLowerCase();
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    errors.push('Mật khẩu không được chứa các chuỗi phổ biến');
  }

  // Determine strength
  if (score >= 5 && password.length >= 12) {
    strength = 'strong';
  } else if (score >= 4 && password.length >= 10) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Sanitize and validate email
 */
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email) && validator.isLength(email, { max: 255 });
};

/**
 * Sanitize string input (remove dangerous characters)
 */
export const sanitizeString = (input: string): string => {
  return validator.escape(validator.trim(input));
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (phone: string): string => {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
};











