import { clearSessionCookie } from '../../../src/server/auth/session';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ success: true });
}
