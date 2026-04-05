import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight,
  Database,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Minimalist Workspace Registry for NexuAI.
 * Features: Success Modals, Delete Confirmations, Matte Black Aesthetic.
 */
const Workspaces = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState(null);

  const fetchProjects = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setCreating(true);
    try {
      const token = await getToken();
      const res = await axios.post(`${API_BASE_URL}/api/projects`, { name: workspaceName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWorkspaceName('');
      setLastCreatedId(res.data.id);
      setShowSuccess(true);
      fetchProjects();
      window.dispatchEvent(new Event('workspace-created'));
    } catch (err) {
      toast.error('Synthesis failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently purge "${name}" from the neural grid?`)) return;
    
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Neural Hub Purged');
      fetchProjects();
      window.dispatchEvent(new Event('workspace-created'));
    } catch (err) {
      toast.error('Purge failed.');
    }
  };

  return (
    <div className="space-y-12 page-transition relative">
      
      {/* 1. Archive Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="w-5 h-5 rounded-lg bg-saas-accent/10 flex items-center justify-center text-saas-accent">
              <Database size={14} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Repository: Neural Hubs</p>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-saas-text">Knowledge Bases</h1>
        <p className="text-sm text-saas-text-muted max-w-xl leading-relaxed">
           Architect new intelligence containers or manage existing neural nodes.
        </p>
      </header>

      {/* 2. Management Table Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <form onSubmit={handleCreate} className="flex-1 max-w-md flex gap-2">
           <input 
             type="text" 
             placeholder="New Workspace Name..." 
             className="saas-input flex-1"
             value={workspaceName}
             onChange={(e) => setWorkspaceName(e.target.value)}
           />
           <button 
             type="submit" 
             disabled={creating || !workspaceName.trim()}
             className="saas-button-primary"
           >
              {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
           </button>
        </form>

        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-saas-surface border border-saas-border rounded-xl text-saas-text-muted">
              <Search size={18} />
           </div>
           <div className="p-2.5 bg-saas-surface border border-saas-border rounded-xl text-saas-text-muted">
              <Filter size={18} />
           </div>
        </div>
      </div>

      {/* 3. Workspace Table (Minimalist) */}
      <div className="saas-card overflow-hidden">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-saas-border bg-saas-bg/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Channel Name</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Knowledge Core</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted">Last Activity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-saas-text-muted text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-saas-border/30">
               {projects.map(p => (
                 <tr key={p.id} className="group hover:bg-saas-surface/20 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-saas-accent grayscale group-hover:grayscale-0 transition-all" />
                          <span className="text-sm font-bold text-saas-text">{p.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-black text-saas-text-muted uppercase tracking-widest">{p._count?.documents || 0} Knowledge Blocks</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-black text-saas-text-muted uppercase tracking-[0.2em]">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                            className="p-2 hover:bg-saas-surface rounded-lg text-saas-text-muted hover:text-saas-accent"
                          >
                             <ArrowUpRight size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                            className="p-2 hover:bg-saas-surface rounded-lg text-saas-text-muted hover:text-red-400"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                 </tr>
               ))}
               {!loading && projects.length === 0 && (
                 <tr>
                    <td colSpan="4" className="py-24 text-center">
                       <div className="flex flex-col items-center opacity-30 grayscale">
                          <Database size={48} strokeWidth={1} className="mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">No Active Channels Found</p>
                       </div>
                    </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-saas-bg/90 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="saas-card max-w-md w-full p-10 text-center space-y-8"
            >
               <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                     <CheckCircle2 size={40} />
                  </div>
               </div>

               <div className="space-y-2">
                  <h2 className="text-2xl font-black text-saas-text tracking-tighter">Hub Successfully Synthetic</h2>
                  <p className="text-sm text-saas-text-muted leading-relaxed font-medium">
                     Your knowledge base is initialized and ready for data ingestion. Would you like to proceed with document upload?
                  </p>
               </div>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => navigate('/ingest')}
                    className="saas-button-primary w-full py-4 text-xs font-black uppercase tracking-widest"
                  >
                     Upload Documents Now
                  </button>
                  <button 
                    onClick={() => setShowSuccess(false)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-saas-text-muted hover:text-white transition-colors"
                  >
                     Stay in Repository
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workspaces;
