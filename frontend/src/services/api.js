import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const uploadEvidence = async (file, sourceType) => {
  const formData = new FormData();
  formData.append("file", file);
  if (sourceType) {
    formData.append("source_type", sourceType);
  }
  return api.post('/evidence/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getEvidence = async () => {
  return api.get('/evidence/');
};

export const getAuditLogs = async (evidenceId = null) => {
  const params = evidenceId ? { evidence_id: evidenceId } : {};
  return api.get('/audit-logs', { params });
};

export const getIntelligenceStatus = async (evidenceId) => {
  return api.get(`/intelligence/${evidenceId}/status`);
};

export const getIntelligenceMetadata = async (evidenceId) => {
  return api.get(`/intelligence/${evidenceId}/metadata`);
};

export const getIntelligenceOCR = async (evidenceId) => {
  return api.get(`/intelligence/${evidenceId}/ocr`);
};

export const getIntelligenceEntities = async (evidenceId, entityType = null) => {
  const params = entityType ? { entity_type: entityType } : {};
  return api.get(`/intelligence/${evidenceId}/entities`, { params });
};

export const getIntelligenceInsights = async (evidenceId) => {
  return api.get(`/intelligence/${evidenceId}/insights`);
};

export const getIntelligenceTimeline = async (evidenceId) => {
  return api.get(`/intelligence/${evidenceId}/timeline`);
};

export const getIntelligenceReportPreview = async (evidenceId) => {
  return api.get(`/intelligence/${evidenceId}/report-preview`);
};

// ── Graph API ─────────────────────────────────────────────────────────────────

export const getGraphForEvidence = async (evidenceId) => {
  return api.get(`/graph/evidence/${evidenceId}`);
};

export const getGraphSummary = async () => {
  return api.get('/graph/summary');
};

export const getEntitySubgraph = async (entityId) => {
  return api.get(`/graph/${entityId}`);
};

export const searchGraph = async (q, limit = 50) => {
  return api.get('/graph/search', { params: { q, limit } });
};

// ── Enrichment API ────────────────────────────────────────────────────────────

export const getEnrichmentProviders = async () => {
  return api.get('/enrichment/providers');
};

export const getEntityEnrichment = async (entityId) => {
  return api.get(`/enrichment/entity/${entityId}`);
};

export const getEntityEnrichmentStatus = async (entityId) => {
  return api.get(`/enrichment/entity/${entityId}/status`);
};

export const refreshEntityEnrichment = async (entityId) => {
  return api.post(`/enrichment/entity/${entityId}/refresh`);
};

export const refreshEvidenceEnrichment = async (evidenceId) => {
  return api.post(`/enrichment/evidence/${evidenceId}/refresh`);
};

// ── Assistant API ─────────────────────────────────────────────────────────────

export const askAssistant = async (payload) => {
  return api.post('/assistant/chat', payload);
};

export default api;
