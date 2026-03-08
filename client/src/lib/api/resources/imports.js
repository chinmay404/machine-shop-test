import { centralApiClient } from '../httpClient';

export const importAPI = {
  importToolMaster: (data) => centralApiClient.post('/import/tool-master', data),
  getHistory: () => centralApiClient.get('/import/tool-master'),
};
