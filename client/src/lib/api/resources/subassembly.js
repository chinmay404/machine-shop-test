import { centralApiClient } from '../httpClient';

export const subassemblyAPI = {
  getFieldConfig: (bomType) => centralApiClient.get('/subassembly/field-config', {
    params: bomType ? { bom_type: bomType } : {},
  }),
  calculateParams: (data) => centralApiClient.post('/subassembly/calculate-params', data),
  getCodes: () => centralApiClient.get('/subassembly/codes'),
};
