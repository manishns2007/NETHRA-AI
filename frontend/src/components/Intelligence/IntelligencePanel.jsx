import React, { useState, useEffect } from 'react';
import { getIntelligenceStatus, getIntelligenceMetadata, getIntelligenceOCR, getIntelligenceEntities } from '../../services/api';
import MetadataViewer from './MetadataViewer';
import OCRPreview from './OCRPreview';
import EntityList from './EntityList';
import InvestigationGraph from '../Graph/InvestigationGraph';

const CloseIco = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const TABS = [
  { id: 'status',   label: 'Status & Logs' },
  { id: 'metadata', label: 'Metadata'       },
  { id: 'ocr',      label: 'Extracted Text' },
  { id: 'entities', label: 'Named Entities' },
  { id: 'graph',    label: '🕸 Graph'        },
];

export default function IntelligencePanel({ evidenceId, onClose }) {
  const [activeTab, setActiveTab] = useState('status');
  const [data, setData] = useState({ status: null, metadata: null, ocr: null, entities: null });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!evidenceId) return;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const fetchGracefully = async (fn, id) => {
          try {
            const res = await fn(id);
            return res.data;
          } catch (e) {
            return null; // Return null if 404 or error, allowing panel to still open
          }
        };

        const [s, m, o, e] = await Promise.all([
          fetchGracefully(getIntelligenceStatus, evidenceId),
          fetchGracefully(getIntelligenceMetadata, evidenceId),
          fetchGracefully(getIntelligenceOCR, evidenceId),
          fetchGracefully(getIntelligenceEntities, evidenceId),
        ]);
        
        setData({ status: s, metadata: m, ocr: o, entities: e });
      } catch (err) {
        setError('Failed to load intelligence data.');
      } finally { setLoading(false); }
    };
    load();
  }, [evidenceId]);

  if (!evidenceId) return null;

  /* ── Status tab content ── */
  const renderStatus = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px', padding: '12px 16px',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: data.status?.status === 'PROCESSED' ? '#22c55e'
            : data.status?.status === 'PROCESSING' ? '#3b82f6'
            : '#ef4444',
          boxShadow: `0 0 8px ${data.status?.status === 'PROCESSED' ? '#22c55e' : data.status?.status === 'PROCESSING' ? '#3b82f6' : '#ef4444'}`,
          animation: 'glowPulse 2s infinite',
        }} />
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Processing Status</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '1px' }}>{data.status?.status || 'UNKNOWN'}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          Processing Logs
        </div>
        {data.status?.logs?.length > 0 ? (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', margin: 0, padding: 0 }}>
            {data.status.logs.map(log => {
              const c = log.status === 'SUCCESS' ? '#22c55e' : log.status === 'FAILED' ? '#ef4444' : '#3b82f6';
              return (
                <li key={log.id}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-3)', display: 'block' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
                    <span style={{ fontWeight: 600, color: c, marginRight: '6px' }}>[{log.step}]</span>
                    {log.message}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>No logs available.</p>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: 'var(--text-3)' }}>
        <div className="spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%' }} />
        Loading intelligence…
      </div>
    );
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>{error}</div>;

    switch (activeTab) {
      case 'status':   return renderStatus();
      case 'metadata': return data.metadata ? <MetadataViewer metadata={data.metadata} /> : <div style={{ color: 'var(--text-3)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>No metadata found.</div>;
      case 'ocr':      return data.ocr ? <OCRPreview ocrResults={data.ocr} /> : <div style={{ color: 'var(--text-3)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>No OCR data found.</div>;
      case 'entities': return data.entities ? <EntityList entities={data.entities} /> : <div style={{ color: 'var(--text-3)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>No entities extracted.</div>;
      case 'graph':    return <div style={{ height: '520px' }}><InvestigationGraph evidenceId={evidenceId} /></div>;
      default: return null;
    }
  };

  const tabCount = (id) => {
    if (id === 'metadata' && data.metadata) return data.metadata.length;
    if (id === 'ocr'      && data.ocr)      return data.ocr.length;
    if (id === 'entities' && data.entities) return data.entities.length;
    return null;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Gradient border modal */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.5), rgba(59,130,246,0.5))',
        borderRadius: 'var(--radius-lg)', padding: '1px',
        width: '100%', maxWidth: '900px', height: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-30px 0 80px rgba(239,68,68,0.08), 30px 0 80px rgba(59,130,246,0.1)',
      }}>
        <div style={{
          background: '#0a0a0f', borderRadius: 'calc(var(--radius-lg) - 1px)',
          display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Intelligence Profile</div>
              <div className="mono-sm" style={{ marginTop: '2px' }}>ID: {evidenceId}</div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: 'var(--text-2)', cursor: 'pointer', padding: '6px',
              lineHeight: 0, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-2)'; }}
            ><CloseIco /></button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '2px',
            padding: '10px 20px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {TABS.map(t => {
              const active = activeTab === t.id;
              const cnt = tabCount(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '8px 16px', fontSize: '12.5px', fontWeight: 500,
                    border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0',
                    transition: 'all 0.2s',
                    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: active ? '#60a5fa' : 'var(--text-3)',
                    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {t.label}{cnt != null ? ` (${cnt})` : ''}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
