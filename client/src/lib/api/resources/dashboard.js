import { centralApiClient } from '../httpClient';

export const dashboardAPI = {
  getAll: () => centralApiClient.get('/dashboard'),
};
