'use client';

import { X, AlertTriangle, Trash2, Ban, Play, RotateCw } from 'lucide-react';

export type ConfirmActionType = 'delete' | 'suspend' | 'activate' | 'cancel' | 'resend' | 'default';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  actionType?: ConfirmActionType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  actionType = 'default',
  confirmText,
  cancelText = 'Цуцлах',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'suspend':
        return <Ban className="h-6 w-6 text-orange-600" />;
      case 'activate':
        return <Play className="h-6 w-6 text-green-600" />;
      case 'cancel':
        return <X className="h-6 w-6 text-gray-600" />;
      case 'resend':
        return <RotateCw className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getButtonColor = () => {
    switch (actionType) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'suspend':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'activate':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'cancel':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'resend':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-[#02251A] hover:bg-[#02251A]/90 text-white';
    }
  };

  const handleConfirm = () => {
    // Close modal first
    onClose();
    // Then execute the action after a small delay to ensure modal is closed
    setTimeout(() => {
      onConfirm();
    }, 100);
  };

  const defaultConfirmText = () => {
    switch (actionType) {
      case 'delete':
        return 'Устгах';
      case 'suspend':
        return 'Идэвхгүй болгох';
      case 'activate':
        return 'Идэвхтэй болгох';
      case 'cancel':
        return 'Цуцлах';
      case 'resend':
        return 'Дахин илгээх';
      default:
        return 'Тийм';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 ${getButtonColor()}`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Хүлээгээд байна...
                    </span>
                  ) : (
                    confirmText || defaultConfirmText()
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
