import React from 'react';

export default function OCRPreview({ ocrResults }) {
  if (!ocrResults || ocrResults.length === 0) {
    return <div className="text-slate-400 text-sm">No text extracted.</div>;
  }

  return (
    <div className="space-y-4">
      {ocrResults.map((ocr) => (
        <div key={ocr.id} className="bg-slate-900 border border-slate-700 rounded p-4">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              {ocr.page_number ? `Page ${ocr.page_number}` : 'Document Text'}
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
              {ocr.extraction_method}
            </span>
          </div>
          <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-950 p-3 rounded border border-slate-800 max-h-96 overflow-y-auto">
            {ocr.extracted_text}
          </div>
        </div>
      ))}
    </div>
  );
}
