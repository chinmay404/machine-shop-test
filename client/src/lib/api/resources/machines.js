import { centralApiClient } from '../httpClient';

export const machineAPI = {
  list: (params) => centralApiClient.get('/machines', { params }),
  get: (id) => centralApiClient.get(`/machines/${id}`),
  getComponents: (id) => centralApiClient.get(`/machines/${id}/components`),
  create: (data) => centralApiClient.post('/machines', data),
  update: (id, data) => centralApiClient.put(`/machines/${id}`, data),
};

export const componentAPI = {
  list: (params) => centralApiClient.get('/components', { params }),
  get: (id) => centralApiClient.get(`/components/${id}`),
  create: (data) => centralApiClient.post('/components', data),
  update: (id, data) => centralApiClient.put(`/components/${id}`, data),
};
