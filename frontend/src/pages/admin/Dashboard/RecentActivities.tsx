import React, { useState, useEffect } from 'react';
import { api } from '../../../config/api';
import { format } from 'date-fns';

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Get recent appointments as activities
      const response = await api.get('/appointments');
      const appointments = (response.data.data || []).slice(0, 10);

      const activityList: Activity[] = appointments.map((apt: any) => ({
        id: apt.id,
        type: 'appointment',
        description: `Lịch hẹn #${apt.id} - ${apt.patient_name || 'N/A'}`,
        timestamp: apt.createdAt || apt.created_at || new Date().toISOString(),
        user: apt.patient_name || 'N/A',
      }));

      setActivities(activityList);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="activities-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activities-empty">
        <p>Chưa có hoạt động nào</p>
      </div>
    );
  }

  return (
    <div className="recent-activities">
      <ul className="activities-list">
        {activities.map((activity) => (
          <li key={activity.id} className="activity-item">
            <div className="activity-icon">
              <div className="activity-dot"></div>
            </div>
            <div className="activity-content">
              <p className="activity-description">{activity.description}</p>
              <span className="activity-time">
                {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

