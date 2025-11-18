import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError';

/**
 * Middleware to validate request using express-validator
 * Should be used after validation chain
 */
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    throw new AppError(
      'Validation failed',
      400,
      errorMessages
    );
  }

  next();
};
