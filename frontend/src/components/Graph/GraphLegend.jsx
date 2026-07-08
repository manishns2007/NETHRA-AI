/**
 * GraphLegend.jsx — themed with blue/red ambient design
 */
import React from 'react';
import { NODE_COLORS, ENTITY_LABELS } from './graphConfig';

export default function GraphLegend({ presentTypes = [] }) {
  const order = ['EVIDENCE', ...Object.keys(NODE_COLORS).filter(t => t !== 'EVIDENCE' && t !== 'DEFAULT')];
  const types = order.filter(t => presentTypes.includes(t));

  if (types.length === 0) return null;

  return (
    <div style={{
      position: 'absolute', bottom: '12px', left: '12px', zIndex: 10,
      background: 'rgba(10,10,15,0.85)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', padding: '10px 14px',
      backdropFilter: 'blur(12px)',
      maxWidth: '260px',
    }}>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>Legend</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
        {types.map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: NODE_COLORS[type],
              boxShadow: `0 0 6px ${NODE_COLORS[type]}`,
            }} />
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)' }}>
              {ENTITY_LABELS[type] ?? type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
