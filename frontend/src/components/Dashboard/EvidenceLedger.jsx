import React, { useState, useMemo } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Dropdown } from '../UI/Dropdown';

const SOURCE_LABELS = {
  whatsapp_export: 'WhatsApp',
  telegram_export: 'Telegram',
  pdf_document:    'PDF Doc',
  image_evidence:  'Image',
  unknown:         'Unknown',
};

const timeAgo = ts => {
  if (!ts) return '—';
  const d = Date.now() - new Date(ts);
  if (d < 60000)   return `${Math.round(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.round(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.round(d / 3600000)}h ago`;
  return `${Math.round(d / 86400000)}d ago`;
};

const StatusIcon = ({ status }) => {
  if (status === 'PROCESSED') return <CheckCircle2 size={14} color="#22c55e" />;
  if (['PROCESSING', 'PENDING', 'UPLOADED', 'QUEUED'].includes(status)) return <Clock size={14} color="#3b82f6" />;
  return <AlertCircle size={14} color="#ef4444" />;
};

export const EvidenceLedger = ({ evidenceList, selectedId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const filteredData = useMemo(() => {
    return evidenceList.filter(item => {
      const matchSearch = item.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) || item.evidence_id.includes(searchTerm);
      const matchSource = filterSource === 'ALL' || item.source_type === filterSource;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      return matchSearch && matchSource && matchStatus;
    }).sort((a, b) => new Date(b.upload_timestamp||0) - new Date(a.upload_timestamp||0));
  }, [evidenceList, searchTerm, filterSource, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const uniqueSources = [...new Set(evidenceList.map(item => item.source_type))];
  const uniqueStatuses = [...new Set(evidenceList.map(item => item.status))];

  const sourceOptions = [
    { value: 'ALL', label: 'All Sources' },
    ...uniqueSources.map(s => ({ value: s, label: SOURCE_LABELS[s] || s }))
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    ...uniqueStatuses.map(s => ({ value: s, label: s }))
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.01)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header & Controls */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Evidence Ledger</span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{filteredData.length} records</span>
        </div>
        
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={14} color="var(--text-3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search filename or ID..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            style={{ 
              width: '100%', padding: '8px 10px 8px 32px', fontSize: '12px', background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', outline: 'none' 
            }} 
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Dropdown
            value={filterSource}
            onChange={val => { setFilterSource(val); setPage(1); }}
            options={sourceOptions}
            style={{ flex: 1 }}
          />
          <Dropdown
            value={filterStatus}
            onChange={val => { setFilterStatus(val); setPage(1); }}
            options={statusOptions}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {paginatedData.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <Shield size={24} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontSize: '12px' }}>No evidence matches your search.</div>
          </div>
        ) : (
          paginatedData.map(item => {
            const isSelected = selectedId === item.evidence_id;
            return (
              <div 
                key={item.evidence_id} 
                onClick={() => onSelect(item.evidence_id)}
                style={{ 
                  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
                  background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: isSelected ? '#fff' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    {item.original_filename}
                  </div>
                  <StatusIcon status={item.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)' }}>
                  <span style={{ fontFamily: 'monospace', color: isSelected ? '#93c5fd' : 'var(--text-3)' }}>{item.evidence_id.substring(0,8)}</span>
                  <span>{timeAgo(item.upload_timestamp)}</span>
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-2)' }}>
                    {SOURCE_LABELS[item.source_type] || item.source_type}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <button 
            disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-4)' : 'var(--text-2)', cursor: page === 1 ? 'default' : 'pointer' }}
          ><ChevronLeft size={18} /></button>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            style={{ background: 'none', border: 'none', color: page === totalPages ? 'var(--text-4)' : 'var(--text-2)', cursor: page === totalPages ? 'default' : 'pointer' }}
          ><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  );
};
