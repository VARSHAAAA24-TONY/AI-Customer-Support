import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  MessageSquare, 
  Database,
  ArrowRight,
  ChevronDown,
  Globe,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Minimalist Global AI Dialogue for NexuAI.
 */
const AIChat = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef(null);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedWorkspace || chatLoading) return;
    
    // Check for docs - warning only
    if (!selectedWorkspace.documents || selectedWorkspace.documents.length === 0) {
      toast("Workspace Grounding Empty. Results may be general.", { icon: 'ℹ️' });
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
        body: JSON.stringify({ projectId: selectedWorkspace.id, query: input })
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

  if (loading) return (
     <div className="flex flex-col items-center justify-center h-[60vh] gap-6 grayscale opacity-30">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Calibrating Neural Baseline...</p>
     </div>
  );

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center page-transition">
        <div className="w-16 h-16 rounded-2xl bg-saas-surface border border-saas-border flex items-center justify-center text-saas-accent mb-8">
           <Globe size={32} />
        </div>
        <h2 className="text-2xl font-black text-saas-text tracking-tight mb-4">Neural Dialogue Offline</h2>
        <p className="text-xs font-black uppercase tracking-widest text-saas-text-muted mb-8">Initiate at least one workspace to begin global dialogue.</p>
        <button onClick={() => navigate('/workspaces')} className="saas-button-primary">Architect Workspace</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 page-transition">
      
      {/* 1. Context Selector */}
      <div className="flex items-center justify-between border-b border-saas-border pb-8">
         <div className="space-y-1">
            <h3 className="text-xl font-black tracking-tighter text-saas-text">Neural Context</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted">Currently Grounded In</p>
         </div>

         <div className="relative group">
            <select 
              value={selectedWorkspace?.id} 
              onChange={(e) => setSelectedWorkspace(workspaces.find(w => w.id === e.target.value))}
              className="appearance-none bg-saas-surface border border-saas-border text-saas-text text-xs font-black uppercase tracking-widest py-3 pl-6 pr-12 rounded-xl focus:border-saas-accent/50 outline-none cursor-pointer hover:bg-saas-bg transition-all"
            >
               {Array.isArray(workspaces) && workspaces.map(w => (
                 <option key={w.id} value={w.id}>{w.name}</option>
               ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-saas-text-muted group-hover:text-saas-accent transition-colors" size={14} />
         </div>
      </div>

      {/* 2. Global Chat Interface */}
      <div className="saas-card h-[60vh] flex flex-col bg-saas-bg/20 relative overflow-hidden backdrop-blur-sm border border-saas-border/50">
         <div className="flex-1 overflow-y-auto p-10 lg:p-14 space-y-12 custom-scrollbar" ref={scrollRef}>
            {messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-6 grayscale">
                  <MessageSquare size={64} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Instruction for {selectedWorkspace?.name}</p>
               </div>
            )}
            {Array.isArray(messages) && messages.map((msg, i) => (
              <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                 <div className={`max-w-[85%] lg:max-w-[65%] p-7 rounded-3xl space-y-5 shadow-saas-soft
                    ${msg.role === 'user' 
                      ? 'bg-saas-surface text-saas-text border border-saas-accent/30 rounded-tr-none' 
                      : 'bg-saas-surface/40 text-saas-text border border-saas-border rounded-tl-none'}`}>
                     <div className="text-sm font-medium leading-[1.8] whitespace-pre-wrap">{msg.content}</div>
                     {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                       <div className="pt-5 border-t border-saas-border/30">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-saas-accent mb-3 flex items-center gap-2">
                             <Zap size={10} /> Grounding Baseline
                          </p>
                          <div className="flex flex-wrap gap-2 opacity-80">
                             {msg.sources.map((s, si) => (
                               <span key={si} className="px-3 py-1.5 bg-saas-bg/50 text-[9px] font-black rounded-lg border border-saas-border/30">
                                  {s}
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
                 <div className="bg-saas-surface p-6 rounded-2xl rounded-tl-none border border-saas-border shadow-saas-soft animate-fade-in">
                    <Loader2 size={24} className="animate-spin text-saas-accent" />
                 </div>
              </div>
            )}
         </div>

         {/* STICKY MINIMALIST INPUT */}
         <div className="p-10 bg-saas-surface/30 border-t border-saas-border/50">
            <div className="max-w-4xl mx-auto relative group">
               <div className="absolute -inset-1 bg-gradient-to-tr from-saas-accent/10 to-transparent rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <div className="relative flex items-center gap-4 bg-saas-bg border border-saas-border/60 rounded-2xl pr-4 transition-all duration-500 focus-within:border-saas-accent/40 shadow-inner">
                  <input 
                    type="text" 
                    placeholder={`Ask {${selectedWorkspace?.name}}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent border-none py-5 pl-8 text-sm text-saas-text outline-none placeholder:text-saas-text-muted/30"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || chatLoading}
                    className="p-3.5 bg-saas-accent text-saas-bg rounded-xl hover:bg-white hover:scale-105 transition-all disabled:opacity-20 flex items-center justify-center shadow-lg"
                  >
                    <Send size={20} />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AIChat;
