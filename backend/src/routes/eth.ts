import express from 'express'
import { EthereumService } from '../services/ethereum'
import { CacheService } from '../services/cache'
import { validateAddress } from '../middleware/validation'

const router = express.Router()
const ethereumService = new EthereumService()
const cacheService = new CacheService()

/**
 * GET /api/eth/gas-price
 * Returns current Ethereum gas price
 */
router.get('/gas-price', async (req, res, next): Promise<void> => {
  try {
    // Check cache first
    const cacheKey = 'eth:gas-price'
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      res.json({
        gasPrice: cached,
        source: 'cache',
        timestamp: new Date().toISOString()
      })
      return
    }

    const gasPrice = await ethereumService.getGasPrice()
    
    // Cache for 30 seconds
    await cacheService.set(cacheKey, gasPrice, 30)
    
    res.json({
      gasPrice,
      source: 'network',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/eth/block-number
 * Returns current Ethereum block number
 */
router.get('/block-number', async (req, res, next): Promise<void> => {
  try {
    // Check cache first
    const cacheKey = 'eth:block-number'
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      res.json({
        blockNumber: cached,
        source: 'cache',
        timestamp: new Date().toISOString()
      })
      return
    }

    const blockNumber = await ethereumService.getBlockNumber()
    
    // Cache for 15 seconds
    await cacheService.set(cacheKey, blockNumber, 15)
    
    res.json({
      blockNumber,
      source: 'network',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/eth/network-info
 * Returns comprehensive network information
 */
router.get('/network-info', async (req, res, next): Promise<void> => {
  try {
    const cacheKey = 'eth:network-info'
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      res.json({
        ...cached,
        source: 'cache',
        timestamp: new Date().toISOString()
      })
      return
    }

    const [gasPrice, blockNumber, network] = await Promise.all([
      ethereumService.getGasPrice(),
      ethereumService.getBlockNumber(),
      ethereumService.getNetwork()
    ])

    const networkInfo = {
      gasPrice,
      blockNumber,
      network,
      chainId: network.chainId
    }
    
    // Cache for 30 seconds
    await cacheService.set(cacheKey, networkInfo, 30)
    
    res.json({
      ...networkInfo,
      source: 'network',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/eth/balance/:address
 * Returns ETH balance for given address
 */
router.get('/balance/:address', validateAddress, async (req, res, next): Promise<void> => {
  try {
    const { address } = req.params
    
    const cacheKey = `eth:balance:${address.toLowerCase()}`
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      res.json({
        address,
        balance: cached,
        source: 'cache',
        timestamp: new Date().toISOString()
      })
      return
    }


    const balance = await ethereumService.getBalance(address)
    
    // Cache balance for 60 seconds
    await cacheService.set(cacheKey, balance, 60)
    
    res.json({
      address,
      balance,
      source: 'network',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

export { router as ethRoutes }
