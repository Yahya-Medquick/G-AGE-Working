import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

export function createAdminSessionVerifier(secret: string): (token: string) => boolean {
  return (token) => {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      return decoded.scope === 'admin';
    } catch {
      return false;
    }
  };
}

export function createAdminAuthMiddleware(isValidAdminSession: (token: string) => boolean): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/verify') return next();

    const header = req.headers['x-admin-token'] ?? req.headers.authorization;
    if (typeof header !== 'string') {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing administrative authorization token.' });
    }
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
    if (!token || !isValidAdminSession(token)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing administrative authorization token.' });
    }
    return next();
  };
}
