'use client';

import Link from 'next/link';
import { Plus, Edit, Trash2, HelpCircle, GripVertical } from 'lucide-react';
import type { FAQ } from '@/types';
import type { ToastType } from '@/components/Toast';

export type DragItem = { type: 'category' | 'faq'; id: string; index: number } | null;

interface Props {
  faqs: FAQ[];
  setFAQs: React.Dispatch<React.SetStateAction<FAQ[]>>;
  draggedItem: DragItem;
  setDraggedItem: React.Dispatch<React.SetStateAction<DragItem>>;
  dragOverIndex: number | null;
  setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showToast: (message: string, type?: ToastType) => void;
  fetchData: () => void;
  onDelete: (id: string) => void;
}

export default function FAQsTab({
  faqs,
  setFAQs,
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
        <h3 className="text-lg font-semibold text-gray-900">Бүх FAQ</h3>
        <Link
          href="/jadmin/faqs/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Шинэ FAQ
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {faqs.sort((a, b) => (a.order || 0) - (b.order || 0)).map((faq, index) => (
          <div
            key={faq.id}
            draggable
            onDragStart={(e) => {
              setDraggedItem({ type: 'faq', id: faq.id, index });
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', faq.id);
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
              if (draggedItem?.type === 'faq' && draggedItem.id !== faq.id) {
                setDragOverIndex(index);
              }
            }}
            onDragLeave={() => {
              setDragOverIndex(null);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              const draggedId = draggedItem?.id;
              if (!draggedId || draggedId === faq.id || draggedItem?.type !== 'faq') {
                setDraggedItem(null);
                setDragOverIndex(null);
                return;
              }

              const sortedFaqs = [...faqs].sort((a, b) => (a.order || 0) - (b.order || 0));
              const draggedIndex = sortedFaqs.findIndex((f) => f.id === draggedId);
              const targetIndex = index;
              if (draggedIndex === -1 || draggedIndex === targetIndex) {
                setDraggedItem(null);
                setDragOverIndex(null);
                return;
              }

              const newFaqs = [...sortedFaqs];
              const [removed] = newFaqs.splice(draggedIndex, 1);
              newFaqs.splice(targetIndex, 0, removed);
              const updates = newFaqs.map((f, idx) => ({ id: f.id, order: idx }));

              try {
                const changedUpdates = updates.filter((update, idx) => {
                  const original = sortedFaqs.find((f) => f.id === update.id);
                  return original && original.order !== idx;
                });
                if (changedUpdates.length > 0) {
                  await Promise.all(
                    changedUpdates.map((update) =>
                      fetch('/api/faqs', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: update.id, order: update.order }),
                      })
                    )
                  );
                  showToast('FAQ-ийн дараалал амжилттай шинэчлэгдлээ', 'success');
                  setFAQs(
                    newFaqs.map((f) => ({
                      ...f,
                      order: updates.find((u) => u.id === f.id)?.order ?? f.order,
                    }))
                  );
                }
              } catch (error) {
                console.error('Failed to update FAQ order:', error);
                showToast('FAQ-ийн дараалал шинэчлэхэд алдаа гарлаа', 'error');
                fetchData();
              }
              setDraggedItem(null);
              setDragOverIndex(null);
            }}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all overflow-hidden cursor-move flex flex-col ${
              dragOverIndex === index && draggedItem?.type === 'faq' && draggedItem.id !== faq.id
                ? 'border-[#02251A] shadow-lg'
                : 'border-gray-200 hover:shadow-md'
            }`}
          >
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-[#02251A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{faq.title}</h3>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/jadmin/faqs/${faq.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                >
                  <Edit className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Засах</span>
                </Link>
                <button
                  onClick={() => onDelete(faq.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm flex-shrink-0"
                  title="Устгах"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            FAQ байхгүй байна. Шинэ FAQ нэмэх үү?
          </div>
        )}
      </div>
    </div>
  );
}
