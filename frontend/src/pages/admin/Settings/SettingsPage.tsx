import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Cài đặt hệ thống</h1>
          <p className="text-muted">Cấu hình hệ thống và thông tin phòng khám</p>
        </div>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <h3>Thông tin phòng khám</h3>
          <p>Quản lý thông tin phòng khám</p>
          <button className="btn btn-primary">Cấu hình</button>
        </div>

        <div className="settings-section">
          <h3>Quản lý người dùng</h3>
          <p>Quản lý tài khoản người dùng</p>
          <button className="btn btn-primary">Quản lý</button>
        </div>
      </div>
    </div>
  );
};







