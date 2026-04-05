import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Command, 
  Search, 
  LayoutDashboard, 
  Database, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Plus, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Command Palette (Cmd+K) for NexuAI.
 */
const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [query, setQuery] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
      setQuery('');
    }
  }, [isOpen, fetchWorkspaces]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview', category: 'Navigation' },
    { to: '/workspaces', icon: Database, label: 'Workspaces Hub', category: 'Navigation' },
    { to: '/documents', icon: FileText, label: 'Knowledge Base', category: 'Navigation' },
    { to: '/chat', icon: MessageSquare, label: 'AI Central Dialogue', category: 'Navigation' },
    { to: '/analytics', icon: BarChart3, label: 'Insights & Performance', category: 'Navigation' },
    { to: '/settings', icon: Settings, label: 'System Configuration', category: 'Navigation' },
  ];

  const filteredNav = navItems.filter(i => 
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-saas-bg/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-saas-surface border border-saas-border rounded-2xl shadow-saas-soft overflow-hidden"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-saas-border bg-saas-bg/20">
               <Search className="text-saas-accent grayscale" size={18} />
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Type to navigate or search workspaces..."
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none text-saas-text text-sm font-medium placeholder:text-saas-text-muted/40"
               />
               <kbd className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-saas-bg rounded-lg border border-saas-border text-[9px] font-black text-saas-text-muted">
                  ESC
               </kbd>
            </div>

            {/* Results Display */}
            <div className="max-h-[50vh] overflow-y-auto no-scrollbar py-4 px-4 space-y-8">
               
               {/* 1. Core Navigation Section */}
               {filteredNav.length > 0 && (
                 <div className="space-y-2">
                    <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-saas-text-muted mb-4 opacity-50">Global Portal</p>
                    {filteredNav.map(item => (
                      <button 
                        key={item.to}
                        onClick={() => handleNavigate(item.to)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-saas-accent/5 hover:text-saas-accent transition-all group border border-transparent hover:border-saas-accent/20"
                      >
                         <div className="w-8 h-8 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center grayscale group-hover:grayscale-0 group-hover:border-saas-accent/30 transition-all">
                            <item.icon size={16} />
                         </div>
                         <span className="flex-1 text-left text-xs font-bold tracking-tight">{item.label}</span>
                         <ArrowRight size={14} className="opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                 </div>
               )}

               {/* 2. Active Workspaces Section */}
               {(filteredWorkspaces.length > 0 || loading) && (
                 <div className="space-y-2">
                    <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-saas-text-muted mb-4 opacity-50">Neural Channels</p>
                    {loading ? (
                      <div className="px-4 py-4 space-y-4">
                         <div className="h-4 w-48 bg-saas-bg rounded-lg animate-pulse" />
                         <div className="h-4 w-32 bg-saas-bg rounded-lg animate-pulse" />
                      </div>
                    ) : filteredWorkspaces.map(ws => (
                      <button 
                        key={ws.id}
                        onClick={() => handleNavigate(`/projects/${ws.id}`)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-saas-accent/5 hover:text-saas-accent transition-all group border border-transparent hover:border-saas-accent/20"
                      >
                         <div className="w-8 h-8 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center grayscale group-hover:grayscale-0 group-hover:border-saas-accent/30 transition-all">
                            <Zap size={14} />
                         </div>
                         <div className="flex-1 text-left">
                           <p className="text-xs font-bold tracking-tight">{ws.name}</p>
                           <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted opacity-60">Grounded Core Active</p>
                         </div>
                         <ArrowRight size={14} className="opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                 </div>
               )}

               {/* 3. Global Actions Section */}
               {query.length > 0 && (
                 <div className="space-y-2">
                    <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-saas-text-muted mb-4 opacity-50">Global Actions</p>
                    <button 
                      onClick={() => handleNavigate('/workspaces')}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-saas-accent/5 hover:text-saas-accent transition-all group border border-transparent hover:border-saas-accent/20"
                    >
                       <div className="w-8 h-8 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center grayscale group-hover:grayscale-0 group-hover:border-saas-accent/30 transition-all">
                          <Plus size={16} />
                       </div>
                       <span className="flex-1 text-left text-xs font-bold tracking-tight">Architect New Workspace: "{query}"</span>
                       <ArrowRight size={14} className="opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                 </div>
               )}

               {/* Empty Placeholder */}
               {filteredNav.length === 0 && filteredWorkspaces.length === 0 && !loading && (
                  <div className="py-20 text-center space-y-6 grayscale opacity-20">
                     <Command size={48} strokeWidth={1} className="mx-auto" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Baseline Query Logic Failure.<br />Try another Neural Path.</p>
                  </div>
               )}

            </div>

            {/* Footer Tips */}
            <div className="px-6 py-4 bg-saas-bg border-t border-saas-border flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-saas-text-muted select-none">
               <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                     <span className="px-1.5 py-0.5 bg-saas-surface rounded border border-saas-border text-saas-text">↑↓</span> to navigate
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="px-1.5 py-0.5 bg-saas-surface rounded border border-saas-border text-saas-text">↵</span> to confirm
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-saas-surface rounded border border-saas-border text-saas-text">ESC</span> to exit
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
