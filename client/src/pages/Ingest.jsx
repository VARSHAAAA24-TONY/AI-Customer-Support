import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { 
  CloudUpload, 
  Database, 
  Loader2, 
  CheckCircle2, 
  FileText,
  Search,
  ChevronDown,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

/**
 * Premium Dedicated Ingestion Portal for NexuAI.
 * Features: Workspace Selector + Multi-Format Dropzone.
 */
const Ingest = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);

  const fetchWorkspaces = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setWorkspaces(res.data);
        if (res.data.length > 0) setSelectedWorkspace(res.data[0]);
      } else {
        console.error('Unexpected Workspaces Data:', res.data);
        setWorkspaces([]);
        toast.error('Portal Error: Could not synchronize workspaces.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Neural Sync Offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const onDrop = async (acceptedFiles) => {
    if (!selectedWorkspace) return toast.error('Initiate a Workspace First.');
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setShowSuccess(false);
    const toastId = toast.loading(`Ingesting ${acceptedFiles.length} knowledge blocks...`);
    
    const formData = new FormData();
    acceptedFiles.forEach(file => formData.append('files', file));
    
    try {
      const token = await getToken();
      await axios.post(`${API_BASE_URL}/api/projects/${selectedWorkspace.id}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Neural Memory Updated', { id: toastId });
      setRecentUploads(prev => [...acceptedFiles.map(f => f.name), ...prev].slice(0, 5));
      setShowSuccess(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Ingestion interrupted';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    }
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-10 h-10 border-2 border-saas-accent/20 border-t-saas-accent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Initializing Ingest Portal...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 page-transition px-4">
      
      {/* 1. Header Hub */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="w-5 h-5 rounded-lg bg-saas-accent/10 flex items-center justify-center text-saas-accent">
              <CloudUpload size={14} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Portal: Neural Ingestion</p>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-saas-text">Upload Documents</h1>
        <p className="text-sm text-saas-text-muted max-w-xl leading-relaxed">
           Sync your documents to the Intelligence Core. Select a workspace context and drop your knowledge blocks below.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT: Context Configuration */}
        <div className="lg:col-span-4 space-y-8">
           <div className="saas-card p-8 space-y-6 bg-saas-surface/30">
              <div className="space-y-2">
                 <h3 className="text-xs font-black uppercase tracking-widest text-saas-text">Select Intelligence Hub</h3>
                 <p className="text-[10px] text-saas-text-muted">Target workspace for indexing</p>
              </div>
              
              <div className="relative">
                  <select 
                     value={selectedWorkspace?.id}
                     onChange={(e) => setSelectedWorkspace(Array.isArray(workspaces) ? workspaces.find(w => w.id === e.target.value) : null)}
                     className="w-full bg-saas-bg border border-saas-border rounded-xl py-4 px-5 text-sm text-saas-text outline-none appearance-none focus:border-saas-accent/50 transition-all cursor-pointer"
                  >
                     {Array.isArray(workspaces) && workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                     {(!Array.isArray(workspaces) || workspaces.length === 0) && <option>No Workspaces Available</option>}
                  </select>
                 <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-saas-text-muted pointer-events-none" />
              </div>

              <div className="pt-6 border-t border-saas-border/50">
                 <div className="flex items-center gap-3 text-saas-accent">
                    <Database size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Global Memory Status</span>
                 </div>
                 <div className="mt-4 space-y-3">
                     <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-saas-text-muted">
                        <span>Total Blocks</span>
                        <span>{Array.isArray(workspaces) ? workspaces.reduce((acc, w) => acc + (w._count?.documents || 0), 0) : 0}</span>
                     </div>
                    <div className="w-full h-1 bg-saas-bg rounded-full overflow-hidden">
                       <div className="h-full bg-saas-accent w-2/3" />
                    </div>
                 </div>
              </div>
           </div>

           {recentUploads.length > 0 && (
             <div className="saas-card p-6 border-none bg-transparent">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted mb-4 px-2">Recent Synchronizations</h4>
                <div className="space-y-2">
                   {recentUploads.map((name, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-saas-surface/50 rounded-xl border border-saas-border/50">
                        <FileText size={14} className="text-saas-accent" />
                        <span className="text-[10px] font-medium text-saas-text truncate">{name}</span>
                        <CheckCircle2 size={12} className="ml-auto text-emerald-400" />
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* RIGHT: High-Fidelity Dropzone */}
        <div className="lg:col-span-8">
           <div 
             {...getRootProps()} 
             className={`saas-card min-h-[500px] p-16 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all duration-700
               ${isDragActive 
                 ? 'border-saas-accent bg-saas-accent/5' 
                 : 'border-saas-border hover:border-saas-accent/20 bg-saas-bg/10'}`}
           >
              <input {...getInputProps()} />
              
              <motion.div 
                animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                className="mb-12 p-10 rounded-[2.5rem] bg-saas-accent/5 text-saas-accent border border-saas-accent/10"
              >
                 <CloudUpload size={64} strokeWidth={1} />
              </motion.div>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-50 bg-saas-bg/95 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-8">
                       <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2 mb-10">
                       <h3 className="text-2xl font-black text-saas-text tracking-tighter">Knowledge Synchronized</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted">Intelligence Core Updated Successfully</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                       <button 
                         onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}
                         className="flex items-center gap-3 bg-saas-accent text-saas-bg px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-saas-accent/20"
                       >
                          <MessageSquare size={14} />
                          <span>Initiate Dialogue</span>
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setShowSuccess(false); }}
                         className="flex items-center gap-3 bg-saas-surface text-saas-text px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-saas-border hover:bg-saas-bg transition-all"
                       >
                          <span>Continue Ingestion</span>
                          <ArrowRight size={14} />
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h2 className="text-3xl font-black text-saas-text mb-4 tracking-tighter">Neural Block Ingestion</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-saas-text-muted max-w-sm mx-auto leading-relaxed">
                 SYNC PDF • TXT • CSV • DOCX • PPTX<br />TO GROUND THE AI CORE
              </p>

              {uploading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 flex items-center gap-4 text-saas-accent px-6 py-3 bg-saas-accent/10 rounded-2xl border border-saas-accent/20"
                >
                   <Loader2 className="animate-spin" size={18} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Neural Memory...</span>
                </motion.div>
              )}

              <div className="mt-16 flex items-center gap-8 opacity-20 grayscale">
                 <FileText size={32} />
                 <div className="w-px h-8 bg-saas-text" />
                 <span className="text-2xl font-black italic tracking-tighter">Verified</span>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
};

export default Ingest;
