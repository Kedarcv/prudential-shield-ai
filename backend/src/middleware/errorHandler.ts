import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string | number;
  errors?: any;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  public errors: any;

  constructor(message: string, errors: any = null) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

const handleCastErrorDB = (err: any): CustomError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err: any): CustomError => {
  const duplicateField = Object.keys(err.keyValue)[0];
  const message = `Duplicate field value: ${duplicateField}. Please use another value.`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err: MongooseError.ValidationError): CustomError => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message, errors);
};

const handleJWTError = (): CustomError => {
  return new AuthenticationError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = (): CustomError => {
  return new AuthenticationError('Your token has expired. Please log in again.');
};

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    status: 'error',
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString(),
      ...(err instanceof ValidationError && { errors: err.errors })
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error
    console.error('ERROR 💥:', err);

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  }
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err as MongooseError.ValidationError);
  if (err instanceof JsonWebTokenError) error = handleJWTError();
  if (err instanceof TokenExpiredError) error = handleJWTExpiredError();

  // Log error for monitoring
  logError(error, req);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

const logError = (err: AppError, req: Request): void => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: (req as any).user?.id || 'anonymous',
    stack: err.stack,
    isOperational: err.isOperational
  };

  console.error('Error Log:', JSON.stringify(errorLog, null, 2));

  // In production, you would send this to a logging service
  // like Winston, ELK Stack, or cloud logging services
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Global unhandled rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  
  process.exit(1);
});

// Global uncaught exception handler
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  
  process.exit(1);
});