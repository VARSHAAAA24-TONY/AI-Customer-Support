import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import FloatingChat from './FloatingChat';
import CommandPalette from './CommandPalette';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Minimalist MainLayout for NexuAI.
 * 
 * Theme: Matte Black (#0D0D0D), Golden Accents (#C2A878), Standard Serif/Sans mix.
 */
const MainLayout = ({ children }) => {
  const { isLoaded } = useUser();
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState(localStorage.getItem('saas-theme') || 'gold');
  
  // Sidebar State (Global for this layout)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // 1. Keyboard Listener for Command Palette
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Theme Synchronization
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('saas-theme', currentTheme);
    
    const handleThemeChange = (e) => setCurrentTheme(e.detail);
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, [currentTheme]);

  // Dynamic Page Title Heading Logic
  const pageHeading = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/projects/')) return 'Workspace Hub';
    if (path === '/knowledge') return 'Knowledge Base';
    if (path === '/ingest') return 'Document Insertion';
    if (path === '/chat') return 'AI Chat';
    return 'Panel';
  }, [location]);

  return (
    <div className="flex bg-saas-bg min-h-screen selection:bg-saas-accent/20">
      <AnimatePresence mode="wait">
        {!isLoaded ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-saas-bg"
          >
            <div className="w-8 h-8 border-2 border-saas-accent/20 border-t-saas-accent rounded-full animate-spin" />
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-saas-text-muted">Initializing Core System...</p>
          </motion.div>
        ) : (
          <div className="flex w-full min-h-screen relative overflow-hidden">
            <Sidebar 
              isCollapsed={isSidebarCollapsed} 
              setIsCollapsed={setIsSidebarCollapsed}
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />

            <div 
              className={`flex-1 flex flex-col min-w-0 transition-all duration-300 
                ${isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[260px]'}
                ml-0`}
            >
              <Navbar 
                title={pageHeading} 
                onMenuClick={() => setIsSidebarOpen(true)}
              />

              <main className="flex-1 px-4 sm:px-8 lg:px-12 py-10 pb-24 overflow-y-auto no-scrollbar">
                
                {/* 1. Universal Page Heading (Clean Minimalism) */}
                <header className="mb-12 page-transition">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-accent mb-2">NexuAI Core Console</h2>
                   <h1 className="text-4xl font-black tracking-tighter text-saas-text">{pageHeading}</h1>
                   <div className="h-0.5 w-12 bg-saas-accent mt-4" />
                </header>

                {/* 2. Main Page Content Section */}
                <div className="max-w-[1400px] mx-auto min-h-full">
                  {children}
                </div>
              </main>
            </div>

            {/* Global Floating AI Utility (Grounded) */}
            <FloatingChat />

            {/* Global Command Center (Cmd+K) */}
            <CommandPalette 
              isOpen={isCommandPaletteOpen} 
              onClose={() => setIsCommandPaletteOpen(false)} 
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
