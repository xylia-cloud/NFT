// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * PaymentChannel v2
 * 新增 withdrawWithSignature: 用户带后端签名提现，用户付 gas，后端零 gas
 * 
 * 签名消息格式: keccak256(abi.encodePacked(user, amount, orderId, nonce, chainId, contractAddress))
 * - nonce 防重放
 * - chainId + contractAddress 防跨链/跨合约重放
 */
contract PaymentChannel {
    address public owner;
    IERC20 public usdtToken;
    IERC20 public xplToken;   // XPL 代币，收益提现用
    
    mapping(address => uint256) public balances;
    mapping(bytes32 => bool) public usedSignatures;  // 防重放
    
    event Deposited(address indexed user, uint256 amount, string orderId);
    event USDTDeposited(address indexed user, uint256 amount, string orderId);
    event Withdrawn(address indexed user, uint256 amount, string orderId);
    event XplWithdrawn(address indexed user, uint256 xplAmount, uint256 usdtValue, string orderId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // ========== 充值 ==========
    
    function deposit(string calldata orderId) external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, orderId);
    }
    
    function depositUsdt(uint256 amount, string calldata orderId) external {
        require(address(usdtToken) != address(0), "USDT token not set");
        require(amount > 0, "Deposit amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        bool success = usdtToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDT transfer failed");
        
        balances[msg.sender] += amount;
        emit USDTDeposited(msg.sender, amount, orderId);
    }
    
    // ========== 提现（带签名验证） ==========
    
    /**
     * 用户调用，带后端 owner 签名提现 USDT
     * @param amount 提现金额 (wei)
     * @param orderId 订单号
     * @param nonce 唯一随机数，防重放
     * @param signature owner 对 (user, amount, orderId, nonce, chainId, contractAddress) 的签名
     */
    function withdrawWithSignature(
        uint256 amount,
        string calldata orderId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        // 构造签名哈希
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, amount, orderId, nonce, block.chainid, address(this))
        );
        bytes32 ethSignedHash = _toEthSignedMessageHash(messageHash);
        
        // 防重放
        require(!usedSignatures[ethSignedHash], "Signature already used");
        usedSignatures[ethSignedHash] = true;
        
        // 验证签名
        address signer = _recoverSigner(ethSignedHash, signature);
        require(signer == owner, "Invalid signature");
        
        // 转 USDT 给用户
        require(address(usdtToken) != address(0), "USDT token not set");
        bool success = usdtToken.transfer(msg.sender, amount);
        require(success, "USDT transfer failed");
        
        emit Withdrawn(msg.sender, amount, orderId);
    }
    
    // ========== 收益提现（XPL，带签名验证） ==========
    
    /**
     * 用户调用，带后端 owner 签名提现 XPL（收益提现）
     * 后端已按汇率算好 XPL 数量，签名里包含 xplAmount
     * @param xplAmount XPL 数量 (wei, 18 decimals)
     * @param usdtValue 对应的 USDT 价值 (用于事件记录)
     * @param orderId 订单号
     * @param nonce 唯一随机数，防重放
     * @param signature owner 对 (user, xplAmount, orderId, nonce, chainId, contractAddress) 的签名
     */
    function withdrawXplWithSignature(
        uint256 xplAmount,
        uint256 usdtValue,
        string calldata orderId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(xplAmount > 0, "Withdrawal amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        // 构造签名哈希（签名内容不含 usdtValue，只签核心字段）
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, xplAmount, orderId, nonce, block.chainid, address(this))
        );
        bytes32 ethSignedHash = _toEthSignedMessageHash(messageHash);
        
        // 防重放
        require(!usedSignatures[ethSignedHash], "Signature already used");
        usedSignatures[ethSignedHash] = true;
        
        // 验证签名
        address signer = _recoverSigner(ethSignedHash, signature);
        require(signer == owner, "Invalid signature");
        
        // 转 XPL 给用户
        require(address(xplToken) != address(0), "XPL token not set");
        bool success = xplToken.transfer(msg.sender, xplAmount);
        require(success, "XPL transfer failed");
        
        emit XplWithdrawn(msg.sender, xplAmount, usdtValue, orderId);
    }
    
    // ========== Owner 方法 ==========
    
    function withdrawTo(address payable to, uint256 amount, string calldata orderId) external onlyOwner {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        require(balances[to] >= amount, "Insufficient balance");
        
        balances[to] -= amount;
        to.transfer(amount);
        emit Withdrawn(to, amount, orderId);
    }
    
    function setUsdtToken(address _usdtToken) external onlyOwner {
        usdtToken = IERC20(_usdtToken);
    }
    
    function setXplToken(address _xplToken) external onlyOwner {
        xplToken = IERC20(_xplToken);
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * 紧急提取：管理员提取合约中的所有 USDT
     * @param amount 提取金额（如果为 0，则提取全部）
     */
    function emergencyWithdrawUsdt(uint256 amount) external onlyOwner {
        require(address(usdtToken) != address(0), "USDT token not set");
        
        uint256 contractBalance = usdtToken.balanceOf(address(this));
        require(contractBalance > 0, "No USDT to withdraw");
        
        uint256 withdrawAmount = amount == 0 ? contractBalance : amount;
        require(withdrawAmount <= contractBalance, "Insufficient contract balance");
        
        bool success = usdtToken.transfer(owner, withdrawAmount);
        require(success, "USDT transfer failed");
    }
    
    /**
     * 紧急提取：管理员提取合约中的所有 XPL
     * @param amount 提取金额（如果为 0，则提取全部）
     */
    function emergencyWithdrawXpl(uint256 amount) external onlyOwner {
        require(address(xplToken) != address(0), "XPL token not set");
        
        uint256 contractBalance = xplToken.balanceOf(address(this));
        require(contractBalance > 0, "No XPL to withdraw");
        
        uint256 withdrawAmount = amount == 0 ? contractBalance : amount;
        require(withdrawAmount <= contractBalance, "Insufficient contract balance");
        
        bool success = xplToken.transfer(owner, withdrawAmount);
        require(success, "XPL transfer failed");
    }
    
    /**
     * 紧急提取：管理员提取合约中的原生代币（ETH/BNB等）
     */
    function emergencyWithdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No native token to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Native token transfer failed");
    }
    
    // ========== 内部方法 ==========
    
    function _toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
    
    function _recoverSigner(bytes32 ethSignedHash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature v value");
        
        return ecrecover(ethSignedHash, v, r, s);
    }
    
    receive() external payable {
        revert("Please use deposit() function with order ID");
    }
}
