// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
}

contract PaymentChannel {
    mapping(address => uint256) public balances;
    IERC20 public usdtToken;
    
    address public owner;
    
    event Deposited(address indexed user, uint256 amount, string orderId);
    event Withdrawn(address indexed user, uint256 amount, string orderId);
    event USDTDeposited(address indexed user, uint256 amount, string orderId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function setUsdtToken(address _usdtToken) external onlyOwner {
        usdtToken = IERC20(_usdtToken);
    }
    
    function deposit(string memory orderId) public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, orderId);
    }
    
    // USDT 充值
    function depositUsdt(uint256 amount, string memory orderId) external {
        require(address(usdtToken) != address(0), "USDT token not set");
        require(amount > 0, "Deposit amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        // 从用户账户转账 USDT 到合约
        bool success = usdtToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDT transfer failed");
        
        balances[msg.sender] += amount;
        emit USDTDeposited(msg.sender, amount, orderId);
    }
    
    function withdraw(uint256 amount, string memory orderId) public {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount, orderId);
    }
    
    function withdrawTo(address payable to, uint256 amount, string memory orderId) public {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        balances[msg.sender] -= amount;
        to.transfer(amount);
        emit Withdrawn(msg.sender, amount, orderId);
    }
    
    function getBalance(address user) public view returns (uint256) {
        return balances[user];
    }
    
    receive() external payable {
        revert("Please use deposit() function with order ID");
    }
}