// Test setup file
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock database to prevent actual connections
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn(),
  },
}));

// Dummy test to make Jest happy
describe('Test Setup', () => {
  it('should load test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

// Clean up after all tests
afterAll(async () => {
  // Note: Database is mocked in tests, so no actual cleanup needed
  // The teardown warnings are from mysql2 trying to clean up after Jest environment
  // This is a known issue and doesn't affect test results
}, 5000);
