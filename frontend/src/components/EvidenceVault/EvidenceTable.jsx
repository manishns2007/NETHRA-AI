import React, { useState } from 'react';
import IntelligencePanel from '../Intelligence/IntelligencePanel';

export default function EvidenceTable({ evidenceList }) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);

  if (!evidenceList || evidenceList.length === 0) {
    return <div className="text-slate-500 text-center py-8">No evidence ingested yet.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
              <th className="p-4 font-semibold">Evidence ID</th>
              <th className="p-4 font-semibold">Source Type</th>
              <th className="p-4 font-semibold">Filename</th>
              <th className="p-4 font-semibold">SHA-256 Hash</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900">
            {evidenceList.map((item) => (
              <tr 
                key={item.evidence_id} 
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => setSelectedEvidenceId(item.evidence_id)}
              >
                <td className="p-4 text-blue-400 font-mono text-sm">{item.evidence_id}</td>
                <td className="p-4 text-slate-300 text-sm">{item.source_type || 'Unknown'}</td>
                <td className="p-4 text-slate-300 text-sm font-medium">{item.original_filename}</td>
                <td className="p-4 text-slate-500 font-mono text-xs truncate max-w-xs" title={item.sha256_hash}>
                  {item.sha256_hash.substring(0, 16)}...
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    item.status === 'PROCESSED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    item.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    item.status === 'FAILED' || item.status === 'INTEGRITY_FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEvidenceId && (
        <IntelligencePanel 
          evidenceId={selectedEvidenceId} 
          onClose={() => setSelectedEvidenceId(null)} 
        />
      )}
    </>
  );
}
