import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Trash2, 
  Activity, 
  AlertCircle,
  Loader2,
  ChevronRight,
  MoreVertical,
  X,
  Mail,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Admin Console for NexuAI.
 * Features: Global Data Control, Matte Black & Gold Theme, User Isolation Verification.
 */
const AdminDashboard = () => {
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'projects'

  const fetchAdminData = async () => {
    try {
      const token = await getToken();
      const [uRes, pRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/admin/projects`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setProjects(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (err) {
      console.error('Admin Fetch Error:', err);
      toast.error('Identity Mismatch: Forbidden Access');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const handleDeleteProject = async (projectId, name) => {
    if (!window.confirm(`[ADMIN] Forcefully purge neural hub "${name}"? This action is irreversible.`)) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Neural Hub Purged');
      fetchAdminData();
    } catch (err) {
      toast.error('Force purge failed.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-10 h-10 border-2 border-saas-accent/20 border-t-saas-accent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Authorizing Admin Protocol...</p>
    </div>
  );

  return (
    <div className="space-y-12 page-transition max-w-7xl mx-auto">
      
      {/* 1. Admin Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-saas-border">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-saas-accent/10 flex items-center justify-center text-saas-accent">
                 <ShieldCheck size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Admin Console: Global Oversight</p>
           </div>
           <h1 className="text-4xl font-black text-saas-text tracking-tighter">Nexus Intelligence Control</h1>
           <p className="text-sm text-saas-text-muted font-medium max-w-xl">
              Systems-level access to all neural nodes, knowledge blocks, and artisan profiles.
           </p>
        </div>

        <div className="flex p-1 bg-saas-surface rounded-2xl border border-saas-border shadow-saas-soft">
           {['users', 'projects'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                 ${activeTab === tab ? 'bg-saas-bg text-saas-accent border border-saas-border' : 'text-saas-text-muted hover:text-saas-text'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      {/* 2. Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         {[
           { label: 'Total Artisans', value: Array.isArray(users) ? users.length : 0, icon: <Users size={18} /> },
           { label: 'Active Hubs', value: Array.isArray(projects) ? projects.length : 0, icon: <Database size={18} /> },
           { label: 'Grounded Files', value: Array.isArray(projects) ? projects.reduce((acc, p) => acc + (p._count?.documents || 0), 0) : 0, icon: <Activity size={18} /> },
           { label: 'System Integrity', value: '100%', icon: <ShieldCheck size={18} /> }
         ].map((stat, i) => (
           <div key={i} className="saas-card p-8 flex items-center gap-6 bg-saas-surface/20">
              <div className="w-12 h-12 rounded-xl bg-saas-bg border border-saas-border flex items-center justify-center text-saas-accent">
                 {stat.icon}
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted mb-1">{stat.label}</p>
                 <h3 className="text-2xl font-black text-saas-text tracking-tighter">{stat.value}</h3>
              </div>
           </div>
         ))}
      </div>

      {/* 3. Data Management Table */}
      <section className="saas-card overflow-hidden bg-saas-surface/10 border-none">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-saas-border bg-saas-bg/50">
                  {activeTab === 'users' ? (
                    <>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Artisan Profile</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Nodes</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Status</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Joined</th>
                    </>
                  ) : (
                    <>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Neural Hub</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Owner</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Blocks</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted text-right">Control</th>
                    </>
                  )}
               </tr>
            </thead>
            <tbody className="divide-y divide-saas-border/30">
               {activeTab === 'users' ? (Array.isArray(users) && users.map(u => (
                 <tr key={u.id} className="group hover:bg-saas-surface/20 transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-saas-bg border border-saas-border flex items-center justify-center font-black text-saas-accent">
                             {u.email[0].toUpperCase()}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-saas-text">{u.email}</p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted">ID: ...{u.id.slice(-8)}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-black text-saas-text uppercase tracking-widest">{u._count?.projects || 0} Hubs</td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border
                         ${u.role === 'ADMIN' ? 'bg-saas-accent/10 border-saas-accent/20 text-saas-accent' : 'bg-saas-surface border-saas-border text-saas-text-muted'}`}>
                          {u.role}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-saas-text-muted uppercase tracking-[0.2em]">{new Date(u.createdAt).toLocaleDateString()}</td>
                 </tr>
               ))) : (Array.isArray(projects) && projects.map(p => (
                 <tr key={p.id} className="group hover:bg-saas-surface/20 transition-colors">
                    <td className="px-8 py-6 font-bold text-saas-text text-sm">{p.name}</td>
                    <td className="px-8 py-6 text-xs font-black text-saas-text-muted uppercase tracking-widest">{p.user?.email}</td>
                    <td className="px-8 py-6 text-xs font-medium text-saas-text-muted tracking-widest">{p._count?.documents || 0} BLOCKS</td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => handleDeleteProject(p.id, p.name)}
                        className="p-3 text-saas-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-saas-bg"
                       >
                          <Trash2 size={18} />
                       </button>
                    </td>
                 </tr>
               )))}
            </tbody>
         </table>
      </section>

    </div>
  );
};

export default AdminDashboard;
