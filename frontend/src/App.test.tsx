import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock date-fns/locale to avoid ESM issues with full localize functions
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

jest.mock('date-fns/locale', () => ({
  vi: {
    code: 'vi',
    formatDistance: () => '',
    formatLong: {
      date: () => 'dd/MM/yyyy',
      time: () => 'HH:mm',
      dateTime: () => 'dd/MM/yyyy HH:mm',
    },
    formatRelative: () => '',
    localize: {
      ordinalNumber: (n: number) => `${n}`,
      era: () => '',
      quarter: () => '',
      month: (n: number) => months[n] || '',
      day: (n: number) => days[n] || '',
      dayPeriod: () => '',
    },
    match: {
      ordinalNumber: () => ({ value: 1, rest: '' }),
      era: () => null,
      quarter: () => null,
      month: () => null,
      day: () => null,
      dayPeriod: () => null,
    },
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
}));

// Mock the contexts and config
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('./config/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Import App after mocking
import App from './App';

describe('App', () => {
  test('renders login page when not authenticated', () => {
    render(<App />);
    // App should render login page when not authenticated - use heading role to be specific
    expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument();
  });
});
