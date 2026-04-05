import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Sparkles,
  ChevronDown,
  Database,
  Search,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Minimalist Floating AI Assistant for NexuAI.
 * 
 * Theme: Matte Black & Gold.
 * Design: Positioned bottom-right, clean modal, grounded logic.
 */
const FloatingChat = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  
  const scrollRef = useRef(null);

  const fetchWorkspaces = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkspaces(res.data);
      if (res.data.length > 0) setSelectedWorkspace(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchWorkspaces();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedWorkspace || chatLoading) return;
    
    // Grounding Check - warning only
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
      toast.error('Grounded dialogue interrupted.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-10 z-[200] w-14 h-14 bg-saas-accent text-saas-bg rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 transition-all group"
      >
        <AnimatePresence mode="wait">
           {isOpen ? <X key="close" size={24} /> : <MessageSquare key="open" size={24} strokeWidth={2.5} />}
        </AnimatePresence>
      </button>

      {/* Persistent Backdrop-free Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-10 z-[201] w-[400px] h-[600px] flex flex-col bg-saas-surface border border-saas-border rounded-3xl shadow-saas-soft overflow-hidden"
          >
            {/* Header Hub */}
            <header className="p-6 bg-saas-bg border-b border-saas-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-saas-accent/10 flex items-center justify-center text-saas-accent">
                     <Sparkles size={16} />
                  </div>
                  <div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-saas-text">NexuAI Specialist</h3>
                     <p className="text-[9px] font-black uppercase tracking-widest text-saas-accent">Synchronized Core</p>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-saas-text-muted hover:text-saas-text transition-colors">
                  <ChevronDown size={18} />
               </button>
            </header>

            {/* Workspace Context Switcher */}
            <div className="px-6 py-4 bg-saas-surface border-b border-saas-border">
               <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-saas-text-muted mb-2">
                 <span>Active Context:</span>
               </div>
               <select 
                  value={selectedWorkspace?.id} 
                  onChange={(e) => setSelectedWorkspace(workspaces.find(w => w.id === e.target.value))}
                  className="w-full bg-saas-bg border border-saas-border text-[10px] font-black uppercase tracking-widest text-saas-text py-2 px-3 rounded-lg outline-none cursor-pointer focus:border-saas-accent/40"
               >
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  {workspaces.length === 0 && <option>No Workspaces</option>}
               </select>
            </div>

            {/* Neural Dialogue Display */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-saas-bg/10" ref={scrollRef}>
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 grayscale scale-90">
                    <Zap size={32} strokeWidth={1.5} />
                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed px-4">Grounded In Intelligence Core: {selectedWorkspace?.name}</p>
                 </div>
               )}
               {messages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed
                      ${msg.role === 'user' 
                        ? 'bg-saas-surface text-saas-text border border-saas-accent/20 rounded-tr-none' 
                        : 'bg-saas-surface/40 text-saas-text border border-saas-border rounded-tl-none'}`}>
                        {msg.content}
                    </div>
                 </div>
               ))}
               {chatLoading && (
                 <div className="flex justify-start">
                    <div className="bg-saas-surface p-4 rounded-xl border border-saas-border">
                       <Loader2 size={16} className="animate-spin text-saas-accent" />
                    </div>
                 </div>
               )}
            </div>

            {/* Input Hub */}
            <div className="p-6 bg-saas-bg border-t border-saas-border">
               <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Query grounded knowledge..."
                    className="w-full bg-saas-surface border border-saas-border rounded-xl py-3 pl-4 pr-12 text-xs text-saas-text outline-none focus:border-saas-accent/40 transition-all shadow-inner"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || chatLoading}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-saas-accent text-saas-bg rounded-lg hover:scale-105 transition-all disabled:opacity-20 flex items-center justify-center"
                  >
                    <Send size={14} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;
