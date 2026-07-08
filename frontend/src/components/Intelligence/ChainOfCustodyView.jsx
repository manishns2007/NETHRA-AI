import React from 'react';
import { ShieldCheck, User, Fingerprint } from 'lucide-react';

export const ChainOfCustodyView = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: '13px', textAlign: 'center' }}>No audit logs found.</div>;
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldCheck size={14} /> Forensic Audit Trail
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {logs.map((log, index) => (
          <div key={log.id} style={{ 
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '8px', padding: '12px', position: 'relative'
          }}>
            {/* Timeline connector */}
            {index !== logs.length - 1 && (
              <div style={{ position: 'absolute', left: '16px', bottom: '-16px', width: '2px', height: '16px', background: 'rgba(255,255,255,0.05)' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{log.action}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-2)', marginBottom: '8px' }}>
              <User size={12} /> {log.performed_by}
            </div>

            {log.hash_verification_status && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                <Fingerprint size={12} /> Hash: {log.hash_verification_status}
              </div>
            )}

            {log.details && (
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                {log.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
