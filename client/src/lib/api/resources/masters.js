import { centralApiClient } from '../httpClient';

export const masterAPI = {
  list: (params) => centralApiClient.get('/masters', { params }),
  get: (id) => centralApiClient.get(`/masters/${id}`),
  create: (data) => centralApiClient.post('/masters', data),
  update: (id, data) => centralApiClient.put(`/masters/${id}`, data),
};
