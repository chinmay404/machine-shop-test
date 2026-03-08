import { getSessionFromRequest } from '../../../src/server/auth/session';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const user = getSessionFromRequest(req);

  if (!user) {
    return res.status(401).json({ detail: 'Unauthenticated' });
  }

  return res.status(200).json(user);
}
