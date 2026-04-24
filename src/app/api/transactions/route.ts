import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const limit = searchParams.get('limit') || '10'
    const offset = searchParams.get('offset') || '0'

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    // Forward request to backend API
    const backendUrl = `${BACKEND_URL}/api/account/${address}/transactions?limit=${limit}&offset=${offset}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Blockchain-Frontend/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      // If backend is not available, return mock data
      if (response.status >= 500) {
        console.warn('Backend unavailable, returning mock data')
        return NextResponse.json({
          address,
          transactions: generateMockTransactions(address, parseInt(limit)),
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: parseInt(limit)
          },
          source: 'mock',
          timestamp: new Date().toISOString()
        })
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Frontend API error:', error)
    
    // Return mock data as fallback
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address') || '0x0000000000000000000000000000000000000000'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    return NextResponse.json({
      address,
      transactions: generateMockTransactions(address, limit),
      pagination: {
        limit,
        offset: 0,
        total: limit
      },
      source: 'mock',
      timestamp: new Date().toISOString(),
      note: 'Backend service unavailable, showing mock data'
    })
  }
}

function generateMockTransactions(address: string, count: number) {
  const transactions = []
  const now = Math.floor(Date.now() / 1000)

  for (let i = 0; i < count; i++) {
    const isIncoming = Math.random() > 0.5
    const value = (Math.random() * 5 + 0.001).toFixed(18)
    const timestamp = (now - (i * 3600 * 24)).toString()

    transactions.push({
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

  return transactions
}