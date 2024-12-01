import { Request, Response } from 'express';

export class HealthController {
  async getHealthStatus(_req: Request, res: Response): Promise<void> {
    res.send({ date: new Date().toISOString() });
  }
}
