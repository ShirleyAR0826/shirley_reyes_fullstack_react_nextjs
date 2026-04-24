# Blockchain Full-Stack Application

A comprehensive blockchain application demonstrating wallet integration, backend API development, smart contract deployment, and full-stack integration. This project covers all four tiers of blockchain development: Frontend, Backend, Smart Contracts, and Integration.

## 🎯 Project Overview

This project implements a complete blockchain ecosystem with:

- **Frontend (Tier 1)**: Next.js application with wallet connection and blockchain interaction
- **Backend (Tier 2)**: Node.js API for Ethereum network data with caching and database
- **Smart Contracts (Tier 3)**: ERC-721 NFT contract with minting and transfer functionality
- **Integration (Tier 4)**: Full-stack integration with Docker containerization

## 🏗️ Architecture

```
blockchain-fullstack-app/
├── src/                          # Next.js Frontend
│   ├── app/                      # App Router
│   ├── components/               # React Components
│   └── lib/                      # Utility Libraries
├── backend/                      # Node.js Backend API
│   ├── src/                      # Source Code
│   ├── routes/                   # API Routes
│   ├── services/                 # Business Logic
│   └── middleware/               # Express Middleware
├── contracts/                    # Smart Contracts
│   ├── contracts/                # Solidity Files
│   ├── scripts/                  # Deployment Scripts
│   └── test/                     # Contract Tests
├── docker-compose.yml            # Docker Orchestration
└── README.md                     # This File
```

## ✨ Features

### Tier 1: Frontend Development
- ✅ MetaMask/WalletConnect wallet connection
- ✅ ETH balance display
- ✅ Transaction history viewer (last 10 transactions)
- ✅ Error handling for failed connections
- ✅ TypeScript implementation
- ✅ Modern UI with Tailwind CSS

### Tier 2: Backend Development
- ✅ REST API endpoints:
  - Current gas price
  - Current block number
  - Account balance for given address
- ✅ JSON response format
- ✅ Extensible architecture
- ✅ Redis caching for performance
- ✅ PostgreSQL database integration
- ✅ Rate limiting and security

### Tier 3: Smart Contract Development
- ✅ ERC-721 NFT contract
- ✅ Token minting functionality
- ✅ Transfer between addresses
- ✅ OpenZeppelin libraries
- ✅ Hardhat development environment
- ✅ Comprehensive testing suite

### Tier 4: Integration
- ✅ Frontend-backend-contract integration
- ✅ Token minting from frontend
- ✅ Token details display
- ✅ Error handling (gas fees, deployment)
- ✅ Docker containerization
- ✅ Docker Compose orchestration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker & Docker Compose (optional)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd blockchain-fullstack-app
```

### 2. Install Dependencies

```bash
# Install all dependencies across all modules
npm run install:all

# Or install individually:
npm install                    # Frontend
cd backend && npm install     # Backend  
cd contracts && npm install   # Smart Contracts
```

### 3. Environment Configuration

```bash
# Copy environment files
cp .env.example .env.local
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env

# Edit the files with your API keys and configuration
```

### 4. Database Setup (Optional)

If using PostgreSQL and Redis:

```bash
# Start services with Docker
docker-compose up postgres redis -d

# Or install locally and configure connection strings
```

### 5. Smart Contract Deployment

```bash
cd contracts

# Compile contracts
npm run compile

# Deploy to local network
npx hardhat node                    # Terminal 1
npm run deploy                      # Terminal 2

# Deploy to testnet (requires private key in .env)
npm run deploy:sepolia
```

### 6. Start Development

```bash
# Start backend
cd backend
npm run dev                         # Runs on http://localhost:3001

# Start frontend  
npm run dev                         # Runs on http://localhost:3000
```

## 🐳 Docker Deployment

### Option 1: Full Stack with Docker Compose

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Option 2: Development with Hardhat Node

```bash
# Start with local blockchain
docker-compose --profile dev up

# This includes a local Hardhat node on port 8545
```

## 📚 API Documentation

### Backend Endpoints

#### Ethereum Network
- `GET /api/eth/gas-price` - Current gas prices
- `GET /api/eth/block-number` - Current block number  
- `GET /api/eth/network-info` - Comprehensive network data
- `GET /api/eth/balance/:address` - ETH balance for address

#### Account Management
- `GET /api/account/:address` - Account information
- `GET /api/account/:address/transactions` - Transaction history
- `GET /api/account/:address/balance-history` - Historical balances
- `POST /api/account/:address/watch` - Add to watch list

#### System
- `GET /health` - Health check endpoint

### Example API Usage

```javascript
// Get current gas price
const response = await fetch('/api/eth/gas-price');
const { gasPrice } = await response.json();

// Get account balance
const balance = await fetch(`/api/eth/balance/${address}`);
const balanceData = await balance.json();

// Get transaction history
const txHistory = await fetch(`/api/account/${address}/transactions?limit=10`);
const transactions = await txHistory.json();
```

## 🔐 Security Features

- Rate limiting on API endpoints
- Input validation and sanitization  
- Ethereum address validation
- Error handling and logging
- Environment-based configuration
- Secure headers with Helmet.js

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npm test                # Run all contract tests
npm run coverage        # Generate coverage report
```

### Backend Tests

```bash
cd backend  
npm test                # Run API tests (if implemented)
```

## 🔧 Configuration

### Frontend Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
BACKEND_URL=http://localhost:3001
```

### Backend Environment Variables  

```bash
# backend/.env
ETHEREUM_RPC_URL=https://eth.llamarpc.com
ETHERSCAN_API_KEY=your_api_key
ALCHEMY_API_KEY=your_api_key  
REDIS_URL=redis://localhost:6379
DB_HOST=localhost
DB_NAME=blockchain_app
```

### Smart Contract Environment

```bash
# contracts/.env
PRIVATE_KEY=your_private_key_for_deployment
ETHERSCAN_API_KEY=your_api_key_for_verification
```

## 🚀 Deployment

### Production Deployment

1. **Smart Contracts**
   ```bash
   cd contracts
   npm run deploy:sepolia  # Testnet
   npm run deploy:mainnet  # Mainnet (be careful!)
   ```

2. **Backend API**
   - Deploy to cloud provider (AWS, GCP, Heroku)
   - Configure PostgreSQL and Redis
   - Set environment variables
   - Enable SSL/HTTPS

3. **Frontend**
   - Deploy to Vercel, Netlify, or CDN
   - Update contract addresses
   - Configure environment variables

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for smart contract libraries
- [Hardhat](https://hardhat.org/) for development environment
- [Ethers.js](https://ethers.org/) for Ethereum interaction
- [Next.js](https://nextjs.org/) for React framework
- [WalletConnect](https://walletconnect.com/) for wallet integration

## 📞 Support

For questions and support:

- Create an issue on GitHub
- Check the documentation
- Review the code comments

## 🗺️ Roadmap

- [ ] Mobile app with React Native
- [ ] Multi-chain support (Polygon, BSC)
- [ ] Advanced NFT marketplace features
- [ ] GraphQL API implementation
- [ ] WebSocket real-time updates
- [ ] Enhanced monitoring and analytics

---

**Built with ❤️ for the blockchain community**