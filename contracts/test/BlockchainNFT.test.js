const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockchainNFT", function () {
  let blockchainNFT;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    const BlockchainNFT = await ethers.getContractFactory("BlockchainNFT");
    blockchainNFT = await BlockchainNFT.deploy();
    await blockchainNFT.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await blockchainNFT.owner()).to.equal(owner.address);
    });

    it("Should mint genesis token to deployer", async function () {
      expect(await blockchainNFT.totalSupply()).to.equal(1);
      expect(await blockchainNFT.balanceOf(owner.address)).to.equal(1);
      expect(await blockchainNFT.ownerOf(1)).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await blockchainNFT.name()).to.equal("BlockchainNFT");
      expect(await blockchainNFT.symbol()).to.equal("BNFT");
    });

    it("Should have correct constants", async function () {
      expect(await blockchainNFT.MAX_SUPPLY()).to.equal(10000);
      expect(await blockchainNFT.MINT_PRICE()).to.equal(ethers.utils.parseEther("0.01"));
    });
  });

  describe("Minting", function () {
    it("Should allow public minting with correct payment", async function () {
      const mintPrice = await blockchainNFT.MINT_PRICE();
      
      await expect(
        blockchainNFT.connect(addr1).mint(
          addr1.address,
          "https://example.com/token1",
          "Art",
          { value: mintPrice }
        )
      ).to.emit(blockchainNFT, "TokenMinted");

      expect(await blockchainNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await blockchainNFT.totalSupply()).to.equal(2);
    });

    it("Should reject minting with insufficient payment", async function () {
      const insufficientPayment = ethers.utils.parseEther("0.005");
      
      await expect(
        blockchainNFT.connect(addr1).mint(
          addr1.address,
          "https://example.com/token1",
          "Art",
          { value: insufficientPayment }
        )
      ).to.be.revertedWith("Insufficient payment for minting");
    });

    it("Should allow owner to mint for free", async function () {
      await expect(
        blockchainNFT.connect(owner).mint(
          addr1.address,
          "https://example.com/token1",
          "Art"
        )
      ).to.emit(blockchainNFT, "TokenMinted");

      expect(await blockchainNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should allow owner minting", async function () {
      await expect(
        blockchainNFT.connect(owner).ownerMint(
          addr1.address,
          "https://example.com/token1",
          "Utility"
        )
      ).to.emit(blockchainNFT, "TokenMinted");

      const tokenMetadata = await blockchainNFT.getTokenMetadata(2);
      expect(tokenMetadata.creator).to.equal(owner.address);
      expect(tokenMetadata.category).to.equal("Utility");
    });

    it("Should reject empty URI", async function () {
      const mintPrice = await blockchainNFT.MINT_PRICE();
      
      await expect(
        blockchainNFT.connect(addr1).mint(
          addr1.address,
          "",
          "Art",
          { value: mintPrice }
        )
      ).to.be.revertedWith("URI cannot be empty");
    });

    it("Should track mint count", async function () {
      const mintPrice = await blockchainNFT.MINT_PRICE();
      
      await blockchainNFT.connect(addr1).mint(
        addr1.address,
        "https://example.com/token1",
        "Art",
        { value: mintPrice }
      );

      expect(await blockchainNFT.mintCount(addr1.address)).to.equal(1);
    });
  });

  describe("Batch Minting", function () {
    it("Should allow owner to batch mint", async function () {
      const uris = [
        "https://example.com/token1",
        "https://example.com/token2",
        "https://example.com/token3"
      ];
      const categories = ["Art", "Gaming", "Utility"];

      await expect(
        blockchainNFT.connect(owner).batchMint(addr1.address, uris, categories)
      ).to.emit(blockchainNFT, "BatchMinted");

      expect(await blockchainNFT.balanceOf(addr1.address)).to.equal(3);
      expect(await blockchainNFT.totalSupply()).to.equal(4); // Including genesis token
    });

    it("Should reject batch mint with mismatched arrays", async function () {
      const uris = ["https://example.com/token1", "https://example.com/token2"];
      const categories = ["Art"];

      await expect(
        blockchainNFT.connect(owner).batchMint(addr1.address, uris, categories)
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should reject batch mint from non-owner", async function () {
      const uris = ["https://example.com/token1"];
      const categories = ["Art"];

      await expect(
        blockchainNFT.connect(addr1).batchMint(addr1.address, uris, categories)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Token Management", function () {
    beforeEach(async function () {
      const mintPrice = await blockchainNFT.MINT_PRICE();
      await blockchainNFT.connect(addr1).mint(
        addr1.address,
        "https://example.com/token1",
        "Art",
        { value: mintPrice }
      );
    });

    it("Should allow token owner to burn", async function () {
      await expect(
        blockchainNFT.connect(addr1).burn(2)
      ).to.emit(blockchainNFT, "TokenBurned");

      expect(await blockchainNFT.totalSupply()).to.equal(1);
      
      await expect(
        blockchainNFT.ownerOf(2)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should reject burning by non-owner", async function () {
      await expect(
        blockchainNFT.connect(addr2).burn(2)
      ).to.be.revertedWith("Not authorized to burn this token");
    });

    it("Should return correct tokens by owner", async function () {
      const ownerTokens = await blockchainNFT.getTokensByOwner(owner.address);
      const addr1Tokens = await blockchainNFT.getTokensByOwner(addr1.address);

      expect(ownerTokens.length).to.equal(1);
      expect(ownerTokens[0]).to.equal(1);
      expect(addr1Tokens.length).to.equal(1);
      expect(addr1Tokens[0]).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to toggle public mint", async function () {
      expect(await blockchainNFT.publicMintEnabled()).to.equal(true);
      
      await blockchainNFT.connect(owner).togglePublicMint();
      expect(await blockchainNFT.publicMintEnabled()).to.equal(false);
      
      const mintPrice = await blockchainNFT.MINT_PRICE();
      await expect(
        blockchainNFT.connect(addr1).mint(
          addr1.address,
          "https://example.com/token1",
          "Art",
          { value: mintPrice }
        )
      ).to.be.revertedWith("Public minting is disabled");
    });

    it("Should allow owner to withdraw funds", async function () {
      const mintPrice = await blockchainNFT.MINT_PRICE();
      await blockchainNFT.connect(addr1).mint(
        addr1.address,
        "https://example.com/token1",
        "Art",
        { value: mintPrice }
      );

      const contractBalance = await ethers.provider.getBalance(blockchainNFT.address);
      expect(contractBalance).to.equal(mintPrice);

      await expect(
        blockchainNFT.connect(owner).withdraw()
      ).to.changeEtherBalance(owner, mintPrice);
    });

    it("Should reject withdrawal by non-owner", async function () {
      await expect(
        blockchainNFT.connect(addr1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Metadata", function () {
    it("Should return correct token metadata", async function () {
      const mintPrice = await blockchainNFT.MINT_PRICE();
      await blockchainNFT.connect(addr1).mint(
        addr1.address,
        "https://example.com/token1",
        "Art",
        { value: mintPrice }
      );

      const metadata = await blockchainNFT.getTokenMetadata(2);
      expect(metadata.creator).to.equal(addr1.address);
      expect(metadata.category).to.equal("Art");
      expect(metadata.createdAt).to.be.gt(0);
    });

    it("Should return correct token URI", async function () {
      const tokenURI = await blockchainNFT.tokenURI(1);
      expect(tokenURI).to.equal("https://ipfs.io/ipfs/QmYourFirstTokenMetadata");
    });
  });
});