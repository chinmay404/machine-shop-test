import axios from 'axios';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8001/api/v1/machine-shop';
const DEFAULT_API_TIMEOUT_MS = 15000;

function getCentralApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function getCentralApiTimeoutMs() {
  return Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || DEFAULT_API_TIMEOUT_MS);
}

const centralAuthSyncClient = axios.create({
  baseURL: getCentralApiBaseUrl(),
  timeout: getCentralApiTimeoutMs(),
  headers: {
    'X-App-Client': 'machine-shop-next-web-auth',
  },
});

export async function syncMachineShopUser(user) {
  const payload = {
    auth_subject: user.auth_subject,
    email: user.email,
    display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    role: user.role || 'planner',
    status: user.status || 'ACTIVE',
    is_test_user: Boolean(user.is_test_user),
    preferences: user.preferences || {},
  };

  const response = await centralAuthSyncClient.post('/app-users/sync', payload);
  return {
    ...response.data,
    username: user.username,
    first_name: response.data.first_name || user.first_name || '',
    last_name: response.data.last_name || user.last_name || '',
  };
}
