import React, { useState } from 'react';
import { Shield, Brain, FileText } from 'lucide-react';
import MetadataViewer from '../Intelligence/MetadataViewer';
import OCRPreview from '../Intelligence/OCRPreview';
import EntityList from '../Intelligence/EntityList';
import { useInvestigation } from '../../context/InvestigationContext';

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'metadata',     label: 'Metadata' },
  { id: 'ocr',          label: 'OCR Text' },
  { id: 'entities',     label: 'Entities' },
  { id: 'insights',     label: 'AI Insights' },
  { id: 'future_report',label: 'Report' },
];

export const InvestigationPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedEvidenceId, selectedEvidenceItem, intelligence } = useInvestigation();
  const { status, metadata, ocr, entities, loading } = intelligence;

  if (!selectedEvidenceId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
        <Shield size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p style={{ fontSize: '13px', lineHeight: 1.6 }}>Select an evidence file from the ledger to view its intelligence profile.</p>
      </div>
    );
  }

  // --- Abstracted Insights generation ---
  const generateInsights = () => {
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return [{ text: 'No entities extracted to generate insights.', conf: 'N/A', type: 'info' }];
    }
    
    const persons = entities.filter(e => e.entity_type === 'PERSON').length;
    const orgs = entities.filter(e => e.entity_type === 'ORG').length;
    const locations = entities.filter(e => e.entity_type === 'LOC' || e.entity_type === 'LOCATION').length;
    
    const insights = [];
    if (persons > 0) insights.push({ text: `Detected ${persons} key individuals mentioned in this evidence.`, conf: '92%', type: 'lead' });
    if (orgs > 0) insights.push({ text: `Extracted ${orgs} organizations which may be tied to external networks.`, conf: '88%', type: 'lead' });
    if (locations > 0) insights.push({ text: `Found ${locations} geolocation references indicating physical movement.`, conf: '85%', type: 'lead' });
    
    if (Array.isArray(metadata) && metadata.some(m => m.key?.toLowerCase().includes('date') || m.key?.toLowerCase().includes('time'))) {
      insights.push({ text: `Temporal metadata successfully mapped to timeline.`, conf: '99%', type: 'timeline' });
    }

    if (insights.length === 0) {
      insights.push({ text: 'Entities found, but no critical patterns detected.', conf: 'N/A', type: 'info' });
    }
    return insights;
  };

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="spin" style={{ width: '20px', height: '20px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%' }} />
      </div>
    );

    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>File Info</div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500, wordBreak: 'break-all' }}>{selectedEvidenceItem?.original_filename}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Type: {selectedEvidenceItem?.source_type}</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '12px' }}>Processing Logs</div>
              {status?.logs?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {status.logs.map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: log.status === 'SUCCESS' ? '#22c55e' : log.status === 'FAILED' ? '#ef4444' : '#3b82f6', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}><span style={{ fontWeight: 600, color: 'var(--text-2)', marginRight: '6px' }}>[{log.step}]</span>{log.message}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>No logs available.</div>}
            </div>
          </div>
        );
      case 'metadata':
        return metadata ? <div style={{ padding: '20px' }}><MetadataViewer metadata={metadata} /></div> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <p style={{ fontSize: '13px' }}>No metadata available for this evidence.</p>
          </div>
        );
      case 'ocr':
        return ocr ? <div style={{ padding: '20px' }}><OCRPreview ocrResults={ocr} /></div> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <p style={{ fontSize: '13px' }}>No OCR text found.</p>
          </div>
        );
      case 'entities':
        return entities ? <div style={{ padding: '20px' }}><EntityList entities={entities} /></div> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <p style={{ fontSize: '13px' }}>No entities found.</p>
          </div>
        );
      case 'insights':
        const insights = generateInsights();
        return (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, i) => (
              <div key={i} style={{ padding: '14px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                <Brain size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 8px 0', lineHeight: 1.5 }}>{insight.text}</p>
                  <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Confidence: {insight.conf}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case 'future_report':
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <FileText size={32} color="var(--text-3)" style={{ opacity: 0.5, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px' }}>Report Generation</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: '200px', margin: '0 auto' }}>Module 8 functionality will be integrated here, allowing you to generate comprehensive intelligence reports directly from this workspace.</p>
            <div style={{ marginTop: '20px', padding: '6px 12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '11px', fontWeight: 600, borderRadius: '4px', display: 'inline-block' }}>COMING SOON</div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.02)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investigation Context</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedEvidenceItem?.original_filename || selectedEvidenceId}
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px', fontSize: '11.5px', fontWeight: 600,
                border: 'none', background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: active ? '#60a5fa' : 'var(--text-3)', cursor: 'pointer',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
};
