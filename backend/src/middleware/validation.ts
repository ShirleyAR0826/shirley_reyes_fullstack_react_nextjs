import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ethers } from 'ethers'

/**
 * Validate Ethereum address
 */
export function validateAddress(req: Request, res: Response, next: NextFunction): void {
  const { address } = req.params

  if (!address) {
    res.status(400).json({
      error: 'Address parameter is required',
      code: 'MISSING_ADDRESS'
    })
    return
  }

  // Check if it's a valid Ethereum address
  if (!ethers.isAddress(address)) {
    res.status(400).json({
      error: 'Invalid Ethereum address format',
      address,
      code: 'INVALID_ADDRESS'
    })
    return
  }

  // Convert to checksum address
  req.params.address = ethers.getAddress(address)
  
  next()
}

/**
 * Validate query parameters against Joi schema
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      })
      return
    }

    // Replace query with validated values
    req.query = value
    next()
  }
}

/**
 * Validate request body against Joi schema
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      res.status(400).json({
        error: 'Invalid request body',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      })
      return
    }

    // Replace body with validated values
    req.body = value
    next()
  }
}

/**
 * Validate transaction hash
 */
export function validateTxHash(req: Request, res: Response, next: NextFunction): void {
  const { hash } = req.params

  if (!hash) {
    res.status(400).json({
      error: 'Transaction hash parameter is required',
      code: 'MISSING_TX_HASH'
    })
    return
  }

  // Check if it's a valid transaction hash (64 hex characters with 0x prefix)
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/
  if (!txHashRegex.test(hash)) {
    res.status(400).json({
      error: 'Invalid transaction hash format',
      hash,
      code: 'INVALID_TX_HASH',
      expected: '0x followed by 64 hexadecimal characters'
    })
    return
  }

  next()
}

/**
 * Validate block number
 */
export function validateBlockNumber(req: Request, res: Response, next: NextFunction): void {
  const { blockNumber } = req.params

  if (!blockNumber) {
    res.status(400).json({
      error: 'Block number parameter is required',
      code: 'MISSING_BLOCK_NUMBER'
    })
    return
  }

  // Check if it's a valid block number (positive integer or 'latest')
  if (blockNumber !== 'latest') {
    const blockNum = parseInt(blockNumber)
    if (isNaN(blockNum) || blockNum < 0) {
      res.status(400).json({
        error: 'Invalid block number format',
        blockNumber,
        code: 'INVALID_BLOCK_NUMBER',
        expected: 'Positive integer or "latest"'
      })
      return
    }
    
    // Add parsed block number to request
    req.params.blockNumber = blockNum.toString()
  }

  next()
}

/**
 * Common Joi schemas
 */
export const schemas = {
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
    page: Joi.number().integer().min(1).default(1)
  }),

  address: Joi.string().custom((value, helpers) => {
    if (!ethers.isAddress(value)) {
      return helpers.error('any.invalid')
    }
    return ethers.getAddress(value) // Return checksum address
  }).required(),

  txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),

  blockNumber: Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.string().valid('latest', 'pending', 'earliest')
  ),

  watchAddress: Joi.object({
    webhookUrl: Joi.string().uri().optional(),
    alertThreshold: Joi.number().min(0).optional()
  })
}

/**
 * Generic validation middleware factory
 */
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const target = req[property]
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      res.status(400).json({
        error: `Invalid ${property}`,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        code: 'VALIDATION_ERROR'
      })
      return
    }

    // Replace with validated values
    req[property] = value
    next()
  }
}