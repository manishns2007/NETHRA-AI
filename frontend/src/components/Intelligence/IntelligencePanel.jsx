import React, { useState, useEffect } from 'react';
import { getIntelligenceStatus, getIntelligenceMetadata, getIntelligenceOCR, getIntelligenceEntities } from '../../services/api';
import MetadataViewer from './MetadataViewer';
import OCRPreview from './OCRPreview';
import EntityList from './EntityList';

export default function IntelligencePanel({ evidenceId, onClose }) {
  const [activeTab, setActiveTab] = useState('status');
  const [data, setData] = useState({
    status: null,
    metadata: null,
    ocr: null,
    entities: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!evidenceId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statusRes, metaRes, ocrRes, entitiesRes] = await Promise.all([
          getIntelligenceStatus(evidenceId),
          getIntelligenceMetadata(evidenceId),
          getIntelligenceOCR(evidenceId),
          getIntelligenceEntities(evidenceId),
        ]);
        
        setData({
          status: statusRes.data,
          metadata: metaRes.data,
          ocr: ocrRes.data,
          entities: entitiesRes.data,
        });
      } catch (err) {
        console.error("Failed to load intelligence data", err);
        setError("Failed to load intelligence data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [evidenceId]);

  if (!evidenceId) return null;

  const renderTabContent = () => {
    if (loading) return <div className="p-8 text-center text-slate-400">Loading intelligence...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    switch (activeTab) {
      case 'status':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Processing Status: {data.status?.status || 'UNKNOWN'}</h3>
            <div className="bg-slate-900 rounded p-4 border border-slate-700">
              <h4 className="text-sm font-semibold text-slate-400 mb-3 border-b border-slate-800 pb-2">Processing Logs</h4>
              {data.status?.logs?.length > 0 ? (
                <ul className="space-y-3">
                  {data.status.logs.map((log) => (
                    <li key={log.id} className="text-sm text-slate-300">
                      <span className="text-xs text-slate-500 block">{new Date(log.timestamp).toLocaleString()}</span>
                      <span className={`font-semibold mr-2 ${log.status === 'SUCCESS' ? 'text-green-400' : log.status === 'FAILED' ? 'text-red-400' : 'text-blue-400'}`}>[{log.step}]</span>
                      {log.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No logs available.</p>
              )}
            </div>
          </div>
        );
      case 'metadata':
        return <MetadataViewer metadata={data.metadata} />;
      case 'ocr':
        return <OCRPreview ocrResults={data.ocr} />;
      case 'entities':
        return <EntityList entities={data.entities} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'status', label: 'Status & Logs' },
    { id: 'metadata', label: 'Metadata' },
    { id: 'ocr', label: 'Extracted Text' },
    { id: 'entities', label: 'Named Entities' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-slate-200">Intelligence Profile</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {evidenceId}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.label}
              {tab.id === 'metadata' && data.metadata && ` (${data.metadata.length})`}
              {tab.id === 'ocr' && data.ocr && ` (${data.ocr.length})`}
              {tab.id === 'entities' && data.entities && ` (${data.entities.length})`}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
