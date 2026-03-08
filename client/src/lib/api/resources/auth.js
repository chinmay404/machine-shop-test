import { nextAuthClient } from '../httpClient';

export const authAPI = {
  login: (data) => nextAuthClient.post('/login', data),
  getMe: () => nextAuthClient.get('/me'),
  logout: () => nextAuthClient.post('/logout'),
};
