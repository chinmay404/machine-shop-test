import axios from 'axios';
import { appEnv } from '../../config/env';

export const centralApiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: appEnv.apiTimeoutMs,
  headers: {
    'X-App-Client': appEnv.appName,
  },
});

export const nextAuthClient = axios.create({
  baseURL: '/api/auth',
  timeout: appEnv.apiTimeoutMs,
  withCredentials: true,
});

centralApiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

nextAuthClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default centralApiClient;
