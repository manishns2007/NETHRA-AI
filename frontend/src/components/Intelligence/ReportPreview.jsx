import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getIntelligenceReport } from '../../services/api';
import PrintableReport from './PrintableReport';

const StatusIcon = ({ status }) => {
  if (status === 'ready') return <CheckCircle2 size={14} color="#34d399" />;
  if (status === 'processing') return <Clock size={14} color="#60a5fa" />;
  return <AlertCircle size={14} color="#ef4444" />;
};

export const ReportPreview = ({ preview, evidenceId, evidenceItem }) => {
  const [printing, setPrinting] = useState(false);
  const [fullReportData, setFullReportData] = useState(null);

  if (!preview || !preview.sections) {
    return <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: '13px', textAlign: 'center' }}>No report preview available.</div>;
  }

  const handleExportPDF = async () => {
    try {
      setPrinting(true);
      const res = await getIntelligenceReport(evidenceId);
      setFullReportData(res.data);
      // Wait for React to render the printable component
      setTimeout(() => {
        window.print();
        setPrinting(false);
      }, 500);
    } catch (err) {
      console.error("Failed to fetch full report", err);
      setPrinting(false);
    }
  };

  return (
    <>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <FileText size={32} color="var(--text-3)" style={{ opacity: 0.5, margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '4px' }}>Investigation Report Generator</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Full Intelligence Report (Module 8)</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {preview.sections.map(section => (
            <div key={section.id} style={{ 
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '8px', padding: '16px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{section.title}</div>
                <StatusIcon status={section.status} />
              </div>
              {section.summary_placeholder && (
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                  {section.summary_placeholder}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button 
            onClick={handleExportPDF} 
            disabled={printing}
            style={{ 
              flex: 1, padding: '10px', background: printing ? 'rgba(59,130,246,0.1)' : '#3b82f6', 
              border: 'none', borderRadius: '6px', color: '#fff', 
              fontSize: '12px', fontWeight: 600, cursor: printing ? 'not-allowed' : 'pointer' 
            }}
          >
            {printing ? 'Generating...' : 'Export PDF'}
          </button>
          <button disabled style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-4)', fontSize: '12px', fontWeight: 600, cursor: 'not-allowed' }}>
            Export DOCX
          </button>
        </div>

      </div>

      {fullReportData && <PrintableReport reportData={fullReportData} evidenceItem={evidenceItem} />}
    </>
  );
};
