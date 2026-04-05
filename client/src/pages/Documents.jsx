import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Trash2, 
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Database,
  ShieldCheck,
  Zap,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Premium Minimalist Document Inventory for NexuAI.
 */
const Documents = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const fetchAllDocuments = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Flatten all documents from all projects
      const allDocs = res.data.flatMap(p => 
        (p.documents || []).map(d => ({ ...d, projectName: p.name, projectId: p.id }))
      );
      setDocuments(allDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllDocuments(); }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm("Purge this knowledge block from neural archives?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Knowledge Block Purged');
      fetchAllDocuments();
    } catch (err) {
      toast.error('Failed to purge.');
    }
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    d.projectName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 page-transition">
      
      {/* 1. Archive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
           <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-saas-text-muted group-focus-within:text-saas-accent transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search Knowledge Core..." 
                className="saas-input w-full pl-10"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
           </div>
           <button className="p-3 bg-saas-surface border border-saas-border rounded-xl text-saas-text-muted hover:bg-saas-bg hover:border-saas-accent/30 transition-all">
              <Filter size={18} />
           </button>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-saas-text-muted">Global Index</p>
              <p className="text-sm font-black text-saas-text">{documents.length} Neural Blocks</p>
           </div>
           <div className="h-8 w-px bg-saas-border" />
           <ShieldCheck className="text-saas-accent" size={24} />
        </div>
      </div>

      {/* 2. Document Grid (Minimalist Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {loading ? [1,2,3,4].map(i => <div key={i} className="h-48 saas-skeleton border border-saas-border" />) : 
          filteredDocs.map(doc => (
            <div key={doc.id} className="saas-card saas-card-hover group p-6 flex flex-col h-full bg-saas-surface/40">
               <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-saas-bg border border-saas-border flex items-center justify-center text-saas-accent group-hover:scale-105 transition-transform">
                     <FileText size={20} />
                  </div>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-saas-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                     <Trash2 size={16} />
                  </button>
               </div>
               
               <h4 className="text-sm font-bold text-saas-text mb-1 truncate">{doc.name}</h4>
               <p className="text-[9px] font-black uppercase tracking-widest text-saas-text-muted mb-4">{doc.type.split('/')[1]?.toUpperCase() || 'DATA'}</p>
               
               <div className="mt-auto pt-4 border-t border-saas-border/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-saas-text-muted">Origin Hub</span>
                     <span 
                       onClick={() => navigate(`/projects/${doc.projectId}`)}
                       className="text-[9px] font-black uppercase tracking-[0.2em] text-saas-accent hover:underline cursor-pointer"
                     >
                        {doc.projectName}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-saas-text-muted">Sync Verified</span>
                     <Zap size={10} className="text-saas-accent" />
                  </div>
               </div>
            </div>
         ))}
      </div>

      {!loading && filteredDocs.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center grayscale opacity-10">
           <Database size={64} strokeWidth={1} className="mb-6" />
           <p className="text-xs font-black uppercase tracking-widest leading-loose">The Neural Core is Offline.<br />No Knowledge Blocks Found.</p>
        </div>
      )}
    </div>
  );
};

export default Documents;
