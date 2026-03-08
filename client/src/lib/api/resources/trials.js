import { centralApiClient } from '../httpClient';

export const trialAPI = {
  list: (params) => centralApiClient.get('/trials', { params }),
  get: (id) => centralApiClient.get(`/trials/${id}`),
  getActiveSummary: () => centralApiClient.get('/trials/active_summary'),
  create: (data) => centralApiClient.post('/trials', data),
  update: (id, data) => centralApiClient.put(`/trials/${id}`, data),
  submit: (id, data) => centralApiClient.post(`/trials/${id}/submit`, data),
  approve: (id, data) => centralApiClient.post(`/trials/${id}/approve`, data),
  reject: (id, data) => centralApiClient.post(`/trials/${id}/reject`, data),
  getSlotHistory: (slotId) => centralApiClient.get(`/trials/slot/${slotId}/history`),
  replaceSubassembly: (id, data) => centralApiClient.post(`/trials/${id}/replace_subassembly`, data),
  downloadPDF: (id) => centralApiClient.get(`/trials/${id}/download_pdf`, { responseType: 'blob' }),
};
