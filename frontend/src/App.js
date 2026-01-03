import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import NFTContract from './contracts/NFT.json';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [nftCount, setNftCount] = useState(0);
  const [tokenURI, setTokenURI] = useState('');
  const [userNFTs, setUserNFTs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 合约地址 - 部署后需要更新
  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // 自动更新

  useEffect(() => {
    checkWalletConnection();
  }, []);

  // 检查钱包连接
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connectWallet();
        }
      } catch (error) {
        console.error('检查钱包连接失败:', error);
      }
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包！');
      return;
    }

    try {
      setLoading(true);
      // 请求账户访问
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // 创建provider和signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 创建合约实例
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        NFTContract.abi,
        signer
      );

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(accounts[0]);

      // 加载NFT数据
      await loadNFTData(contract, accounts[0]);
    } catch (error) {
      console.error('连接钱包失败:', error);
      alert('连接钱包失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 加载NFT数据
  const loadNFTData = async (contractInstance, userAddress) => {
    try {
      const totalSupply = await contractInstance.totalSupply();
      setNftCount(Number(totalSupply));

      // 获取用户拥有的NFT
      const balance = await contractInstance.balanceOf(userAddress);
      const nfts = [];
      
      // 这里简化处理，实际应该遍历所有NFT并检查所有者
      // 为了演示，我们只显示总数
      setUserNFTs(nfts);
    } catch (error) {
      console.error('加载NFT数据失败:', error);
    }
  };

  // 铸造NFT
  const mintNFT = async () => {
    if (!contract || !tokenURI.trim()) {
      alert('请输入Token URI');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.mintNFT(account, tokenURI);
      await tx.wait();
      
      alert('NFT铸造成功！');
      setTokenURI('');
      
      // 重新加载数据
      await loadNFTData(contract, account);
    } catch (error) {
      console.error('铸造NFT失败:', error);
      alert('铸造NFT失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🎨 NFT DApp</h1>
          <p className="subtitle">基于Solidity和React的区块链应用</p>
        </header>

        <main className="main-content">
          {!account ? (
            <div className="connect-section">
              <button 
                className="connect-btn" 
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? '连接中...' : '连接钱包'}
              </button>
              <p className="hint">请确保已安装MetaMask并连接到本地网络</p>
            </div>
          ) : (
            <div className="wallet-connected">
              <div className="wallet-info">
                <p className="account">已连接: {account.slice(0, 6)}...{account.slice(-4)}</p>
                <p className="nft-count">总NFT数量: {nftCount}</p>
              </div>

              <div className="mint-section">
                <h2>铸造NFT</h2>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="输入Token URI (例如: https://example.com/token/1)"
                    value={tokenURI}
                    onChange={(e) => setTokenURI(e.target.value)}
                    className="token-uri-input"
                  />
                  <button 
                    className="mint-btn" 
                    onClick={mintNFT}
                    disabled={loading || !tokenURI.trim()}
                  >
                    {loading ? '铸造中...' : '铸造NFT'}
                  </button>
                </div>
              </div>

              {userNFTs.length > 0 && (
                <div className="nft-list">
                  <h2>我的NFT</h2>
                  <div className="nft-grid">
                    {userNFTs.map((nft, index) => (
                      <div key={index} className="nft-card">
                        <p>Token ID: {nft.tokenId}</p>
                        <p>URI: {nft.uri}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

