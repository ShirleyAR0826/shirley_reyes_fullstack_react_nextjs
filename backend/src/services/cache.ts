import { createClient, RedisClientType } from 'redis'

export class CacheService {
  private client: RedisClientType | null = null
  private isConnected = false

  constructor() {
    this.init()
  }

  private async init() {
    try {
      // Redis connection configuration
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000
        }
      })

      this.client.on('error', (err) => {
        console.warn('Redis Client Error:', err.message)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('Redis client connected')
        this.isConnected = true
      })

      this.client.on('ready', () => {
        console.log('Redis client ready')
        this.isConnected = true
      })

      this.client.on('end', () => {
        console.log('Redis client disconnected')
        this.isConnected = false
      })

      // Try to connect
      await this.client.connect()
    } catch (error) {
      console.warn('Redis initialization failed, running without cache:', error)
      this.client = null
      this.isConnected = false
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.warn('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return // Gracefully fail if Redis is not available
    }

    try {
      const serializedValue = JSON.stringify(value)
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue)
      } else {
        await this.client.set(key, serializedValue)
      }
    } catch (error) {
      console.warn('Cache set error:', error)
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      await this.client.del(key)
    } catch (error) {
      console.warn('Cache delete error:', error)
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(keys)
      }
    } catch (error) {
      console.warn('Cache pattern delete error:', error)
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.warn('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return -1
    }

    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.warn('Cache TTL error:', error)
      return -1
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.incr(key)
    } catch (error) {
      console.warn('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Set expiration for existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      await this.client.expire(key, ttlSeconds)
    } catch (error) {
      console.warn('Cache expire error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    info?: any
  }> {
    if (!this.client || !this.isConnected) {
      return { connected: false }
    }

    try {
      const info = await this.client.info()
      return {
        connected: true,
        info: this.parseRedisInfo(info)
      }
    } catch (error) {
      console.warn('Cache stats error:', error)
      return { connected: false }
    }
  }

  /**
   * Parse Redis info string into object
   */
  private parseRedisInfo(infoString: string): Record<string, any> {
    const info: Record<string, any> = {}
    const lines = infoString.split('\r\n')
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          info[key] = isNaN(Number(value)) ? value : Number(value)
        }
      }
    }
    
    return info
  }

  /**
   * Flush all cache data (use with caution)
   */
  async flush(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      await this.client.flushAll()
    } catch (error) {
      console.warn('Cache flush error:', error)
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
        this.isConnected = false
      } catch (error) {
        console.warn('Cache close error:', error)
      }
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.client !== null && this.isConnected
  }
}