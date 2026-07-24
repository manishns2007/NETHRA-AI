import React from 'react';
import { Shield, Clock, HardDrive, Brain, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Reusable Panel Wrapper ---
export const Panel = ({ title, icon: Icon, right, children, className = '', bodyStyle = {} }) => (
  <div className={`glass-panel ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(255,255,255,0.01)', flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={16} color="var(--text-3)" />}
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          {title}
        </span>
      </div>
      {right && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{right}</div>}
    </div>
    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, ...bodyStyle }}>
      {children}
    </div>
  </div>
);

// --- Case Context Panel ---
export const CaseContextPanel = () => {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Current Investigation</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Operation Phantom</div>
          <div className="mono-sm" style={{ color: '#60a5fa', marginTop: '2px' }}>ID: INV-2026-092</div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Active Analysis</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Investigator</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Agent K. Chen</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Last Updated</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Just now</div>
          </div>
        </div>
      </div>
      
      {/* Module 8 Placeholder (Report Generation Action) */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{
          padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        title="Report Generation (Module 8 Pending)"
        >
          <FileText size={14} /> Generate Report
        </button>
      </div>
    </div>
  );
};

// --- Investigation Status Strip ---
export const InvestigationStatus = () => {
  const steps = [
    { label: 'Evidence Integrity', status: 'done' },
    { label: 'OCR & Parsing', status: 'done' },
    { label: 'Entity Extraction', status: 'done' },
    { label: 'Timeline Gen', status: 'active' },
    { label: 'AI Analysis', status: 'pending' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '24px' }}>
      {steps.map((step, idx) => {
        const isDone = step.status === 'done';
        const isActive = step.status === 'active';
        const color = isDone ? '#22c55e' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.2)';
        
        return (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', height: '20px', borderRadius: '50%', 
                background: isDone ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: `1px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isDone ? <CheckCircle2 size={12} color={color} /> : isActive ? <Loader2 size={12} color={color} className="spin" /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }} />}
              </div>
              <span style={{ fontSize: '12px', fontWeight: isActive || isDone ? 600 : 500, color: isActive || isDone ? '#fff' : 'var(--text-3)' }}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: isDone ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// --- Evidence Health Overview ---
export const EvidenceHealth = ({ total, processed, processing, failed }) => {
  return (
    <Panel title="Evidence Health" icon={HardDrive}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '42px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-3)', paddingBottom: '6px' }}>Total Items</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Verified & Extracted', count: processed, color: '#22c55e' },
            { label: 'Processing Pipeline', count: processing, color: '#3b82f6' },
            { label: 'Failed / Flagged', count: failed, color: '#ef4444' },
          ].map(stat => {
            const pct = total > 0 ? (stat.count / total) * 100 : 0;
            return (
              <div key={stat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-2)' }}>{stat.label}</span>
                  <span style={{ fontWeight: 600, color: stat.color }}>{stat.count}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', background: stat.color, borderRadius: '2px' }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};

// --- AI Investigation Insights ---
export const AIInsightsWidget = () => {
  const insights = [
    { type: 'relationship', text: 'New cross-evidence relationship detected between John Doe and Asset Alpha.', conf: '94%' },
    { type: 'anomaly', text: 'Timeline anomaly: Metadata timestamp precedes communication log by 4 hours.', conf: '88%' },
    { type: 'lead', text: 'High-confidence lead: Unidentified crypto wallet (0x4a2...) found in 3 documents.', conf: '97%' },
  ];

  return (
    <Panel title="AI Investigation Insights" icon={Brain} right="Real-time">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
        {insights.map((insight, i) => (
          <div key={i} style={{ 
            padding: '12px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', 
            borderRadius: '8px', display: 'flex', gap: '12px' 
          }}>
            <div style={{ marginTop: '2px' }}>
              {insight.type === 'anomaly' ? <AlertCircle size={16} color="#f59e0b" /> : <Brain size={16} color="#60a5fa" />}
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 6px 0', lineHeight: 1.5 }}>{insight.text}</p>
              <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                Confidence: {insight.conf}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

// --- Event Log Widget ---
export const EventLogWidget = ({ events }) => {
  const timeAgo = ts => {
    if (!ts) return '—';
    const d = Date.now() - new Date(ts);
    if (d < 60000)   return `${Math.round(d / 1000)}s ago`;
    if (d < 3600000) return `${Math.round(d / 60000)}m ago`;
    return `${Math.round(d / 3600000)}h ago`;
  };

  return (
    <Panel title="Recent Events" icon={Clock} right="System Log">
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {events.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No events logged.</div>
        ) : (
          events.map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', width: '45px', flexShrink: 0, fontFamily: 'monospace' }}>
                {timeAgo(ev.upload_timestamp)}
              </div>
              <div style={{ width: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ev.status === 'PROCESSED' ? '#22c55e' : ev.status === 'PROCESSING' ? '#3b82f6' : '#ef4444', marginTop: '4px' }} />
                {i < events.length - 1 && <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginTop: '4px' }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: '4px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-1)', fontWeight: 500, marginBottom: '2px' }}>
                  Evidence {ev.status === 'PROCESSED' ? 'Processed' : ev.status === 'PROCESSING' ? 'Processing' : 'Failed'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{ev.original_filename}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
};
