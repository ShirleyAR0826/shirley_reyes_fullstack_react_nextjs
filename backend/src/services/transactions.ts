import axios from 'axios'

interface EtherscanTransaction {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  isError: string
  gasUsed: string
  gasPrice: string
  blockNumber: string
  confirmations: string
}

interface FormattedTransaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: string
  status: string
  gasUsed: string
  gasPrice: string
  blockNumber: string
  confirmations: string
}

export class TransactionService {
  private etherscanApiKey: string | undefined
  private baseUrl = 'https://api.etherscan.io/api'

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<FormattedTransaction[]> {
    if (!this.etherscanApiKey) {
      console.warn('Etherscan API key not provided, returning mock data')
      return this.getMockTransactions(address, limit)
    }

    try {
      // Get both normal and internal transactions
      const [normalTxs, internalTxs] = await Promise.all([
        this.getNormalTransactions(address, limit, offset),
        this.getInternalTransactions(address, limit, offset)
      ])

      // Combine and sort by timestamp
      const allTransactions = [...normalTxs, ...internalTxs]
      allTransactions.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))

      // Return only the requested number of transactions
      return allTransactions.slice(0, limit)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      
      // Return mock data as fallback
      console.warn('Falling back to mock transaction data')
      return this.getMockTransactions(address, limit)
    }
  }

  /**
   * Get normal transactions from Etherscan
   */
  private async getNormalTransactions(
    address: string, 
    limit: number, 
    offset: number
  ): Promise<FormattedTransaction[]> {
    const params = {
      module: 'account',
      action: 'txlist',
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: Math.floor(offset / limit) + 1,
      offset: limit,
      sort: 'desc',
      apikey: this.etherscanApiKey
    }

    const response = await axios.get(this.baseUrl, {
      params,
      timeout: 10000
    })

    if (response.data.status !== '1') {
      throw new Error(`Etherscan API error: ${response.data.message}`)
    }

    return this.formatTransactions(response.data.result)
  }

  /**
   * Get internal transactions from Etherscan
   */
  private async getInternalTransactions(
    address: string, 
    limit: number, 
    offset: number
  ): Promise<FormattedTransaction[]> {
    const params = {
      module: 'account',
      action: 'txlistinternal',
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: Math.floor(offset / limit) + 1,
      offset: limit,
      sort: 'desc',
      apikey: this.etherscanApiKey
    }

    const response = await axios.get(this.baseUrl, {
      params,
      timeout: 10000
    })

    if (response.data.status !== '1') {
      // Internal transactions might not exist, which is normal
      if (response.data.message === 'No transactions found') {
        return []
      }
      throw new Error(`Etherscan API error: ${response.data.message}`)
    }

    return this.formatTransactions(response.data.result)
  }

  /**
   * Format raw Etherscan transactions
   */
  private formatTransactions(transactions: EtherscanTransaction[]): FormattedTransaction[] {
    return transactions.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: tx.value,
      timestamp: tx.timeStamp,
      status: tx.isError === '0' ? '1' : '0',
      gasUsed: tx.gasUsed || '0',
      gasPrice: tx.gasPrice || '0',
      blockNumber: tx.blockNumber || '0',
      confirmations: tx.confirmations || '0'
    }))
  }

  /**
   * Get mock transactions for demo purposes
   */
  private getMockTransactions(address: string, limit: number): FormattedTransaction[] {
    const mockTransactions: FormattedTransaction[] = []
    const now = Math.floor(Date.now() / 1000)

    for (let i = 0; i < Math.min(limit, 5); i++) {
      const isIncoming = Math.random() > 0.5
      const value = (Math.random() * 10 + 0.001).toFixed(18)
      const timestamp = (now - (i * 3600 * 24)).toString() // One day apart

      mockTransactions.push({
        hash: `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`,
        from: isIncoming 
          ? `0x${Math.random().toString(16).slice(2).padEnd(40, '0')}` 
          : address,
        to: isIncoming 
          ? address 
          : `0x${Math.random().toString(16).slice(2).padEnd(40, '0')}`,
        value: (parseFloat(value) * Math.pow(10, 18)).toString(),
        timestamp,
        status: '1',
        gasUsed: (21000 + Math.floor(Math.random() * 50000)).toString(),
        gasPrice: (20000000000 + Math.floor(Math.random() * 100000000000)).toString(),
        blockNumber: (18000000 + Math.floor(Math.random() * 1000000)).toString(),
        confirmations: (Math.floor(Math.random() * 1000) + 100).toString()
      })
    }

    return mockTransactions
  }

  /**
   * Get single transaction details
   */
  async getTransactionDetails(hash: string): Promise<any> {
    if (!this.etherscanApiKey) {
      throw new Error('Etherscan API key not configured')
    }

    try {
      const params = {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: hash,
        apikey: this.etherscanApiKey
      }

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000
      })

      return response.data.result
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      throw new Error('Failed to fetch transaction details')
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<any> {
    if (!this.etherscanApiKey) {
      throw new Error('Etherscan API key not configured')
    }

    try {
      const params = {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: hash,
        apikey: this.etherscanApiKey
      }

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000
      })

      return response.data.result
    } catch (error) {
      console.error('Error fetching transaction receipt:', error)
      throw new Error('Failed to fetch transaction receipt')
    }
  }

  /**
   * Health check for transaction service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.etherscanApiKey) {
        console.warn('Etherscan API key not configured')
        return false
      }

      // Test with a simple API call
      const params = {
        module: 'stats',
        action: 'ethsupply',
        apikey: this.etherscanApiKey
      }

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 5000
      })

      return response.data.status === '1'
    } catch (error) {
      console.error('Transaction service health check failed:', error)
      return false
    }
  }
}