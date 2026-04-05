import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Minimalist Sidebar for NexuAI.
 * Features: Matte Black (#0D0D0D), Workspace Persistence, Gold Accents (#C2A878).
 */
const Sidebar = () => {
  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Fetch all projects (workspaces) for the sidebar
  const fetchWorkspaces = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setWorkspaces(res.data);
      } else {
        console.error('Sidebar Data Mismatch:', res.data);
      }
    } catch (err) {
      console.error('Sidebar Workspace Fetch Error:', err);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(res.data.role);
    } catch (err) {
      console.error('Sidebar Profile Fetch Error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
      fetchProfile();
    }
    
    // Listen for global 'workspace-created' events
    const handleCreated = () => fetchWorkspaces();
    window.addEventListener('workspace-created', handleCreated);
    return () => window.removeEventListener('workspace-created', handleCreated);
  }, [user]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/workspaces', icon: Database, label: 'Knowledge Base' },
    { to: '/ingest', icon: Plus, label: 'Document Insertion' },
    { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  ];

  const adminItem = { to: '/admin', icon: LayoutDashboard, label: 'Admin Console' };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="fixed left-0 top-0 bottom-0 bg-saas-bg border-r border-saas-border z-[100] flex flex-col transition-all duration-300"
    >
      {/* Brand Section */}
      <div className={`h-20 flex items-center px-6 justify-between ${isCollapsed ? 'justify-center px-0' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-saas-accent flex items-center justify-center text-saas-bg">
                <span className="text-lg font-black tracking-tighter">N</span>
             </div>
             <span className="text-lg font-black tracking-tighter text-saas-text uppercase">NexuAI</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-saas-accent flex items-center justify-center text-saas-bg">
             <span className="text-lg font-black tracking-tighter">N</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto no-scrollbar">
        <p className={`px-4 text-[10px] font-black uppercase tracking-widest text-saas-text-muted mb-3 ${isCollapsed ? 'hidden' : ''}`}>
           Application
        </p>
        {navItems.map((item) => (
          <NavLink 
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-saas-surface text-saas-accent font-bold' 
                : 'text-saas-text-muted hover:text-saas-text hover:bg-saas-surface/40'}
            `}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
          </NavLink>
        ))}

        {userRole === 'ADMIN' && (
          <div className="pt-4 mt-4 border-t border-saas-border/30">
            <p className={`px-4 text-[10px] font-black uppercase tracking-widest text-saas-accent mb-3 ${isCollapsed ? 'hidden' : ''}`}>
               Management
            </p>
            <NavLink 
              to={adminItem.to}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-saas-surface text-saas-accent font-bold' 
                  : 'text-saas-text-muted hover:text-saas-accent hover:bg-saas-surface/40'}
              `}
            >
              <adminItem.icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm tracking-tight">{adminItem.label}</span>}
            </NavLink>
          </div>
        )}

        {/* Workspaces section removed for simplified SaaS view */}
      </nav>

      {/* User Section & Collapse Toggle */}
      <div className="mt-auto px-3 pb-6 space-y-4">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-saas-text-muted hover:text-saas-text hover:bg-saas-surface/40 rounded-xl transition-all hidden lg:flex ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Collapse</span>}
        </button>

        <div className={`p-3 bg-saas-surface rounded-2xl border border-saas-border flex items-center gap-3 ${isCollapsed ? 'justify-center mx-1 px-0' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-saas-bg border border-saas-border overflow-hidden flex-shrink-0">
             <img src={user?.imageUrl} alt="Avatar" className="w-full h-full object-cover grayscale opacity-80" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-black text-saas-text truncate tracking-tight uppercase">{user?.fullName || 'User'}</p>
               <button onClick={() => signOut()} className="text-[9px] font-black text-saas-accent uppercase tracking-widest hover:text-white transition-colors">Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
