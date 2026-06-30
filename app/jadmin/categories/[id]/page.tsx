'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react';
import type { Category, Article } from '@/types';
import IconSelector from '@/components/IconSelector';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    icon: '',
    iconColor: '#FEF3C7', // Default soft yellow
    order: 0,
  });

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch('/api/categories');
      const categories: Category[] = await response.json();
      const found = categories.find(cat => cat.id === categoryId);
      if (found) {
        setCategory(found);
        setFormData({
          slug: found.slug,
          title: found.title,
          description: found.description || '',
          icon: found.icon || '',
          iconColor: found.iconColor || '#FEF3C7',
          order: found.order,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch category:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          slug: formData.slug,
          title: formData.title,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          iconColor: formData.iconColor || undefined,
          order: formData.order,
        }),
      });
      if (response.ok) {
        router.push('/jadmin');
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error || 'Ангиллыг шинэчлэхэд алдаа гарлаа'}`);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Ангиллыг шинэчлэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Энэ нийтлэлийг устгах уу?')) return;
    
    try {
      const response = await fetch(`/api/articles?categoryId=${categoryId}&id=${articleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchCategory();
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <p className="text-gray-600">Уншиж байна...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ангилал олдсонгүй</p>
          <Link href="/jadmin" className="text-[#02251A] hover:text-[#02251A]">
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
            <Link href="/jadmin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ангилал засах</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL хаяг) *
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
              onChange={(iconName) => setFormData({ ...formData, icon: iconName })}
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
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A] disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
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

        {/* Articles Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Нийтлэл ({category.articles.length})</h2>
            <Link
              href={`/jadmin/categories/${categoryId}/articles/new`}
              className="flex items-center gap-2 px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]"
            >
              <Plus className="h-5 w-5" />
              Шинэ нийтлэл
            </Link>
          </div>

          {category.articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Нийтлэл байхгүй байна.
            </div>
          ) : (
            <div className="space-y-4">
              {category.articles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                      <p className="text-sm text-gray-600">{article.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/jadmin/categories/${categoryId}/articles/${article.id}`}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        <Edit className="h-4 w-4" />
                        Засах
                      </Link>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        Устгах
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
