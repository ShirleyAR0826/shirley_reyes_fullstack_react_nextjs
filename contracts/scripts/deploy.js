const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of BlockchainNFT contract...");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log(`📍 Deploying to network: ${network}`);
  console.log(`👤 Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  console.log("\n📦 Deploying BlockchainNFT contract...");

  const BlockchainNFT = await hre.ethers.getContractFactory("BlockchainNFT");

  const contract = await BlockchainNFT.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log(`✅ BlockchainNFT deployed to: ${contractAddress}`);

  const deploymentTx = contract.deploymentTransaction();

  console.log(`📄 Transaction hash: ${deploymentTx.hash}`);

  await deploymentTx.wait(3);

  console.log("✅ Contract confirmed!");

  const tokenName = await contract.name();
  const tokenSymbol = await contract.symbol();

  console.log(`Name: ${tokenName}`);
  console.log(`Symbol: ${tokenSymbol}`);

  console.log("\n🔧 Add this to .env.local");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });