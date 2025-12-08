import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

const menuItems: MenuItem[] = [
  { path: '/admin', icon: HomeIcon, label: 'Tổng quan' },
  { path: '/admin/appointments', icon: CalendarIcon, label: 'Lịch hẹn' },
  { path: '/admin/patients', icon: UsersIcon, label: 'Bệnh nhân' },
  { path: '/admin/doctors', icon: UserGroupIcon, label: 'Bác sĩ' },
  { path: '/admin/services', icon: ClipboardDocumentListIcon, label: 'Dịch vụ' },
  { path: '/admin/payments', icon: CreditCardIcon, label: 'Thanh toán' },
  { path: '/admin/reports', icon: ChartBarIcon, label: 'Báo cáo' },
  { path: '/admin/settings', icon: CogIcon, label: 'Cài đặt' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-wrapper">
          <img src="/logo-icon.svg" alt="Happy Care Logo" className="sidebar-logo-img" />
        </div>
        <h2 className="sidebar-title">Happy Care</h2>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

