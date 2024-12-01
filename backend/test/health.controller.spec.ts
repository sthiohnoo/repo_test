import express, { Application } from 'express';
import request from 'supertest';

import { HealthController } from '../src/controller/health.controller';

/**
 * This test is neither a unit test nor a full integration test.
 * It functions more as a functional or API/endpoint test, as it verifies the endpoint's response
 * without mocking dependencies or combining multiple components but also not using our real system.
 */
describe('HealthController', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    const healthController = new HealthController();
    app.get('/health', healthController.getHealthStatus);
  });

  describe('GET /health', () => {
    it('should return 200 with date', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('date');
      expect(new Date(response.body.date)).toBeInstanceOf(Date);
    });
  });
});
