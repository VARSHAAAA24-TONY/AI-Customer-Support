import React, { lazy, Suspense } from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Core
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import AdminDashboard from './pages/AdminDashboard';

// Lazy Load Secondary Modules
const Workspaces = lazy(() => import('./pages/Workspaces'));
const Documents = lazy(() => import('./pages/Documents'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Ingest = lazy(() => import('./pages/Ingest'));

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Premium NexuAI Dashboard Refactor.
 * Clean, production-level routing with minimalist aesthetic.
 */
function App() {
  if (!clerkPubKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Configuration Error</h1>
        <p className="text-sm text-zinc-400 text-center max-w-sm">
          Microsoft Clerk Key (<code className="text-red-400">VITE_CLERK_PUBLISHABLE_KEY</code>) was not found. Please ensure it is set in your Vercel Environment Variables.
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1A1A1A',
              color: '#EAEAEA',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '13px',
              border: '1px solid #262626',
            }
          }}
        />
        
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />

          {/* Core App Area (Protected) */}
          <Route path="/*" element={
            <>
              <SignedIn>
                <MainLayout>
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-[60vh]">
                      <div className="w-8 h-8 border-2 border-saas-accent/20 border-t-saas-accent rounded-full animate-spin" />
                    </div>
                  }>
                    <Routes>
                      {/* Dashboard / Home */}
                      <Route path="/" element={<Dashboard />} />
                      
                      {/* Admin Panel */}
                      <Route path="/admin" element={<AdminDashboard />} />
                      
                      {/* Projects & Workspaces */}
                      <Route path="/workspaces" element={<Workspaces />} />
                      <Route path="/projects/:id" element={<ProjectWorkspace />} />
                      
                      {/* Document Hub & Neural Ingest (Differentiated) */}
                      <Route path="/knowledge" element={<Documents />} />
                      <Route path="/ingest" element={<Ingest />} />
                      
                      {/* AI Central Chat */}
                      <Route path="/chat" element={<AIChat />} />
                      
                      {/* Business Analytics */}
                      <Route path="/analytics" element={<Analytics />} />
                      
                      {/* Configuration Settings */}
                      <Route path="/settings" element={<Settings />} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </MainLayout>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn redirectUrl="/login" />
              </SignedOut>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
