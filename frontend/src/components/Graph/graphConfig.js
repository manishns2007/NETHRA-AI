/**
 * graph/graphConfig.js
 *
 * Shared configuration for the InvestigationGraph:
 *   - Entity type → color mapping
 *   - Backend response → Cytoscape elements transformer
 *
 * Kept as a pure utility module so the graph component stays declarative.
 * Adding support for a new entity type only requires adding one entry to
 * NODE_COLORS and ENTITY_ICONS.
 */

// ── Color palette (entity type → hex) ────────────────────────────────────────

export const NODE_COLORS = {
  EVIDENCE:      '#6366f1', // indigo  – root evidence node
  PERSON:        '#3b82f6', // blue
  EMAIL:         '#06b6d4', // cyan
  PHONE:         '#8b5cf6', // violet
  ORG:           '#f59e0b', // amber
  DOMAIN:        '#10b981', // emerald
  URL:           '#14b8a6', // teal
  IP:            '#f97316', // orange
  CRYPTO_WALLET: '#fbbf24', // yellow
  FILE_HASH:     '#ec4899', // pink
  LOC:           '#84cc16', // lime
  USERNAME:      '#a78bfa', // light violet
  SOCIAL_HANDLE: '#38bdf8', // sky
  DATE:          '#94a3b8', // slate
  TIME:          '#94a3b8', // slate
  DEVICE:        '#fb7185', // rose
  DEFAULT:       '#64748b', // slate-500
};

export const ENTITY_LABELS = {
  EVIDENCE:      'Evidence',
  PERSON:        'Person',
  EMAIL:         'Email',
  PHONE:         'Phone',
  ORG:           'Organization',
  DOMAIN:        'Domain',
  URL:           'URL',
  IP:            'IP Address',
  CRYPTO_WALLET: 'Crypto Wallet',
  FILE_HASH:     'File Hash',
  LOC:           'Location',
  USERNAME:      'Username',
  SOCIAL_HANDLE: 'Social Handle',
  DATE:          'Date',
  TIME:          'Time',
  DEVICE:        'Device',
};

export function getNodeColor(entityType) {
  return NODE_COLORS[entityType] ?? NODE_COLORS.DEFAULT;
}

// ── Backend → Cytoscape transformer ──────────────────────────────────────────

/**
 * Transform a backend GraphResponse { nodes, edges } into a flat
 * Cytoscape `elements` array ready for <CytoscapeComponent elements={...} />.
 *
 * @param {Object} graphData - { nodes: Entity[], edges: Relationship[] }
 * @returns {Array} Cytoscape elements array
 */
export function transformToCytoscape(graphData) {
  if (!graphData) return [];

  const { nodes = [], edges = [] } = graphData;

  const cyNodes = nodes.map((node) => {
    let label = node.value || '';
    
    // For EVIDENCE nodes, prefer human-friendly filename over raw UUIDs
    if (node.entity_type === 'EVIDENCE' || !label) {
      const filename = node.properties?.filename || node.properties?.original_filename || node.label;
      if (filename) {
        label = filename;
      } else if (/^[0-9a-f-]{30,}$/i.test(label)) {
        label = `Evidence (${label.slice(0, 8)})`;
      }
    }

    const truncated = truncateLabel(label, 24);

    return {
      data: {
        id: node.id,
        label: truncated,
        fullLabel: label,
        entity_type: node.entity_type,
        normalized_value: node.normalized_value,
        confidence: node.confidence,
        first_seen: node.first_seen,
        last_seen: node.last_seen,
        properties: node.properties ?? {},
        color: getNodeColor(node.entity_type),
      },
    };
  });

  const cyEdges = edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source_entity_id,
      target: edge.target_entity_id,
      label: edge.relationship_type || 'CONNECTED_TO',
      provenance: edge.provenance,
      confidence: edge.confidence,
      evidence_id: edge.evidence_id,
    },
  }));

  return [...cyNodes, ...cyEdges];
}

function truncateLabel(value, maxLen) {
  if (!value) return '';
  return value.length > maxLen ? value.slice(0, maxLen) + '…' : value;
}

// ── Cytoscape stylesheet ──────────────────────────────────────────────────────

export const GRAPH_STYLESHEET = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'label': 'data(label)',
      'color': '#f8fafc',
      'font-size': '11px',
      'font-weight': '600',
      'font-family': 'Inter, system-ui, -apple-system, sans-serif',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': '6px',
      'text-background-color': '#090d16',
      'text-background-opacity': 0.92,
      'text-background-padding': '3px 8px',
      'text-background-shape': 'roundrectangle',
      'text-border-color': 'rgba(255, 255, 255, 0.15)',
      'text-border-width': '1px',
      'text-border-opacity': 0.8,
      'width': '42px',
      'height': '42px',
      'border-width': '3px',
      'border-color': '#0f172a',
      'overlay-padding': '4px',
      'transition-property': 'border-color, border-width, background-color',
      'transition-duration': '200ms',
    },
  },
  {
    selector: 'node[entity_type = "EVIDENCE"]',
    style: {
      'shape': 'round-rectangle',
      'width': '52px',
      'height': '52px',
      'background-color': '#4f46e5',
      'border-color': '#818cf8',
      'border-width': '3px',
      'font-weight': '700',
      'font-size': '12px',
      'text-background-color': '#1e1b4b',
      'text-background-opacity': 0.95,
      'text-border-color': '#6366f1',
    },
  },
  {
    selector: 'node[entity_type = "PERSON"]',
    style: {
      'shape': 'ellipse',
      'border-color': '#60a5fa',
    },
  },
  {
    selector: 'node[entity_type = "EMAIL"]',
    style: {
      'shape': 'round-rectangle',
      'border-color': '#22d3ee',
    },
  },
  {
    selector: 'node[entity_type = "PHONE"]',
    style: {
      'shape': 'ellipse',
      'border-color': '#a78bfa',
    },
  },
  {
    selector: 'node[entity_type = "IP"]',
    style: {
      'shape': 'diamond',
      'border-color': '#fb923c',
      'width': '44px',
      'height': '44px',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#38bdf8',
      'border-width': '5px',
      'text-background-color': '#0369a1',
      'text-background-opacity': 1,
      'text-border-color': '#38bdf8',
    },
  },
  {
    selector: 'node:active',
    style: {
      'overlay-color': '#3b82f6',
      'overlay-opacity': 0.25,
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': 'rgba(96, 165, 250, 0.4)',
      'target-arrow-color': '#60a5fa',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.1,
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '9.5px',
      'font-weight': '600',
      'color': '#93c5fd',
      'text-background-color': '#070b14',
      'text-background-opacity': 0.95,
      'text-background-padding': '3px 6px',
      'text-background-shape': 'roundrectangle',
      'text-border-color': 'rgba(96, 165, 250, 0.3)',
      'text-border-width': '1px',
      'text-rotation': 'autorotate',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#60a5fa',
      'target-arrow-color': '#60a5fa',
      'width': 3.5,
    },
  },
];
