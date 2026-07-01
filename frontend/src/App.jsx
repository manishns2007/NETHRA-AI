import React, { useEffect, useState } from 'react';
import EvidenceUploader from './components/EvidenceVault/EvidenceUploader';
import EvidenceTable from './components/EvidenceVault/EvidenceTable';
import { getEvidence } from './services/api';

function App() {
  const [evidenceList, setEvidenceList] = useState([]);

  const fetchEvidence = async () => {
    try {
      const res = await getEvidence();
      setEvidenceList(res.data);
    } catch (error) {
      console.error("Failed to fetch evidence", error);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleUploadSuccess = () => {
    fetchEvidence();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
            NETHRA AI
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Digital Evidence Vault</p>
        </header>

        <main>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-200 mb-6">Ingest Evidence</h2>
            <EvidenceUploader onUploadSuccess={handleUploadSuccess} />
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-200 mb-6">Secured Evidence</h2>
            <EvidenceTable evidenceList={evidenceList} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
