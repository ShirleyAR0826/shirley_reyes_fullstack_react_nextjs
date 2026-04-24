import { ethers } from 'ethers'
import axios from 'axios'

export class EthereumService {
  private provider: ethers.JsonRpcProvider
  private etherscanApiKey: string | undefined
  private alchemyApiKey: string | undefined

  constructor() {
    // Primary provider (public RPC)
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // API keys for enhanced functionality
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY
    
    // Setup fallback providers if API keys are available
    this.setupFallbackProviders()
  }

  private setupFallbackProviders() {
    if (this.alchemyApiKey) {
      // Add Alchemy as fallback
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`
      // Could implement fallback logic here
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<{
    standard: string
    fast: string
    rapid: string
    timestamp: string
  }> {
    try {
      // Try Etherscan Gas Oracle first for detailed gas prices
      if (this.etherscanApiKey) {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${this.etherscanApiKey}`
        )
        
        if (response.data.status === '1') {
          const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = response.data.result
          return {
            standard: ethers.parseUnits(SafeGasPrice, 'gwei').toString(),
            fast: ethers.parseUnits(ProposeGasPrice, 'gwei').toString(),
            rapid: ethers.parseUnits(FastGasPrice, 'gwei').toString(),
            timestamp: new Date().toISOString()
          }
        }
      }
      
      // Fallback to provider gas price
      const feeData = await this.provider.getFeeData()
      let baseGasPrice = feeData.gasPrice
      
      // If gasPrice is null or 0, try to get it from latest block
      if (!baseGasPrice || baseGasPrice === BigInt(0)) {
        try {
          const latestBlock = await this.provider.getBlock('latest')
          if (latestBlock && latestBlock.baseFeePerGas) {
            // Use base fee + 2 Gwei as estimate
            baseGasPrice = latestBlock.baseFeePerGas + ethers.parseUnits('2', 'gwei')
          } else {
            // Fallback to reasonable default (20 Gwei)
            baseGasPrice = ethers.parseUnits('20', 'gwei')
          }
        } catch {
          // Ultimate fallback
          baseGasPrice = ethers.parseUnits('20', 'gwei')
        }
      }
      
      return {
        standard: baseGasPrice.toString(),
        fast: (baseGasPrice * BigInt(120) / BigInt(100)).toString(),
        rapid: (baseGasPrice * BigInt(150) / BigInt(100)).toString(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching gas price:', error)
      throw new Error('Failed to fetch gas price')
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber()
    } catch (error) {
      console.error('Error fetching block number:', error)
      throw new Error('Failed to fetch block number')
    }
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<{
    name: string
    chainId: number
    ensAddress?: string
  }> {
    try {
      const network = await this.provider.getNetwork()
      return {
        name: network.name,
        chainId: Number(network.chainId),
        ensAddress: (network as any).ensAddress || undefined
      }
    } catch (error) {
      console.error('Error fetching network:', error)
      throw new Error('Failed to fetch network information')
    }
  }

  /**
   * Get ETH balance for address
   */
  async getBalance(address: string): Promise<{
    wei: string
    ether: string
    usd?: string
  }> {
    try {
      const balance = await this.provider.getBalance(address)
      const etherBalance = ethers.formatEther(balance)
      
      // Optionally fetch USD price
      let usdValue: string | undefined
      try {
        const priceResponse = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
          { timeout: 3000 }
        )
        const ethPrice = priceResponse.data.ethereum.usd
        usdValue = (parseFloat(etherBalance) * ethPrice).toFixed(2)
      } catch (priceError) {
        console.warn('Could not fetch ETH price:', priceError)
      }
      
      return {
        wei: balance.toString(),
        ether: etherBalance,
        usd: usdValue
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw new Error('Failed to fetch balance')
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(hash: string): Promise<any> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(hash),
        this.provider.getTransactionReceipt(hash)
      ])
      
      return {
        transaction: tx,
        receipt: receipt
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      throw new Error('Failed to fetch transaction')
    }
  }

  /**
   * Get block details
   */
  async getBlock(blockNumber: number): Promise<any> {
    try {
      return await this.provider.getBlock(blockNumber)
    } catch (error) {
      console.error('Error fetching block:', error)
      throw new Error('Failed to fetch block')
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber()
      return true
    } catch (error) {
      console.error('Ethereum service health check failed:', error)
      return false
    }
  }
}