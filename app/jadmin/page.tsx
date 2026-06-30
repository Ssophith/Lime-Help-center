'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, HelpCircle, BookOpen, LogOut, Users, User as UserIcon } from 'lucide-react';
import type { Category, FAQ, Article, ArticleStatus } from '@/types';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import ArticleModal from './_components/ArticleModal';
import ProfileTab from './_components/ProfileTab';
import EditUserModal from './_components/EditUserModal';
import PasswordModal from './_components/PasswordModal';
import InviteModal from './_components/InviteModal';
import FAQsTab from './_components/FAQsTab';
import CategoriesTab from './_components/CategoriesTab';
import ArticlesTab from './_components/ArticlesTab';
import UsersTab from './_components/UsersTab';
import { ToastContainer, type Toast, type ToastType } from '@/components/Toast';
import { ConfirmModal, type ConfirmActionType } from '@/components/ConfirmModal';
import Image from 'next/image';

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMenu = (searchParams.get('menu') as 'categories' | 'faqs' | 'articles' | 'users' | 'profile') || 'categories';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'publisher' as 'super_admin' | 'publisher' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', role: 'publisher' as 'super_admin' | 'publisher' });
  const [activeMenu, setActiveMenu] = useState<'categories' | 'faqs' | 'articles' | 'users' | 'profile'>(initialMenu);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: ConfirmActionType;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'default',
    onConfirm: () => {},
  });
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'faq'; id: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showConfirm = (
    title: string,
    message: string,
    actionType: ConfirmActionType,
    onConfirm: () => void,
    confirmText?: string
  ) => {
    setConfirmModal({ isOpen: true, title, message, actionType, onConfirm, confirmText });
  };

  const closeConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };
  
  // Article list state
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('all');
  const [articleSortField, setArticleSortField] = useState<'title' | 'category' | 'views' | 'status'>('title');
  const [articleSortDirection, setArticleSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Safety check: ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Article modal state
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [editingArticle, setEditingArticle] = useState<{ article: Article; categoryId: string } | null>(null);
  const [articleForm, setArticleForm] = useState({
    categoryId: '',
    articleId: '',
    slug: '',
    title: '',
    content: '',
    excerpt: '',
    order: 0,
    status: 'draft' as ArticleStatus,
  });
  const [savingArticle, setSavingArticle] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update URL when menu changes (for back button support)
    const params = new URLSearchParams(searchParams.toString());
    params.set('menu', activeMenu);
    router.replace(`/jadmin?${params.toString()}`, { scroll: false });
  }, [activeMenu]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const [catsRes, faqsRes, usersRes, invitesRes, currentUserRes] = await Promise.all([
          fetch('/api/categories?includeAllStatuses=true', { signal: controller.signal, cache: 'no-store' }),
          fetch('/api/faqs', { signal: controller.signal, cache: 'no-store' }),
          fetch('/api/users', { signal: controller.signal, cache: 'no-store' }).catch(() => ({ json: async () => [] })),
          fetch('/api/users/invites', { signal: controller.signal, cache: 'no-store' }).catch(() => ({ json: async () => [] })),
          fetch('/api/users/me', { signal: controller.signal, cache: 'no-store' }).catch(() => ({ json: async () => null })),
        ]);
        
        clearTimeout(timeoutId);
        
        const cats = await catsRes.json();
        const faqsData = await faqsRes.json();
        const usersData = await usersRes.json();
        const invitesData = await invitesRes.json();
        const currentUserData = await currentUserRes.json();
        
        setCategories(Array.isArray(cats) ? cats : []);
        setFAQs(Array.isArray(faqsData) ? faqsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setInvites(Array.isArray(invitesData) ? invitesData : []);
        if (currentUserData) {
          setCurrentUser(currentUserData);
          setProfileForm({ name: currentUserData.name || '', email: currentUserData.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          showToast('Холболт удаан байна. Дахин оролдоно уу.', 'error');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Өгөгдөл ачаалахад алдаа гарлаа', 'error');
      setCategories([]);
      setFAQs([]);
      setUsers([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    showConfirm(
      'Ангилал устгах',
      'Энэ ангилалыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.',
      'delete',
      async () => {
        try {
          await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
          showToast('Ангилал амжилттай устгагдлаа', 'success');
          fetchData();
        } catch (error) {
          console.error('Failed to delete category:', error);
          showToast('Ангилал устгахад алдаа гарлаа', 'error');
        }
      }
    );
  };

  const handleDeleteFAQ = async (id: string) => {
    showConfirm(
      'FAQ устгах',
      'Энэ FAQ-г устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.',
      'delete',
      async () => {
        try {
          await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' });
          showToast('FAQ амжилттай устгагдлаа', 'success');
          fetchData();
        } catch (error) {
          console.error('Failed to delete FAQ:', error);
          showToast('FAQ устгахад алдаа гарлаа', 'error');
        }
      }
    );
  };

  const handleDeleteArticle = async (categoryId: string, articleId: string) => {
    showConfirm(
      'Нийтлэл устгах',
      'Энэ нийтлэлийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.',
      'delete',
      async () => {
        try {
          await fetch(`/api/articles?categoryId=${categoryId}&id=${articleId}`, { method: 'DELETE' });
          showToast('Нийтлэл амжилттай устгагдлаа', 'success');
          fetchData();
        } catch (error) {
          console.error('Failed to delete article:', error);
          showToast('Нийтлэл устгахад алдаа гарлаа', 'error');
        }
      }
    );
  };

  const handleUpdateArticleStatus = async (categoryId: string, articleId: string, status: ArticleStatus) => {
    try {
      await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, articleId, status }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update article status:', error);
    }
  };

  const openEditArticle = (article: Article, categoryId: string) => {
    setEditingArticle({ article, categoryId });
    setArticleForm({
      categoryId,
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      order: article.order,
      status: article.status || 'draft',
    });
    setShowAddArticle(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.categoryId) {
      showToast('Ангилал сонгоно уу', 'warning');
      return;
    }
    setSavingArticle(true);
    try {
      const isEdit = !!editingArticle;
      const response = await fetch('/api/articles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: articleForm.categoryId,
          articleId: isEdit ? articleForm.articleId : undefined,
          slug: articleForm.slug,
          title: articleForm.title,
          content: articleForm.content,
          excerpt: articleForm.excerpt || undefined,
          order: articleForm.order,
          status: articleForm.status,
        }),
      });
      if (response.ok) {
        showToast(`Нийтлэл ${isEdit ? 'амжилттай шинэчлэгдлээ' : 'амжилттай нэмэгдлээ'}!`, 'success');
        setShowAddArticle(false);
        setEditingArticle(null);
        setArticleForm({
          categoryId: '',
          articleId: '',
          slug: '',
          title: '',
          content: '',
          excerpt: '',
          order: 0,
          status: 'draft',
        });
        fetchData();
      } else {
        const error = await response.json();
        showToast(`Алдаа: ${error.error || 'Нийтлэл хадгалахад алдаа гарлаа'}`, 'error');
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      showToast('Нийтлэл хадгалахад алдаа гарлаа', 'error');
    } finally {
      setSavingArticle(false);
    }
  };

  // Sort handler is the only article-list helper left in the parent —
  // the rest (filter, sort impl, status color/label, contrast) lives in ArticlesTab.
  const handleSort = (field: 'title' | 'category' | 'views' | 'status') => {
    if (articleSortField === field) {
      setArticleSortDirection(articleSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setArticleSortField(field);
      setArticleSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Уншиж байна...</p>
      </div>
    );
  }

  const totalArticles = safeCategories.reduce((total, cat) => total + (cat.articles?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/lime-logo-text.png"
              alt="LIME"
              width={100}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
        </div>
        <nav className="p-2 flex-1">
          <button
            onClick={() => setActiveMenu('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeMenu === 'categories'
                ? 'bg-[#02251A] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Ангилал</span>
            <span className="ml-auto text-sm opacity-75">({safeCategories.length})</span>
          </button>
          <button
            onClick={() => setActiveMenu('articles')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeMenu === 'articles'
                ? 'bg-[#02251A] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">Нийтлэл</span>
            <span className="ml-auto text-sm opacity-75">({totalArticles})</span>
          </button>
          <button
            onClick={() => setActiveMenu('faqs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeMenu === 'faqs'
                ? 'bg-[#02251A] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="font-medium">FAQ</span>
            <span className="ml-auto text-sm opacity-75">({faqs.length})</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setActiveMenu('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'profile'
                ? 'bg-[#02251A] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserIcon className="h-5 w-5" />
            <span className="font-medium">Профайл</span>
          </button>
          {currentUser && currentUser.role === 'super_admin' && (
            <button
              onClick={() => setActiveMenu('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'users'
                  ? 'bg-[#02251A] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Хэрэглэгчид</span>
            </button>
          )}
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/jadmin/login');
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Гарах</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeMenu === 'categories' && 'Ангилал'}
              {activeMenu === 'articles' && 'Нийтлэл'}
              {activeMenu === 'faqs' && 'FAQ'}
              {activeMenu === 'users' && currentUser?.role === 'super_admin' && 'Хэрэглэгчид'}
              {activeMenu === 'profile' && 'Профайл'}
            </h2>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeMenu === 'categories' && (
            <CategoriesTab
              categories={safeCategories}
              setCategories={setCategories}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
              dragOverIndex={dragOverIndex}
              setDragOverIndex={setDragOverIndex}
              showToast={showToast}
              fetchData={fetchData}
              onDelete={handleDeleteCategory}
            />
          )}

          {activeMenu === 'articles' && (
            <ArticlesTab
              categories={safeCategories}
              searchQuery={articleSearchQuery}
              setSearchQuery={setArticleSearchQuery}
              statusFilter={articleStatusFilter}
              setStatusFilter={setArticleStatusFilter}
              categoryFilter={articleCategoryFilter}
              setCategoryFilter={setArticleCategoryFilter}
              sortField={articleSortField}
              sortDirection={articleSortDirection}
              onSort={handleSort}
              onNewArticle={() => {
                setEditingArticle(null);
                setArticleForm({
                  categoryId: '',
                  articleId: '',
                  slug: '',
                  title: '',
                  content: '',
                  excerpt: '',
                  order: 0,
                  status: 'draft',
                });
                setShowAddArticle(true);
              }}
              onEditArticle={openEditArticle}
              onDeleteArticle={handleDeleteArticle}
              onUpdateStatus={handleUpdateArticleStatus}
            />
          )}

          {activeMenu === 'faqs' && (
            <FAQsTab
              faqs={faqs}
              setFAQs={setFAQs}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
              dragOverIndex={dragOverIndex}
              setDragOverIndex={setDragOverIndex}
              showToast={showToast}
              fetchData={fetchData}
              onDelete={handleDeleteFAQ}
            />
          )}

          {activeMenu === 'users' && currentUser?.role === 'super_admin' && (
            <UsersTab
              users={users}
              setUsers={setUsers}
              invites={invites}
              setInvites={setInvites}
              showToast={showToast}
              showConfirm={showConfirm}
              fetchData={fetchData}
              onOpenInviteModal={() => {
                setInviteForm({ email: '', role: 'publisher' });
                setShowInviteModal(true);
              }}
              onOpenEditUserModal={(user) => {
                setEditingUser(user);
                setEditUserForm({ name: user.name, email: user.email, role: user.role });
                setShowEditUserModal(true);
              }}
              onOpenPasswordModal={(user) => {
                setEditingUser(user);
                setShowPasswordModal(true);
              }}
            />
          )}

          {activeMenu === 'profile' && (
            <ProfileTab
              form={profileForm}
              setForm={setProfileForm}
              currentUser={currentUser}
              showToast={showToast}
              fetchData={fetchData}
            />
          )}

          <EditUserModal
            open={showEditUserModal}
            user={editingUser}
            form={editUserForm}
            setForm={setEditUserForm}
            onClose={() => {
              setShowEditUserModal(false);
              setEditingUser(null);
            }}
            showToast={showToast}
            fetchData={fetchData}
          />

          <PasswordModal
            open={showPasswordModal}
            user={editingUser}
            onClose={() => {
              setShowPasswordModal(false);
              setEditingUser(null);
            }}
            showToast={showToast}
            fetchData={fetchData}
          />

          <InviteModal
            open={showInviteModal}
            form={inviteForm}
            setForm={setInviteForm}
            onClose={() => setShowInviteModal(false)}
            showToast={showToast}
            fetchData={fetchData}
          />
        </main>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        actionType={confirmModal.actionType}
        confirmText={confirmModal.confirmText}
      />

      <ArticleModal
        open={showAddArticle}
        editingArticle={editingArticle}
        form={articleForm}
        setForm={setArticleForm}
        categories={safeCategories}
        saving={savingArticle}
        onClose={() => {
          setShowAddArticle(false);
          setEditingArticle(null);
        }}
        onSubmit={handleSaveArticle}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminPageContent />
    </AdminAuthGuard>
  );
}
