'use client';

import { Edit, Trash2, Mail, Key, RotateCw, Ban, Play } from 'lucide-react';
import type { ToastType } from '@/components/Toast';
import type { ConfirmActionType } from '@/components/ConfirmModal';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'publisher';
  isActive: boolean;
  lastLoginAt?: string;
  createdBy?: string;
}

interface InviteRow {
  id: string;
  email: string;
  role: 'super_admin' | 'publisher';
  expiresAt: string;
  usedAt?: string | null;
}

interface Props {
  users: UserRow[];
  setUsers: React.Dispatch<React.SetStateAction<UserRow[]>>;
  invites: InviteRow[];
  setInvites: React.Dispatch<React.SetStateAction<InviteRow[]>>;
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    title: string,
    message: string,
    actionType: ConfirmActionType,
    onConfirm: () => void,
    confirmText?: string
  ) => void;
  fetchData: () => void;
  onOpenInviteModal: () => void;
  onOpenEditUserModal: (user: UserRow) => void;
  onOpenPasswordModal: (user: UserRow) => void;
}

export default function UsersTab({
  users,
  setUsers,
  invites,
  setInvites,
  showToast,
  showConfirm,
  fetchData,
  onOpenInviteModal,
  onOpenEditUserModal,
  onOpenPasswordModal,
}: Props) {
  const pendingInvites = invites.filter((i) => !i.usedAt && new Date(i.expiresAt) > new Date());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Хэрэглэгчийн удирдлага</h3>
        <button
          onClick={onOpenInviteModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 transition-colors"
        >
          <Mail className="h-5 w-5" />
          Хэрэглэгч урих
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нэр</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имэйл</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Эрх</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сүүлд нэвтэрсэн</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Супер админ' : 'Нийтлэгч'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('mn-MN') : 'Хэзээ ч'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenEditUserModal(user)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="Хэрэглэгч засах"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onOpenPasswordModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50 transition-colors"
                        title="Нууц үг солих"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          showConfirm(
                            user.isActive ? 'Хэрэглэгчийг идэвхгүй болгох' : 'Хэрэглэгчийг идэвхтэй болгох',
                            `Энэ хэрэглэгчийг ${user.isActive ? 'идэвхгүй' : 'идэвхтэй'} болгохдаа итгэлтэй байна уу?`,
                            user.isActive ? 'suspend' : 'activate',
                            async () => {
                              try {
                                await fetch('/api/users', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    userId: user.id,
                                    action: 'update_status',
                                    isActive: !user.isActive,
                                  }),
                                });
                                showToast(
                                  `Хэрэглэгч ${user.isActive ? 'идэвхгүй' : 'идэвхтэй'} болголоо`,
                                  'success'
                                );
                                fetchData();
                              } catch (error) {
                                showToast('Хэрэглэгчийн статус өөрчлөхөд алдаа гарлаа', 'error');
                              }
                            }
                          );
                        }}
                        className={`${
                          user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                        } p-1.5 rounded hover:bg-gray-50 transition-colors`}
                        title={user.isActive ? 'Идэвхгүй болгох' : 'Идэвхтэй болгох'}
                      >
                        {user.isActive ? <Ban className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          const isDefaultAdmin =
                            user.email === 'admin@lime.mn' ||
                            user.email === 'admin' ||
                            (user.role === 'super_admin' && !user.createdBy);
                          if (isDefaultAdmin) {
                            showToast('Үндсэн супер админийг устгах боломжгүй', 'error');
                            return;
                          }
                          showConfirm(
                            'Хэрэглэгч устгах',
                            `Энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй. (${user.email})`,
                            'delete',
                            async () => {
                              try {
                                const res = await fetch(`/api/users?userId=${user.id}`, { method: 'DELETE' });
                                const data = await res.json();
                                if (res.ok || res.status === 200) {
                                  showToast('Хэрэглэгч амжилттай устгагдлаа', 'success');
                                  setUsers(users.filter((u) => u.id !== user.id));
                                } else if (res.status === 404) {
                                  setUsers(users.filter((u) => u.id !== user.id));
                                  showToast('Хэрэглэгч устгагдсан байна', 'info');
                                } else {
                                  showToast(`Алдаа: ${data.error || 'Хэрэглэгч устгахад алдаа гарлаа'}`, 'error');
                                }
                              } catch (error) {
                                console.error('Delete user error:', error);
                                showToast('Хэрэглэгч устгахад алдаа гарлаа', 'error');
                              }
                            }
                          );
                        }}
                        className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Хэрэглэгч устгах"
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
        {users.length === 0 && <div className="text-center py-12 text-gray-500">Хэрэглэгч байхгүй байна.</div>}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Хүлээгдэж буй урилгууд</h4>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">{invite.email}</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      invite.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {invite.role === 'super_admin' ? 'Супер админ' : 'Нийтлэгч'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Хүчинтэй: {new Date(invite.expiresAt).toLocaleDateString('mn-MN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/users/invites/resend', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ inviteId: invite.id }),
                        });
                        const data = await response.json();
                        if (response.ok) {
                          showToast('Урилга амжилттай дахин илгээгдлээ', 'success');
                          fetchData();
                        } else {
                          showToast(`Алдаа: ${data.error}`, 'error');
                        }
                      } catch (error) {
                        console.error('Failed to resend invite:', error);
                        showToast('Урилга дахин илгээхэд алдаа гарлаа', 'error');
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Урилга дахин илгээх"
                  >
                    <RotateCw className="h-4 w-4" />
                    Дахин илгээх
                  </button>
                  <button
                    onClick={() => {
                      showConfirm(
                        'Урилга цуцлах',
                        `Энэ урилгыг цуцлахдаа итгэлтэй байна уу? (${invite.email})`,
                        'cancel',
                        async () => {
                          try {
                            const response = await fetch(`/api/users/invites/delete?id=${invite.id}`, {
                              method: 'DELETE',
                            });
                            const data = await response.json();
                            if (response.ok) {
                              showToast('Урилга амжилттай цуцлагдлаа', 'success');
                              setInvites(invites.filter((i) => i.id !== invite.id));
                              fetchData();
                            } else {
                              showToast(`Алдаа: ${data.error}`, 'error');
                            }
                          } catch (error) {
                            console.error('Failed to delete invite:', error);
                            showToast('Урилга цуцлахад алдаа гарлаа', 'error');
                          }
                        }
                      );
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Урилга цуцлах"
                  >
                    <Trash2 className="h-4 w-4" />
                    Цуцлах
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
