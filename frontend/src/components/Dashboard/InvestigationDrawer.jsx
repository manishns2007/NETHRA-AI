import React, { useState } from 'react';
import { Shield, Brain, FileText, Network, Clock, List } from 'lucide-react';
import MetadataViewer from '../Intelligence/MetadataViewer';
import OCRPreview from '../Intelligence/OCRPreview';
import EntityList from '../Intelligence/EntityList';
import { TimelineView } from '../Intelligence/TimelineView';
import { ChainOfCustodyView } from '../Intelligence/ChainOfCustodyView';
import { AIInsightsView } from '../Intelligence/AIInsightsView';
import { ReportPreview } from '../Intelligence/ReportPreview';
import { RelationshipsView } from '../Intelligence/RelationshipsView';
import { useInvestigation } from '../../context/InvestigationContext';

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'metadata',     label: 'Metadata' },
  { id: 'ocr',          label: 'OCR' },
  { id: 'entities',     label: 'Entities' },
  { id: 'relationships',label: 'Relationships' },
  { id: 'timeline',     label: 'Timeline' },
  { id: 'custody',      label: 'Chain of Custody' },
  { id: 'insights',     label: 'AI Insights' },
  { id: 'report',       label: 'Report Preview' },
];

export const InvestigationDrawer = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedEvidenceId, selectedEvidenceItem, intelligence, selectedGraphNode } = useInvestigation();
  const { status, metadata, ocr, entities, insights, timeline, chainOfCustody, reportPreview, loading } = intelligence;

  if (!selectedEvidenceId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
        <Shield size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '14px', color: '#fff', marginBottom: '8px' }}>Investigation Drawer</h3>
        <p style={{ fontSize: '13px', lineHeight: 1.6 }}>Select an evidence item, graph node, or timeline event to view details here.</p>
      </div>
    );
  }

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
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', fontFamily: 'monospace' }}>ID: {selectedEvidenceId}</div>
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
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No metadata available.</div>
        );
      case 'ocr':
        return ocr ? <div style={{ padding: '20px' }}><OCRPreview ocrResults={ocr} /></div> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No OCR text found.</div>
        );
      case 'entities':
        return entities ? <div style={{ padding: '20px' }}><EntityList entities={entities} /></div> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No entities found.</div>
        );
      case 'relationships':
        return <RelationshipsView selectedNode={selectedGraphNode} />;
      case 'timeline':
        return timeline ? <TimelineView timeline={timeline} /> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No timeline events found.</div>
        );
      case 'custody':
        return chainOfCustody ? <ChainOfCustodyView logs={chainOfCustody} /> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No audit logs found.</div>
        );
      case 'insights':
        return insights ? <AIInsightsView insights={insights} /> : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No AI insights generated.</div>
        );
      case 'report':
        return reportPreview ? (
          <ReportPreview 
            preview={reportPreview} 
            evidenceId={selectedEvidenceId}
            evidenceItem={selectedEvidenceItem}
          />
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No report preview available.</div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(10,10,15,0.95)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investigation Context</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedEvidenceItem?.original_filename || selectedEvidenceId}
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: '1 0 33%', padding: '10px 8px', fontSize: '11px', fontWeight: 600,
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
