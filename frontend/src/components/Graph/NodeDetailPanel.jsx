/**
 * NodeDetailPanel.jsx
 *
 * Slide-in panel showing full details for the selected graph node.
 * Includes a dynamically-rendered Threat Intelligence section that reads from
 * Entity.properties. Adding a new enrichment provider requires no frontend changes —
 * any new key in properties is rendered automatically.
 *
 * Props:
 *   node     - Cytoscape node data object or null
 *   onClose  - callback to deselect node
 */
import React, { useState } from 'react';
import { ENTITY_LABELS, getNodeColor } from './graphConfig';
import { refreshEntityEnrichment, getEntityEnrichment } from '../../services/api';

// ── Provider icon/color map ─────────────────────────────────────────────────
// Used only for cosmetic purposes. Unknown providers will use a default style.
const PROVIDER_META = {
  whois:      { label: 'WHOIS',           color: '#60a5fa' },
  geoip:      { label: 'GeoIP',           color: '#34d399' },
  virustotal: { label: 'VirusTotal',      color: '#f87171' },
  abuseipdb:  { label: 'AbuseIPDB',       color: '#fb923c' },
  hibp:       { label: 'HaveIBeenPwned',  color: '#a78bfa' },
  blockchain: { label: 'Blockchain',      color: '#fbbf24' },
};

// ── Sub-components ───────────────────────────────────────────────────────────

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
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function ProviderSection({ providerKey, data }) {
  const [open, setOpen] = useState(true);
  const meta = PROVIDER_META[providerKey] ?? {
    label: providerKey.charAt(0).toUpperCase() + providerKey.slice(1),
    color: '#94a3b8',
  };

  return (
    <div className="mb-3 rounded-lg border border-slate-700 overflow-hidden">
      {/* Provider header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/80 text-left hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: meta.color }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {/* Provider data */}
      {open && (
        <div className="px-3 py-2 bg-slate-900/60">
          {Object.entries(data).length === 0 ? (
            <p className="text-xs text-slate-500 italic">No data returned</p>
          ) : (
            Object.entries(data).map(([key, value]) => {
              if (key === 'last_updated') return null; // Render timestamp at end
              const displayValue = typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value);
              return (
                <div key={key} className="py-1.5 border-b border-slate-800/60 last:border-0">
                  <span className="block text-xs text-slate-500 mb-0.5">{key}</span>
                  <span className="text-xs text-slate-200 font-mono break-all">{displayValue}</span>
                </div>
              );
            })
          )}
          {data.last_updated && (
            <p className="text-xs text-slate-600 mt-1 pt-1 border-t border-slate-800">
              Updated: {formatDate(data.last_updated)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ThreatIntelSection({ node }) {
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);
  const [enrichment, setEnrichment] = useState(null);

  // Pull enrichment data from node.properties (already stored in the entity)
  // or from a separate fetch if needed
  const rawProperties = node.properties || {};
  // Filter out non-enrichment system keys if any
  const enrichmentKeys = Object.keys(rawProperties);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshEntityEnrichment(node.id);
      setQueued(true);
    } catch (err) {
      console.error('Failed to queue enrichment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          Threat Intelligence
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading || queued}
          className="text-xs px-2 py-0.5 rounded border transition-colors
            border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Queuing…' : queued ? '✓ Queued' : 'Enrich'}
        </button>
      </div>

      {queued && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs text-blue-300">
            Enrichment task queued. Refresh the node after the Celery worker processes it.
          </p>
        </div>
      )}

      {enrichmentKeys.length === 0 ? (
        <div className="space-y-2">
          {/* Render placeholder cards for all known providers */}
          {Object.entries(PROVIDER_META).map(([key, meta]) => (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800 bg-slate-800/30"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-xs text-slate-500 font-medium">{meta.label}</span>
              </div>
              <span className="text-xs text-slate-600 italic">Not Enriched</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {enrichmentKeys.map(key => (
            <ProviderSection key={key} providerKey={key} data={rawProperties[key]} />
          ))}
        </div>
      )}
    </div>
  );
}


// ── Main Panel ───────────────────────────────────────────────────────────────

export default function NodeDetailPanel({ node, onClose }) {
  if (!node) return null;

  const color    = getNodeColor(node.entity_type);
  const typeLabel = ENTITY_LABELS[node.entity_type] ?? node.entity_type;

  // EVIDENCE nodes don't get enriched
  const isEnrichable = node.entity_type !== 'EVIDENCE';

  return (
    <div className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* Core entity details */}
        <DetailRow label="Entity Type"  value={typeLabel} />
        <DetailRow label="Value"        value={node.fullLabel} mono />
        <DetailRow label="Normalized"   value={node.normalized_value} mono />
        <DetailRow label="Confidence"   value={node.confidence != null ? `${(node.confidence * 100).toFixed(0)}%` : null} />
        <DetailRow label="First Seen"   value={formatDate(node.first_seen)} />
        <DetailRow label="Last Seen"    value={formatDate(node.last_seen)} />
        <DetailRow label="Node ID"      value={node.id} mono />

        {/* Threat Intelligence Section */}
        {isEnrichable && <ThreatIntelSection node={node} />}
      </div>
    </div>
  );
}
