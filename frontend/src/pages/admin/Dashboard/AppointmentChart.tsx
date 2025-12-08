import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { format, subDays } from 'date-fns';

interface ChartData {
  date: string;
  count: number;
}

export const AppointmentChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      const appointments = response.data.data || [];

      // Get last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      // Count appointments per day
      const chartData = last7Days.map((date) => ({
        date,
        count: appointments.filter((apt: any) => {
          const aptDate = apt.appointmentDate
            ? new Date(apt.appointmentDate).toISOString().split('T')[0]
            : apt.appointment_date;
          return aptDate === date;
        }).length,
      }));

      setData(chartData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count), 1) : 1;

  return (
    <div className="appointment-chart">
      <div className="chart-bars">
        {data.map((item, index) => {
          const height = (item.count / maxCount) * 100;
          const date = new Date(item.date);
          return (
            <div key={index} className="chart-bar-wrapper">
              <div className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ height: `${height}%` }}
                  title={`${format(date, 'dd/MM')}: ${item.count} lịch hẹn`}
                >
                  <span className="chart-bar-value">{item.count}</span>
                </div>
              </div>
              <span className="chart-bar-label">
                {format(date, 'dd/MM')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

