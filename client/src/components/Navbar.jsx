import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Search, Bell, HelpCircle, Command, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Premium SaaS Navbar for NexuAI.
 * Features: Dynamic Title, Centered Search, Glassmorphism.
 */
const Navbar = ({ onMenuClick }) => {
  const { user } = useUser();
  const location = useLocation();

  // Dynamic Page Title mapping
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/workspaces')) return 'Workspaces';
    if (path.startsWith('/projects')) return 'Workspace Detail';
    if (path.startsWith('/documents')) return 'Document Repository';
    if (path.startsWith('/chat')) return 'AI Dialogue';
    if (path.startsWith('/analytics')) return 'Neural Analytics';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'Intelligence Hub';
  };

  return (
    <header className="sticky top-0 h-20 bg-saas-bg/80 backdrop-blur-md border-b border-saas-border z-40 flex items-center justify-between px-6 sm:px-8 transition-all">
      {/* Left: Hamburger & Dynamic Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-saas-text-muted hover:text-saas-text hover:bg-saas-surface rounded-lg transition-all"
        >
          <Menu size={20} />
        </button>
        
        <motion.div 
          key={location.pathname}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-saas-accent/70">Intelligence Overview</p>
          <h2 className="text-lg sm:text-xl font-black text-saas-text tracking-tight truncate max-w-[150px] sm:max-w-none">{getPageTitle()}</h2>
        </motion.div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-saas-text-muted group-focus-within:text-saas-primary transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search neural blocks..." 
          className="w-full bg-saas-surface border border-saas-border rounded-xl py-3 pl-12 pr-4 text-sm text-saas-text focus:border-saas-primary/50 outline-none transition-all shadow-sm group-hover:bg-saas-surface/80"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-saas-bg border border-saas-border text-[9px] font-bold text-saas-text-muted">
          <Command size={10} /> K
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-saas-text-muted hover:text-saas-text hover:bg-saas-surface rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-saas-primary rounded-full border-2 border-saas-bg" />
        </button>
        <button className="p-2.5 text-saas-text-muted hover:text-saas-text hover:bg-saas-surface rounded-xl transition-all">
          <HelpCircle size={20} />
        </button>
        <div className="h-8 w-px bg-saas-border mx-2" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
             <p className="text-xs font-bold text-saas-text leading-none mb-1">{user?.firstName}</p>
             <p className="text-[10px] text-saas-text-muted uppercase tracking-widest font-black">Pro Tier</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-saas-primary/20 to-saas-secondary/20 p-0.5 border border-saas-border">
             <img src={user?.imageUrl} alt="Avatar" className="w-full h-full rounded-[10px] object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
