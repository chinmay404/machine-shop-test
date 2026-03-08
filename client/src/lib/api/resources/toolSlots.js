import { centralApiClient } from '../httpClient';

export const toolSlotAPI = {
  list: (params) => centralApiClient.get('/tool-slots', { params }),
  get: (id) => centralApiClient.get(`/tool-slots/${id}`),
  create: (data) => centralApiClient.post('/tool-slots', data),
  update: (id, data) => centralApiClient.patch(`/tool-slots/${id}`, data),
  delete: (id) => centralApiClient.delete(`/tool-slots/${id}`),
  getBOM: (id) => centralApiClient.get(`/tool-slots/${id}/bom`),
  uploadDrawing: (id, formData) => centralApiClient.post(`/tool-slots/${id}/upload_drawing`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getTrialHistory: (id) => centralApiClient.get(`/tool-slots/${id}/trial_history`),
  getShape: (id) => centralApiClient.get(`/tool-slots/${id}/shape`),
  updateShape: (id, data) => centralApiClient.put(`/tool-slots/${id}/shape`, data),
  getLife: (id) => centralApiClient.get(`/tool-slots/${id}/life`),
  updateLife: (id, data) => centralApiClient.put(`/tool-slots/${id}/life`, data),
  getOther: (id) => centralApiClient.get(`/tool-slots/${id}/other`),
  updateOther: (id, data) => centralApiClient.put(`/tool-slots/${id}/other`, data),
  nextToolNumber: (params) => centralApiClient.get('/tool-slots/next_tool_number', { params }),
};
