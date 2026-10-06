import express from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { createAdminAuthMiddleware, createAdminSessionVerifier } from '../src/utils/adminSession';

describe('admin session protection', () => {
  it('rejects missing and non-admin credentials on a protected admin route', async () => {
    const secret = 'test-only-admin-secret';
    const verify = createAdminSessionVerifier(secret);
    const app = express();
    app.use('/api/admin', createAdminAuthMiddleware(verify));
    app.get('/api/admin/catalog', (_request, response) => response.json({ success: true }));
    app.post('/api/admin/verify', (_request, response) => response.json({ success: true }));

    const server = app.listen(0, '127.0.0.1');
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.');
      const baseUrl = `http://127.0.0.1:${address.port}`;
      const regularUserToken = jwt.sign({ scope: 'user' }, secret, { algorithm: 'HS256' });
      const adminToken = jwt.sign({ scope: 'admin' }, secret, { algorithm: 'HS256' });

      expect((await fetch(`${baseUrl}/api/admin/catalog`)).status).toBe(401);
      expect((await fetch(`${baseUrl}/api/admin/catalog`, {
        headers: { 'X-Admin-Token': regularUserToken },
      })).status).toBe(401);
      expect((await fetch(`${baseUrl}/api/admin/catalog`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })).status).toBe(200);
      expect((await fetch(`${baseUrl}/api/admin/verify`, { method: 'POST' })).status).toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  });
});
