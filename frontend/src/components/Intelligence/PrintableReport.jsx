import React from 'react';

// Basic styles for the printable report
// This relies on standard HTML/CSS because it needs to print well.
const PrintableReport = ({ reportData, evidenceItem }) => {
  if (!reportData) return null;

  return (
    <div className="printable-report" style={{ display: 'none' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report, .printable-report * {
            visibility: visible;
          }
          .printable-report {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          .report-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .report-header {
            text-align: center;
            border-bottom: 2px solid #000;
            margin-bottom: 30px;
            padding-bottom: 20px;
          }
          .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .metadata-table th, .metadata-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .metadata-table th {
            background-color: #f2f2f2;
          }
          h1, h2, h3, p { margin: 0 0 10px 0; }
        }
      `}</style>

      <div className="report-header">
        <h1>NETHRA AI Investigation Report</h1>
        <p><strong>Generated At:</strong> {new Date(reportData.generated_at).toLocaleString()}</p>
        <p><strong>Evidence ID:</strong> {reportData.evidence_id}</p>
        {evidenceItem && <p><strong>Original File:</strong> {evidenceItem.original_filename}</p>}
      </div>

      <div className="report-section">
        <h2>1. Executive Summary (Insights)</h2>
        {reportData.insights && reportData.insights.length > 0 ? (
          <ul>
            {reportData.insights.map((insight, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>
                <strong>[{insight.type.toUpperCase()}]</strong> {insight.text} (Confidence: {insight.confidence})
              </li>
            ))}
          </ul>
        ) : (
          <p>No critical insights detected.</p>
        )}
      </div>

      <div className="report-section">
        <h2>2. Extracted Entities</h2>
        {reportData.entities && reportData.entities.length > 0 ? (
          <table className="metadata-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {reportData.entities.map((ent, idx) => (
                <tr key={idx}>
                  <td>{ent.entity_type}</td>
                  <td>{ent.entity_value}</td>
                  <td>{ent.confidence ? (ent.confidence * 100).toFixed(1) + '%' : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No entities extracted.</p>
        )}
      </div>

      <div className="report-section">
        <h2>3. Timeline Events</h2>
        {reportData.timeline && reportData.timeline.length > 0 ? (
          <table className="metadata-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Event</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {reportData.timeline.map((event, idx) => (
                <tr key={idx}>
                  <td>{new Date(event.timestamp).toLocaleString()}</td>
                  <td>{event.type}</td>
                  <td>{event.event_name}</td>
                  <td>{event.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No timeline events available.</p>
        )}
      </div>

      <div className="report-section">
        <h2>4. Evidence Metadata</h2>
        {reportData.metadata && reportData.metadata.length > 0 ? (
          <table className="metadata-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {reportData.metadata.map((m, idx) => (
                <tr key={idx}>
                  <td>{m.metadata_type}</td>
                  <td>{JSON.stringify(m.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No metadata extracted.</p>
        )}
      </div>

      <div className="report-section">
        <h2>5. OCR / Extracted Text</h2>
        {reportData.ocr && reportData.ocr.length > 0 ? (
          <div>
            {reportData.ocr.map((o, idx) => (
              <div key={idx} style={{ marginBottom: '15px' }}>
                <strong>Page {o.page_number || 1}:</strong>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '12px', background: '#f9f9f9', padding: '10px', border: '1px solid #ddd' }}>
                  {o.extracted_text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No text extracted.</p>
        )}
      </div>

    </div>
  );
};

export default PrintableReport;
