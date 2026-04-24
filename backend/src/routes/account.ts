import express from 'express'
import { EthereumService } from '../services/ethereum'
import { TransactionService } from '../services/transactions'
import { DatabaseService } from '../services/database'
import { CacheService } from '../services/cache'
import { validateAddress, validateQuery } from '../middleware/validation'
import Joi from 'joi'

const router = express.Router()
const ethereumService = new EthereumService()
const transactionService = new TransactionService()
const databaseService = new DatabaseService()
const cacheService = new CacheService()

const transactionQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
})

/**
 * GET /api/account/:address
 * Returns comprehensive account information
 */
router.get('/:address', validateAddress, async (req, res, next): Promise<void> => {
  try {
    const { address } = req.params
    
    const cacheKey = `account:info:${address.toLowerCase()}`
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      res.json({
        ...cached,
        source: 'cache',
        timestamp: new Date().toISOString()
      })
      return
    }

    const [balance, gasPrice, blockNumber] = await Promise.all([
      ethereumService.getBalance(address),
      ethereumService.getGasPrice(),
      ethereumService.getBlockNumber()
    ])

    const accountInfo = {
      address,
      balance,
      gasPrice,
      blockNumber,
      network: await ethereumService.getNetwork()
    }
    
    // Cache for 60 seconds
    await cacheService.set(cacheKey, accountInfo, 60)
    
    // Store in database for analytics
    await databaseService.storeAccountBalance(address, balance)
    
    res.json({
      ...accountInfo,
      source: 'network',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/account/:address/transactions
 * Returns transaction history for address
 */
router.get('/:address/transactions', 
  validateAddress, 
  validateQuery(transactionQuerySchema),
  async (req, res, next): Promise<void> => {
    try {
      const { address } = req.params
      const { limit, offset } = req.query as unknown as { limit: number, offset: number }
      
      const cacheKey = `account:transactions:${address.toLowerCase()}:${limit}:${offset}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        res.json({
          ...cached,
          source: 'cache',
          timestamp: new Date().toISOString()
        })
        return
      }

      const transactions = await transactionService.getTransactionHistory(
        address, 
        limit, 
        offset
      )
      
      const result = {
        address,
        transactions,
        pagination: {
          limit,
          offset,
          total: transactions.length
        }
      }
      
      // Cache for 2 minutes
      await cacheService.set(cacheKey, result, 120)
      
      res.json({
        ...result,
        source: 'network',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/account/:address/balance-history
 * Returns balance history from database
 */
router.get('/:address/balance-history', validateAddress, async (req, res, next) => {
  try {
    const { address } = req.params
    const { days = 7 } = req.query
    
    const balanceHistory = await databaseService.getBalanceHistory(
      address,
      parseInt(days as string)
    )
    
    res.json({
      address,
      balanceHistory,
      days: parseInt(days as string),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/account/:address/watch
 * Add address to watch list for monitoring
 */
router.post('/:address/watch', validateAddress, async (req, res, next) => {
  try {
    const { address } = req.params
    const { webhookUrl, alertThreshold } = req.body
    
    await databaseService.addWatchAddress(address, {
      webhookUrl,
      alertThreshold: parseFloat(alertThreshold) || 0
    })
    
    res.json({
      address,
      status: 'added_to_watch_list',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

export { router as accountRoutes }