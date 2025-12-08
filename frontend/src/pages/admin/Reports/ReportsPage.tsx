import React from 'react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Báo cáo & Phân tích</h1>
          <p className="text-muted">Xem các báo cáo và thống kê</p>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Báo cáo lịch hẹn</h3>
          <p>Thống kê lịch hẹn theo thời gian</p>
          <button className="btn btn-primary">Xem báo cáo</button>
        </div>

        <div className="report-card">
          <h3>Báo cáo doanh thu</h3>
          <p>Thống kê doanh thu theo kỳ</p>
          <button className="btn btn-primary">Xem báo cáo</button>
        </div>

        <div className="report-card">
          <h3>Hiệu suất bác sĩ</h3>
          <p>Thống kê hiệu suất làm việc của bác sĩ</p>
          <button className="btn btn-primary">Xem báo cáo</button>
        </div>
      </div>
    </div>
  );
};

