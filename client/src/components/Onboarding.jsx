import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Rocket, Globe, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Premium SaaS Onboarding for NexuAI.
 * 
 * Features:
 * - Centered Modern Card
 * - Clean Workspace Creation Form
 * - High-end Dark Theme (#0f172a)
 */
const Onboarding = ({ onProjectCreated }) => {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Workspace name is required');
    
    setLoading(true);
    const toastId = toast.loading('Initializing neural hub...');
    try {
      const token = await getToken();
      const res = await axios.post(`${API_BASE_URL}/api/projects`, 
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Workspace created successfully!', { id: toastId });
      // Notify parent/sidebar
      window.dispatchEvent(new Event('project-created'));
      if (onProjectCreated) onProjectCreated(res.data);
    } catch (err) {
      toast.error('Initialization failed.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="saas-card max-w-xl w-full p-12 lg:p-16 relative overflow-hidden"
      >
        {/* Atmosphere */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-saas-primary/20 rounded-full blur-[60px] -z-10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-saas-secondary/20 rounded-full blur-[50px] -z-10" />

        <div className="text-center space-y-6 mb-12">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-saas-bg border border-saas-border flex items-center justify-center text-saas-primary shadow-saas-soft">
            <Rocket size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter text-saas-text">Create Your First Workspace</h2>
            <p className="text-sm text-saas-text-muted font-medium max-w-sm mx-auto leading-relaxed">
              Scale your support infrastructure with a dedicated neural hub for your documents and AI dialogues.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted ml-2">Workspace Name</label>
               <input 
                type="text" 
                placeholder="e.g. Acme Support Hub"
                className="saas-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted ml-2">Description (Optional)</label>
               <textarea 
                placeholder="Briefly describe the purpose of this hub..."
                className="saas-input min-h-[100px] resize-none py-4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="p-4 bg-saas-bg/50 rounded-xl border border-saas-border flex flex-col gap-2">
                <Globe size={16} className="text-saas-primary" />
                <span className="text-[10px] font-bold text-saas-text">Unified API Access</span>
             </div>
             <div className="p-4 bg-saas-bg/50 rounded-xl border border-saas-border flex flex-col gap-2">
                <Shield check size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-saas-text">Security Isolation</span>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full saas-button-primary py-5 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            Create Workspace
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
