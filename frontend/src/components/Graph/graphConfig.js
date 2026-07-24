/**
 * graphConfig.js
 *
 * Professional Digital Forensics & SOC Intelligence Visual Configuration.
 * Inspired by Palantir Gotham, IBM i2 Analyst's Notebook, Maltego, and Microsoft Sentinel.
 */

// ── Entity Type Metadata (Color, Shape, Icon, Label) ─────────────────────────

export const NODE_META = {
  EVIDENCE: {
    label: 'Evidence File',
    typeLabel: 'DOCUMENT',
    color: '#4f46e5',        // Indigo
    borderColor: '#818cf8',
    shape: 'round-rectangle',
    icon: '📄',
    size: 54,
  },
  PERSON: {
    label: 'Person / Identity',
    typeLabel: 'PERSON',
    color: '#f97316',        // Orange
    borderColor: '#fb923c',
    shape: 'ellipse',
    icon: '👤',
    size: 44,
  },
  EMAIL: {
    label: 'Email Address',
    typeLabel: 'EMAIL',
    color: '#06b6d4',        // Cyan
    borderColor: '#22d3ee',
    shape: 'round-rectangle',
    icon: '✉️',
    size: 44,
  },
  PHONE: {
    label: 'Phone Number',
    typeLabel: 'PHONE',
    color: '#8b5cf6',        // Violet / Purple
    borderColor: '#c084fc',
    shape: 'ellipse',
    icon: '📞',
    size: 44,
  },
  DOMAIN: {
    label: 'Domain Name',
    typeLabel: 'DOMAIN',
    color: '#10b981',        // Emerald / Green
    borderColor: '#34d399',
    shape: 'round-rectangle',
    icon: '🌐',
    size: 44,
  },
  URL: {
    label: 'Web URL',
    typeLabel: 'URL',
    color: '#14b8a6',        // Teal
    borderColor: '#2dd4bf',
    shape: 'round-rectangle',
    icon: '🔗',
    size: 44,
  },
  IP: {
    label: 'IP Address',
    typeLabel: 'IP',
    color: '#ef4444',        // Red
    borderColor: '#f87171',
    shape: 'hexagon',
    icon: '🖥',
    size: 46,
  },
  ORG: {
    label: 'Organization',
    typeLabel: 'ORGANIZATION',
    color: '#f59e0b',        // Amber / Gold
    borderColor: '#fbbf24',
    shape: 'octagon',
    icon: '🏢',
    size: 48,
  },
  LOC: {
    label: 'Location / Geo',
    typeLabel: 'LOCATION',
    color: '#ec4899',        // Pink
    borderColor: '#f472b6',
    shape: 'tag',
    icon: '📍',
    size: 44,
  },
  CRYPTO_WALLET: {
    label: 'Crypto Wallet',
    typeLabel: 'CRYPTO',
    color: '#fbbf24',        // Gold
    borderColor: '#fde047',
    shape: 'hexagon',
    icon: '💰',
    size: 46,
  },
  FILE_HASH: {
    label: 'File Hash',
    typeLabel: 'HASH',
    color: '#f43f5e',        // Rose
    borderColor: '#fb7185',
    shape: 'round-rectangle',
    icon: '🔑',
    size: 44,
  },
  USERNAME: {
    label: 'Username / Handle',
    typeLabel: 'HANDLE',
    color: '#a78bfa',        // Light Violet
    borderColor: '#c084fc',
    shape: 'ellipse',
    icon: '🆔',
    size: 44,
  },
  DEFAULT: {
    label: 'Forensic Entity',
    typeLabel: 'ENTITY',
    color: '#64748b',        // Slate
    borderColor: '#94a3b8',
    shape: 'ellipse',
    icon: '🔍',
    size: 42,
  },
};

export const NODE_COLORS = Object.fromEntries(
  Object.entries(NODE_META).map(([k, v]) => [k, v.color])
);

export const ENTITY_LABELS = Object.fromEntries(
  Object.entries(NODE_META).map(([k, v]) => [k, v.label])
);

export function getNodeMeta(entityType) {
  return NODE_META[entityType] ?? NODE_META.DEFAULT;
}

export function getNodeColor(entityType) {
  return getNodeMeta(entityType).color;
}

// ── Relationship Type Colors & Labels ────────────────────────────────────────

export const RELATIONSHIP_META = {
  EXTRACTED_FROM:    { label: 'EXTRACTED FROM', color: '#818cf8' },
  COMMUNICATES_WITH: { label: 'COMMUNICATES WITH', color: '#60a5fa' },
  MENTIONS:          { label: 'MENTIONS', color: '#94a3b8' },
  REGISTERED_TO:     { label: 'REGISTERED TO', color: '#34d399' },
  HOSTED_ON:         { label: 'HOSTED ON', color: '#f87171' },
  OWNS:              { label: 'OWNS', color: '#fbbf24' },
  USES:              { label: 'USES', color: '#c084fc' },
  LOCATED_AT:        { label: 'LOCATED AT', color: '#f472b6' },
  SHARES_PHONE:      { label: 'SHARES PHONE', color: '#a78bfa' },
  VISITED:           { label: 'VISITED', color: '#2dd4bf' },
  DOWNLOADED:        { label: 'DOWNLOADED', color: '#818cf8' },
  CONTAINS:          { label: 'CONTAINS', color: '#60a5fa' },
  CONNECTED_TO:      { label: 'CONNECTED TO', color: '#64748b' },
};

