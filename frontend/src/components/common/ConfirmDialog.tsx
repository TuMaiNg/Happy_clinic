import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'warning',
  icon,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (icon) return icon;
    if (type === 'danger') {
      return (
        <div className="confirm-icon confirm-icon-danger">
          <ExclamationTriangleIcon className="w-8 h-8" />
        </div>
      );
    }
    return (
      <div className="confirm-icon confirm-icon-warning">
        <ExclamationTriangleIcon className="w-8 h-8" />
      </div>
    );
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-dialog-close" onClick={onCancel}>
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="confirm-dialog-content">
          {getIcon()}
          
          <div className="confirm-dialog-text">
            {title && <h3 className="confirm-dialog-title">{title}</h3>}
            <p className="confirm-dialog-message">{message}</p>
          </div>
        </div>

        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};












