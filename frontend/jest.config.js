module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  
  // Don't ignore axios and other ESM packages - react-scripts sử dụng babel-jest
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|@heroicons|react-router-dom|date-fns)/)',
  ],
  
  // Module name mapper for imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-router-dom$': '<rootDir>/src/__mocks__/react-router-dom.tsx',
    '^date-fns/locale$': '<rootDir>/src/__mocks__/date-fns-locale.ts',
  },
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Resolve extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};



