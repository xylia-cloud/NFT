// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFT
 * @dev 一个简单的NFT合约示例
 */
contract NFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}

    /**
     * @dev 铸造新的NFT
     * @param to 接收NFT的地址
     * @param tokenURI NFT的元数据URI
     * @return tokenId 新铸造的NFT的token ID
     */
    function mintNFT(address to, string memory tokenURI) public returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        return newTokenId;
    }

    /**
     * @dev 获取当前已铸造的NFT总数
     * @return 总数量
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
}

