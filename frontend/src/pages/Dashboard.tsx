import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng đến với Happy Care Clinic
          </h1>
          <p className="mt-2 text-gray-600">
            Xin chào, {user?.email}. Vai trò: {user?.role}
          </p>
        </div>
      </div>
    </div>
  );
};

