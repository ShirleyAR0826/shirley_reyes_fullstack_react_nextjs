'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: string
  status: string
  gasUsed: string
  gasPrice: string
}

interface TransactionHistoryProps {
  address: string
}

export function TransactionHistory({ address }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions?address=${address}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchTransactions()
    }
  }, [address])

  const formatValue = (value: string) => {
    const ethValue = parseFloat(value) / Math.pow(10, 18)
    return ethValue.toFixed(6)
  }

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString()
  }

  const isIncoming = (tx: Transaction) => 
    tx.to.toLowerCase() === address.toLowerCase()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <RefreshCw className="h-4 w-4 animate-spin" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Clock className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure the backend API is running and accessible.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <Button variant="outline" size="sm" onClick={fetchTransactions}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <Card key={tx.hash} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      {isIncoming(tx) ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={isIncoming(tx) ? "default" : "secondary"}>
                          {isIncoming(tx) ? 'Received' : 'Sent'}
                        </Badge>
                        <Badge variant="outline">{tx.status === '1' ? 'Success' : 'Failed'}</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">
                          {formatValue(tx.value)} ETH
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isIncoming(tx) ? 'From' : 'To'}: {
                          isIncoming(tx) 
                            ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                            : `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}