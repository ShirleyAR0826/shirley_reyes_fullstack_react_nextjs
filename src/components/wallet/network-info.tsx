'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Fuel, RefreshCw, Activity, Network } from 'lucide-react'

interface GasPriceData {
  gasPrice: {
    standard: string
    fast: string
    rapid: string
    timestamp: string
  }
  source: string
  timestamp: string
}

interface BlockNumberData {
  blockNumber: number
  source: string
  timestamp: string
}

export function NetworkInfo() {
  const [gasPrice, setGasPrice] = useState<{ standard: string; fast: string; rapid: string } | null>(null)
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchNetworkInfo = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch gas price and block number in parallel
      const [gasPriceRes, blockNumberRes] = await Promise.all([
        fetch('http://localhost:3003/api/eth/gas-price'),
        fetch('http://localhost:3003/api/eth/block-number')
      ])

      if (!gasPriceRes.ok || !blockNumberRes.ok) {
        throw new Error('Failed to fetch network information')
      }

      const gasPriceData: GasPriceData = await gasPriceRes.json()
      const blockNumberData: BlockNumberData = await blockNumberRes.json()

      setGasPrice(gasPriceData.gasPrice)
      setBlockNumber(blockNumberData.blockNumber)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworkInfo()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNetworkInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network Info</CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge variant="destructive">Error loading network info</Badge>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNetworkInfo}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Network Info</CardTitle>
        <Network className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Gas Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Fuel className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Gas Price</span>
            </div>
            <div className="text-right">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : gasPrice ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-green-600">
                    {(parseFloat(gasPrice.standard) / 1e9).toFixed(1)} Gwei
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Fast: {(parseFloat(gasPrice.fast) / 1e9).toFixed(1)} Gwei</div>
                    <div>Rapid: {(parseFloat(gasPrice.rapid) / 1e9).toFixed(1)} Gwei</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Loading...</div>
              )}
            </div>
          </div>

          {/* Block Number */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Block Number</span>
            </div>
            <div className="text-right">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-sm font-semibold">
                  {blockNumber ? blockNumber.toLocaleString() : 'Loading...'}
                </div>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {lastUpdated || 'Never'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchNetworkInfo}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}