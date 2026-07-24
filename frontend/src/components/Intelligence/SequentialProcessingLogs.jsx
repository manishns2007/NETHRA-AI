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
          background: 'rgba(34,197,94,0.12)',
          color: '#4ade80',
          border: '1px solid rgba(34,197,94,0.25)',
          fontWeight: 600
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
          
          const statusColor = isFailed ? '#ef4444' : isSuccess ? '#22c55e' : '#3b82f6';
          const statusBg = isFailed ? 'rgba(239,68,68,0.15)' : isSuccess ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.15)';
          const nodeBorder = isFailed ? 'rgba(239,68,68,0.4)' : isSuccess ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)';

          return (
            <div key={log.id || index} style={{ display: 'flex', gap: '12px', position: 'relative', paddingBottom: isLast ? '0px' : '16px' }}>
              {/* Vertical connecting line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '24px',
                  bottom: '0px',
                  width: '2px',
                  background: 'linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(255,255,255,0.06))',
                  zIndex: 0
                }} />
              )}

              {/* Step node badge */}
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: statusBg,
                border: `1.5px solid ${nodeBorder}`,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                flexShrink: 0,
                zIndex: 1,
                fontSize: '11px',
                fontWeight: 700,
                color: statusColor,
                boxShadow: `0 0 10px ${statusBg}`
              }}>
                {isFailed ? (
                  <AlertCircle size={13} color="#ef4444" />
                ) : isSuccess ? (
                  <span>{stepNum}</span>
                ) : (
                  <Clock size={13} color="#3b82f6" />
                )}
              </div>

              {/* Step details card */}
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginTop: '-2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: 'rgba(59,130,246,0.12)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59,130,246,0.2)',
                      fontFamily: 'monospace'
                    }}>
                      STEP {String(stepNum).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
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
