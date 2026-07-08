import React from 'react';
import { Clock, ShieldCheck, Database } from 'lucide-react';

export const TimelineView = ({ timeline }) => {
  if (!timeline || !timeline.events || timeline.events.length === 0) {
    return <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: '13px', textAlign: 'center' }}>No timeline events found.</div>;
  }

  const processingEvents = timeline.events.filter(e => e.type === 'PROCESSING');
  const evidenceEvents = timeline.events.filter(e => e.type === 'EVIDENCE');

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Evidence Timeline */}
      <div>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} /> Evidence Timeline
        </h4>
        {evidenceEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {evidenceEvents.map(event => (
              <div key={event.id} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', marginTop: '6px' }} />
                <div>
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{event.event_name}</div>
                  {event.details && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{event.details}</div>}
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>{new Date(event.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>No temporal events extracted from this evidence.</div>
        )}
      </div>

      {/* Processing Timeline */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={14} /> System Processing
        </h4>
        {processingEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {processingEvents.map(event => (
              <div key={event.id} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }} />
                <div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0' }}>{event.event_name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{new Date(event.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>No processing events found.</div>
        )}
      </div>

    </div>
  );
};
