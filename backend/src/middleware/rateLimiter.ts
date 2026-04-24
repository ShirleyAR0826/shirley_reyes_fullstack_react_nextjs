import { Request, Response, NextFunction } from 'express'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface ClientRequest {
  count: number
  resetTime: number
  blocked?: boolean
}

class InMemoryStore {
  private clients = new Map<string, ClientRequest>()
  
  get(key: string): ClientRequest | undefined {
    const client = this.clients.get(key)
    if (client && Date.now() > client.resetTime) {
      // Reset expired entry
      this.clients.delete(key)
      return undefined
    }
    return client
  }
  
  set(key: string, value: ClientRequest): void {
    this.clients.set(key, value)
  }
  
  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const resetTime = now + windowMs
    const existing = this.get(key)
    
    if (!existing) {
      const newEntry = { count: 1, resetTime }
      this.set(key, newEntry)
      return newEntry
    }
    
    existing.count++
    this.set(key, existing)
    return existing
  }
  
  cleanup(): void {
    const now = Date.now()
    for (const [key, client] of this.clients.entries()) {
      if (now > client.resetTime) {
        this.clients.delete(key)
      }
    }
  }
}

const store = new InMemoryStore()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  store.cleanup()
}, 5 * 60 * 1000)

/**
 * Create rate limiter middleware
 */
export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate unique key for client (IP + User-Agent hash)
    const clientKey = generateClientKey(req)
    
    // Get or create client entry
    const client = store.increment(clientKey, windowMs)
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - client.count).toString(),
      'X-RateLimit-Reset': new Date(client.resetTime).toISOString(),
      'X-RateLimit-Window': windowMs.toString()
    })
    
    // Check if limit exceeded
    if (client.count > maxRequests) {
      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((client.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // Track response to optionally skip counting
    const originalSend = res.send
    res.send = function(data) {
      const statusCode = res.statusCode
      
      // Decrement count if we should skip this request type
      if (
        (skipSuccessfulRequests && statusCode < 400) ||
        (skipFailedRequests && statusCode >= 400)
      ) {
        const currentClient = store.get(clientKey)
        if (currentClient && currentClient.count > 0) {
          currentClient.count--
          store.set(clientKey, currentClient)
        }
      }
      
      return originalSend.call(this, data)
    }
    
    next()
  }
}

/**
 * Generate unique client key
 */
function generateClientKey(req: Request): string {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const userAgent = req.get('User-Agent') || 'unknown'
  
  // Simple hash function for user agent
  let hash = 0
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return `${ip}:${hash}`
}

/**
 * Default rate limiter for general API endpoints
 */
export const rateLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again in 15 minutes.'
})

/**
 * Stricter rate limiter for expensive operations
 */
export const strictRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Rate limit exceeded for this operation. Please wait before retrying.'
})

/**
 * Rate limiter for transaction history (API-heavy operation)
 */
export const transactionRateLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute
  message: 'Transaction history requests are limited. Please wait before requesting again.'
})

/**
 * Rate limiter for balance checks
 */
export const balanceRateLimiter = createRateLimit({
  windowMs: 30 * 1000, // 30 seconds
  maxRequests: 20, // 20 requests per 30 seconds
  skipSuccessfulRequests: true // Don't count successful requests against limit
})

/**
 * Rate limiter for watch address operations
 */
export const watchRateLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 watch operations per hour
  message: 'Too many watch address operations. Please try again in an hour.'
})