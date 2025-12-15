import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock useAuth hook - this will be used by components
export const mockUseAuth = {
  user: { id: 1, email: 'test@example.com', role: 'patient' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

// Mock AuthProvider để tránh dependency issues - chỉ render children
// Các test file sẽ tự mock useAuth hook nếu cần
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Mock Router wrapper
const MockRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <MockRouter>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </MockRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };



