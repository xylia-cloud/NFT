/**
 * 后端区块链服务完整示例
 * 
 * 功能：
 * 1. 监听 USDT 充值事件
 * 2. 处理 XPL 提现请求
 * 3. 查询余额
 */

const { ethers } = require("ethers");

// 配置信息（从 local-testnet-config.json 获取）
const CONFIG = {
  rpcUrl: "http://127.0.0.1:8546",
  chainId: 31337,
  contracts: {
    usdt: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    paymentChannel: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  },
  // 管理员私钥（用于执行提现）
  adminPrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
};

// 合约 ABI
const PAYMENT_CHANNEL_ABI = [
  "function depositUsdt(uint256 amount) external",
  "function withdrawTo(address payable to, uint256 amount) public",
  "function getBalance(address user) public view returns (uint256)",
  "event USDTDeposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)"
];

const USDT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string memory)"
];

/**
 * 区块链服务类
 */
class BlockchainService {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.adminWallet = null;
    this.paymentChannel = null;
    this.usdt = null;
    this.isRunning = false;
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      console.log("🔗 连接到区块链...");
      
      // 连接到本地测试链
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      // 验证连接
      const network = await this.provider.getNetwork();
      console.log("✅ 已连接到链 ID:", network.chainId.toString());
      
      if (network.chainId !== BigInt(this.config.chainId)) {
        throw new Error(`链 ID 不匹配: 期望 ${this.config.chainId}, 实际 ${network.chainId}`);
      }
      
      // 初始化管理员钱包
      this.adminWallet = new ethers.Wallet(this.config.adminPrivateKey, this.provider);
      console.log("👤 管理员地址:", this.adminWallet.address);
      
      const balance = await this.provider.getBalance(this.adminWallet.address);
      console.log("💰 管理员余额:", ethers.formatEther(balance), "XPL");
      
      // 初始化合约实例
      this.paymentChannel = new ethers.Contract(
        this.config.contracts.paymentChannel,
        PAYMENT_CHANNEL_ABI,
        this.adminWallet
      );
      
      this.usdt = new ethers.Contract(
        this.config.contracts.usdt,
        USDT_ABI,
        this.provider
      );
      
      // 验证合约部署
      const pcCode = await this.provider.getCode(this.config.contracts.paymentChannel);
      const usdtCode = await this.provider.getCode(this.config.contracts.usdt);
      
      if (pcCode === "0x" || usdtCode === "0x") {
        throw new Error("合约未部署或地址错误");
      }
      
      console.log("✅ 合约验证成功");
      console.log("- PaymentChannel:", this.config.contracts.paymentChannel);
      console.log("- USDT:", this.config.contracts.usdt);
      
      return true;
    } catch (error) {
      console.error("❌ 初始化失败:", error.message);
      throw error;
    }
  }

  /**
   * 启动事件监听
   */
  startEventListeners() {
    if (this.isRunning) {
      console.log("⚠️ 事件监听已在运行");
      return;
    }
    
    console.log("\n👂 开始监听区块链事件...\n");
    this.isRunning = true;
    
    // 监听 USDT 充值事件
    this.paymentChannel.on("USDTDeposited", async (user, amount, event) => {
      try {
        const depositData = {
          userAddress: user.toLowerCase(),
          amount: ethers.formatUnits(amount, 6),
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          timestamp: Date.now()
        };
        
        console.log("💰 检测到充值:");
        console.log("- 用户:", depositData.userAddress);
        console.log("- 金额:", depositData.amount, "USDT");
        console.log("- 交易:", depositData.txHash);
        console.log("- 区块:", depositData.blockNumber);
        console.log("");
        
        await this.handleDeposit(depositData);
      } catch (error) {
        console.error("❌ 处理充值事件失败:", error);
      }
    });
    
    // 监听提现事件
    this.paymentChannel.on("Withdrawn", async (user, amount, event) => {
      console.log("💸 检测到提现:");
      console.log("- 用户:", user.toLowerCase());
      console.log("- 金额:", ethers.formatEther(amount), "XPL");
      console.log("- 交易:", event.log.transactionHash);
      console.log("- 区块:", event.log.blockNumber);
      console.log("");
    });
    
    // 监听错误
    this.paymentChannel.on("error", (error) => {
      console.error("❌ 合约事件错误:", error);
    });
    
    console.log("✅ 事件监听已启动\n");
  }

  /**
   * 停止事件监听
   */
  stopEventListeners() {
    if (!this.isRunning) {
      return;
    }
    
    this.paymentChannel.removeAllListeners();
    this.isRunning = false;
    console.log("🛑 事件监听已停止");
  }

  /**
   * 处理充值
   */
  async handleDeposit(depositData) {
    // TODO: 实现数据库操作
    // 1. 查找或创建用户
    // 2. 增加用户余额
    // 3. 记录交易
    
    console.log("✅ 充值已处理");
    console.log("---");
    
    // 示例：数据库操作
    /*
    const user = await db.users.findOrCreate({
      wallet_address: depositData.userAddress
    });
    
    await db.users.increaseBalance(user.id, depositData.amount);
    
    await db.transactions.create({
      user_id: user.id,
      type: 'deposit',
      coin: 'USDT',
      amount: depositData.amount,
      tx_hash: depositData.txHash,
      block_number: depositData.blockNumber,
      status: 'confirmed',
      created_at: new Date(depositData.timestamp)
    });
    */
  }

  /**
   * 执行提现
   */
  async withdraw(userAddress, amount) {
    try {
      console.log("\n💸 执行提现:");
      console.log("- 用户:", userAddress);
      console.log("- 金额:", amount, "XPL");
      
      // 1. 验证地址
      if (!ethers.isAddress(userAddress)) {
        throw new Error("无效的钱包地址");
      }
      
      // 2. 转换金额
      const amountWei = ethers.parseEther(amount.toString());
      
      // 3. 检查合约余额
      const contractBalance = await this.provider.getBalance(
        this.config.contracts.paymentChannel
      );
      
      console.log("- 合约余额:", ethers.formatEther(contractBalance), "XPL");
      
      if (contractBalance < amountWei) {
        throw new Error("合约余额不足");
      }
      
      // 4. 估算 gas
      const gasEstimate = await this.paymentChannel.withdrawTo.estimateGas(
        userAddress,
        amountWei
      );
      console.log("- 预估 gas:", gasEstimate.toString());
      
      // 5. 执行交易
      console.log("📤 发送交易...");
      const tx = await this.paymentChannel.withdrawTo(userAddress, amountWei, {
        gasLimit: gasEstimate * 120n / 100n // 增加 20% 余量
      });
      
      console.log("⏳ 等待确认...");
      console.log("- 交易哈希:", tx.hash);
      
      // 6. 等待确认
      const receipt = await tx.wait();
      
      console.log("✅ 提现成功!");
      console.log("- Gas 消耗:", receipt.gasUsed.toString());
      console.log("- 区块号:", receipt.blockNumber);
      console.log("");
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error("❌ 提现失败:", error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 查询用户在合约中的余额
   */
  async getContractBalance(userAddress) {
    try {
      const balance = await this.paymentChannel.getBalance(userAddress);
      return ethers.formatUnits(balance, 6); // USDT 是 6 位小数
    } catch (error) {
      console.error("查询合约余额失败:", error);
      throw error;
    }
  }

  /**
   * 查询用户的 USDT 钱包余额
   */
  async getUsdtBalance(userAddress) {
    try {
      const balance = await this.usdt.balanceOf(userAddress);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error("查询 USDT 余额失败:", error);
      throw error;
    }
  }

  /**
   * 查询用户的 XPL 钱包余额
   */
  async getXplBalance(userAddress) {
    try {
      const balance = await this.provider.getBalance(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("查询 XPL 余额失败:", error);
      throw error;
    }
  }

  /**
   * 获取最新区块号
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * 查询历史充值事件
   */
  async getDepositHistory(fromBlock = 0, toBlock = "latest") {
    try {
      const filter = this.paymentChannel.filters.USDTDeposited();
      const events = await this.paymentChannel.queryFilter(filter, fromBlock, toBlock);
      
      return events.map(event => ({
        userAddress: event.args.user.toLowerCase(),
        amount: ethers.formatUnits(event.args.amount, 6),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      }));
    } catch (error) {
      console.error("查询历史事件失败:", error);
      throw error;
    }
  }
}

// ==================== 使用示例 ====================

async function main() {
  // 1. 创建服务实例
  const service = new BlockchainService(CONFIG);
  
  // 2. 初始化
  await service.initialize();
  
  // 3. 启动事件监听
  service.startEventListeners();
  
  // 4. 测试查询功能
  console.log("📊 测试查询功能:\n");
  
  const testAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  const usdtBalance = await service.getUsdtBalance(testAddress);
  console.log("USDT 余额:", usdtBalance);
  
  const xplBalance = await service.getXplBalance(testAddress);
  console.log("XPL 余额:", xplBalance);
  
  const contractBalance = await service.getContractBalance(testAddress);
  console.log("合约余额:", contractBalance);
  
  const blockNumber = await service.getBlockNumber();
  console.log("当前区块:", blockNumber);
  console.log("");
  
  // 5. 测试提现（可选）
  // const result = await service.withdraw(testAddress, "10");
  // console.log("提现结果:", result);
  
  // 6. 查询历史事件（可选）
  // const history = await service.getDepositHistory();
  // console.log("历史充值:", history);
  
  // 保持运行，监听事件
  console.log("🎯 服务运行中，按 Ctrl+C 退出\n");
  
  // 优雅退出
  process.on("SIGINT", () => {
    console.log("\n\n🛑 正在关闭服务...");
    service.stopEventListeners();
    process.exit(0);
  });
}

// 运行服务
if (require.main === module) {
  main().catch((error) => {
    console.error("服务启动失败:", error);
    process.exit(1);
  });
}

// 导出供其他模块使用
module.exports = { BlockchainService, CONFIG };
