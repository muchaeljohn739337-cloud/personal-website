/**
 * Basic Health Check Tests
 * Simple test to verify test infrastructure is working
 */

import request from 'supertest';
import { getApp } from '../setup';

describe('Health Check (E2E)', () => {
  const app = getApp();

  describe('GET /', () => {
    it('should return backend running message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Backend running');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'advancia-backend');
    });
  });
});
