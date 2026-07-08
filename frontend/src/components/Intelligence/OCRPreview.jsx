import React from 'react';

export default function OCRPreview({ ocrResults }) {
  if (!ocrResults || ocrResults.length === 0) {
    return <div style={{ color: 'var(--text-3)', fontSize: '13px', padding: '10px 0' }}>No text extracted.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {ocrResults.map(ocr => (
        <div key={ocr.id} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px', padding: '14px 16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px', paddingBottom: '10px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>
              {ocr.page_number ? `Page ${ocr.page_number}` : 'Document Text'}
            </span>
            <span style={{
              fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa', borderRadius: '6px', padding: '2px 8px',
            }}>
              {ocr.extraction_method}
            </span>
          </div>
          <div style={{
            fontSize: '12.5px', color: 'var(--text-2)',
            whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono','Fira Code',monospace",
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px', padding: '14px',
            maxHeight: '380px', overflowY: 'auto',
            lineHeight: 1.7,
          }}>
            {ocr.extracted_text}
          </div>
        </div>
      ))}
    </div>
  );
}
