'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import TinyMCEEditor from '@/components/TinyMCEEditor';

export default function NewFAQPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    order: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          order: formData.order,
        }),
      });
      if (response.ok) {
        router.push('/jadmin');
      }
    } catch (error) {
      console.error('Failed to create FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/jadmin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Шинэ FAQ</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Гарчиг
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Агуулга *
              </label>
              <TinyMCEEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content: content })}
                placeholder="Энд FAQ-ийн агуулгаа бичнэ үү..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дараалал
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A] disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                Хадгалах
              </button>
              <Link
                href="/jadmin"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Цуцлах
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
