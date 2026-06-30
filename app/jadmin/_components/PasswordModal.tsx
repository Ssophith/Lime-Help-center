'use client';

import { X } from 'lucide-react';
import type { ToastType } from '@/components/Toast';

interface User {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  showToast: (message: string, type?: ToastType) => void;
  fetchData: () => void;
}

export default function PasswordModal({ open, user, onClose, showToast, fetchData }: Props) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Нууц үг солих</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            const newPassword = formData.get('newPassword') as string;
            const confirmPassword = formData.get('confirmPassword') as string;

            if (newPassword !== confirmPassword) {
              showToast('Нууц үг таарахгүй байна', 'error');
              return;
            }
            if (newPassword.length < 8) {
              showToast('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой', 'error');
              return;
            }

            try {
              const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  action: 'change_password',
                  password: newPassword,
                }),
              });
              const data = await response.json();
              if (response.ok) {
                showToast('Нууц үг амжилттай солигдлоо', 'success');
                onClose();
                fetchData();
              } else {
                showToast(`Алдаа: ${data.error}`, 'error');
              }
            } catch (error) {
              console.error('Failed to change password:', error);
              showToast('Нууц үг солихөд алдаа гарлаа', 'error');
            }
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Шинэ нууц үг *</label>
            <input
              type="password"
              name="newPassword"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
              required
              placeholder="Хамгийн багадаа 8 тэмдэгт"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Нууц үг давтах *</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
              required
              placeholder="Нууц үгээ дахин оруулна уу"
              minLength={8}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors"
            >
              Хадгалах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