// ── Backend → Cytoscape transformer ──────────────────────────────────────────

export function transformToCytoscape(graphData) {
  if (!graphData) return [];

  const { nodes = [], edges = [] } = graphData;

  const cyNodes = nodes.map((node) => {
    const meta = getNodeMeta(node.entity_type);
    let label = node.value || '';

    // For EVIDENCE nodes, prefer human-friendly filename over raw UUID
    if (node.entity_type === 'EVIDENCE' || !label) {
      const filename = node.properties?.filename || node.properties?.original_filename || node.label;
      if (filename) {
        label = filename;
      } else if (/^[0-9a-f-]{30,}$/i.test(label)) {
        label = `Evidence (${label.slice(0, 8)})`;
      }
    }

    const truncated = truncateLabel(label, 26);
    const conf = typeof node.confidence === 'number' ? Math.round(node.confidence * 100) : 95;

    return {
      data: {
        id: node.id,
        label: truncated,
        fullLabel: label,
        entity_type: node.entity_type || 'DEFAULT',
        typeLabel: meta.typeLabel,
        icon: meta.icon,
        normalized_value: node.normalized_value,
        confidence: node.confidence ?? 0.95,
        confidencePct: conf,
        first_seen: node.first_seen,
        last_seen: node.last_seen,
        properties: node.properties ?? {},
        color: meta.color,
        borderColor: meta.borderColor,
        shape: meta.shape,
        size: meta.size,
      },
    };
  });

  const cyEdges = edges.map((edge) => {
    let relType = edge.relationship_type || 'CONNECTED_TO';
    const meta = RELATIONSHIP_META[relType] ?? RELATIONSHIP_META.CONNECTED_TO;

    return {
      data: {
        id: edge.id,
        source: edge.source_entity_id,
        target: edge.target_entity_id,
        label: meta.label,
        relationship_type: relType,
        provenance: edge.provenance,
        confidence: edge.confidence,
        evidence_id: edge.evidence_id,
        color: meta.color,
      },
    };
  });

  return [...cyNodes, ...cyEdges];
}

function truncateLabel(value, maxLen) {
  if (!value) return '';
  return value.length > maxLen ? value.slice(0, maxLen) + '…' : value;
}

// ── Cytoscape Modern Investigation Stylesheet ─────────────────────────────────

export const GRAPH_STYLESHEET = [
  // Default Node
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
      'text-margin-y': '7px',
      'text-background-color': '#090d16',
      'text-background-opacity': 0.92,
      'text-background-padding': '4px 8px',
      'text-background-shape': 'roundrectangle',
      'text-border-color': 'rgba(255, 255, 255, 0.15)',
      'text-border-width': '1px',
      'text-border-opacity': 0.8,
      'width': 'data(size)',
      'height': 'data(size)',
      'border-width': '3px',
      'border-color': 'data(borderColor)',
      'overlay-padding': '6px',
      'transition-property': 'border-color, border-width, background-color, width, height',
      'transition-duration': '200ms',
    },
  },
  // Specific Node Shapes
  {
    selector: 'node[shape = "round-rectangle"]',
    style: {
      'shape': 'round-rectangle',
    },
  },
  {
    selector: 'node[shape = "ellipse"]',
    style: {
      'shape': 'ellipse',
    },
  },
  {
    selector: 'node[shape = "hexagon"]',
    style: {
      'shape': 'hexagon',
    },
  },
  {
    selector: 'node[shape = "octagon"]',
    style: {
      'shape': 'octagon',
    },
  },
  {
    selector: 'node[shape = "tag"]',
    style: {
      'shape': 'tag',
    },
  },
  // Evidence Node Prominence
  {
    selector: 'node[entity_type = "EVIDENCE"]',
    style: {
      'font-weight': '700',
      'font-size': '12px',
      'text-background-color': '#1e1b4b',
      'text-background-opacity': 0.96,
      'text-border-color': '#6366f1',
    },
  },
  // Selection & Hover States
  {
    selector: 'node:selected',
    style: {
      'border-color': '#38bdf8',
      'border-width': '6px',
      'text-background-color': '#0284c7',
      'text-background-opacity': 1,
      'text-border-color': '#38bdf8',
      'color': '#ffffff',
    },
  },
  {
    selector: 'node.highlighted',
    style: {
      'border-color': '#60a5fa',
      'border-width': '5px',
      'text-background-color': '#1d4ed8',
      'text-background-opacity': 1,
    },
  },
  {
    selector: 'node.dimmed',
    style: {
      'opacity': 0.25,
    },
  },
  // Edges
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': 'rgba(96, 165, 250, 0.45)',
      'target-arrow-color': '#60a5fa',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.15,
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '9.5px',
      'font-weight': '600',
      'color': '#93c5fd',
      'text-background-color': '#070b14',
      'text-background-opacity': 0.95,
      'text-background-padding': '3px 7px',
      'text-background-shape': 'roundrectangle',
      'text-border-color': 'rgba(96, 165, 250, 0.3)',
      'text-border-width': '1px',
      'text-rotation': 'autorotate',
      'transition-property': 'line-color, width, target-arrow-color',
      'transition-duration': '200ms',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#38bdf8',
      'target-arrow-color': '#38bdf8',
      'width': 3.5,
      'text-background-color': '#0369a1',
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      'line-color': '#60a5fa',
      'target-arrow-color': '#60a5fa',
      'width': 3,
    },
  },
  {
    selector: 'edge.dimmed',
    style: {
      'opacity': 0.15,
    },
  },
];
