import React, { useState } from 'react';
import { UploadModal } from './UploadModal';
import { EvidenceLedger } from '../Dashboard/EvidenceLedger';
import { WorkspaceGraph } from '../Dashboard/GraphPreviewWidget';
import { InvestigationDrawer } from '../Dashboard/InvestigationDrawer';
import { CaseContextPanel, InvestigationStatus } from '../Dashboard/DashboardWidgets';
import { useInvestigation } from '../../context/InvestigationContext';
import { Upload, Shield } from 'lucide-react';
import Assistant from '../Assistant/Assistant';

export default function EvidenceVaultDashboard({ onUploadSuccess }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { evidenceList, refreshEvidence, selectedEvidenceId, setSelectedEvidenceId } = useInvestigation();

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    refreshEvidence();
    if (onUploadSuccess) onUploadSuccess();
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: '32px' }}>
        
        {/* Top Header Action Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 28px 0', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Evidence Vault & Knowledge Graph
            </span>
            <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Active Analysis
            </span>
          </div>

          <button 
            onClick={() => setShowUploadModal(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
              border: 'none', padding: '9px 18px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Upload size={15} />
            Ingest Evidence
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: '650px', padding: '16px 28px 28px', gap: '16px' }}>
          
          {/* Left: Evidence Ledger */}
          <div style={{ width: '25%', minWidth: '280px', maxWidth: '350px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <EvidenceLedger 
              evidenceList={evidenceList} 
              selectedId={selectedEvidenceId} 
              onSelect={setSelectedEvidenceId} 
            />
          </div>

          {/* Center: Workspace Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            {selectedEvidenceId ? (
              <WorkspaceGraph evidenceId={selectedEvidenceId} />
            ) : (
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', padding: '40px', textAlign: 'center' }}>
                <Shield size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px' }}>Investigation Workspace</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.6, maxWidth: '300px' }}>Select an evidence item from the ledger to begin analysis. The workspace will automatically adapt to the selected context.</p>
              </div>
            )}
          </div>

          {/* Right: Persistent Investigation Drawer */}
          <div style={{ width: '35%', minWidth: '320px', maxWidth: '450px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <InvestigationDrawer />
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
