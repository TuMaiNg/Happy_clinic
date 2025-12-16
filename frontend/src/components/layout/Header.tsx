import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { NotificationCenter } from '../features/notifications/NotificationCenter';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src="/logo-icon.svg" 
              alt="Happy Care Logo" 
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-neutral-dark hidden sm:block">
              Happy Care Clinic
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user?.role === 'patient' && (
              <>
                <Link
                  to="/dashboard"
                  className="font-semibold text-neutral-medium hover:text-primary-500 transition-colors"
                >
                  Trang chủ
                </Link>
                <Link
                  to="/book-appointment"
                  className="font-semibold text-neutral-medium hover:text-primary-500 transition-colors"
                >
                  Đặt lịch
                </Link>
                <Link
                  to="/appointments"
                  className="font-semibold text-neutral-medium hover:text-primary-500 transition-colors"
                >
                  Lịch hẹn
                </Link>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-light transition-colors"
              >
                <UserCircleIcon className="w-6 h-6 text-neutral-medium" />
                <span className="hidden sm:block text-sm font-medium text-neutral-dark">
                  {user?.email}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-neutral-border py-2 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-light"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Hồ sơ
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-light flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

