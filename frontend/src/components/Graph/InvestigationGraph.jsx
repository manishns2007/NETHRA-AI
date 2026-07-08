/**
 * InvestigationGraph.jsx — themed with blue/red ambient design
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { getGraphForEvidence } from '../../services/api';
import { transformToCytoscape, GRAPH_STYLESHEET } from './graphConfig';
import NodeDetailPanel from './NodeDetailPanel';
import GraphLegend from './GraphLegend';

const LAYOUT_OPTIONS = {
  breadthfirst: { name: 'breadthfirst', directed: true, padding: 40, spacingFactor: 1.5, animate: true, animationDuration: 500 },
  cose: { name: 'cose', padding: 40, animate: true, animationDuration: 600, idealEdgeLength: 120, nodeOverlap: 20, refresh: 20, fit: true, randomize: false, componentSpacing: 100, nodeRepulsion: 400000, edgeElasticity: 100, nestingFactor: 5, gravity: 80, numIter: 1000, initialTemp: 200, coolingFactor: 0.95, minTemp: 1.0 },
  grid:   { name: 'grid',   padding: 40, animate: true },
  circle: { name: 'circle', padding: 40, animate: true },
};

const btn = (label, onClick, title) => (
  <button
    key={label}
    onClick={onClick}
    title={title}
    style={{
      fontSize: '11.5px', padding: '5px 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '7px', color: 'rgba(255,255,255,0.5)',
      cursor: 'pointer', transition: 'all 0.18s',
    }}
    onMouseEnter={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
  >{label}</button>
);

export default function InvestigationGraph({ evidenceId, layout = 'cose', onNodeClick }) {
  const [graphData, setGraphData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeLayout, setActiveLayout] = useState(layout);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!evidenceId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(null); setSelectedNode(null);
      try {
        const res = await getGraphForEvidence(evidenceId);
        if (!cancelled) setGraphData(res.data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.status === 404
          ? 'No graph data yet. Process this evidence first.'
          : 'Failed to load graph data.');
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [evidenceId]);

  const elements     = useMemo(() => transformToCytoscape(graphData), [graphData]);
  const presentTypes = useMemo(() => graphData?.nodes ? [...new Set(graphData.nodes.map(n => n.entity_type))] : [], [graphData]);
  const stats        = useMemo(() => ({ nodes: graphData?.nodes?.length ?? 0, edges: graphData?.edges?.length ?? 0 }), [graphData]);

  const handleCyReady = useCallback(cy => {
    cyRef.current = cy;
    cy.off('tap');
    cy.on('tap', 'node', evt => { const d = evt.target.data(); setSelectedNode(d); if (onNodeClick) onNodeClick(d); });
    cy.on('tap', evt => { if (evt.target === cy) setSelectedNode(null); });
  }, [onNodeClick]);

  const rerunLayout = useCallback(() => cyRef.current?.layout(LAYOUT_OPTIONS[activeLayout] ?? LAYOUT_OPTIONS.cose).run(), [activeLayout]);

  /* ── States ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px', color: 'var(--text-3)' }}>
      <div className="spin" style={{ width: '22px', height: '22px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%' }} />
      Building knowledge graph…
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
        <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>{error}</p>
      </div>
    </div>
  );

  if (!elements || elements.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
      <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>No graph entities found for this evidence.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>{stats.nodes}</span> nodes ·{' '}
          <span style={{ color: '#fff', fontWeight: 600 }}>{stats.edges}</span> edges
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={activeLayout}
            onChange={e => setActiveLayout(e.target.value)}
            style={{
              fontSize: '11.5px', padding: '5px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '7px', color: 'rgba(255,255,255,0.55)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="cose">CoSE Layout</option>
            <option value="breadthfirst">Breadth-First</option>
            <option value="grid">Grid</option>
            <option value="circle">Circle</option>
          </select>
          {btn('↻ Layout', rerunLayout, 'Re-run layout')}
          {btn('⛶ Fit', () => cyRef.current?.fit(undefined, 40), 'Fit graph to view')}
        </div>
      </div>

      {/* Canvas + panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <CytoscapeComponent
            elements={elements}
            layout={LAYOUT_OPTIONS[activeLayout] ?? LAYOUT_OPTIONS.cose}
            stylesheet={GRAPH_STYLESHEET}
            cy={handleCyReady}
            style={{ width: '100%', height: '100%', minHeight: '400px', background: 'transparent' }}
            userZoomingEnabled
            userPanningEnabled
            boxSelectionEnabled={false}
          />
          <GraphLegend presentTypes={presentTypes} />
        </div>

        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  );
}
