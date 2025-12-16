import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components
export const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-soft border border-neutral-border">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton height={20} width="60%" className="mb-2" />
        <Skeleton height={16} width="40%" />
      </div>
    </div>
    <Skeleton height={16} width="100%" className="mb-2" />
    <Skeleton height={16} width="80%" />
  </div>
);

export const SkeletonAppointmentCard = () => (
  <div className="appointment-card">
    <div className="card-header">
      <Skeleton height={24} width="40%" />
      <Skeleton height={20} width={80} className="rounded-full" />
    </div>
    <div className="card-body space-y-2">
      <Skeleton height={16} width="70%" />
      <Skeleton height={16} width="60%" />
      <Skeleton height={16} width="50%" />
    </div>
    <div className="card-actions">
      <Skeleton height={36} width={100} className="rounded-lg" />
    </div>
  </div>
);

export const SkeletonTimeSlot = () => (
  <div className="p-4 rounded-xl border-2 border-neutral-border bg-white animate-pulse">
    <Skeleton height={24} width={60} className="mb-2 mx-auto" />
    <Skeleton height={14} width={80} className="mx-auto" />
  </div>
);

export const SkeletonDoctorCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-soft border border-neutral-border">
    <div className="flex flex-col items-center text-center">
      <Skeleton variant="circular" width={80} height={80} className="mb-4" />
      <Skeleton height={20} width="70%" className="mb-2" />
      <Skeleton height={16} width="50%" className="mb-4" />
      <Skeleton height={36} width="100%" className="rounded-lg" />
    </div>
  </div>
);


