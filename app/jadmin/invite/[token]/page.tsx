'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Key, Mail, User } from 'lucide-react';
import { ToastContainer, type Toast, type ToastType } from '@/components/Toast';

export default function InviteAcceptancePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (token) {
      fetchInvite();
    }
  }, [token]);

  const fetchInvite = async () => {
    try {
      const response = await fetch(`/api/users/invites/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvite(data);
        setError(null);
      } else {
        setError(data.error || 'Урилга олдсонгүй эсвэл хүчингүй болсон байна');
      }
    } catch (error) {
      setError('Урилга шалгахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Нууц үг таарахгүй байна');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Auto-login the user after account creation
        try {
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: invite.email,
              password: formData.password,
            }),
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok && loginData.success) {
            showToast('Бүртгэл амжилттай үүслээ! Нэвтрэж байна...', 'success');
            // Redirect to admin dashboard after a short delay
            setTimeout(() => {
              router.push('/jadmin');
              router.refresh();
            }, 1000);
          } else {
            // If auto-login fails, redirect to login page
            showToast('Бүртгэл үүслээ. Нэвтрэх хуудас руу шилжиж байна...', 'info');
            setTimeout(() => {
              router.push('/jadmin/login');
            }, 1500);
          }
        } catch (loginError) {
          // If auto-login fails, redirect to login page
          showToast('Бүртгэл үүслээ. Нэвтрэх хуудас руу шилжиж байна...', 'info');
          setTimeout(() => {
            router.push('/jadmin/login');
          }, 1500);
        }
      } else {
        setError(data.error || 'Бүртгэл үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      setError('Бүртгэл үүсгэхэд алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02251A] mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <Key className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Алдаа</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/jadmin/login')}
            className="px-6 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors"
          >
            Нэвтрэх хуудас руу буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-[#02251A] rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Урилга хүлээн авах</h1>
          <p className="text-gray-600">
            {invite?.email} хаягт урилга илгээгдсэн байна
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Эрх: {invite?.role === 'super_admin' ? 'Супер админ' : 'Нийтлэгч'}
          </p>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Нэр *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
                required
                placeholder="Таны нэр"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Нууц үг *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
                required
                placeholder="Хамгийн багадаа 6 тэмдэгт"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Нууц үг давтах *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
                required
                placeholder="Нууц үгээ дахин оруулна уу"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Бүртгэж байна...' : 'Бүртгэл үүсгэх'}
          </button>
        </form>
      </div>
    </div>
  );
}
