import React from 'react';

export default function MetadataViewer({ metadata }) {
  if (!metadata || metadata.length === 0) {
    return <div className="text-slate-400 text-sm">No metadata extracted.</div>;
  }

  return (
    <div className="space-y-4">
      {metadata.map((meta) => (
        <div key={meta.id} className="bg-slate-900 border border-slate-700 rounded p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">{meta.metadata_type}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300">
            {Object.entries(meta.data).map(([key, value]) => (
              <div key={key} className="flex flex-col border-b border-slate-800 pb-1">
                <span className="text-slate-500 text-xs uppercase">{key.replace(/_/g, ' ')}</span>
                <span className="truncate" title={String(value)}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
