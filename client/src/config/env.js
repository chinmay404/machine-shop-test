const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8001/api/v1/machine-shop';
const DEFAULT_API_TIMEOUT_MS = 15000;

export const appEnv = {
  appName: 'machine-shop-next-web',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || DEFAULT_API_TIMEOUT_MS),
};
