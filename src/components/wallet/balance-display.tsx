'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BalanceDisplay() {
  const { address, isConnected } = useAccount()
  const { 
    data: balance, 
    error, 
    isLoading, 
    refetch 
  } = useBalance({
    address: address
  })

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <p className="text-muted-foreground">Connect wallet to view balance</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading balance...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge variant="destructive">Error loading balance</Badge>
            <p className="text-xs text-muted-foreground">
              {error.message || 'Failed to fetch balance'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
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
        <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} ETH
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {balance?.symbol || 'ETH'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Network: {balance?.symbol === 'ETH' ? 'Ethereum Mainnet' : 'Unknown'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}