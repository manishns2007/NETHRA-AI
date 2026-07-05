import React, { useState } from 'react';
import EvidenceUploader from './components/EvidenceVault/EvidenceUploader';
import EvidenceTable from './components/EvidenceVault/EvidenceTable';
import Assistant from './components/Assistant/Assistant';
import { getEvidence } from './services/api';

function App() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [activeTab, setActiveTab] = useState('vault');

  const fetchEvidence = async () => {
    try {
      const res = await getEvidence();
      setEvidenceList(res.data);
    } catch (error) {
      console.error("Failed to fetch evidence", error);
    }
  };

  React.useEffect(() => {
    fetchEvidence();
  }, []);

  const handleUploadSuccess = () => {
    fetchEvidence();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
              NETHRA AI
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Digital Evidence Vault & Investigation</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'vault' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Evidence Vault
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'assistant' 
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/50' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              AI Assistant
            </button>
          </div>
        </header>

        <main>
          {activeTab === 'vault' ? (
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-semibold text-slate-200 mb-6">Ingest Evidence</h2>
                <EvidenceUploader onUploadSuccess={handleUploadSuccess} />
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-200 mb-6">Secured Evidence</h2>
                <EvidenceTable evidenceList={evidenceList} />
              </section>
            </div>
          ) : (
            <section>
              <Assistant />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
