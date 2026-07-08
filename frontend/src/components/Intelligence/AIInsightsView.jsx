import React from 'react';
import { Brain, AlertCircle, TrendingUp, Clock } from 'lucide-react';

const TYPE_ICONS = {
  'lead': <TrendingUp size={16} color="#60a5fa" />,
  'timeline': <Clock size={16} color="#f59e0b" />,
  'info': <AlertCircle size={16} color="#94a3b8" />
};

export const AIInsightsView = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: '13px', textAlign: 'center' }}>No AI insights generated.</div>;
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Brain size={14} /> Automatically Generated Findings
      </div>
      
      {insights.map(insight => (
        <div key={insight.id} style={{ 
          padding: '14px', background: 'rgba(59,130,246,0.05)', 
          border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', 
          display: 'flex', gap: '12px' 
        }}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {TYPE_ICONS[insight.type] || TYPE_ICONS['info']}
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 8px 0', lineHeight: 1.5 }}>
              {insight.text}
            </p>
            {insight.confidence && (
              <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Confidence: {Math.round(insight.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
