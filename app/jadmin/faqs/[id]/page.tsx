'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import type { FAQ } from '@/types';
import TinyMCEEditor from '@/components/TinyMCEEditor';

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const faqId = params.id as string;
  
  const [faq, setFAQ] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    order: 0,
  });

  useEffect(() => {
    fetchFAQ();
  }, [faqId]);

  const fetchFAQ = async () => {
    try {
      const response = await fetch('/api/faqs');
      const faqs: FAQ[] = await response.json();
      const found = faqs.find(f => f.id === faqId);
      if (found) {
        setFAQ(found);
        setFormData({
          title: found.title,
          content: found.content,
          order: found.order,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch FAQ:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: faqId,
          title: formData.title,
          content: formData.content,
          order: formData.order,
        }),
      });
      if (response.ok) {
        router.push('/jadmin');
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error || 'FAQ шинэчлэхэд алдаа гарлаа'}`);
      }
    } catch (error) {
      console.error('Failed to update FAQ:', error);
      alert('FAQ шинэчлэхэд алдаа гарлаа');
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

  if (!faq) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">FAQ олдсонгүй</p>
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
            <h1 className="text-2xl font-bold text-gray-900">FAQ засах</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
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
      </main>
    </div>
  );
}
