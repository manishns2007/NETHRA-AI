import React, { useState } from 'react';
import { UploadModal } from './UploadModal';
import { EvidenceLedger } from '../Dashboard/EvidenceLedger';
import { WorkspaceGraph } from '../Dashboard/GraphPreviewWidget';
import { InvestigationPanel } from '../Dashboard/InvestigationPanel';
import { CaseContextPanel, InvestigationStatus, EvidenceHealth, AIInsightsWidget, EventLogWidget } from '../Dashboard/DashboardWidgets';
import { useInvestigation } from '../../context/InvestigationContext';
import { Upload } from 'lucide-react';

export default function EvidenceVaultDashboard({ onUploadSuccess }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { evidenceList, refreshEvidence, selectedEvidenceId, setSelectedEvidenceId } = useInvestigation();

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    refreshEvidence();
    if (onUploadSuccess) onUploadSuccess();
  };

  // If no evidence is selected, we could show a global dashboard view, or just show the 3 columns with empty states.
  // The user requested a persistent workspace, so we keep the 3 columns always visible.

  // Aggregate stats for the top panels
  const total = evidenceList.length;
  const processed = evidenceList.filter(e => e.status === 'PROCESSED').length;
  const processing = evidenceList.filter(e => e.status === 'PROCESSING' || e.status === 'PENDING').length;
  const failed = evidenceList.filter(e => e.status === 'FAILED').length;
  const recentEvents = [...evidenceList].sort((a,b) => new Date(b.upload_timestamp||0) - new Date(a.upload_timestamp||0)).slice(0, 5);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Top Sticky Context Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#0a0a0f', padding: '24px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Custom injection of the CaseContextPanel to include the ingest button */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Current Investigation</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Operation Phantom</div>
                <div className="mono-sm" style={{ color: '#60a5fa', marginTop: '2px' }}>ID: INV-2026-092</div>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Active Analysis</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Investigator</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Agent K. Chen</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowUploadModal(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
                border: 'none', padding: '10px 20px', borderRadius: '8px',
                fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Upload size={16} />
              Ingest Evidence
            </button>
          </div>

          <InvestigationStatus />
        </div>

        {/* Main 3-Column Workspace */}
        <div style={{ display: 'flex', flex: 1, minHeight: '600px', padding: '0 28px 28px', gap: '16px', marginTop: '16px' }}>
          
          {/* Left: Evidence Ledger (25% width) */}
          <div style={{ width: '25%', minWidth: '280px', maxWidth: '350px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <EvidenceLedger 
              evidenceList={evidenceList} 
              selectedId={selectedEvidenceId} 
              onSelect={setSelectedEvidenceId} 
            />
          </div>

          {/* Center: Primary Visualization (Knowledge Graph) (45% width) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <WorkspaceGraph evidenceId={selectedEvidenceId} />
          </div>

          {/* Right: Intelligence / Context Panel (30% width) */}
          <div style={{ width: '30%', minWidth: '320px', maxWidth: '450px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selectedEvidenceId ? (
              <InvestigationPanel 
                evidenceId={selectedEvidenceId} 
              />
            ) : (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                {/* Global Dashboard widgets when no evidence is selected */}
                <EvidenceHealth total={total} processed={processed} processing={processing} failed={failed} />
                <EventLogWidget events={recentEvents} />
              </div>
            )}
          </div>

        </div>
      </div>

      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}
