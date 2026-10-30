import { logger } from '../utils/logger.js';
import { z } from 'zod';
import multer from 'multer';
import { HttpError } from '../utils/ApiError.js';
export function errorHandler(error, req, res, _next) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    });
  }
  if (error instanceof multer.MulterError)
    return res.status(400).json({
      error: 'Image upload failed. Maximum file size is 4 MB.',
    });
  if (error.code === 'P2002' || /unique constraint|UNIQUE constraint/i.test(error.message)) {
    return res.status(409).json({
      error: 'That email, registration, or reference already exists.',
    });
  }
  if (error instanceof HttpError)
    return res.status(error.status).json({
      error: error.message,
    });
  logger.error('request_failed', {
    requestId: req.requestId,
    name: error.name,
    code: error.code,
    path: req.path,
  });
  return res.status(500).json({
    error: 'An unexpected error occurred. Please try again.',
  });
}
