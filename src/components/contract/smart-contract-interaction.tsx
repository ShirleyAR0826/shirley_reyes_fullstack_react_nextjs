'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Send, RefreshCw, ExternalLink } from 'lucide-react'
import { parseEther, formatEther } from 'viem'

// This will be replaced with actual deployed contract address
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

// Basic ERC-721 ABI for minting and transfers
const NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export function SmartContractInteraction() {
  const { address, isConnected } = useAccount()
  const [mintTokenId, setMintTokenId] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferTokenId, setTransferTokenId] = useState('')
  const [activeTab, setActiveTab] = useState('mint')

  const { writeContract, isPending: isMinting, error: mintError } = useWriteContract()
  const { writeContract: writeTransfer, isPending: isTransferring, error: transferError } = useWriteContract()

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  })

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'totalSupply',
    query: { enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  })

  const handleMint = async () => {
    if (!address || !mintTokenId) return

    try {
      await writeContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [address, BigInt(mintTokenId)]
      })
      
      // Refresh balances after minting
      setTimeout(() => {
        refetchBalance()
        refetchSupply()
      }, 2000)
      
      setMintTokenId('')
    } catch (error) {
      console.error('Minting failed:', error)
    }
  }

  const handleTransfer = async () => {
    if (!address || !transferTo || !transferTokenId) return

    try {
      await writeTransfer({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'transferFrom',
        args: [address, transferTo as `0x${string}`, BigInt(transferTokenId)]
      })
      
      // Refresh balances after transfer
      setTimeout(() => {
        refetchBalance()
        refetchSupply()
      }, 2000)
      
      setTransferTo('')
      setTransferTokenId('')
    } catch (error) {
      console.error('Transfer failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Connect wallet to interact with smart contracts</p>
        </CardContent>
      </Card>
    )
  }

  const isContractDeployed = NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="space-y-6">
      {/* Contract Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            NFT Contract Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={isContractDeployed ? "default" : "secondary"}>
                {isContractDeployed ? 'Contract Deployed' : 'Contract Not Deployed'}
              </Badge>
              {isContractDeployed && (
                <Button variant="ghost" size="sm" asChild>
                  <a 
                    href={`https://etherscan.io/address/${NFT_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
            
            {isContractDeployed ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Your NFT Balance</Label>
                  <p className="font-medium">{balance?.toString() || '0'} NFTs</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Supply</Label>
                  <p className="font-medium">{totalSupply?.toString() || '0'} NFTs</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Deploy the smart contract first to enable minting and transfers.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contract Interactions */}
      {isContractDeployed ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mint">Mint NFT</TabsTrigger>
            <TabsTrigger value="transfer">Transfer NFT</TabsTrigger>
          </TabsList>

          <TabsContent value="mint" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mint New NFT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    type="number"
                    placeholder="Enter token ID (e.g., 1, 2, 3...)"
                    value={mintTokenId}
                    onChange={(e) => setMintTokenId(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleMint}
                  disabled={!mintTokenId || isMinting}
                  className="w-full"
                >
                  {isMinting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Mint NFT
                    </>
                  )}
                </Button>
                
                {mintError && (
                  <p className="text-sm text-destructive">
                    Error: {mintError.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transfer NFT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transferTo">Recipient Address</Label>
                  <Input
                    id="transferTo"
                    placeholder="0x..."
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transferTokenId">Token ID</Label>
                  <Input
                    id="transferTokenId"
                    type="number"
                    placeholder="Token ID to transfer"
                    value={transferTokenId}
                    onChange={(e) => setTransferTokenId(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleTransfer}
                  disabled={!transferTo || !transferTokenId || isTransferring}
                  className="w-full"
                >
                  {isTransferring ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Transfer NFT
                    </>
                  )}
                </Button>
                
                {transferError && (
                  <p className="text-sm text-destructive">
                    Error: {transferError.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="space-y-4">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Smart Contract Not Deployed</h3>
                <p className="text-muted-foreground">
                  Run the deployment script to deploy the NFT contract to the blockchain.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>To deploy the contract:</p>
                <code className="block mt-2 p-2 bg-muted rounded">
                  cd contracts && npm run deploy
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}