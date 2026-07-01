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

  const cyNodes = nodes.map((node) => ({
    data: {
      id: node.id,
      label: truncateLabel(node.value, 24),
      fullLabel: node.value,
      entity_type: node.entity_type,
      normalized_value: node.normalized_value,
      confidence: node.confidence,
      first_seen: node.first_seen,
      last_seen: node.last_seen,
      properties: node.properties ?? {},
      color: getNodeColor(node.entity_type),
    },
  }));

  const cyEdges = edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source_entity_id,
      target: edge.target_entity_id,
      label: edge.relationship_type,
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
      'font-size': '10px',
      'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': '4px',
      'text-outline-color': '#0f172a',
      'text-outline-width': '2px',
      'width': '36px',
      'height': '36px',
      'border-width': '2px',
      'border-color': '#1e293b',
      'transition-property': 'border-color, border-width',
      'transition-duration': '150ms',
    },
  },
  {
    selector: 'node[entity_type = "EVIDENCE"]',
    style: {
      'shape': 'diamond',
      'width': '48px',
      'height': '48px',
      'font-weight': 'bold',
      'font-size': '11px',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#f1f5f9',
      'border-width': '3px',
    },
  },
  {
    selector: 'node:active',
    style: {
      'overlay-color': '#ffffff',
      'overlay-opacity': 0.1,
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 1.5,
      'line-color': '#334155',
      'target-arrow-color': '#334155',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '8px',
      'color': '#64748b',
      'text-background-color': '#0f172a',
      'text-background-opacity': 0.8,
      'text-background-padding': '2px',
      'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace',
      'text-rotation': 'autorotate',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#6366f1',
      'target-arrow-color': '#6366f1',
      'width': 2.5,
    },
  },
];
