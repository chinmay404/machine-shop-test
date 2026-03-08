import { centralApiClient } from '../httpClient';

export const bomAPI = {
  list: (params) => centralApiClient.get('/tool-bom', { params }),
  get: (id) => centralApiClient.get(`/tool-bom/${id}`),
  create: (data) => centralApiClient.post('/tool-bom', data),
  update: (id, data) => centralApiClient.put(`/tool-bom/${id}`, data),
  delete: (id) => centralApiClient.delete(`/tool-bom/${id}`),
  saveDetail: (id, data) => centralApiClient.post(`/tool-bom/${id}/save_detail`, data),
  lock: (id) => centralApiClient.post(`/tool-bom/${id}/lock`),
};
