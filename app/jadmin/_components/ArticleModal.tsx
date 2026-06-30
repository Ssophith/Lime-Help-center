'use client';

import { X } from 'lucide-react';
import TinyMCEEditor from '@/components/TinyMCEEditor';
import type { Category, Article, ArticleStatus } from '@/types';

export interface ArticleFormState {
  categoryId: string;
  articleId: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  order: number;
  status: ArticleStatus;
}

interface ArticleModalProps {
  open: boolean;
  editingArticle: { article: Article; categoryId: string } | null;
  form: ArticleFormState;
  setForm: React.Dispatch<React.SetStateAction<ArticleFormState>>;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
}

/**
 * Article create/edit modal. Extracted from app/jadmin/page.tsx so the form
 * state and TinyMCE wiring live in one place.
 *
 * All setForm callbacks use the functional updater form — TinyMCE's
 * onEditorChange can fire during init/normalization before React commits
 * the openEditArticle state batch, and spreading the captured (stale)
 * articleForm there was what silently demoted published articles to draft.
 */
export default function ArticleModal({
  open,
  editingArticle,
  form,
  setForm,
  categories,
  saving,
  onClose,
  onSubmit,
}: ArticleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {editingArticle ? 'Нийтлэл засах' : 'Шинэ нийтлэл нэмэх'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{ fontFamily: "'Mulish', sans-serif" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ангилал *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    categoryId,
                    // Keep the real articleId when editing — only synthesize a temp
                    // id for new-article uploads. Earlier code clobbered the real
                    // id with a temp string and the subsequent PUT 404'd.
                    articleId: editingArticle
                      ? prev.articleId
                      : categoryId
                        ? `temp-${Date.now()}`
                        : '',
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
                required
              >
                <option value="">Сонгох...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус *
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as ArticleStatus }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
                required
              >
                <option value="draft">Ноорог</option>
                <option value="published">Нийтлэгдсэн</option>
                <option value="archived">Архивлагдсан</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Гарчиг *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Агуулга *
            </label>
            <TinyMCEEditor
              content={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              placeholder="Энд нийтлэлийн агуулгаа бичнэ үү..."
              categoryId={form.categoryId}
              articleId={form.articleId || `temp-${Date.now()}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Товчлол
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дараалал
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02251A] focus:border-[#02251A]"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Хадгалж байна...' : editingArticle ? 'Хадгалах' : 'Нийтлэл нэмэх'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Цуцлах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
