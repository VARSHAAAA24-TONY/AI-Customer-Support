import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { 
  CloudUpload, 
  FileText, 
  MessageSquare, 
  Trash2, 
  Send, 
  Loader2, 
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Database,
  Search,
  MoreVertical,
  X,
  FileCode,
  Check,
  Zap,
  Info
} from 'lucide-react';

/**
 * Premium Minimalist Project Workspace for NexuAI.
 * 
 * Theme: Matte Black & Gold.
 * Features:
 * - Structured Document Management (Multi-Format, Metadata)
 * - Grounded AI Chat (Notion/Linear Style)
 */
const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [activeView, setActiveView] = useState('dialogue'); // 'knowledge' or 'dialogue'
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  
  const scrollRef = useRef(null);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [pRes, hRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/projects/${id}/chat`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProject(pRes.data);
      setMessages(hRes.data || []);
    } catch (err) {
      console.error('Workspace Fetch Error:', err);
      if (err.response?.status === 403) {
        toast.error('Identity Mismatch: Access Forbidden');
      } else {
        toast.error('Neural Node Offline');
      }
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Permanently destroy this neural hub? All grounded data will be lost.`)) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Neural Hub Purged');
      window.dispatchEvent(new Event('workspace-created'));
      navigate('/');
    } catch (err) {
      toast.error('Purge failed.');
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`Indexing ${acceptedFiles.length} neural blocks...`);
    const formData = new FormData();
    acceptedFiles.forEach(file => formData.append('files', file));
    
    try {
      const token = await getToken();
      await axios.post(`${API_BASE_URL}/api/projects/${id}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Grounded Logic Updated.', { id: toastId });
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Indexing failed.';
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

  const deleteDocument = async (docId, name) => {
    if (!window.confirm(`Purge knowledge block "${name}" from neural memory?`)) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Memory Purged');
      fetchData();
    } catch (err) {
      toast.error('Purge failed.');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    
    // Relaxed Grounding Check
    if (!project?.documents || project?.documents.length === 0) {
      toast("Workspace Archive Empty. Dialogue may be general.", { icon: 'ℹ️' });
    }

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId: id, query: input })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMsg = { role: 'assistant', content: '', sources: [] };
      setMessages(prev => [...prev, aiMsg]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                aiMsg.content += data.content;
                setMessages(prev => [...prev.slice(0, -1), { ...aiMsg }]);
              }
              if (data.sources) {
                aiMsg.sources = data.sources;
                setMessages(prev => [...prev.slice(0, -1), { ...aiMsg }]);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      toast.error('Neural transmission interrupted.');
    } finally {
      setChatLoading(false);
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) return <span className="text-red-400">PDF</span>;
    if (mimetype.includes('word')) return <span className="text-blue-400">DOCX</span>;
    if (mimetype.includes('csv') || mimetype.includes('excel')) return <span className="text-emerald-400">CSV</span>;
    if (mimetype.includes('presentation')) return <span className="text-orange-400">PPTX</span>;
    return <span className="text-saas-accent">DATA</span>;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-10 h-10 border-2 border-saas-accent/20 border-t-saas-accent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Synchronizing Workspace...</p>
    </div>
  );

  return (
    <div className="space-y-10 page-transition">
      
      {/* 1. Header Hub */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 rounded-full bg-saas-accent/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-saas-accent animate-pulse" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-saas-text-muted">Channel: Grounded Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-black tracking-tighter text-saas-text">{project?.name}</h1>
             <button 
               onClick={() => handleDeleteProject()}
               className="p-2 text-saas-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
             >
                <Trash2 size={18} />
             </button>
          </div>
        </div>

        {/* High-Fidelity Switcher */}
        <div className="flex p-1 bg-saas-surface rounded-2xl border border-saas-border w-fit shadow-saas-soft">
          {[
            { id: 'dialogue', label: 'AI Dialogue', icon: <MessageSquare size={16} /> },
            { id: 'knowledge', label: 'Knowledge Hub', icon: <Database size={16} /> }
          ].map(view => (
            <button 
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3
                ${activeView === view.id 
                  ? 'bg-saas-bg text-saas-accent border border-saas-border' 
                  : 'text-saas-text-muted hover:text-saas-text'}`}
            >
              {view.icon}
              {view.label}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeView === 'knowledge' ? (
          <motion.div 
            key="knowledge"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* LEFT: Upload Console */}
            <div className="lg:col-span-5 space-y-8">
              <div 
                {...getRootProps()} 
                className={`saas-card min-h-[480px] p-12 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all duration-500
                  ${isDragActive 
                    ? 'border-saas-accent bg-saas-accent/5' 
                    : 'border-saas-border hover:border-saas-accent/30 bg-saas-bg/30'}`}
              >
                <input {...getInputProps()} />
                <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }} className="mb-10 p-8 rounded-3xl bg-saas-accent/5 text-saas-accent">
                   <CloudUpload size={56} strokeWidth={1} />
                </motion.div>
                <h3 className="text-2xl font-black text-saas-text mb-4">Ingest Resources</h3>
                <p className="text-[10px] text-saas-text-muted font-black uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                   Sync PDF, TXT, CSV, or Office docs to Ground the Neural Core.
                </p>
                {uploading && (
                  <div className="mt-10 flex items-center gap-3 text-saas-accent font-black text-[10px] uppercase tracking-[0.3em]">
                    <Loader2 className="animate-spin" size={14} /> Synchronizing Memory...
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Document Registry */}
            <div className="lg:col-span-7">
               <div className="saas-card min-h-[480px] p-10 flex flex-col bg-saas-surface/30">
                  <div className="flex items-center justify-between mb-10">
                     <div className="space-y-1">
                        <h3 className="text-xl font-black text-saas-text">Knowledge Hub</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted">Repository Index</p>
                     </div>
                     <div className="flex items-center gap-3 px-4 py-2 bg-saas-bg rounded-xl border border-saas-border">
                        <Search size={14} className="text-saas-text-muted" />
                        <input type="text" placeholder="Search Memory..." className="bg-transparent border-none outline-none text-xs text-saas-text w-32" />
                     </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar max-h-[500px]">
                     {uploading && (
                       <div className="p-6 bg-saas-accent/5 rounded-2xl border border-saas-accent/20 flex items-center gap-6 animate-pulse">
                          <div className="w-12 h-12 rounded-xl bg-saas-surface border border-saas-accent/20 flex flex-col items-center justify-center">
                             <Loader2 size={20} className="animate-spin text-saas-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-saas-accent tracking-tight">Neural Ingest Active...</p>
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-saas-text-muted mt-1">Indexing Knowledge Blocks</p>
                          </div>
                       </div>
                     )}
                     {project?.documents?.map(doc => (
                       <div 
                        key={doc.id}
                        className="p-6 bg-saas-bg/50 rounded-2xl border border-saas-border flex items-center gap-6 group hover:border-saas-accent/20 transition-all transition-all"
                       >
                          <div className="w-12 h-12 rounded-xl bg-saas-surface border border-saas-border flex flex-col items-center justify-center text-[8px] font-black text-saas-accent group-hover:scale-105 transition-transform">
                             <FileText size={20} className="mb-0.5" />
                             {getFileIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-saas-text truncate mb-1.5">{doc.name}</p>
                             <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-saas-text-muted">
                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                <span className="w-1 h-1 rounded-full bg-saas-border" />
                                <span>Verified Hub</span>
                             </div>
                          </div>
                          <button onClick={() => deleteDocument(doc.id, doc.name)} className="p-3 text-saas-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={18} />
                          </button>
                       </div>
                     ))}
                     {(!project?.documents || project?.documents.length === 0) && (
                       <div className="h-full flex flex-col items-center justify-center opacity-10 py-32 text-center grayscale">
                          <Database size={64} strokeWidth={1} className="mb-6" />
                          <p className="text-sm font-black uppercase tracking-widest">Neural Archive Offline</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dialogue"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="saas-card h-[70vh] flex flex-col bg-saas-bg/20 relative overflow-hidden transition-all duration-700"
          >
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-10 lg:p-14 space-y-12 custom-scrollbar" ref={scrollRef}>
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-6 grayscale">
                    <Sparkles size={64} strokeWidth={1} />
                    <div className="max-w-sm mx-auto">
                       <h4 className="text-2xl font-black text-saas-text">Core Dialogue Active</h4>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2">Analytical Baseline Primed</p>
                    </div>
                 </div>
               )}
               {messages.map((msg, i) => (
                 <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                    <div className={`max-w-[85%] lg:max-w-[65%] p-7 rounded-3xl shadow-saas-soft space-y-5
                      ${msg.role === 'user' 
                        ? 'bg-saas-surface text-saas-text border border-saas-accent/30 rounded-tr-none' 
                        : 'bg-saas-surface/40 text-saas-text border border-saas-border rounded-tl-none'}`}>
                        <div className="text-sm font-medium leading-[1.8] whitespace-pre-wrap">{msg.content}</div>
                        {msg.sources?.length > 0 && (
                          <div className={`pt-5 border-t border-saas-border/50`}>
                             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-saas-accent mb-3">Verified Sources:</p>
                             <div className="flex flex-wrap gap-2">
                                {msg.sources.map((s, si) => (
                                  <span key={si} className="px-3 py-1.5 bg-saas-bg/50 text-[9px] font-black rounded-lg border border-saas-border flex items-center gap-2">
                                     <FileCode size={12} className="text-saas-accent" /> {s}
                                  </span>
                                ))}
                             </div>
                          </div>
                        )}
                    </div>
                 </motion.div>
               ))}
               {chatLoading && (
                 <div className="flex justify-start">
                    <div className="bg-saas-surface p-6 rounded-2xl rounded-tl-none border border-saas-border">
                       <Loader2 size={24} className="animate-spin text-saas-accent" />
                    </div>
                 </div>
               )}
            </div>

            {/* MINIMALIST STICKY INPUT */}
            <div className="p-8 bg-saas-surface/50 border-t border-saas-border">
               <div className="max-w-4xl mx-auto relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-saas-accent/20 to-transparent rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-4 bg-saas-bg border border-saas-border rounded-2xl pr-3 overflow-hidden transition-all duration-300 focus-within:border-saas-accent/50 shadow-inner">
                    <input 
                      type="text" 
                      placeholder={`Ask {${project?.name}}...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-transparent border-none py-5 pl-8 text-sm text-saas-text outline-none placeholder:text-saas-text-muted/40"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!input.trim() || chatLoading}
                      className="p-3 bg-saas-accent text-saas-bg rounded-xl hover:scale-105 transition-all disabled:opacity-20 flex items-center justify-center"
                    >
                      <Send size={20} />
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectWorkspace;
