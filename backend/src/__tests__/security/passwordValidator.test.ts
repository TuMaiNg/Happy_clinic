import { validatePassword, validateEmail, sanitizeString, sanitizePhone } from '../../utils/passwordValidator';

describe('Password Validator', () => {
  describe('validatePassword', () => {
    it('should reject weak passwords', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải có ít nhất một chữ cái in hoa');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải có ít nhất một chữ cái thường');
    });

    it('should reject password without number', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải có ít nhất một số');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('ký tự đặc biệt'))).toBe(true);
    });

    it('should reject password with common patterns', () => {
      const result = validatePassword('Password123!');
      // This should pass basic requirements but might fail on common patterns
      const resultWithPattern = validatePassword('Password123456!');
      expect(resultWithPattern.errors.some(e => e.includes('chuỗi phổ biến'))).toBe(true);
    });

    it('should accept strong password', () => {
      const result = validatePassword('StrongPass123!@#');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.strength).toBe('strong');
    });

    it('should accept medium strength password', () => {
      const result = validatePassword('MediumPass123!');
      expect(result.isValid).toBe(true);
      expect(['medium', 'strong']).toContain(result.strength);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only digits and +', () => {
      expect(sanitizePhone('+84 123 456 789')).toBe('+84123456789');
      expect(sanitizePhone('0123-456-789')).toBe('0123456789');
    });

    it('should remove special characters', () => {
      expect(sanitizePhone('(123) 456-7890')).toBe('1234567890');
    });
  });
});

