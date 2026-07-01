/**
 * InvestigationGraph.jsx
 *
 * Interactive knowledge graph for a single evidence item.
 *
 * Architecture:
 *   - Data fetching: this component owns fetch + loading/error state.
 *   - Rendering: CytoscapeComponent (react-cytoscapejs) does all canvas work.
 *   - Config:   graphConfig.js owns colors, transformer, stylesheet.
 *   - Side panel: NodeDetailPanel.jsx (fully decoupled).
 *   - Legend:     GraphLegend.jsx (fully decoupled).
 *
 * Extensibility hooks built in:
 *   - `layout` prop lets callers swap layouts (breadthfirst, cose, etc.)
 *   - `onNodeClick` optional callback for parent-level actions (OSINT drill-down)
 *   - CytoscapeComponent ref exposed as `cyRef` for future imperative API access
 *
 * Props:
 *   evidenceId  {string}   - The evidence UUID to load the graph for
 *   layout      {string}   - Cytoscape layout name (default: 'breadthfirst')
 *   onNodeClick {function} - Optional parent callback(nodeData)
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { getGraphForEvidence } from '../../services/api';
import { transformToCytoscape, GRAPH_STYLESHEET } from './graphConfig';
import NodeDetailPanel from './NodeDetailPanel';
import GraphLegend from './GraphLegend';

const LAYOUT_OPTIONS = {
  breadthfirst: {
    name: 'breadthfirst',
    directed: true,
    padding: 40,
    spacingFactor: 1.5,
    animate: true,
    animationDuration: 500,
  },
  cose: {
    name: 'cose',
    padding: 40,
    animate: true,
    animationDuration: 600,
    idealEdgeLength: 120,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
  },
  grid: { name: 'grid', padding: 40, animate: true },
  circle: { name: 'circle', padding: 40, animate: true },
};

export default function InvestigationGraph({
  evidenceId,
  layout = 'cose',
  onNodeClick,
}) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeLayout, setActiveLayout] = useState(layout);
  const cyRef = useRef(null);

  // ── Fetch graph data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!evidenceId) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      setSelectedNode(null);
      try {
        const res = await getGraphForEvidence(evidenceId);
        if (!cancelled) setGraphData(res.data);
      } catch (err) {
        if (!cancelled) {
          console.error('Graph fetch failed:', err);
          setError(err?.response?.status === 404
            ? 'No graph data yet. Process this evidence first.'
            : 'Failed to load graph data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [evidenceId]);

  // ── Transform data for Cytoscape ────────────────────────────────────────────
  const elements = useMemo(() => transformToCytoscape(graphData), [graphData]);

  const presentTypes = useMemo(() => {
    if (!graphData?.nodes) return [];
    return [...new Set(graphData.nodes.map(n => n.entity_type))];
  }, [graphData]);

  const stats = useMemo(() => ({
    nodes: graphData?.nodes?.length ?? 0,
    edges: graphData?.edges?.length ?? 0,
  }), [graphData]);

  // ── Cytoscape event handlers ────────────────────────────────────────────────
  const handleCyReady = useCallback((cy) => {
    cyRef.current = cy;

    cy.off('tap'); // Remove existing listeners to avoid duplicates

    cy.on('tap', 'node', (evt) => {
      const data = evt.target.data();
      console.log('Node clicked:', data);
      setSelectedNode(data);
      if (onNodeClick) onNodeClick(data);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });
  }, [onNodeClick]);

  // ── Layout re-run when selection changes ────────────────────────────────────
  const rerunLayout = useCallback(() => {
    cyRef.current?.layout(LAYOUT_OPTIONS[activeLayout] ?? LAYOUT_OPTIONS.cose).run();
  }, [activeLayout]);

  // ── Render helpers ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Building knowledge graph…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!elements || elements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-slate-500 text-sm">No graph entities found for this evidence.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/70 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            <span className="text-slate-300 font-semibold">{stats.nodes}</span> nodes ·{' '}
            <span className="text-slate-300 font-semibold">{stats.edges}</span> edges
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout selector */}
          <select
            value={activeLayout}
            onChange={(e) => setActiveLayout(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="cose">CoSE Layout</option>
            <option value="breadthfirst">Breadth-First</option>
            <option value="grid">Grid</option>
            <option value="circle">Circle</option>
          </select>

          {/* Re-run layout */}
          <button
            onClick={rerunLayout}
            title="Re-run layout"
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            ↻ Layout
          </button>

          {/* Fit graph */}
          <button
            onClick={() => cyRef.current?.fit(undefined, 40)}
            title="Fit graph to view"
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            ⛶ Fit
          </button>

        </div>
      </div>

      {/* Canvas + Side panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Graph canvas */}
        <div className="relative flex-1 min-w-0">
          <CytoscapeComponent
            elements={elements}
            layout={LAYOUT_OPTIONS[activeLayout] ?? LAYOUT_OPTIONS.cose}
            stylesheet={GRAPH_STYLESHEET}
            cy={handleCyReady}
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
            userZoomingEnabled
            userPanningEnabled
            boxSelectionEnabled={false}
          />
          <GraphLegend presentTypes={presentTypes} />
        </div>

        {/* Node detail side panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
