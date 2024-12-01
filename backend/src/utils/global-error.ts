import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      errors: err.errors,
    });
    return;
  }

  console.error('Unhandled error:', err);

  // Default error response
  res.status(500).json({
    errors: ['Internal Server Error'],
  });
}
