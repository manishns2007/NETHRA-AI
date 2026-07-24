/**
 * NodeDetailPanel.jsx
 *
 * Professional Slide-Over Investigation Panel.
 * Displays Entity Type, Value, Confidence Score, Threat Intel, and Audit Provenance.
 */
import React, { useState } from 'react';
import { ENTITY_LABELS, getNodeMeta } from './graphConfig';
import { refreshEntityEnrichment } from '../../services/api';

const PROVIDER_META = {
  whois:      { label: 'WHOIS',          color: '#60a5fa' },
  geoip:      { label: 'GeoIP',          color: '#34d399' },
  virustotal: { label: 'VirusTotal',     color: '#f87171' },
  abuseipdb:  { label: 'AbuseIPDB',      color: '#fb923c' },
  hibp:       { label: 'HaveIBeenPwned', color: '#a78bfa' },
  blockchain: { label: 'Blockchain',     color: '#fbbf24' },
};

function formatDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function DetailRow({ label, value, mono = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>{label}</span>
      <span style={{ fontSize: '12.5px', color: '#e2e8f0', wordBreak: 'break-all', fontFamily: mono ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit' }}>
        {String(value)}
      </span>
    </div>
  );
}

function SeverityBadge({ confidence }) {
  let label = 'Low 🔵';
  let color = '#60a5fa';
  let bg = 'rgba(96,165,250,0.1)';
  
  if (confidence >= 0.9) {
    label = 'Critical 🔴';
    color = '#ef4444';
    bg = 'rgba(239,68,68,0.12)';
  } else if (confidence >= 0.75) {
    label = 'High 🟠';
    color = '#f97316';
    bg = 'rgba(249,115,22,0.12)';
  } else if (confidence >= 0.5) {
    label = 'Medium 🟡';
    color = '#eab308';
    bg = 'rgba(234,179,8,0.12)';
  }

  return (
    <span style={{ fontSize: '11px', fontWeight: 600, color, background: bg, border: `1px solid ${color}40`, padding: '2px 8px', borderRadius: '4px' }}>
      {label}
    </span>
  );
}

function ProviderSection({ providerKey, data }) {
  const [open, setOpen] = useState(true);
  const meta = PROVIDER_META[providerKey] ?? {
    label: providerKey.charAt(0).toUpperCase() + providerKey.slice(1),
    color: '#94a3b8',
  };

  return (
    <div style={{ marginBottom: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
          border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.18s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color, boxShadow: `0 0 5px ${meta.color}`, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: meta.color }}>{meta.label}</span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}>
          {Object.entries(data).length === 0 ? (
            <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No data returned</p>
          ) : (
            Object.entries(data).map(([key, value]) => {
              if (key === 'last_updated') return null;
              const dv = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
              return (
                <div key={key} style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginBottom: '1px' }}>{key}</span>
                  <span style={{ fontSize: '11.5px', color: '#e2e8f0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{dv}</span>
                </div>
              );
            })
          )}
          {data.last_updated && (
            <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.2)', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
  const [queued, setQueued]   = useState(false);

  const rawProperties  = node.properties || {};
  const enrichmentKeys = Object.keys(rawProperties);

  const handleRefresh = async () => {
    setLoading(true);
    try { await refreshEntityEnrichment(node.id); setQueued(true); }
    catch (err) { console.error('Failed to queue enrichment:', err); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
          Threat Intelligence
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading || queued}
          style={{
            fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer',
            background: queued ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
            border: queued ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(59,130,246,0.25)',
            color: queued ? '#22c55e' : '#60a5fa',
            opacity: loading ? 0.4 : 1, transition: 'all 0.2s',
          }}
        >
          {loading ? 'Queuing…' : queued ? '✓ Queued' : 'Enrich'}
        </button>
      </div>

      {queued && (
        <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ fontSize: '12px', color: '#60a5fa' }}>Enrichment task queued. Refresh the node after processing completes.</p>
        </div>
      )}

      {enrichmentKeys.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(PROVIDER_META).map(([key, meta]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{meta.label}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Not Enriched</span>
            </div>
          ))}
        </div>
      ) : (
        enrichmentKeys.map(key => <ProviderSection key={key} providerKey={key} data={rawProperties[key]} />)
      )}
    </div>
  );
}

/* ── Main ── */
export default function NodeDetailPanel({ node, onClose }) {
  if (!node) return null;

  const meta = getNodeMeta(node.entity_type);
  const typeLabel = ENTITY_LABELS[node.entity_type] ?? node.entity_type;
  const isEnrichable = node.entity_type !== 'EVIDENCE';
  const confidencePct = node.confidencePct ?? (node.confidence != null ? Math.round(node.confidence * 100) : 95);

  return (
    <div style={{
      width: '320px', flexShrink: 0,
      background: 'rgba(10,10,15,0.96)',
      backdropFilter: 'blur(16px)',
      borderLeft: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
      zIndex: 30,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `4px solid ${meta.color}`,
      }}>
        <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px' }}>{meta.icon}</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              background: `${meta.color}22`, border: `1px solid ${meta.color}40`,
              color: meta.color, borderRadius: '6px', padding: '2px 7px',
            }}>{typeLabel}</span>
          </div>
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={node.fullLabel}>
            {node.fullLabel}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            padding: '5px', lineHeight: 0, transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* Confidence & Severity Header Card */}
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Confidence Metric</span>
            <SeverityBadge confidence={node.confidence ?? 0.95} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${confidencePct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{confidencePct}%</span>
          </div>
        </div>

        <DetailRow label="Entity Classification" value={typeLabel} />
        <DetailRow label="Full Value" value={node.fullLabel} mono />
        <DetailRow label="Normalized Value" value={node.normalized_value} mono />
        <DetailRow label="First Seen" value={formatDate(node.first_seen)} />
        <DetailRow label="Last Seen" value={formatDate(node.last_seen)} />
        <DetailRow label="Entity UUID" value={node.id} mono />

        {isEnrichable && <ThreatIntelSection node={node} />}
      </div>
    </div>
  );
}
