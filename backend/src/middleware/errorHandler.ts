import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
  status?: number
  code?: string
  details?: any
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // Default error response
  let status = err.status || 500
  let code = err.code || 'INTERNAL_ERROR'
  let message = err.message || 'Internal server error'
  let details = err.details || undefined

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400
    code = 'VALIDATION_ERROR'
  } else if (err.name === 'UnauthorizedError') {
    status = 401
    code = 'UNAUTHORIZED'
  } else if (err.name === 'ForbiddenError') {
    status = 403
    code = 'FORBIDDEN'
  } else if (err.name === 'NotFoundError') {
    status = 404
    code = 'NOT_FOUND'
  } else if (err.name === 'RateLimitError') {
    status = 429
    code = 'RATE_LIMIT_EXCEEDED'
  } else if (err.name === 'TimeoutError') {
    status = 408
    code = 'REQUEST_TIMEOUT'
  }

  // Handle Ethereum/Web3 errors
  if (err.message.includes('invalid address')) {
    status = 400
    code = 'INVALID_ADDRESS'
    message = 'Invalid Ethereum address provided'
  } else if (err.message.includes('network error') || err.message.includes('connection')) {
    status = 503
    code = 'NETWORK_ERROR'
    message = 'Blockchain network unavailable'
  } else if (err.message.includes('gas price') || err.message.includes('gas limit')) {
    status = 400
    code = 'GAS_ERROR'
    message = 'Gas price or limit error'
  }

  // Handle Joi validation errors
  if (err.name === 'ValidationError' && err.details) {
    details = {
      fields: err.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    }
  }

  // Handle Axios/HTTP errors
  if (err.name === 'AxiosError') {
    status = 502
    code = 'EXTERNAL_API_ERROR'
    message = 'External service unavailable'
    details = {
      service: 'External API',
      originalError: err.message
    }
  }

  // Handle Database errors
  if (err.message.includes('database') || err.message.includes('connection')) {
    status = 503
    code = 'DATABASE_ERROR'
    message = 'Database service unavailable'
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production') {
    if (status >= 500) {
      message = 'Internal server error'
      details = undefined
    }
  }

  // Send error response
  const errorResponse: any = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  }

  if (details) {
    errorResponse.details = details
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id']
  }

  res.status(status).json(errorResponse)
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/eth/gas-price',
      'GET /api/eth/block-number',
      'GET /api/eth/network-info',
      'GET /api/eth/balance/:address',
      'GET /api/account/:address',
      'GET /api/account/:address/transactions',
      'GET /api/account/:address/balance-history',
      'POST /api/account/:address/watch'
    ]
  })
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Create custom error classes
 */
export class ValidationError extends Error {
  status = 400
  code = 'VALIDATION_ERROR'
  details?: any
  
  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class NotFoundError extends Error {
  status = 404
  code = 'NOT_FOUND'
  
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends Error {
  status = 429
  code = 'RATE_LIMIT_EXCEEDED'
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class NetworkError extends Error {
  status = 503
  code = 'NETWORK_ERROR'
  
  constructor(message: string = 'Network unavailable') {
    super(message)
    this.name = 'NetworkError'
  }
}