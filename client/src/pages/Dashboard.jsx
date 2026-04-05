import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  CloudUpload, 
  MessageSquare, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Database,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Guided Dashboard for NexuAI.
 * Features: 3-Step Success Journey, Minimalist Cards, Quick Insights.
 */
const Dashboard = () => {
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ documents: 0, chats: 0 });

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
      
      const docCount = res.data.reduce((acc, p) => acc + (p._count?.documents || 0), 0);
      setStats({ documents: docCount, chats: 0 }); // Chats count can be added if backend supports
    } catch (err) {
      console.error('Dashboard Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoaded && user) fetchDashboardData();
  }, [userLoaded, user]);

  if (loading || !userLoaded) {
    return (
      <div className="space-y-12 py-10 animate-pulse">
        <div className="h-48 bg-saas-surface border border-saas-border rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[1,2,3].map(i => <div key={i} className="h-64 bg-saas-surface/50 border border-saas-border rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // --- PROGRESS LOGIC ---
  const step1Complete = projects.length > 0;
  const step2Complete = stats.documents > 0;
  const step3Complete = false; // Add chat history check if needed

  const steps = [
    {
      id: 1,
      title: 'Initialize Hub',
      desc: 'Create your primary neural baseline.',
      icon: <Database size={24} />,
      status: step1Complete ? 'completed' : 'pending',
      cta: 'Create Workspace',
      to: '/workspaces'
    },
    {
      id: 2,
      title: 'Ingest Blocks',
      desc: 'Upload documents to ground the core.',
      icon: <CloudUpload size={24} />,
      status: step2Complete ? 'completed' : 'pending',
      cta: 'Upload Now',
      to: '/ingest',
      disabled: !step1Complete
    },
    {
      id: 3,
      title: 'Synch Dialogue',
      desc: 'Engage with your verified knowledge.',
      icon: <MessageSquare size={24} />,
      status: step3Complete ? 'completed' : 'pending',
      cta: 'Start AI Chat',
      to: '/chat',
      disabled: !step2Complete
    }
  ];

  return (
    <div className="space-y-16 page-transition max-w-6xl mx-auto">
      
      {/* 1. Welcoming Hero */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-saas-border">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-accent">System Online</span>
              <div className="w-1 h-1 rounded-full bg-saas-accent animate-pulse" />
           </div>
           <h1 className="text-4xl font-black text-saas-text tracking-tighter">
              Welcome back, <span className="text-saas-accent">{user?.firstName || 'Artisan'}</span>.
           </h1>
           <p className="text-sm text-saas-text-muted font-medium uppercase tracking-widest text-[9px]">
              Managing {projects.length} Neural Hubs across the intelligence grid.
           </p>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted">Total Knowledge Blocks</p>
              <p className="text-xl font-black text-saas-text">{stats.documents}</p>
           </div>
           <div className="w-px h-10 bg-saas-border" />
           <ShieldCheck className="text-saas-accent" size={32} />
        </div>
      </header>

      {/* 2. Guided 3-Step Journey */}
      <section className="space-y-10">
         <div className="flex items-center gap-3">
            <Zap size={16} className="text-saas-accent" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-saas-text">Deployment Roadmap</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`saas-card relative p-10 flex flex-col h-full transition-all duration-500
                  ${step.status === 'completed' ? 'bg-saas-accent/5 border-saas-accent/20' : 'bg-saas-surface/30'}`}
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-xl bg-saas-bg border border-saas-border flex items-center justify-center text-xs font-black text-saas-text shadow-xl">
                   {step.id}
                </div>

                <div className="flex items-center justify-between mb-8">
                   <div className={`p-4 rounded-2xl border transition-colors
                     ${step.status === 'completed' ? 'bg-saas-accent text-saas-bg border-transparent' : 'bg-saas-bg border-saas-border text-saas-text-muted'}`}>
                      {step.icon}
                   </div>
                   {step.status === 'completed' ? (
                     <CheckCircle2 size={24} className="text-emerald-400" />
                   ) : (
                     <Circle size={24} className="text-saas-border" />
                   )}
                </div>

                <h3 className="text-xl font-black text-saas-text mb-2 tracking-tight">{step.title}</h3>
                <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-saas-text-muted leading-relaxed mb-10">
                   {step.desc}
                </p>

                <div className="mt-auto">
                   <button 
                     onClick={() => navigate(step.to)}
                     disabled={step.disabled}
                     className={`w-full group flex items-center justify-between px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                       ${step.disabled 
                         ? 'bg-saas-bg text-saas-text-muted border border-saas-border cursor-not-allowed opacity-50' 
                         : 'bg-saas-surface text-saas-text hover:bg-saas-accent hover:text-saas-bg'}`}
                   >
                      {step.cta}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            ))}
         </div>
      </section>

      {/* 3. Global Activity Snippet */}
      <section className="saas-card p-10 flex flex-col md:flex-row items-center justify-between gap-10 bg-saas-accent text-saas-bg border-none">
         <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter italic uppercase">Synchronize Now</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-relaxed">
               Ready to engage? Open the Global Chat Archive to begin<br />grounded dialogue across all hubs.
            </p>
         </div>
         <button 
           onClick={() => navigate('/chat')}
           disabled={!step2Complete}
           className={`flex items-center gap-4 px-10 py-5 bg-saas-bg text-saas-text rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 transition-all shadow-2xl
             ${!step2Complete ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-black'}`}
         >
            <MessageSquare size={18} /> Open Neural Dialogue
         </button>
      </section>

    </div>
  );
};

export default Dashboard;
