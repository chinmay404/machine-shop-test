import { authenticateDevUser } from '../../../src/server/auth/devUsers';
import { syncMachineShopUser } from '../../../src/server/auth/centralApi';
import { buildSessionCookie, createSessionToken } from '../../../src/server/auth/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const user = authenticateDevUser(username, password);

  if (!user) {
    return res.status(401).json({ detail: 'Invalid username or password' });
  }

  let syncedUser;
  try {
    syncedUser = await syncMachineShopUser(user);
  } catch (error) {
    console.error('Central API user sync failed:', error?.response?.data || error.message);
    return res.status(502).json({ detail: 'Central API user sync failed' });
  }

  const sessionToken = createSessionToken(syncedUser);
  res.setHeader('Set-Cookie', buildSessionCookie(sessionToken));

  return res.status(200).json(syncedUser);
}
