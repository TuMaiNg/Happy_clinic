import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateTokens, verifyToken } from '../../utils/jwt';

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await comparePassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await comparePassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('JWT Tokens', () => {
    const testPayload = {
      userId: 1,
      email: 'test@example.com',
      role: 'patient',
    };

    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(testPayload);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });

    it('should verify valid access token', () => {
      const tokens = generateTokens(testPayload);
      const decoded = verifyToken(tokens.accessToken, false);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should verify valid refresh token', () => {
      const tokens = generateTokens(testPayload);
      const decoded = verifyToken(tokens.refreshToken, true);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token', false);
      }).toThrow();
    });

    it('should throw error when using access token as refresh token', () => {
      const tokens = generateTokens(testPayload);
      
      expect(() => {
        verifyToken(tokens.accessToken, true); // Using access token with refresh secret
      }).toThrow();
    });
  });
});
