'use client'

import { useState } from 'react'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { BalanceDisplay } from '@/components/wallet/balance-display'
import { NetworkInfo } from '@/components/wallet/network-info'
import { TransactionHistory } from '@/components/wallet/transaction-history'
import { SmartContractInteraction } from '@/components/contract/smart-contract-interaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccount } from 'wagmi'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('wallet')

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          Blockchain FullStack Application
        </h1>
        <p className="text-lg text-center text-muted-foreground mb-6">
          Complete blockchain interface with wallet connection, balance tracking, transactions, and smart contract interaction
        </p>
        <WalletConnection />
      </header>

      {isConnected ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connected Address: <code className="bg-muted px-2 py-1 rounded">{address}</code>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BalanceDisplay />
                  <NetworkInfo />
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ View your ETH balance</p>
                    <p>✓ Check real-time gas prices</p>
                    <p>✓ Monitor network activity</p>
                    <p>✓ Check transaction history</p>
                    <p>✓ Interact with smart contracts</p>
                    <p>✓ Mint NFT tokens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Account Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <BalanceDisplay />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionHistory address={address!} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Smart Contract Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                <SmartContractInteraction />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center">
          <CardContent className="py-8">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your Ethereum wallet to access the full application features.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}