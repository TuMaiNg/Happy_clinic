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
                  className="text-neutral-medium hover:text-primary-500 transition-colors"
                >
                  Trang chủ
                </Link>
                <Link
                  to="/book-appointment"
                  className="text-neutral-medium hover:text-primary-500 transition-colors"
                >
                  Đặt lịch
                </Link>
                <Link
                  to="/appointments"
                  className="text-neutral-medium hover:text-primary-500 transition-colors"
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
                <div className="hidden sm:block text-left">
                  <span className="block text-sm font-medium text-neutral-dark">
                    {user?.email}
                  </span>
                  <span className="block text-xs text-neutral-medium capitalize">
                    {user?.role === 'patient' ? 'Bệnh nhân' : 
                     user?.role === 'doctor' ? 'Bác sĩ' :
                     user?.role === 'staff' ? 'Nhân viên' :
                     user?.role === 'admin' ? 'Quản trị viên' : user?.role}
                  </span>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-large border border-neutral-border py-2 z-50">
                  <div className="px-4 py-2 border-b border-neutral-border">
                    <p className="text-sm font-semibold text-neutral-dark">{user?.email}</p>
                    <p className="text-xs text-neutral-medium capitalize mt-1">
                      Vai trò: {user?.role === 'patient' ? 'Bệnh nhân' : 
                                user?.role === 'doctor' ? 'Bác sĩ' :
                                user?.role === 'staff' ? 'Nhân viên' :
                                user?.role === 'admin' ? 'Quản trị viên' : user?.role}
                    </p>
                  </div>
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

