// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IPool.sol";

/**
 * PaymentChannel v4 - Aave 集成版
 *
 * - 充值 USDT 后自动 supply 到 Aave V3 Pool
 * - 用户签名提现时从 Aave withdraw 到用户地址
 * - 管理员紧急提现支持从 Aave 提取全部资金
 * - 充值/提现均支持订单号 orderId
 *
 * Plasma Mainnet 参考地址:
 * - Aave Pool:  0x925a2A7214Ed92428B5b1B090F80b25700095e12
 * - aPlaUSDT0:  0x5D72a9d9A9510Cd8cBdBA12aC62593A58930a948
 * - USDT0:      0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb
 */
contract PaymentChannel {
    using SafeERC20 for IERC20;

    address public owner;
    IERC20 public usdtToken;
    IERC20 public xplToken;
    IERC20 public aUsdtToken;
    IPool public aavePool;

    mapping(address => uint256) public balances;
    mapping(uint256 => bool) public usedNonces;

    event Deposited(address indexed user, uint256 amount, string orderId);
    event USDTDeposited(address indexed user, uint256 amount, string orderId);
    event SuppliedToAave(address indexed user, uint256 amount, string orderId);
    event Withdrawn(address indexed user, uint256 amount, string orderId, uint256 nonce);
    event WithdrawnFromAave(address indexed user, uint256 amount, string orderId, uint256 nonce);
    event XplWithdrawn(address indexed user, uint256 amount, string orderId, uint256 nonce);
    event OwnerWithdrawn(address indexed user, uint256 amount, string orderId);
    event EmergencyUsdtWithdrawn(address indexed to, uint256 amount);
    event EmergencyXplWithdrawn(address indexed to, uint256 amount);
    event EmergencyNativeWithdrawn(address indexed to, uint256 amount);

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

    /**
     * USDT 充值：收到后立即 supply 到 Aave Pool
     */
    function depositUsdt(uint256 amount, string calldata orderId) external {
        require(address(usdtToken) != address(0), "USDT token not set");
        require(address(aavePool) != address(0), "Aave pool not set");
        require(amount > 0, "Deposit amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");

        usdtToken.safeTransferFrom(msg.sender, address(this), amount);
        _supplyToAave(amount);

        balances[msg.sender] += amount;
        emit USDTDeposited(msg.sender, amount, orderId);
        emit SuppliedToAave(msg.sender, amount, orderId);
    }

    // ========== 提现（带签名验证） ==========

    /**
     * 用户调用，带后端 owner 签名提现 USDT（从 Aave 池子 withdraw）
     */
    function withdrawWithSignature(
        uint256 amount,
        string calldata orderId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[nonce], "Nonce already used");
        require(_verifySignature(msg.sender, amount, orderId, nonce, deadline, signature), "Invalid signature");
        require(address(usdtToken) != address(0), "USDT token not set");
        require(address(aavePool) != address(0), "Aave pool not set");
        require(getTotalUsdtManaged() >= amount, "Insufficient Aave balance");

        usedNonces[nonce] = true;

        aavePool.withdraw(address(usdtToken), amount, msg.sender);

        emit Withdrawn(msg.sender, amount, orderId, nonce);
        emit WithdrawnFromAave(msg.sender, amount, orderId, nonce);
    }

    // ========== 收益提现（XPL，带签名验证） ==========

    function withdrawXplWithSignature(
        uint256 amount,
        string calldata orderId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[nonce], "Nonce already used");
        require(_verifySignature(msg.sender, amount, orderId, nonce, deadline, signature), "Invalid signature");
        usedNonces[nonce] = true;

        require(address(xplToken) != address(0), "XPL token not set");
        xplToken.safeTransfer(msg.sender, amount);

        emit XplWithdrawn(msg.sender, amount, orderId, nonce);
    }

    // ========== Owner 方法 ==========

    function withdrawTo(address payable to, uint256 amount, string calldata orderId) external onlyOwner {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        require(balances[to] >= amount, "Insufficient balance");

        balances[to] -= amount;
        to.transfer(amount);
        emit OwnerWithdrawn(to, amount, orderId);
    }

    function setUsdtToken(address _usdtToken) external onlyOwner {
        usdtToken = IERC20(_usdtToken);
        _resetAaveApproval();
    }

    function setXplToken(address _xplToken) external onlyOwner {
        xplToken = IERC20(_xplToken);
    }

    function setAUsdtToken(address _aUsdtToken) external onlyOwner {
        aUsdtToken = IERC20(_aUsdtToken);
    }

    function setAavePool(address _aavePool) external onlyOwner {
        if (address(aavePool) != address(0) && address(usdtToken) != address(0)) {
            usdtToken.forceApprove(address(aavePool), 0);
        }
        aavePool = IPool(_aavePool);
        _resetAaveApproval();
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /**
     * 合约管理的 USDT 总量 = Aave aToken 余额 + 合约内闲置 USDT
     */
    function getTotalUsdtManaged() public view returns (uint256) {
        uint256 idle = address(usdtToken) == address(0) ? 0 : usdtToken.balanceOf(address(this));
        uint256 inAave = address(aUsdtToken) == address(0) ? 0 : aUsdtToken.balanceOf(address(this));
        return idle + inAave;
    }

    /**
     * 紧急提取 USDT 到 owner（兼容旧接口）
     * @param amount 提取金额（0 = 提取全部）
     */
    function emergencyWithdrawUsdt(uint256 amount) external onlyOwner {
        emergencyWithdrawUsdtTo(owner, amount);
    }

    /**
     * 紧急提取 USDT 到指定地址（合约 idle 直转 + Aave 直达收款地址，与用户提现一致）
     * @param to 收款地址
     * @param amount 提取金额（0 = 提取全部）
     */
    function emergencyWithdrawUsdtTo(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(address(usdtToken) != address(0), "USDT token not set");

        uint256 totalManaged = getTotalUsdtManaged();
        require(totalManaged > 0, "No USDT to withdraw");

        uint256 withdrawAmount = amount == 0 ? totalManaged : amount;
        require(withdrawAmount <= totalManaged, "Insufficient balance");

        _withdrawUsdtTo(to, withdrawAmount);
        emit EmergencyUsdtWithdrawn(to, withdrawAmount);
    }

    function emergencyWithdrawXpl(uint256 amount) external onlyOwner {
        emergencyWithdrawXplTo(owner, amount);
    }

    function emergencyWithdrawXplTo(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(address(xplToken) != address(0), "XPL token not set");

        uint256 contractBalance = xplToken.balanceOf(address(this));
        require(contractBalance > 0, "No XPL to withdraw");

        uint256 withdrawAmount = amount == 0 ? contractBalance : amount;
        require(withdrawAmount <= contractBalance, "Insufficient contract balance");

        xplToken.safeTransfer(to, withdrawAmount);
        emit EmergencyXplWithdrawn(to, withdrawAmount);
    }

    function emergencyWithdrawNative() external onlyOwner {
        emergencyWithdrawNativeTo(payable(owner));
    }

    function emergencyWithdrawNativeTo(address payable to) public onlyOwner {
        require(to != address(0), "Invalid recipient");

        uint256 balance = address(this).balance;
        require(balance > 0, "No native token to withdraw");

        (bool success, ) = to.call{value: balance}("");
        require(success, "Native token transfer failed");
        emit EmergencyNativeWithdrawn(to, balance);
    }

    // ========== 内部方法 ==========

    function _supplyToAave(uint256 amount) internal {
        usdtToken.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdtToken), amount, address(this), 0);
    }

    function _withdrawUsdtTo(address to, uint256 amount) internal {
        uint256 idle = usdtToken.balanceOf(address(this));
        uint256 fromIdle = amount > idle ? idle : amount;

        if (fromIdle > 0) {
            usdtToken.safeTransfer(to, fromIdle);
        }

        uint256 fromAave = amount - fromIdle;
        if (fromAave > 0) {
            require(address(aavePool) != address(0), "Aave pool not set");
            aavePool.withdraw(address(usdtToken), fromAave, to);
        }
    }

    function _resetAaveApproval() internal {
        if (address(aavePool) != address(0) && address(usdtToken) != address(0)) {
            usdtToken.forceApprove(address(aavePool), type(uint256).max);
        }
    }

    function _verifySignature(
        address user,
        uint256 amount,
        string calldata orderId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(user, amount, orderId, nonce, deadline, block.chainid, address(this))
        );
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedHash, signature);
        return signer == owner;
    }

    receive() external payable {
        revert("Please use deposit() function with order ID");
    }
}
