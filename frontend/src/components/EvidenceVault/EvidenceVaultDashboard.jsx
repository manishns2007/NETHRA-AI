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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: '40px' }}>
        {/* Top Sticky Context Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#0a0a0f', padding: '24px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
            >
              <Upload size={16} />
              Ingest Evidence
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: '600px', height: 'calc(100vh - 150px)', padding: '0 28px 28px', gap: '16px', marginTop: '16px' }}>
          
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
