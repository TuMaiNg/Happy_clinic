import React from 'react';
import {
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: 'calendar' | 'clock' | 'money' | 'users';
  color: 'blue' | 'orange' | 'green' | 'purple';
  trend?: string;
}

const iconMap = {
  calendar: CalendarIcon,
  clock: ClockIcon,
  money: CurrencyDollarIcon,
  users: UsersIcon,
};

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
}) => {
  const Icon = iconMap[icon];
  const colors = colorClasses[color];

  return (
    <div className={`stats-card ${colors.bg} ${colors.border}`}>
      <div className="stats-card-header">
        <div className={`stats-card-icon ${colors.icon}`}>
          <Icon className="stats-icon" />
        </div>
        {trend && (
          <span className="stats-trend positive">{trend}</span>
        )}
      </div>
      <div className="stats-card-body">
        <h3 className="stats-card-title">{title}</h3>
        <p className="stats-card-value">{value}</p>
      </div>
    </div>
  );
};

