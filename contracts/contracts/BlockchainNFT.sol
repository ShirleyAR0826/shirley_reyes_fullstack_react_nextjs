// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockchainNFT
 * @dev ERC-721 Non-Fungible Token for the Blockchain Full-Stack Application
 * @notice This contract implements a basic NFT with minting and transfer functionality
 */
contract BlockchainNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping from token ID to token metadata
    mapping(uint256 => TokenMetadata) private _tokenMetadata;

    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TokenBurned(uint256 indexed tokenId);
    event BatchMinted(address indexed to, uint256[] tokenIds);

    struct TokenMetadata {
        address creator;
        uint256 createdAt;
        string category;
    }

    // Constants
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.01 ether;

    // State variables
    bool public publicMintEnabled = true;
    uint256 public totalSupply = 0;
    mapping(address => uint256) public mintCount;

    constructor() ERC721("BlockchainNFT", "BNFT") Ownable() {
        // Mint first token to deployer
        _nextTokenId = 1;
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, "https://ipfs.io/ipfs/QmYourFirstTokenMetadata");
        
        _tokenMetadata[tokenId] = TokenMetadata({
            creator: msg.sender,
            createdAt: block.timestamp,
            category: "Genesis"
        });
        
        totalSupply++;
        emit TokenMinted(msg.sender, tokenId, "https://ipfs.io/ipfs/QmYourFirstTokenMetadata");
    }

    /**
     * @dev Mint a single NFT to specified address
     * @param to Address to mint the token to
     * @param uri Token URI for metadata
     * @param category Token category (e.g., "Art", "Gaming", "Utility")
     */
    function mint(address to, string memory uri, string memory category) public payable {
        require(publicMintEnabled, "Public minting is disabled");
        require(totalSupply < MAX_SUPPLY, "Maximum supply reached");
        require(bytes(uri).length > 0, "URI cannot be empty");
        
        // Require payment for non-owner mints
        if (msg.sender != owner()) {
            require(msg.value >= MINT_PRICE, "Insufficient payment for minting");
        }

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        _tokenMetadata[tokenId] = TokenMetadata({
            creator: msg.sender,
            createdAt: block.timestamp,
            category: category
        });
        
        totalSupply++;
        mintCount[to]++;
        
        emit TokenMinted(to, tokenId, uri);
    }

    /**
     * @dev Owner-only mint function for free minting
     * @param to Address to mint the token to
     * @param uri Token URI for metadata
     * @param category Token category
     */
    function ownerMint(address to, string memory uri, string memory category) public onlyOwner {
        require(totalSupply < MAX_SUPPLY, "Maximum supply reached");
        require(bytes(uri).length > 0, "URI cannot be empty");

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        _tokenMetadata[tokenId] = TokenMetadata({
            creator: msg.sender,
            createdAt: block.timestamp,
            category: category
        });
        
        totalSupply++;
        mintCount[to]++;
        
        emit TokenMinted(to, tokenId, uri);
    }

    /**
     * @dev Batch mint multiple NFTs to specified address
     * @param to Address to mint tokens to
     * @param uris Array of token URIs
     * @param categories Array of token categories
     */
    function batchMint(
        address to, 
        string[] memory uris, 
        string[] memory categories
    ) public payable onlyOwner {
        require(uris.length == categories.length, "Arrays length mismatch");
        require(uris.length > 0 && uris.length <= 20, "Invalid batch size");
        require(totalSupply + uris.length <= MAX_SUPPLY, "Would exceed max supply");

        uint256[] memory tokenIds = new uint256[](uris.length);

        for (uint256 i = 0; i < uris.length; i++) {
            require(bytes(uris[i]).length > 0, "URI cannot be empty");
            
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            _tokenMetadata[tokenId] = TokenMetadata({
                creator: msg.sender,
                createdAt: block.timestamp,
                category: categories[i]
            });
            
            totalSupply++;
            emit TokenMinted(to, tokenId, uris[i]);
        }

        mintCount[to] += uris.length;
        emit BatchMinted(to, tokenIds);
    }

    /**
     * @dev Burn a token (only token owner or approved)
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not authorized to burn this token");
        
        _burn(tokenId);
        delete _tokenMetadata[tokenId];
        totalSupply--;
        
        emit TokenBurned(tokenId);
    }

    /**
     * @dev Get token metadata
     * @param tokenId Token ID to query
     * @return TokenMetadata struct
     */
    function getTokenMetadata(uint256 tokenId) public view returns (TokenMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenMetadata[tokenId];
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner Address to query
     * @return Array of token IDs
     */
    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 index = 0;

        for (uint256 tokenId = 1; tokenId < _nextTokenId; tokenId++) {
            if (_ownerOf(tokenId) != address(0) && ownerOf(tokenId) == owner) {
                tokens[index] = tokenId;
                index++;
            }
        }

        return tokens;
    }

    /**
     * @dev Toggle public minting
     */
    function togglePublicMint() public onlyOwner {
        publicMintEnabled = !publicMintEnabled;
    }

    /**
     * @dev Withdraw contract funds to owner
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get current token ID counter
     * @return Current token ID
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    // Emergency functions
    function pause() public onlyOwner {
        publicMintEnabled = false;
    }

    function unpause() public onlyOwner {
        publicMintEnabled = true;
    }
}
