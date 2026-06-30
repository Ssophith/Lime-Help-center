'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, User } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Нэвтрэхэд алдаа гарлаа');
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push('/jadmin');
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Нэвтрэхэд алдаа гарлаа');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02251A] via-[#034a35] to-[#02251A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <Image
                  src="/icons/lime-logo-text.png"
                  alt="LIME"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Админ самбар</h1>
            <p className="text-sm text-gray-600">Системд нэвтрэхийн тулд бүртгэлтэй имэйл эсвэл нэрээ оруулна уу</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имэйл эсвэл нэр
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-all"
                  placeholder="Имэйл эсвэл нэр"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Нууц үг
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A] transition-all"
                  placeholder="Нууц үг"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#02251A] text-white rounded-lg hover:bg-[#034a35] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Нэвтэрч байна...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Нэвтрэх
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
