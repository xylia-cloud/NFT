// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPool.sol";

/**
 * @title MockAavePool
 * @notice 测试用 Aave Pool 模拟，supply 收取 underlying 并 mint aToken，withdraw  burn aToken 并返还 underlying
 */
contract MockAavePool is IPool {
    IERC20 public immutable underlying;
    IERC20 public immutable aToken;

    constructor(address _underlying, address _aToken) {
        underlying = IERC20(_underlying);
        aToken = IERC20(_aToken);
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16
    ) external override {
        require(asset == address(underlying), "Invalid asset");
        require(underlying.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(MockAToken(address(aToken)).mint(onBehalfOf, amount), "Mint failed");
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(asset == address(underlying), "Invalid asset");
        require(MockAToken(address(aToken)).burn(msg.sender, amount), "Burn failed");
        require(underlying.transfer(to, amount), "Transfer failed");
        return amount;
    }
}

/**
 * @title MockAToken
 * @notice 测试用 aToken，仅 MockAavePool 可 mint/burn
 */
contract MockAToken is IERC20 {
    string public name = "Mock aUSDT";
    string public symbol = "maUSDT";
    uint8 public decimals = 6;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    address public pool;

    modifier onlyPool() {
        require(msg.sender == pool, "Only pool");
        _;
    }

    constructor() {}

    function setPool(address _pool) external {
        require(pool == address(0), "Pool already set");
        pool = _pool;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        unchecked {
            _allowances[from][msg.sender] = currentAllowance - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyPool returns (bool) {
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
        return true;
    }

    function burn(address from, uint256 amount) external onlyPool returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0) && to != address(0), "Invalid address");
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
}
