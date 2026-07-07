import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getAllCloudUserProfiles, deleteCloudUserProfile, saveCloudUserProfile } from '../firebase';
import { Shield, Trash2, Edit2, Search, X, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPortalProps {
  user: UserProfile;
}

export default function AdminPortal({ user }: AdminPortalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const fetchedUsers = await getAllCloudUserProfiles();
      setUsers(fetchedUsers);
      setLoading(false);
    };
    fetchUsers();
  }, [refreshTrigger]);

  const handleDelete = async (email: string) => {
    if (window.confirm(`Are you sure you want to delete ${email}?`)) {
      await deleteCloudUserProfile(email);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleEdit = (u: UserProfile) => {
    setEditingEmail(u.email);
    setEditForm(u);
  };

  const handleSave = async () => {
    if (editForm.email) {
      await saveCloudUserProfile(editForm as UserProfile);
      setEditingEmail(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-brand-muted">
        <Shield className="w-16 h-16 mb-4 text-brand-border" />
        <h2 className="text-xl font-bold text-brand-text mb-2">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-brand-text flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-primary" />
            Admin Portal
          </h1>
          <p className="text-brand-muted mt-2">Manage registered customers, businesses, and admins.</p>
        </div>
        <button 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="p-3 bg-white border border-brand-border rounded-xl hover:bg-brand-surface transition-all"
        >
          <RefreshCw className="w-5 h-5 text-brand-text" />
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border/40">
        <div className="flex items-center gap-3 mb-6 bg-brand-surface p-3 rounded-2xl border border-brand-border/60">
          <Search className="w-5 h-5 text-brand-muted ml-2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-brand-text text-sm font-bold"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/40 text-brand-muted text-xs font-black uppercase tracking-wider">
                  <th className="pb-4 pl-4">User</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Phone</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-brand-text">
                <AnimatePresence>
                  {filteredUsers.map((u) => (
                    <motion.tr 
                      key={u.email}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-b border-brand-border/20 hover:bg-brand-surface/30 transition-all"
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar || 'https://via.placeholder.com/40'} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            {editingEmail === u.email ? (
                              <input 
                                type="text"
                                value={editForm.name || ''}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="border border-brand-border rounded px-2 py-1 text-sm bg-white"
                              />
                            ) : (
                              <div className="font-bold">{u.name}</div>
                            )}
                            <div className="text-xs text-brand-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {editingEmail === u.email ? (
                          <select 
                            value={editForm.role || 'customer'}
                            onChange={e => setEditForm({...editForm, role: e.target.value as any})}
                            className="border border-brand-border rounded px-2 py-1 text-sm bg-white"
                          >
                            <option value="customer">Customer</option>
                            <option value="business">Business</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' : 
                            u.role === 'business' ? 'bg-blue-100 text-blue-700' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            {u.role || 'customer'}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {editingEmail === u.email ? (
                          <input 
                            type="text"
                            value={editForm.phone || ''}
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            className="border border-brand-border rounded px-2 py-1 text-sm bg-white"
                          />
                        ) : (
                          <span className="text-brand-muted">{u.phone || 'N/A'}</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {editingEmail === u.email ? (
                            <>
                              <button onClick={handleSave} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingEmail(null)} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(u)} className="p-2 bg-brand-surface text-brand-text rounded-lg hover:bg-brand-border transition-all">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(u.email)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-brand-muted font-semibold">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
