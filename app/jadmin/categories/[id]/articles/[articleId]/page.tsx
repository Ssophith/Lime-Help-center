'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import type { Category, Article } from '@/types';
import TinyMCEEditor from '@/components/TinyMCEEditor';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const articleId = params.articleId as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    slug: '',
    title: '',
    content: '',
    excerpt: '',
    order: 0,
    status: 'draft' as 'published' | 'draft' | 'archived',
  });

  useEffect(() => {
    fetchArticle();
  }, [categoryId, articleId]);

  const fetchArticle = async () => {
    try {
      const response = await fetch('/api/categories?includeAllStatuses=true');
      const categoriesData: Category[] = await response.json();
      setCategories(categoriesData);
      const category = categoriesData.find(cat => cat.id === categoryId);
      if (category) {
        const found = category.articles.find(art => art.id === articleId);
        if (found) {
          setArticle(found);
          setFormData({
            categoryId: categoryId,
            slug: found.slug || '',
            title: found.title || '',
            content: found.content || '',
            excerpt: found.excerpt || '',
            order: found.order || 0,
            status: found.status || 'draft',
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          articleId,
          slug: formData.slug,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || undefined,
          order: formData.order,
          status: formData.status,
        }),
      });
      if (response.ok) {
        router.push(`/jadmin?menu=articles`);
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error || 'Нийтлэл шинэчлэхэд алдаа гарлаа'}`);
      }
    } catch (error) {
      console.error('Failed to update article:', error);
      alert('Нийтлэл шинэчлэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <p className="text-gray-600">Уншиж байна...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Нийтлэл олдсонгүй</p>
          <Link href={`/jadmin/categories/${categoryId}`} className="text-[#02251A] hover:text-[#02251A]">
            Буцах
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href={`/jadmin/categories/${categoryId}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Нийтлэл засах</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ангилал *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                required
              >
                <option value="">Сонгох...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' | 'archived' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                required
              >
                <option value="draft">Ноорог</option>
                <option value="published">Нийтлэгдсэн</option>
                <option value="archived">Архивлагдсан</option>
              </select>
            </div>

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
                    categoryId={formData.categoryId || categoryId}
                    articleId={articleId}
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
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A] disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
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
