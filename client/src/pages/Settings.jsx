import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Database,
  Trash2,
  MoreVertical,
  Check,
  ChevronRight,
  Globe,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Premium Minimalist Settings for NexuAI.
 * 
 * Features: Profile Management, Branding, Synchronization.
 */
const Settings = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: <User size={16} /> },
    { id: 'branding', label: 'Branding Hub', icon: <Zap size={16} /> },
    { id: 'security', label: 'Neural Security', icon: <Shield size={16} /> },
    { id: 'billing', label: 'Resource Plan', icon: <Database size={16} /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 page-transition">
      
      {/* 1. Category Switcher */}
      <aside className="lg:col-span-3 space-y-2">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 group
               ${activeTab === tab.id 
                 ? 'bg-saas-surface text-saas-accent border border-saas-border' 
                 : 'text-saas-text-muted hover:text-saas-text hover:bg-saas-surface/40'}`}
           >
              {tab.icon}
              <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </aside>

      {/* 2. Content Module */}
      <main className="lg:col-span-9">
         <div className="saas-card p-10 lg:p-14 space-y-12 bg-saas-surface/30">
            
            {activeTab === 'profile' && (
              <div className="space-y-12">
                 <div className="flex items-center gap-8 border-b border-saas-border pb-10">
                    <div className="w-24 h-24 rounded-3xl bg-saas-bg border border-saas-border p-1 overflow-hidden group">
                       <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-80" />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-saas-text tracking-tighter">{user?.fullName || 'Artisan Specialist'}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-saas-accent">Premium Intelligence Operator</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted">Account Designation</p>
                       <input disabled value={user?.fullName || ''} className="saas-input w-full cursor-not-allowed opacity-50" />
                    </div>
                    <div className="space-y-4">
                       <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted">Direct Communication</p>
                       <input disabled value={user?.primaryEmailAddress?.emailAddress || ''} className="saas-input w-full cursor-not-allowed opacity-50" />
                    </div>
                 </div>

                 <div className="pt-8 flex justify-end">
                    <button onClick={() => toast.success('Profile Synced')} className="saas-button-primary">Save Baseline</button>
                 </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-10">
                 <div className="border-b border-saas-border pb-8">
                    <h3 className="text-xl font-black text-saas-text tracking-tight">Neural Branding</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted mt-1">Customize your platform experience</p>
                 </div>
                 
                 <div className="space-y-12">
                     <button 
                        onClick={() => {
                           window.dispatchEvent(new CustomEvent('theme-changed', { detail: 'gold' }));
                           toast.success('Neural Baseline: Gold Activated');
                        }}
                        className={`w-full flex items-center justify-between p-8 rounded-2xl border transition-all
                          ${localStorage.getItem('saas-theme') !== 'aurora' 
                            ? 'bg-saas-bg border-saas-accent shadow-saas-gold' 
                            : 'bg-saas-bg/30 border-saas-border hover:border-sa-accent/20'}`}
                     >
                        <div className="text-left space-y-1">
                           <p className="text-xs font-bold text-saas-text">Baseline: Matte Gold</p>
                           <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted">Standard Intelligence Aesthetic</p>
                        </div>
                        {localStorage.getItem('saas-theme') !== 'aurora' && (
                           <div className="w-4 h-4 rounded-full bg-saas-accent flex items-center justify-center">
                              <Check size={10} className="text-saas-bg" />
                           </div>
                        )}
                     </button>

                     <button 
                        onClick={() => {
                           window.dispatchEvent(new CustomEvent('theme-changed', { detail: 'aurora' }));
                           toast.success('Neural Pulse: Aurora Activated');
                        }}
                        className={`w-full flex items-center justify-between p-8 rounded-2xl border transition-all
                          ${localStorage.getItem('saas-theme') === 'aurora' 
                            ? 'bg-saas-bg border-saas-accent shadow-saas-gold' 
                            : 'bg-saas-bg/30 border-saas-border hover:border-saas-accent/20'}`}
                     >
                        <div className="text-left space-y-1">
                           <p className="text-xs font-bold text-saas-text">Pulse: Aurora Indigo</p>
                           <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted">High-Fidelity Neural Glow</p>
                        </div>
                        {localStorage.getItem('saas-theme') === 'aurora' && (
                           <div className="w-4 h-4 rounded-full bg-saas-accent flex items-center justify-center">
                              <Check size={10} className="text-saas-bg" />
                           </div>
                        )}
                     </button>
                 </div>
              </div>
            )}

            {activeTab === 'security' && (
               <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 grayscale opacity-20">
                  <Shield size={64} strokeWidth={1} />
                  <p className="text-xs font-black uppercase tracking-widest">Baseline Security Locked.<br />Neural Protocols Optimal.</p>
               </div>
            )}

            {activeTab === 'billing' && (
               <div className="space-y-10">
                  <div className="border-b border-saas-border pb-8">
                     <h3 className="text-xl font-black text-saas-text tracking-tight">Intelligence Plan</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted mt-1">Resource allocation & limits</p>
                  </div>
                  
                  <div className="saas-card bg-saas-bg border-saas-accent/30 p-10 flex flex-col items-center justify-center text-center">
                     <div className="w-16 h-16 rounded-full bg-saas-accent/10 flex items-center justify-center text-saas-accent mb-6">
                        <Database size={32} />
                     </div>
                     <h4 className="text-2xl font-black text-saas-text uppercase tracking-tighter">Premium Core</h4>
                     <p className="text-[10px] font-black uppercase tracking-widest text-saas-accent mt-2">Unlimited Neural Blocks • Unlimited Dialogue</p>
                  </div>
               </div>
            )}

         </div>
      </main>
    </div>
  );
};

export default Settings;
