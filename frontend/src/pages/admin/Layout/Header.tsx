import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { api } from '../../../config/api';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotificationCount();
  }, []);

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

  const loadNotificationCount = async () => {
    try {
      const response = await api.get('/notifications?unread=true');
      const notifications = response?.data?.data || response?.data || [];
      setNotificationCount(Array.isArray(notifications) ? notifications.length : 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotificationCount(0);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="header-title">Quản trị hệ thống</h1>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" title="Thông báo">
          <BellIcon className="header-icon" />
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </button>

        <div className="user-menu-wrapper" ref={menuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <UserCircleIcon className="user-avatar-icon" />
            <span className="user-name">{user?.email || 'Admin'}</span>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-item">
                <span className="user-menu-label">Email:</span>
                <span className="user-menu-value">{user?.email}</span>
              </div>
              <div className="user-menu-item">
                <span className="user-menu-label">Vai trò:</span>
                <span className="user-menu-value">{user?.role}</span>
              </div>
              <div className="user-menu-divider"></div>
              <button className="user-menu-action" onClick={handleLogout}>
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

