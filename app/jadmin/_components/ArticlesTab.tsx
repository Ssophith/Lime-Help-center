'use client';

import { Plus, Edit, Trash2, Search, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import type { Category, Article, ArticleStatus } from '@/types';

export type ArticleSortField = 'title' | 'category' | 'views' | 'status';
export type SortDirection = 'asc' | 'desc';

interface Props {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: ArticleStatus | 'all';
  setStatusFilter: (v: ArticleStatus | 'all') => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  sortField: ArticleSortField;
  sortDirection: SortDirection;
  onSort: (field: ArticleSortField) => void;
  onNewArticle: () => void;
  onEditArticle: (article: Article, categoryId: string) => void;
  onDeleteArticle: (categoryId: string, articleId: string) => void;
  onUpdateStatus: (categoryId: string, articleId: string, status: ArticleStatus) => void;
}

function getStatusColor(status: ArticleStatus): string {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800 border-green-200';
    case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusLabel(status: ArticleStatus): string {
  switch (status) {
    case 'published': return 'Нийтлэгдсэн';
    case 'draft': return 'Ноорог';
    case 'archived': return 'Архивлагдсан';
    default: return 'Тодорхойгүй';
  }
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default function ArticlesTab({
  categories,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sortField,
  sortDirection,
  onSort,
  onNewArticle,
  onEditArticle,
  onDeleteArticle,
  onUpdateStatus,
}: Props) {
  // Build, filter, sort the list locally — keeps state-shape simple at the parent.
  const allArticles = categories.flatMap((cat) =>
    cat.articles.map((article) => ({ article, category: cat }))
  );

  let filteredArticles = allArticles.filter(({ article, category }) => {
    if (statusFilter !== 'all' && article.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && category.id !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        article.content.toLowerCase().includes(q) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(q)) ||
        category.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredArticles = [...filteredArticles].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'title': cmp = a.article.title.localeCompare(b.article.title); break;
      case 'category': cmp = a.category.title.localeCompare(b.category.title); break;
      case 'views': cmp = (a.article.views || 0) - (b.article.views || 0); break;
      case 'status': cmp = (a.article.status || 'draft').localeCompare(b.article.status || 'draft'); break;
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const SortArrow = ({ field }: { field: ArticleSortField }) =>
    sortField === field ? (sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Бүх нийтлэл</h3>
        <button
          onClick={onNewArticle}
          className="flex items-center gap-2 px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Шинэ нийтлэл нэмэх
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | 'all')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
          >
            <option value="all">Бүх статус</option>
            <option value="published">Нийтлэгдсэн</option>
            <option value="draft">Ноорог</option>
            <option value="archived">Архивлагдсан</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
          >
            <option value="all">Бүх ангилал</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => onSort('title')}
                >
                  <div className="flex items-center gap-2">Гарчиг <SortArrow field="title" /></div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => onSort('category')}
                >
                  <div className="flex items-center gap-2">Ангилал <SortArrow field="category" /></div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => onSort('views')}
                >
                  <div className="flex items-center gap-2">Уншсан <SortArrow field="views" /></div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => onSort('status')}
                >
                  <div className="flex items-center gap-2">Статус <SortArrow field="status" /></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.map(({ article, category }) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                    {article.publisherName && (
                      <div className="text-xs text-gray-500 mt-1">Нийтлэгч: {article.publisherName}</div>
                    )}
                    {article.lastModifiedByName && article.lastModifiedByName !== article.publisherName && (
                      <div className="text-xs text-gray-500 mt-1">Сүүлд зассан: {article.lastModifiedByName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{
                        backgroundColor: category.iconColor || '#FEF3C7',
                        color: getContrastColor(category.iconColor || '#FEF3C7'),
                      }}
                    >
                      {category.title}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {article.views || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        article.status || 'draft'
                      )}`}
                    >
                      {getStatusLabel(article.status || 'draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {article.status === 'published' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(category.id, article.id, 'draft')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ноорог болгох"
                          >
                            Ноорог
                          </button>
                          <button
                            onClick={() => onUpdateStatus(category.id, article.id, 'archived')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Архивлах"
                          >
                            Архив
                          </button>
                        </>
                      )}
                      {article.status === 'draft' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(category.id, article.id, 'published')}
                            className="text-green-600 hover:text-green-900"
                            title="Нийтлэх"
                          >
                            Нийтлэх
                          </button>
                          <button
                            onClick={() => onUpdateStatus(category.id, article.id, 'archived')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Архивлах"
                          >
                            Архив
                          </button>
                        </>
                      )}
                      {article.status === 'archived' && (
                        <button
                          onClick={() => onUpdateStatus(category.id, article.id, 'draft')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ноорог болгох"
                        >
                          Ноорог
                        </button>
                      )}
                      <button
                        onClick={() => onEditArticle(article, category.id)}
                        className="text-[#02251A] hover:text-[#02251A]/80"
                        title="Засах"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteArticle(category.id, article.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Устгах"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredArticles.length === 0 && (
          <div className="text-center py-12 text-gray-500">Нийтлэл олдсонгүй</div>
        )}
      </div>
    </div>
  );
}
