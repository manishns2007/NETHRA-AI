import React from 'react';
import { Panel } from './DashboardWidgets';
import { Activity } from 'lucide-react';

export const TimelineWidget = () => {
  const milestones = [
    { time: '09:00 AM', desc: 'Case INV-2026-092 Initiated', type: 'system' },
    { time: '09:14 AM', desc: 'WhatsApp Export Ingested', type: 'evidence' },
    { time: '09:15 AM', desc: 'SHA-256 Verified', type: 'integrity' },
    { time: '09:16 AM', desc: 'NER Extraction Complete (42 Entities)', type: 'ai' },
    { time: '09:20 AM', desc: 'PDF Document Ingested', type: 'evidence' },
  ];

  return (
    <Panel title="Investigation Timeline" icon={Activity} right="Today">
      <div style={{ flex: 1, position: 'relative', paddingLeft: '12px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', background: '#0a0a0f',
                border: `2px solid ${m.type === 'ai' ? '#a78bfa' : m.type === 'evidence' ? '#3b82f6' : m.type === 'integrity' ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
                zIndex: 2, marginTop: '4px', marginLeft: '-1px'
              }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace', marginBottom: '2px' }}>{m.time}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-1)', fontWeight: 500 }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};
