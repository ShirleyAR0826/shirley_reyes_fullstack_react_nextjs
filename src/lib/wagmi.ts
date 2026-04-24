import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, sepolia } from 'wagmi/chains'

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default-project-id'

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'Blockchain FullStack App',
  description: 'A comprehensive blockchain application',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create wagmiConfig
const chains = [mainnet, sepolia] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
})

export const ETHEREUM_NETWORKS = {
  mainnet: {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia Testnet', 
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
  }
}