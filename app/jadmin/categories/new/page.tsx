'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import IconSelector from '@/components/IconSelector';

export default function NewCategoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    icon: '',
    iconColor: '#FEF3C7', // Default soft yellow
    order: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.slug,
          title: formData.title,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          iconColor: formData.iconColor || undefined,
          order: formData.order,
          articles: [],
        }),
      });
      if (response.ok) {
        router.push('/jadmin');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Шинэ ангилал</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL хаяг)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                required
              />
            </div>

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
                Тайлбар
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                rows={3}
              />
            </div>

            <IconSelector
              value={formData.icon}
              color={formData.iconColor}
              onChange={(iconUrl) => setFormData({ ...formData, icon: iconUrl })}
              onColorChange={(color) => setFormData({ ...formData, iconColor: color })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дараалал
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
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
