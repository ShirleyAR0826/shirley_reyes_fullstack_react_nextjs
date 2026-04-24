import { Pool, PoolClient } from 'pg'

interface BalanceRecord {
  address: string
  balance_wei: string
  balance_ether: string
  balance_usd?: string
  timestamp: Date
}

interface WatchAddress {
  address: string
  webhook_url?: string
  alert_threshold?: number
  created_at: Date
  is_active: boolean
}

export class DatabaseService {
  private pool: Pool | null = null
  private isConnected = false
  private isInitializing = false

  constructor() {
    // Don't initialize immediately - use lazy loading instead
  }

  private async ensureInitialized() {
    if (this.pool || this.isInitializing) {
      return
    }
    
    this.isInitializing = true
    await this.init()
    this.isInitializing = false
  }

  private async init() {
    try {
      // Database connection configuration
      console.log('Initializing database connection...', process.env.DB_PASSWORD ? 'Using provided password' : 'No password provided, using default')
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'blockchain_app',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }

      this.pool = new Pool(dbConfig)

      this.pool.on('error', (err) => {
        console.error('Unexpected database error:', err)
        this.isConnected = false
      })

      this.pool.on('connect', () => {
        console.log('Database connected')
        this.isConnected = true
      })

      // Test the connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()

      this.isConnected = true
      console.log('Database connection established')

      // Initialize tables
      await this.initializeTables()
    } catch (error) {
      console.warn('Database initialization failed, running without database features:', error)
      this.pool = null
      this.isConnected = false
    }
  }

  /**
   * Initialize database tables
   */
  private async initializeTables() {
    if (!this.pool || !this.isConnected) {
      return
    }

    const client = await this.pool.connect()

    try {
      // Create balance_history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS balance_history (
          id SERIAL PRIMARY KEY,
          address VARCHAR(42) NOT NULL,
          balance_wei VARCHAR(78) NOT NULL,
          balance_ether DECIMAL(36,18) NOT NULL,
          balance_usd DECIMAL(15,2),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          block_number INTEGER
        )
      `)

      // Create index on address and timestamp
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_balance_history_address_timestamp 
        ON balance_history(address, timestamp DESC)
      `)

      // Create watch_addresses table
      await client.query(`
        CREATE TABLE IF NOT EXISTS watch_addresses (
          id SERIAL PRIMARY KEY,
          address VARCHAR(42) UNIQUE NOT NULL,
          webhook_url TEXT,
          alert_threshold DECIMAL(36,18) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create alerts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          address VARCHAR(42) NOT NULL,
          alert_type VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          balance_wei VARCHAR(78),
          balance_ether DECIMAL(36,18),
          threshold_crossed BOOLEAN DEFAULT false,
          webhook_sent BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      console.log('Database tables initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database tables:', error)
    } finally {
      client.release()
    }
  }

  /**
   * Store account balance
   */
  async storeAccountBalance(
    address: string,
    balance: {
      wei: string
      ether: string
      usd?: string
    },
    blockNumber?: number
  ): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return
    }

    try {
      const query = `
        INSERT INTO balance_history (address, balance_wei, balance_ether, balance_usd, block_number)
        VALUES ($1, $2, $3, $4, $5)
      `
      
      const values = [
        address.toLowerCase(),
        balance.wei,
        parseFloat(balance.ether),
        balance.usd ? parseFloat(balance.usd) : null,
        blockNumber || null
      ]

      await this.pool.query(query, values)
    } catch (error) {
      console.error('Error storing account balance:', error)
    }
  }

  /**
   * Get balance history for address
   */
  async getBalanceHistory(address: string, days: number = 7): Promise<BalanceRecord[]> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return []
    }

    try {
      const query = `
        SELECT 
          address,
          balance_wei,
          balance_ether,
          balance_usd,
          timestamp
        FROM balance_history
        WHERE address = $1 
          AND timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY timestamp DESC
        LIMIT 1000
      `

      const result = await this.pool.query(query, [address.toLowerCase()])
      return result.rows
    } catch (error) {
      console.error('Error fetching balance history:', error)
      return []
    }
  }

  /**
   * Add address to watch list
   */
  async addWatchAddress(
    address: string,
    options: {
      webhookUrl?: string
      alertThreshold?: number
    }
  ): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return
    }

    try {
      const query = `
        INSERT INTO watch_addresses (address, webhook_url, alert_threshold)
        VALUES ($1, $2, $3)
        ON CONFLICT (address) 
        DO UPDATE SET
          webhook_url = $2,
          alert_threshold = $3,
          updated_at = CURRENT_TIMESTAMP,
          is_active = true
      `

      const values = [
        address.toLowerCase(),
        options.webhookUrl || null,
        options.alertThreshold || 0
      ]

      await this.pool.query(query, values)
    } catch (error) {
      console.error('Error adding watch address:', error)
      throw error
    }
  }

  /**
   * Get all active watch addresses
   */
  async getWatchAddresses(): Promise<WatchAddress[]> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return []
    }

    try {
      const query = `
        SELECT 
          address,
          webhook_url,
          alert_threshold,
          created_at,
          is_active
        FROM watch_addresses
        WHERE is_active = true
        ORDER BY created_at DESC
      `

      const result = await this.pool.query(query)
      return result.rows
    } catch (error) {
      console.error('Error fetching watch addresses:', error)
      return []
    }
  }

  /**
   * Remove address from watch list
   */
  async removeWatchAddress(address: string): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return
    }

    try {
      const query = `
        UPDATE watch_addresses 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE address = $1
      `

      await this.pool.query(query, [address.toLowerCase()])
    } catch (error) {
      console.error('Error removing watch address:', error)
      throw error
    }
  }

  /**
   * Store alert
   */
  async storeAlert(
    address: string,
    alertType: string,
    message: string,
    balance?: {
      wei: string
      ether: string
    },
    thresholdCrossed: boolean = false
  ): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return
    }

    try {
      const query = `
        INSERT INTO alerts (
          address, 
          alert_type, 
          message, 
          balance_wei, 
          balance_ether, 
          threshold_crossed
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `

      const values = [
        address.toLowerCase(),
        alertType,
        message,
        balance?.wei || null,
        balance ? parseFloat(balance.ether) : null,
        thresholdCrossed
      ]

      await this.pool.query(query, values)
    } catch (error) {
      console.error('Error storing alert:', error)
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    connected: boolean
    balanceRecords?: number
    watchAddresses?: number
    alerts?: number
  }> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return { connected: false }
    }

    try {
      const [balanceCount, watchCount, alertCount] = await Promise.all([
        this.pool.query('SELECT COUNT(*) FROM balance_history'),
        this.pool.query('SELECT COUNT(*) FROM watch_addresses WHERE is_active = true'),
        this.pool.query('SELECT COUNT(*) FROM alerts')
      ])

      return {
        connected: true,
        balanceRecords: parseInt(balanceCount.rows[0].count),
        watchAddresses: parseInt(watchCount.rows[0].count),
        alerts: parseInt(alertCount.rows[0].count)
      }
    } catch (error) {
      console.error('Error fetching database stats:', error)
      return { connected: false }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    await this.ensureInitialized()
    
    if (!this.pool || !this.isConnected) {
      return false
    }

    try {
      await this.pool.query('SELECT 1')
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end()
        this.isConnected = false
        console.log('Database connection closed')
      } catch (error) {
        console.error('Error closing database connection:', error)
      }
    }
  }

  /**
   * Check if database is available
   */
  isAvailable(): boolean {
    return this.pool !== null && this.isConnected
  }
}