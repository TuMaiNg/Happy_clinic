import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { api } from '../../../config/api';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
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
      const notifications = response.data.data || [];
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogout = async () => {
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
    </header>
  );
};

