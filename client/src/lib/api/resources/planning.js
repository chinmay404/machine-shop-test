import { centralApiClient } from '../httpClient';

export const planningAPI = {
  list: (params) => centralApiClient.get('/planning', { params }),
  calculate: (data) => centralApiClient.post('/planning/calculate', data),
  getSummary: () => centralApiClient.get('/planning/summary'),
};
