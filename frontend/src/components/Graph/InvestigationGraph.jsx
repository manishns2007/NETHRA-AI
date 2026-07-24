/**
 * InvestigationGraph.jsx
 *
 * SOC & Digital Forensics Intelligence Graph Workspace.
 * Features:
 *   - Entity-specific node shapes, colors, and SVG badges.
 *   - Multi-layout physics (CoSE/fCoSE, Hierarchical, Radial, Circular, Grid).
 *   - Live search with fuzzy highlighting and neighbor glow.
 *   - Category filter pills (Evidence, People, Emails, Phones, IPs, Domains, etc.).
 *   - Hover preview tooltip card & click-to-open right Node Details panel.
 *   - Built-in Mini Map viewport navigator.
 *   - PNG & JSON graph export.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { getGraphForEvidence } from '../../services/api';
import { transformToCytoscape, GRAPH_STYLESHEET, NODE_META } from './graphConfig';
import NodeDetailPanel from './NodeDetailPanel';
import { Search, ZoomIn, ZoomOut, Maximize, RefreshCw, Download, Filter, Eye, ShieldAlert } from 'lucide-react';

const LAYOUT_PRESETS = {
  cose: {
    name: 'cose',
    padding: 40,
    animate: true,
    animationDuration: 600,
    idealEdgeLength: 130,
    nodeOverlap: 30,
    refresh: 20,
    fit: true,
    randomize: false,
    componentSpacing: 120,
    nodeRepulsion: 450000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 70,
    numIter: 1000,
  },
  breadthfirst: {
    name: 'breadthfirst',
    directed: true,
    padding: 40,
    spacingFactor: 1.6,
    animate: true,
    animationDuration: 500,
  },
  concentric: {
    name: 'concentric',
    padding: 40,
    minNodeSpacing: 60,
    animate: true,
  },
  circle: {
    name: 'circle',
    padding: 40,
    animate: true,
  },
  grid: {
    name: 'grid',
    padding: 40,
    animate: true,
  },
};

export default function InvestigationGraph({ evidenceId, layout = 'cose', onNodeClick }) {
  const [rawGraphData, setRawGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeLayout, setActiveLayout] = useState(layout);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportBox, setViewportBox] = useState({ left: 10, top: 10, width: 80, height: 80 });

  const cyRef = useRef(null);
  const containerRef = useRef(null);

  // ── Load Graph Data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!evidenceId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSelectedNode(null);

      try {
        const res = await getGraphForEvidence(evidenceId);
        if (!cancelled) setRawGraphData(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? 'No graph data yet. Upload and process evidence to generate relationships.'
              : 'Failed to load graph data.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [evidenceId]);

  // Transform raw data to Cytoscape elements
  const allElements = useMemo(() => transformToCytoscape(rawGraphData), [rawGraphData]);

  // Extract entity types present in the current graph
  const presentEntityTypes = useMemo(() => {
    if (!rawGraphData?.nodes) return [];
    const types = new Set(rawGraphData.nodes.map(n => n.entity_type || 'DEFAULT'));
    return Array.from(types);
  }, [rawGraphData]);

  // Filter elements based on hidden entity types
  const filteredElements = useMemo(() => {
    if (hiddenTypes.size === 0) return allElements;

    const visibleNodes = allElements.filter(
      el => el.data.source === undefined && !hiddenTypes.has(el.data.entity_type)
    );
    const visibleNodeIds = new Set(visibleNodes.map(n => n.data.id));

    const visibleEdges = allElements.filter(
      el => el.data.source !== undefined &&
            visibleNodeIds.has(el.data.source) &&
            visibleNodeIds.has(el.data.target)
    );

    return [...visibleNodes, ...visibleEdges];
  }, [allElements, hiddenTypes]);

  // ── Cytoscape Event Handlers ───────────────────────────────────────────────
  const handleCyReady = useCallback((cy) => {
    cyRef.current = cy;
    cy.off('tap mouseover mouseout pan zoom');

    // Tap node
    cy.on('tap', 'node', (evt) => {
      const data = evt.target.data();
      setSelectedNode(data);
      if (onNodeClick) onNodeClick(data);
    });

    // Tap background
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    // Double tap node to focus connected sub-tree
    cy.on('dbltap', 'node', (evt) => {
      const node = evt.target;
      cy.animate({
        fit: { eles: node.neighborhood().add(node), padding: 60 },
        duration: 500,
      });
    });

    // Hover Node Highlight & Tooltip
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      const pos = evt.renderedPosition;

      setHoveredNode(data);
      setTooltipPos({ x: pos.x + 15, y: pos.y + 15 });

      // Highlight node and connected elements
      cy.batch(() => {
        cy.elements().removeClass('highlighted dimmed');
        const neighborhood = node.neighborhood().add(node);
        neighborhood.addClass('highlighted');
        cy.elements().not(neighborhood).addClass('dimmed');
      });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
      cy.batch(() => {
        cy.elements().removeClass('highlighted dimmed');
      });
    });

    // Update Mini Map Viewport state on Pan/Zoom
    const updateMiniMap = () => {
      const pan = cy.pan();
      const zoom = cy.zoom();
      const extent = cy.extent();

      const w = containerRef.current?.offsetWidth || 800;
      const h = containerRef.current?.offsetHeight || 500;

      const left = Math.max(0, Math.min(80, ((extent.x1) / w) * 100));
      const top = Math.max(0, Math.min(80, ((extent.y1) / h) * 100));
      const width = Math.min(100, Math.max(20, (w / (extent.x2 - extent.x1)) * 30));
      const height = Math.min(100, Math.max(20, (h / (extent.y2 - extent.y1)) * 30));

      setViewportBox({ left, top, width, height });
    };

    cy.on('pan zoom', updateMiniMap);
  }, [onNodeClick]);

  // ── Live Search Fuzzy Highlighting ─────────────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      cy.elements().removeClass('highlighted dimmed');
      return;
    }

    cy.batch(() => {
      cy.elements().removeClass('highlighted dimmed');

      const matches = cy.nodes().filter((node) => {
        const d = node.data();
        return (
          (d.fullLabel && d.fullLabel.toLowerCase().includes(term)) ||
          (d.label && d.label.toLowerCase().includes(term)) ||
          (d.entity_type && d.entity_type.toLowerCase().includes(term))
        );
      });

      if (matches.length > 0) {
        const neighborhood = matches.neighborhood().add(matches);
        neighborhood.addClass('highlighted');
        cy.elements().not(neighborhood).addClass('dimmed');
      } else {
        cy.elements().addClass('dimmed');
      }
    });
  }, [searchTerm]);

  // ── Layout Re-run ──────────────────────────────────────────────────────────
  const rerunLayout = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const layoutConfig = LAYOUT_PRESETS[activeLayout] || LAYOUT_PRESETS.cose;
    cy.layout(layoutConfig).run();
  }, [activeLayout]);

  // ── Filter Toggle Handler ──────────────────────────────────────────────────
  const toggleEntityType = (type) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // ── Exports ────────────────────────────────────────────────────────────────
  const exportPNG = () => {
    if (!cyRef.current) return;
    const png64 = cyRef.current.png({ full: true, bg: '#05070d', scale: 2 });
    const downloadLink = document.createElement('a');
    downloadLink.href = png64;
    downloadLink.download = `nethra_investigation_graph_${Date.now()}.png`;
    downloadLink.click();
  };

  const exportJSON = () => {
    if (!rawGraphData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rawGraphData, null, 2));
    const downloadLink = document.createElement('a');
    downloadLink.href = dataStr;
    downloadLink.download = `nethra_investigation_graph_${Date.now()}.json`;
    downloadLink.click();
  };

  // ── Render Loading / Error States ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '450px', gap: '14px', background: 'rgba(5,7,12,0.8)', color: 'var(--text-3)' }}>
        <div className="spin" style={{ width: '28px', height: '28px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%' }} />
        <span style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.04em' }}>Constructing Investigation Knowledge Graph…</span>
      </div>
    );
  }

  if (error || filteredElements.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '450px', gap: '12px', background: 'rgba(5,7,12,0.8)', padding: '24px', textAlign: 'center' }}>
        <ShieldAlert size={36} color="#60a5fa" style={{ opacity: 0.6 }} />
        <p style={{ color: 'var(--text-2)', fontSize: '13.5px', maxWidth: '360px' }}>{error || 'No matching entities found for the current filters.'}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        background: '#05070d',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Investigation Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '10px 16px',
          background: 'rgba(10,14,24,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          gap: '12px',
          zIndex: 20,
        }}
      >
        {/* Left: Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '360px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} color="var(--text-3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search entities (e.g. gmail, 97899, IP)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Layout Selector */}
          <select
            value={activeLayout}
            onChange={(e) => setActiveLayout(e.target.value)}
            style={{
              fontSize: '11.5px',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#93c5fd',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            <option value="cose">Investigation (CoSE Physics)</option>
            <option value="breadthfirst">Hierarchical (Flow)</option>
            <option value="concentric">Radial (Clusters)</option>
            <option value="circle">Circular Ring</option>
            <option value="grid">Grid Matrix</option>
          </select>

          {/* Zoom Buttons */}
          <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)} style={btnStyle} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)} style={btnStyle} title="Zoom Out">
            <ZoomOut size={14} />
          </button>

          {/* Fit & Re-run */}
          <button onClick={() => cyRef.current?.fit(undefined, 50)} style={btnStyle} title="Fit Graph to Screen">
            <Maximize size={14} />
          </button>
          <button onClick={rerunLayout} style={btnStyle} title="Re-run Layout Physics">
            <RefreshCw size={14} />
          </button>

          {/* Exports */}
          <button onClick={exportPNG} style={btnStyle} title="Export Graph PNG">
            <Download size={14} /> <span style={{ fontSize: '11px' }}>PNG</span>
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              ...btnStyle,
              background: showFilters ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              color: showFilters ? '#60a5fa' : 'var(--text-3)',
            }}
            title="Toggle Entity Filters"
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* ── Entity Filter Pills Bar ── */}
      {showFilters && presentEntityTypes.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(7,11,20,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            overflowX: 'auto',
            flexShrink: 0,
            zIndex: 15,
          }}
        >
          <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginRight: '4px' }}>
            Filter Categories:
          </span>

          {presentEntityTypes.map((type) => {
            const meta = NODE_META[type] || NODE_META.DEFAULT;
            const isHidden = hiddenTypes.has(type);
            const count = rawGraphData.nodes.filter(n => (n.entity_type || 'DEFAULT') === type).length;

            return (
              <button
                key={type}
                onClick={() => toggleEntityType(type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${isHidden ? 'rgba(255,255,255,0.1)' : meta.color + '60'}`,
                  background: isHidden ? 'rgba(255,255,255,0.02)' : meta.color + '20',
                  color: isHidden ? 'var(--text-3)' : '#fff',
                  opacity: isHidden ? 0.4 : 1,
                  transition: 'all 0.18s',
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.75, background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '8px' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Canvas & Panels Container ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Cytoscape Canvas Area */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0, height: '100%' }}>
          <CytoscapeComponent
            elements={filteredElements}
            layout={LAYOUT_PRESETS[activeLayout] || LAYOUT_PRESETS.cose}
            stylesheet={GRAPH_STYLESHEET}
            cy={handleCyReady}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            userZoomingEnabled
            userPanningEnabled
            boxSelectionEnabled={false}
          />

          {/* Floating Hover Tooltip Card */}
          {hoveredNode && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                background: 'rgba(10,14,24,0.96)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${hoveredNode.color || '#3b82f6'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                zIndex: 40,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                minWidth: '180px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px' }}>{hoveredNode.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: hoveredNode.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {hoveredNode.typeLabel}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', wordBreak: 'break-all', marginBottom: '4px' }}>
                {hoveredNode.fullLabel}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-3)' }}>
                <span>Confidence:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{hoveredNode.confidencePct}%</span>
              </div>
            </div>
          )}

          {/* Built-in Mini Map Navigator (Bottom-Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              width: '120px',
              height: '80px',
              background: 'rgba(10,14,24,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Mini Map
            </div>
            <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 14px)', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
              {/* Mini Map Viewport Indicator Rectangle */}
              <div
                style={{
                  position: 'absolute',
                  left: `${viewportBox.left}%`,
                  top: `${viewportBox.top}%`,
                  width: `${viewportBox.width}%`,
                  height: `${viewportBox.height}%`,
                  border: '1.5px solid #60a5fa',
                  background: 'rgba(96,165,250,0.15)',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right-Side Node Details Panel */}
        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.18s',
};
