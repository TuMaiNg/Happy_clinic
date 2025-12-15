import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import './header.css';

export const StaffHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  return (
    <header className="staff-header">
      <div className="staff-header-left">
        <h1 className="staff-header-title">Quản lý lịch hẹn</h1>
      </div>

      <div className="staff-header-right">
        <div className="staff-user-menu-wrapper" ref={menuRef}>
          <button
            className="staff-user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Menu người dùng"
          >
            <UserCircleIcon className="staff-user-avatar-icon" />
            <span className="staff-user-name">{user?.email || 'Staff'}</span>
            <svg
              className={`staff-user-menu-arrow ${showUserMenu ? 'open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showUserMenu && (
            <div className="staff-user-menu-dropdown">
              <div className="staff-user-menu-header">
                <div className="staff-user-menu-avatar">
                  <UserCircleIcon className="staff-user-menu-avatar-icon" />
                </div>
                <div className="staff-user-menu-info">
                  <div className="staff-user-menu-name">{user?.email || 'Staff'}</div>
                  <div className="staff-user-menu-role">Nhân viên</div>
                </div>
              </div>
              <div className="staff-user-menu-divider"></div>
              <div className="staff-user-menu-item">
                <span className="staff-user-menu-label">Email:</span>
                <span className="staff-user-menu-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="staff-user-menu-item">
                <span className="staff-user-menu-label">Vai trò:</span>
                <span className="staff-user-menu-value">Nhân viên</span>
              </div>
              <div className="staff-user-menu-divider"></div>
              <button className="staff-user-menu-action" onClick={handleLogout}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 14H3.333C2.979 14 2.639 13.8595 2.389 13.6095C2.139 13.3595 1.998 13.0195 1.998 12.6655V3.33248C1.998 2.97848 2.139 2.63848 2.389 2.38848C2.639 2.13848 2.979 1.99805 3.333 1.99805H6M10.667 11.3325L14 7.99848M14 7.99848L10.667 4.66548M14 7.99848H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


