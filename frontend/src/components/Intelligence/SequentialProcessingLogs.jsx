import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

export const SequentialProcessingLogs = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--text-3)', padding: '12px 0' }}>
        No processing logs recorded yet.
      </div>
    );
  }

  // Ensure logs are sorted sequentially in chronological pipeline order (oldest step first)
  const sortedLogs = [...logs].sort((a, b) => {
    const tA = new Date(a.timestamp).getTime();
    const tB = new Date(b.timestamp).getTime();
    if (isNaN(tA) || isNaN(tB) || tA === tB) return 0;
    return tA - tB;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        marginBottom: '14px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Sequential Pipeline ({sortedLogs.length} Steps)
        </span>
        <span style={{
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '10px',
          background: 'rgba(34,197,94,0.15)',
          color: '#4ade80',
          border: '1px solid rgba(34,197,94,0.3)',
          fontWeight: 700
        }}>
          ● Completed
        </span>
      </div>

      <div style={{ position: 'relative', paddingLeft: '2px' }}>
        {sortedLogs.map((log, index) => {
          const isLast = index === sortedLogs.length - 1;
          const stepNum = index + 1;
          const isSuccess = log.status === 'SUCCESS' || !log.status;
          const isFailed = log.status === 'FAILED';

          return (
            <div key={log.id || index} style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: isLast ? '0px' : '18px' }}>
              {/* Vertical connecting line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '13px',
                  top: '26px',
                  bottom: '0px',
                  width: '2px',
                  background: 'linear-gradient(to bottom, #3b82f6 0%, rgba(255,255,255,0.12) 100%)',
                  zIndex: 0
                }} />
              )}

              {/* High-contrast centered step node badge */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isFailed 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                  : isSuccess 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                zIndex: 1,
                boxShadow: isFailed 
                  ? '0 0 12px rgba(239,68,68,0.5)' 
                  : isSuccess 
                    ? '0 0 12px rgba(16,185,129,0.4)' 
                    : '0 0 12px rgba(59,130,246,0.4)'
              }}>
                {isFailed ? (
                  <AlertCircle size={14} color="#ffffff" />
                ) : isSuccess ? (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    textAlign: 'center',
                    userSelect: 'none',
                    margin: 0,
                    padding: 0
                  }}>
                    {stepNum}
                  </span>
                ) : (
                  <Clock size={14} color="#ffffff" />
                )}
              </div>

              {/* Step details card */}
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginTop: '-1px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(59,130,246,0.15)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59,130,246,0.3)',
                      fontFamily: 'monospace'
                    }}>
                      STEP {String(stepNum).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                      [{log.step}]
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {log.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SequentialProcessingLogs;
