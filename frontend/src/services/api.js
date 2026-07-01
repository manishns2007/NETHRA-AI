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

export const getAuditLogs = async () => {
  return api.get('/audit-logs');
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

export default api;
