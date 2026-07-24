import React from 'react';
import { Panel } from './DashboardWidgets';
import { Network } from 'lucide-react';
import InvestigationGraph from '../Graph/InvestigationGraph';
import { useInvestigation } from '../../context/InvestigationContext';

export const WorkspaceGraph = ({ evidenceId }) => {
  const { setSelectedGraphNode } = useInvestigation();

  if (!evidenceId) {
    return (
      <Panel title="Knowledge Graph" icon={Network}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', minHeight: '450px' }}>
          <Network size={32} color="var(--text-3)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Select an evidence file to visualize its relationships.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Knowledge Graph" icon={Network} bodyStyle={{ padding: 0 }}>
      <div style={{ flex: 1, minHeight: '540px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <InvestigationGraph evidenceId={evidenceId} onNodeClick={node => setSelectedGraphNode(node)} />
      </div>
    </Panel>
  );
};
