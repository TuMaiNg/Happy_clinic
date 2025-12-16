import React from 'react';

const mockNavigate = jest.fn();

// Mock all exports from react-router-dom
export const useNavigate = () => mockNavigate;
export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
});
export const useParams = () => ({});
export const useSearchParams = () => [new URLSearchParams(), jest.fn()];
export const useMatch = () => null;

export const BrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const MemoryRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const Route: React.FC<{
  path?: string;
  element?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ element, children }) => (
  <>{element || children}</>
);

export const Navigate: React.FC<{ to: string; replace?: boolean }> = () => null;

export const Link: React.FC<{
  to: string;
  children: React.ReactNode;
  className?: string;
}> = ({ to, children, className }) => (
  <a href={to} className={className}>
    {children}
  </a>
);

export const NavLink: React.FC<{
  to: string;
  children: React.ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
}> = ({ to, children, className }) => (
  <a href={to} className={typeof className === 'function' ? className({ isActive: false }) : className}>
    {children}
  </a>
);

export const Outlet: React.FC = () => null;

// Export mock navigate for testing
export const __mockNavigate = mockNavigate;

export default {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  useMatch,
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  Outlet,
};














