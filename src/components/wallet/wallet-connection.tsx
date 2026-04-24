'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'

export function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="flex items-center justify-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Connected</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => disconnect()}
          className="ml-auto"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wallet className="h-5 w-5" />
        <span>Wallet not connected</span>
      </div>
      <w3m-button />
      <p className="text-xs text-muted-foreground text-center max-w-sm">
        Connect your Ethereum wallet to view your balance, transaction history, and interact with smart contracts.
      </p>
    </div>
  )
}