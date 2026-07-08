import React from 'react';

export default function MetadataViewer({ metadata }) {
  if (!metadata || metadata.length === 0) {
    return <div style={{ color: 'var(--text-3)', fontSize: '13px', padding: '10px 0' }}>No metadata extracted.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {metadata.map(meta => (
        <div key={meta.id} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px', padding: '14px 16px',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: '#60a5fa', marginBottom: '12px', paddingBottom: '8px',
            borderBottom: '1px solid rgba(59,130,246,0.15)',
          }}>
            {meta.metadata_type}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px' }}>
            {Object.entries(meta.data).map(([key, value]) => (
              <div key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '3px' }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-1)', wordBreak: 'break-all' }} title={String(value)}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
