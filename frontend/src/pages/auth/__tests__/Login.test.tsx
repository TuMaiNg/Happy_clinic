import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../Login';
import { useAuth } from '../../../contexts/AuthContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the auth context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    // Default mock implementation
    mockUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({}),
      logout: jest.fn(),
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
    expect(screen.getByText('Chào mừng bạn trở lại!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('displays error message on login failure', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      logout: jest.fn(),
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    renderLogin();

    const emailInput = screen.getByPlaceholderText('email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/đăng nhập thất bại/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
    await userEvent.click(submitButton);

    const emailInput = screen.getByPlaceholderText('email@example.com');
    expect(emailInput).toBeRequired();
  });

  it('shows loading state during login', async () => {
    let resolveLogin: any;
    const mockLogin = jest.fn(() => new Promise((resolve) => {
      resolveLogin = resolve;
    }));
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      logout: jest.fn(),
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    renderLogin();

    const emailInput = screen.getByPlaceholderText('email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/đang đăng nhập/i)).toBeInTheDocument();
    });

    resolveLogin();
  });

  it('has link to register page', () => {
    renderLogin();
    const registerLink = screen.getByRole('link', { name: /đăng ký ngay/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('has forgot password link', () => {
    renderLogin();
    const forgotPasswordLink = screen.getByRole('link', { name: /quên mật khẩu/i });
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });
});

