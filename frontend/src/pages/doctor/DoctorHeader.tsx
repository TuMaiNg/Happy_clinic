import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import './header.css';

export const DoctorHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="staff-header">
      <div className="header-left">
        <h1 className="header-title">Lịch hẹn bác sĩ</h1>
      </div>

      <div className="header-right">
        <div className="user-menu-wrapper" ref={menuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <UserCircleIcon className="user-avatar-icon" />
            <span className="user-name">{user?.email || 'Bác sĩ'}</span>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-item">
                <span className="user-menu-label">Email:</span>
                <span className="user-menu-value">{user?.email}</span>
              </div>
              <div className="user-menu-item">
                <span className="user-menu-label">Vai trò:</span>
                <span className="user-menu-value">Bác sĩ</span>
              </div>
              <div className="user-menu-divider"></div>
              <button className="user-menu-action" onClick={handleLogout}>
                <ArrowRightOnRectangleIcon className="btn-icon" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
};



