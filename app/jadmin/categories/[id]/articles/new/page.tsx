'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import TinyMCEEditor from '@/components/TinyMCEEditor';

export default function NewArticlePage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    excerpt: '',
    order: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          slug: formData.slug,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || undefined,
          order: formData.order,
        }),
      });
      if (response.ok) {
        router.push(`/jadmin/categories/${categoryId}`);
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error || 'Нийтлэл үүсгэхэд алдаа гарлаа'}`);
      }
    } catch (error) {
      console.error('Failed to create article:', error);
      alert('Нийтлэл үүсгэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href={`/jadmin/categories/${categoryId}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Шинэ нийтлэл</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) *
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
                Гарчиг *
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
                    placeholder="Энд нийтлэлийн агуулгаа бичнэ үү..."
                    categoryId={categoryId}
                    articleId={`temp-${Date.now()}`} // Temporary ID for uploads before article is created
                  />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Товчлол
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                rows={2}
              />
            </div>

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
                {loading ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
              <Link
                href={`/jadmin/categories/${categoryId}`}
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
