'use client';

import Link from 'next/link';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import type { Category } from '@/types';
import type { ToastType } from '@/components/Toast';
import CategoryIcon from '@/components/CategoryIcon';
import type { DragItem } from './FAQsTab';

interface Props {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  draggedItem: DragItem;
  setDraggedItem: React.Dispatch<React.SetStateAction<DragItem>>;
  dragOverIndex: number | null;
  setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showToast: (message: string, type?: ToastType) => void;
  fetchData: () => void;
  onDelete: (id: string) => void;
}

export default function CategoriesTab({
  categories,
  setCategories,
  draggedItem,
  setDraggedItem,
  dragOverIndex,
  setDragOverIndex,
  showToast,
  fetchData,
  onDelete,
}: Props) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Бүх ангилал</h3>
        <Link
          href="/jadmin/categories/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Шинэ ангилал
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="categories-list">
        {categories.map((category, index) => (
          <div
            key={category.id}
            draggable
            onDragStart={(e) => {
              setDraggedItem({ type: 'category', id: category.id, index });
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', category.id);
              e.currentTarget.style.opacity = '0.5';
            }}
            onDragEnd={(e) => {
              e.currentTarget.style.opacity = '1';
              setDraggedItem(null);
              setDragOverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (draggedItem?.type === 'category' && draggedItem.id !== category.id) {
                setDragOverIndex(index);
              }
            }}
            onDragLeave={() => {
              setDragOverIndex(null);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              const draggedId = draggedItem?.id;
              if (!draggedId || draggedId === category.id || draggedItem?.type !== 'category') {
                setDraggedItem(null);
                setDragOverIndex(null);
                return;
              }

              const draggedIndex = categories.findIndex((c) => c.id === draggedId);
              const targetIndex = index;
              if (draggedIndex === -1 || draggedIndex === targetIndex) {
                setDraggedItem(null);
                setDragOverIndex(null);
                return;
              }

              const newCategories = [...categories];
              const [removed] = newCategories.splice(draggedIndex, 1);
              newCategories.splice(targetIndex, 0, removed);
              const updates = newCategories.map((cat, idx) => ({ id: cat.id, order: idx }));

              try {
                const changedUpdates = updates.filter((update, idx) => {
                  const original = categories.find((c) => c.id === update.id);
                  return original && original.order !== idx;
                });
                if (changedUpdates.length > 0) {
                  await Promise.all(
                    changedUpdates.map((update) =>
                      fetch('/api/categories', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: update.id, order: update.order }),
                      })
                    )
                  );
                  showToast('Ангиллын дараалал амжилттай шинэчлэгдлээ', 'success');
                  setCategories(
                    newCategories.map((cat) => ({
                      ...cat,
                      order: updates.find((u) => u.id === cat.id)?.order ?? cat.order,
                    }))
                  );
                }
              } catch (error) {
                console.error('Failed to update category order:', error);
                showToast('Ангиллын дараалал шинэчлэхэд алдаа гарлаа', 'error');
                fetchData();
              }
              setDraggedItem(null);
              setDragOverIndex(null);
            }}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all overflow-hidden cursor-move flex flex-col ${
              dragOverIndex === index && draggedItem?.type === 'category' && draggedItem.id !== category.id
                ? 'border-[#02251A] shadow-lg'
                : 'border-gray-200 hover:shadow-md'
            }`}
          >
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                {category.icon && (
                  <div className="flex-shrink-0">
                    <CategoryIcon iconName={category.icon} size={28} color={category.iconColor || '#FEF3C7'} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{category.title}</h3>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {category.articles?.length || 0} нийтлэл
                </span>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/jadmin/categories/${category.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                >
                  <Edit className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Засах</span>
                </Link>
                <button
                  onClick={() => onDelete(category.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm flex-shrink-0"
                  title="Устгах"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Ангилал байхгүй байна. Шинэ ангилал нэмэх үү?
          </div>
        )}
      </div>
    </div>
  );
}
