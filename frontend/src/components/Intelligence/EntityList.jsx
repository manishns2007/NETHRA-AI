import React, { useMemo } from 'react';

/* Entity type → accent color */
const TYPE_COLOR = {
  PERSON:       '#60a5fa',
  ORG:          '#a78bfa',
  PHONE:        '#34d399',
  EMAIL:        '#f59e0b',
  CRYPTO:       '#fbbf24',
  IP_ADDRESS:   '#f87171',
  URL:          '#fb923c',
  DATE:         '#94a3b8',
  LOCATION:     '#2dd4bf',
};
const typeColor = t => TYPE_COLOR[t] || '#94a3b8';

export default function EntityList({ entities }) {
  if (!entities || entities.length === 0) {
    return <div style={{ color: 'var(--text-3)', fontSize: '13px', padding: '10px 0' }}>No entities extracted.</div>;
  }

  const grouped = useMemo(() => entities.reduce((acc, e) => {
    if (!acc[e.entity_type]) acc[e.entity_type] = [];
    acc[e.entity_type].push(e);
    return acc;
  }, {}), [entities]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Object.entries(grouped).map(([type, items]) => {
        const color = typeColor(type);
        return (
          <div key={type}>
            {/* Type header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '10px', paddingBottom: '8px',
              borderBottom: `1px solid ${color}25`,
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ fontSize: '11.5px', fontWeight: 600, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {type}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1px 7px' }}>
                {items.length}
              </span>
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '10px' }}>
              {items.map(entity => (
                <div key={entity.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${color}20`,
                  borderRadius: '10px', padding: '12px 14px',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${color}45`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${color}20`}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '3px' }}>
                    {entity.entity_value}
                  </div>
                  {entity.normalized_value && entity.normalized_value !== entity.entity_value.toLowerCase() && (
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>
                      Norm: {entity.normalized_value}
                    </div>
                  )}
                  {entity.context_snippet && (
                    <p style={{
                      fontSize: '11.5px', color: 'var(--text-3)', fontStyle: 'italic',
                      marginTop: '8px', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }} title={entity.context_snippet}>
                      "{entity.context_snippet}"
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                      {entity.extraction_method}
                    </span>
                    {entity.confidence && (
                      <span style={{
                        fontSize: '10.5px', fontWeight: 600, color: '#22c55e',
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: '10px', padding: '1px 7px',
                      }}>
                        {Math.round(entity.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
