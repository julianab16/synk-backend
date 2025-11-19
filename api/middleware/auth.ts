import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: { uid: string; email?: string };
}

/**
 * Verify Firebase ID token sent in Authorization: Bearer <idToken>
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Normalize and validate Authorization header
    let header = String(req.headers.authorization || '').trim();
    if (!header) return res.status(401).json({ message: 'Missing Authorization header' });

    // header should start with 'Bearer '
    const bearerPrefix = 'Bearer ';
    if (!header.startsWith(bearerPrefix)) {
      // sometimes clients send the token alone; try to use it directly
      // but prefer a strict response to avoid accidental misuse
      return res.status(401).json({ message: 'Missing Bearer token in Authorization header' });
    }

    let idToken = header.slice(bearerPrefix.length).trim();
    // strip surrounding single/double quotes if present (shells or tools may add them)
    if ((idToken.startsWith('"') && idToken.endsWith('"')) || (idToken.startsWith("'") && idToken.endsWith("'"))) {
      idToken = idToken.slice(1, -1);
    }

    // basic structural validation: JWTs have three parts separated by dots
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.error('[authMiddleware] malformed token header length=', header.length, 'token length=', idToken.length);
      return res.status(400).json({ message: 'Malformed ID token. Ensure you pass the full JWT in Authorization: Bearer <token>' });
    }

    const decoded = await auth.verifyIdToken(idToken);
    // attach minimal user info to the request for downstream handlers
    req.user = { uid: decoded.uid, email: decoded.email };
    // debug: log decoded uid for troubleshooting token/profile mismatches
    console.log('[authMiddleware] decoded uid=', decoded.uid, 'email=', decoded.email);
    next();
  } catch (err) {
    console.error('authMiddleware error', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
