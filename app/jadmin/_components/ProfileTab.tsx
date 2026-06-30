'use client';

import type { ToastType } from '@/components/Toast';

export interface ProfileFormState {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Props {
  form: ProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  currentUser: { name?: string; email?: string } | null;
  showToast: (message: string, type?: ToastType) => void;
  fetchData: () => void;
}

export default function ProfileTab({ form, setForm, currentUser, showToast, fetchData }: Props) {
  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Профайл мэдээлэл</h3>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (form.newPassword) {
                if (form.newPassword !== form.confirmPassword) {
                  showToast('Шинэ нууц үг таарахгүй байна', 'error');
                  return;
                }
                if (form.newPassword.length < 8) {
                  showToast('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой', 'error');
                  return;
                }
              }

              const response = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: form.name,
                  email: form.email,
                  currentPassword: form.currentPassword || undefined,
                  newPassword: form.newPassword || undefined,
                }),
              });

              const data = await response.json();
              if (response.ok) {
                showToast('Профайл амжилттай шинэчлэгдлээ', 'success');
                setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                fetchData();
              } else {
                showToast(`Алдаа: ${data.error}`, 'error');
              }
            } catch (error) {
              console.error('Failed to update profile:', error);
              showToast('Профайл шинэчлэхэд алдаа гарлаа', 'error');
            }
          }}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Нэр *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-colors text-sm"
                required
                placeholder="Таны нэр"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Имэйл</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Имэйл өөрчлөх боломжгүй</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Нууц үг солих</h4>
            <p className="text-xs text-gray-500 mb-3">Нууц үг солихыг хүсэхгүй бол хоосон үлдээнэ үү</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Одоогийн нууц үг</label>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-colors text-sm"
                  placeholder="Одоогийн нууц үг"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Шинэ нууц үг</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-colors text-sm"
                  placeholder="Хамгийн багадаа 8 тэмдэгт"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Шинэ нууц үг давтах</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-colors text-sm"
                  placeholder="Нууц үг давтах"
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setForm({
                    name: currentUser.name || '',
                    email: currentUser.email || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors text-sm font-medium"
            >
              Хадгалах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
