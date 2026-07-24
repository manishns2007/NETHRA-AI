import React from 'react';
import { ShieldCheck, User, Fingerprint } from 'lucide-react';

export const ChainOfCustodyView = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: '13px', textAlign: 'center' }}>No audit logs found.</div>;
  }

  const renderDetails = (details) => {
    if (!details) return null;
    
    // Check if details contains a 64-char hex hash
    const hashMatch = details.match(/([a-f0-9]{64})/i);
    if (hashMatch) {
      const hash = hashMatch[1];
      const parts = details.split(hash);
      return (
        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '6px', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {parts[0]}
          <div style={{
            display: 'inline-block',
            marginTop: '4px',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '11px',
            color: '#60a5fa',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            width: '100%',
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>SHA-256 Hash</span>
            {hash}
          </div>
          {parts[1]}
        </div>
      );
    }

    return (
      <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {details}
      </div>
    );
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldCheck size={14} color="#60a5fa" /> Forensic Audit Trail
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {logs.map((log, index) => (
          <div key={log.id} style={{ 
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden'
          }}>
            {/* Timeline connector */}
            {index !== logs.length - 1 && (
              <div style={{ position: 'absolute', left: '18px', bottom: '-14px', width: '2px', height: '14px', background: 'rgba(255,255,255,0.08)' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>{log.action}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'monospace', flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-2)', marginBottom: '6px' }}>
              <User size={12} color="var(--text-3)" /> {log.performed_by}
            </div>

            {log.hash_verification_status && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '3px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                <Fingerprint size={12} /> Hash: {log.hash_verification_status}
              </div>
            )}

            {renderDetails(log.details)}
          </div>
        ))}
      </div>
    </div>
  );
};
