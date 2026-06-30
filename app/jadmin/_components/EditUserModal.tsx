'use client';

import { X } from 'lucide-react';
import type { ToastType } from '@/components/Toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'publisher';
}

export interface EditUserFormState {
  name: string;
  email: string;
  role: 'super_admin' | 'publisher';
}

interface Props {
  open: boolean;
  user: User | null;
  form: EditUserFormState;
  setForm: React.Dispatch<React.SetStateAction<EditUserFormState>>;
  onClose: () => void;
  showToast: (message: string, type?: ToastType) => void;
  fetchData: () => void;
}

export default function EditUserModal({ open, user, form, setForm, onClose, showToast, fetchData }: Props) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Хэрэглэгч засах</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  action: 'update_details',
                  name: form.name,
                }),
              });
              const data = await response.json();
              if (response.ok) {
                showToast('Хэрэглэгч амжилттай шинэчлэгдлээ', 'success');
                onClose();
                fetchData();
              } else {
                showToast(`Алдаа: ${data.error}`, 'error');
              }
            } catch (error) {
              console.error('Failed to update user:', error);
              showToast('Хэрэглэгч шинэчлэхэд алдаа гарлаа', 'error');
            }
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Нэр *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имэйл</label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Имэйл хаягийг өөрчлөх боломжгүй</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Эрх</label>
            <select
              value={form.role}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            >
              <option value="publisher">Нийтлэгч</option>
              <option value="super_admin">Супер админ</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Эрхийг өөрчлөх боломжгүй</p>
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
