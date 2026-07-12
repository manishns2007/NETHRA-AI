import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Panel } from './DashboardWidgets';
import { Network, ZoomIn, Maximize } from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import { GRAPH_STYLESHEET, transformToCytoscape } from '../Graph/graphConfig';
import { getGraphForEvidence } from '../../services/api';
import { useInvestigation } from '../../context/InvestigationContext';

export const WorkspaceGraph = ({ evidenceId }) => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!evidenceId) {
      setGraphData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getGraphForEvidence(evidenceId);
        if (!cancelled) setGraphData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.status === 404 ? 'No relationships found yet.' : 'Failed to load graph.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [evidenceId]);

  const { setSelectedGraphNode } = useInvestigation();
  const elements = useMemo(() => transformToCytoscape(graphData), [graphData]);

  const handleCyReady = useCallback(cy => {
    cyRef.current = cy;
    cy.off('tap');
    cy.on('tap', 'node', evt => setSelectedGraphNode(evt.target.data()));
    cy.on('tap', evt => { if (evt.target === cy) setSelectedGraphNode(null); });
  }, [setSelectedGraphNode]);

  if (!evidenceId) {
    return (
      <Panel title="Knowledge Graph" icon={Network}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Network size={32} color="var(--text-3)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Select an evidence file to visualize its relationships.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Knowledge Graph" icon={Network} right={loading ? 'Loading...' : `${elements.length} nodes & edges`}>
      <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', minHeight: '300px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%' }} />
          </div>
        ) : error || elements.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', fontSize: '13px' }}>
            {error || 'No entities found to construct a graph.'}
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0 }}>
              <CytoscapeComponent
                elements={elements}
                stylesheet={GRAPH_STYLESHEET}
                layout={{ name: 'cose', padding: 30, animate: true }}
                style={{ width: '100%', height: '100%' }}
                cy={handleCyReady}
                userZoomingEnabled
                userPanningEnabled
                boxSelectionEnabled={false}
              />
            </div>
            
            {/* Overlay Controls */}
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px' }}>
              <button onClick={() => cyRef.current?.fit()} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-2)', cursor: 'pointer' }} title="Fit to Screen">
                <Maximize size={14} />
              </button>
              <button onClick={() => cyRef.current?.layout({ name: 'cose', animate: true }).run()} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-2)', cursor: 'pointer' }} title="Re-run Layout">
                <ZoomIn size={14} />
              </button>
            </div>
            <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', color: 'var(--text-3)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
              Interactive Investigation Map
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};
