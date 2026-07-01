/**
 * NodeDetailPanel.jsx
 *
 * Slide-in panel that shows full details for the currently selected graph node.
 * Receives the raw Cytoscape node data object.
 *
 * Props:
 *   node     - Cytoscape node data ({ entity_type, fullLabel, confidence, … }) or null
 *   onClose  - callback to deselect
 */
import React from 'react';
import { ENTITY_LABELS, getNodeColor } from './graphConfig';

function DetailRow({ label, value, mono = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-2 border-b border-slate-800 last:border-0">
      <span className="block text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</span>
      <span className={`text-sm text-slate-200 break-all ${mono ? 'font-mono' : ''}`}>
        {String(value)}
      </span>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function NodeDetailPanel({ node, onClose }) {
  console.log('Rendering NodeDetailPanel with node:', node);
  if (!node) return null;

  const color = getNodeColor(node.entity_type);
  const typeLabel = ENTITY_LABELS[node.entity_type] ?? node.entity_type;
  const hasProperties = node.properties && Object.keys(node.properties).length > 0;

  return (
    <div className="w-72 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-slate-800"
        style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
      >
        <div className="min-w-0">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: color + '25', color }}
          >
            {typeLabel}
          </span>
          <p className="text-sm text-slate-200 font-medium mt-1 truncate" title={node.fullLabel}>
            {node.fullLabel}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800"
          aria-label="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <DetailRow label="Entity Type"   value={typeLabel} />
        <DetailRow label="Value"         value={node.fullLabel} mono />
        <DetailRow label="Normalized"    value={node.normalized_value} mono />
        <DetailRow label="Confidence"    value={node.confidence != null ? `${(node.confidence * 100).toFixed(0)}%` : null} />
        <DetailRow label="First Seen"    value={formatDate(node.first_seen)} />
        <DetailRow label="Last Seen"     value={formatDate(node.last_seen)} />
        <DetailRow label="Node ID"       value={node.id} mono />

        {hasProperties && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Properties</p>
            <div className="bg-slate-800/60 rounded p-3 text-xs font-mono text-slate-300 overflow-x-auto border border-slate-700">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(node.properties, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
