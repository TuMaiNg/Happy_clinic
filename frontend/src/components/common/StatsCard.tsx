/**
 * Reusable Stats Card Component
 * Used across all dashboards for consistent design
 */

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  onClick,
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    error: 'bg-status-error',
    info: 'bg-status-info',
  };

  return (
    <div
      className={`card card-hover ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-dark">{value}</p>
          {trend && (
            <div className={`mt-2 text-xs flex items-center gap-1 ${
              trend.isPositive ? 'text-status-success' : 'text-status-error'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={trend.isPositive ? "M13 7l5 5m0 0l-5 5m5-5H6" : "M13 17l5-5m0 0l-5-5m5 5H6"}
                />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={`${colorClasses[color]} rounded-lg p-3 text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

