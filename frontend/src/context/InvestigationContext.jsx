import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getEvidence, getIntelligenceStatus, getIntelligenceMetadata, 
  getIntelligenceOCR, getIntelligenceEntities, getIntelligenceInsights,
  getIntelligenceTimeline, getIntelligenceReportPreview, getAuditLogs
} from '../services/api';

const InvestigationContext = createContext();

export const useInvestigation = () => useContext(InvestigationContext);

export const InvestigationProvider = ({ children }) => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  
  const [intelligence, setIntelligence] = useState({
    status: null,
    metadata: null,
    ocr: null,
    entities: null,
    insights: null,
    timeline: null,
    reportPreview: null,
    chainOfCustody: null,
    loading: false,
  });

  // Fetch the global evidence list
  const fetchEvidence = async () => {
    try {
      const res = await getEvidence();
      setEvidenceList(res.data);
    } catch (e) {
      console.error('Failed to fetch evidence', e);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  // Fetch intelligence data whenever the selected evidence changes
  useEffect(() => {
    if (!selectedEvidenceId) {
      setIntelligence({ 
        status: null, metadata: null, ocr: null, entities: null, 
        insights: null, timeline: null, reportPreview: null, chainOfCustody: null, 
        loading: false 
      });
      return;
    }

    let cancelled = false;
    const loadIntelligence = async () => {
      setIntelligence(prev => ({ ...prev, loading: true }));
      try {
        const fetchGracefully = async (fn, id) => {
          try { const res = await fn(id); return res.data; }
          catch (e) { return null; }
        };

        const [s, m, o, e, ins, tl, rp, coc] = await Promise.all([
          fetchGracefully(getIntelligenceStatus, selectedEvidenceId),
          fetchGracefully(getIntelligenceMetadata, selectedEvidenceId),
          fetchGracefully(getIntelligenceOCR, selectedEvidenceId),
          fetchGracefully(getIntelligenceEntities, selectedEvidenceId),
          fetchGracefully(getIntelligenceInsights, selectedEvidenceId),
          fetchGracefully(getIntelligenceTimeline, selectedEvidenceId),
          fetchGracefully(getIntelligenceReportPreview, selectedEvidenceId),
          fetchGracefully(getAuditLogs, selectedEvidenceId),
        ]);

        if (!cancelled) {
          setIntelligence({ 
            status: s, metadata: m, ocr: o, entities: e, 
            insights: ins, timeline: tl, reportPreview: rp, chainOfCustody: coc,
            loading: false 
          });
        }
      } catch (err) {
        if (!cancelled) setIntelligence(prev => ({ ...prev, loading: false }));
      }
    };

    loadIntelligence();
    return () => { cancelled = true; };
  }, [selectedEvidenceId]);

  const selectedEvidenceItem = evidenceList.find(e => e.evidence_id === selectedEvidenceId) || null;

  const value = {
    evidenceList,
    refreshEvidence: fetchEvidence,
    selectedEvidenceId,
    setSelectedEvidenceId,
    selectedEvidenceItem,
    intelligence,
  };

  return (
    <InvestigationContext.Provider value={value}>
      {children}
    </InvestigationContext.Provider>
  );
};
