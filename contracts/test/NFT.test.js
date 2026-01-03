const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT合约测试", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置合约名称和符号", async function () {
      expect(await nft.name()).to.equal("MyNFT");
      expect(await nft.symbol()).to.equal("MNFT");
    });
  });

  describe("铸造NFT", function () {
    it("应该能够铸造NFT", async function () {
      const tokenURI = "https://example.com/token/1";
      const tx = await nft.mintNFT(addr1.address, tokenURI);
      await tx.wait();

      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("应该能够铸造多个NFT", async function () {
      await nft.mintNFT(addr1.address, "https://example.com/token/1");
      await nft.mintNFT(addr2.address, "https://example.com/token/2");
      await nft.mintNFT(addr1.address, "https://example.com/token/3");

      expect(await nft.totalSupply()).to.equal(3);
      expect(await nft.balanceOf(addr1.address)).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
    });
  });
});

