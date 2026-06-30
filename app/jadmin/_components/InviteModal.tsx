'use client';

import { X } from 'lucide-react';
import type { ToastType } from '@/components/Toast';

export interface InviteFormState {
  email: string;
  role: 'super_admin' | 'publisher';
}

interface Props {
  open: boolean;
  form: InviteFormState;
  setForm: React.Dispatch<React.SetStateAction<InviteFormState>>;
  onClose: () => void;
  showToast: (message: string, type?: ToastType) => void;
  fetchData: () => void;
}

export default function InviteModal({ open, form, setForm, onClose, showToast, fetchData }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Хэрэглэгч урих</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'invite',
                  email: form.email,
                  role: form.role,
                }),
              });
              const data = await response.json();
              if (response.ok) {
                showToast('Урилга амжилттай илгээгдлээ', 'success');
                onClose();
                setForm({ email: '', role: 'publisher' });
                fetchData();
              } else {
                showToast(`Алдаа: ${data.error}`, 'error');
              }
            } catch (error) {
              console.error('Failed to send invite:', error);
              showToast('Урилга илгээхэд алдаа гарлаа', 'error');
            }
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имэйл *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-colors"
              required
              placeholder="user@onlime.mn"
            />
            <p className="text-xs text-gray-500 mt-1.5">Зөвхөн @onlime.mn домэйнтэй имэйл зөвшөөрөгдөнө</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Эрх *</label>
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as 'super_admin' | 'publisher' }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-colors"
              required
            >
              <option value="publisher">Нийтлэгч</option>
              <option value="super_admin">Супер админ</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                setForm({ email: '', role: 'publisher' });
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors font-medium"
            >
              Урилга илгээх
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
