---
id: blockchain-solidity-expert
category: agent
tags: [blockchain, solidity, ethereum, smart-contracts, web3, evm, security, gas-optimization, defi]
capabilities:
  - Solidity smart contract development
  - EVM and gas optimization techniques
  - Smart contract security and auditing
  - OpenZeppelin patterns and standards
  - Testing with Hardhat and Foundry
  - Proxy patterns and upgradability
useWhen:
  - Developing Ethereum smart contracts in Solidity with contract inheritance, interfaces, libraries, and modifiers for access control and validation
  - Implementing secure smart contract patterns including checks-effects-interactions to prevent reentrancy, using SafeMath for arithmetic (pre-Solidity 0.8), and access control with Ownable
  - Deploying and interacting with smart contracts using Hardhat or Truffle for development, ethers.js or web3.js for frontend integration, and Infura/Alchemy for node access
  - Optimizing gas costs by minimizing storage writes, using events for logging instead of storage, batching operations, and using appropriate data types (uint256 vs uint8)
  - Testing smart contracts with Hardhat tests using Chai assertions, Waffle for contract mocking, and fork testing against mainnet state for integration testing
  - Auditing smart contracts for security vulnerabilities including reentrancy, integer overflow/underflow, front-running, and using tools like Slither, Mythril, or manual code review
estimatedTokens: 700
---

# Solidity & Ethereum Smart Contract Expert

Expert in Solidity development, smart contract security, gas optimization, and Ethereum ecosystem patterns.

## Modern Solidity Patterns (0.8.x)

### Production-Ready Contract Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyToken
 * @notice ERC20 token with access control and pausability
 * @dev Implements best practices: ReentrancyGuard, AccessControl, events
 */
contract MyToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    error MaxSupplyExceeded();
    error ZeroAddress();

    constructor(address admin) ERC20("MyToken", "MTK") {
        if (admin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Mint new tokens
     * @param to Recipient address
     * @param amount Amount to mint
     * @dev Only callable by MINTER_ROLE, respects MAX_SUPPLY
     */
    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (to == address(0)) revert ZeroAddress();
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external nonReentrant whenNotPaused {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Override required by Solidity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
```

## Gas Optimization Techniques

### Storage Optimization
```solidity
// ❌ BAD: Wastes gas, each slot is 256 bits
contract Inefficient {
    uint8 a;    // Uses full slot
    uint256 b;  // New slot
    uint8 c;    // Uses full slot
}

// ✅ GOOD: Pack into fewer slots
contract Efficient {
    uint8 a;    // Slot 0 (8 bits)
    uint8 c;    // Slot 0 (16 bits total)
    uint256 b;  // Slot 1 (256 bits)
    // Saves 1 storage slot = ~20k gas
}

// ✅ BETTER: Struct packing
struct User {
    address wallet;     // 160 bits
    uint96 balance;     // 96 bits (fits in same slot = 256 bits)
    uint32 lastUpdate;  // Slot 1 (32 bits)
    bool active;        // Slot 1 (33 bits total)
}

// ❌ BAD: Repeated SLOAD (each costs 100+ gas)
function getTotal() external view returns (uint256) {
    return users[msg.sender].balance +
           users[msg.sender].rewards +
           users[msg.sender].staked;
}

// ✅ GOOD: Single SLOAD via memory caching
function getTotal() external view returns (uint256) {
    User memory user = users[msg.sender]; // One SLOAD
    return user.balance + user.rewards + user.staked;
}
```

### Loop and Call Optimization
```solidity
// ❌ BAD: Growing array in loop
function badLoop(uint256[] calldata items) external {
    for (uint256 i = 0; i < items.length; i++) {
        results.push(items[i] * 2); // SSTORE each iteration
    }
}

// ✅ GOOD: Batch operations
function goodLoop(uint256[] calldata items) external {
    uint256 len = items.length; // Cache length
    for (uint256 i; i < len;) {
        // Process items
        unchecked { ++i; } // Save gas on overflow check
    }
}

// ✅ BETTER: Use calldata for read-only arrays
function processData(uint256[] calldata data) external pure returns (uint256) {
    // calldata is cheaper than memory for external functions
    uint256 sum;
    for (uint256 i; i < data.length;) {
        sum += data[i];
        unchecked { ++i; }
    }
    return sum;
}
```

### Custom Errors vs Revert Strings
```solidity
// ❌ BAD: Expensive revert strings
require(balance >= amount, "Insufficient balance for withdrawal");

// ✅ GOOD: Custom errors (saves ~50 gas per revert)
error InsufficientBalance(uint256 available, uint256 required);

if (balance < amount) revert InsufficientBalance(balance, amount);
```

## Security Patterns

### Reentrancy Protection
```solidity
// ❌ VULNERABLE: State change after external call
function withdraw() external {
    uint256 amount = balances[msg.sender];
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] = 0; // Too late!
}

// ✅ SAFE: Checks-Effects-Interactions pattern
function withdraw() external nonReentrant {
    uint256 amount = balances[msg.sender];

    // Checks
    require(amount > 0, "No balance");

    // Effects (state changes BEFORE external call)
    balances[msg.sender] = 0;

    // Interactions (external calls last)
    (bool success,) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
```

### Integer Overflow/Underflow
```solidity
// ✅ Solidity 0.8.x: Built-in overflow checks
function safeAdd(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b; // Automatically reverts on overflow
}

// Use unchecked for gas savings when overflow impossible
function increment(uint256 counter) public pure returns (uint256) {
    unchecked {
        return counter + 1; // Save gas, ensure counter < type(uint256).max
    }
}
```

### Access Control
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureVault is Ownable {
    mapping(address => bool) public authorized;

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function withdraw(uint256 amount) external onlyAuthorized {
        // Protected function
    }

    function authorize(address user) external onlyOwner {
        authorized[user] = true;
    }
}
```

## Advanced Patterns

### Proxy Pattern (Upgradability)
```solidity
// UUPS Proxy pattern
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContractV1 is UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function setValue(uint256 _value) external {
        value = _value;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}

// V2 adds new functionality
contract MyContractV2 is MyContractV1 {
    uint256 public newValue;

    function setNewValue(uint256 _value) external {
        newValue = _value;
    }
}
```

### Factory Pattern
```solidity
contract TokenFactory {
    event TokenCreated(address indexed token, address indexed creator);

    function createToken(
        string memory name,
        string memory symbol
    ) external returns (address) {
        MyToken token = new MyToken(name, symbol, msg.sender);
        emit TokenCreated(address(token), msg.sender);
        return address(token);
    }

    // Deterministic deployment with CREATE2
    function createToken2(
        string memory name,
        string memory symbol,
        bytes32 salt
    ) external returns (address) {
        MyToken token = new MyToken{salt: salt}(name, symbol, msg.sender);
        emit TokenCreated(address(token), msg.sender);
        return address(token);
    }
}
```

## Testing with Hardhat

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MyToken", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy(owner.address);
    return { token, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), owner.address))
        .to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should mint tokens when called by minter", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.mint(addr1.address, 1000))
        .to.emit(token, "TokensMinted")
        .withArgs(addr1.address, 1000);

      expect(await token.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should revert when exceeding max supply", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const MAX_SUPPLY = await token.MAX_SUPPLY();

      await expect(token.mint(addr1.address, MAX_SUPPLY.add(1)))
        .to.be.revertedWithCustomError(token, "MaxSupplyExceeded");
    });
  });

  describe("Gas Optimization", function () {
    it("Should use less than 100k gas for mint", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const tx = await token.mint(addr1.address, 1000);
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });
  });
});
```

## Common Vulnerabilities (2025)

1. **Reentrancy**: Use ReentrancyGuard, follow CEI pattern
2. **Integer Overflow**: Use Solidity 0.8.x or SafeMath
3. **Access Control**: Use OpenZeppelin AccessControl or Ownable
4. **Front-running**: Use commit-reveal or flashbots
5. **Timestamp Dependence**: Don't rely on block.timestamp for randomness
6. **Delegate Call**: Understand storage layout in proxy patterns
7. **Unchecked External Calls**: Always check return values
8. **Gas Limit DoS**: Avoid unbounded loops over user-controlled data

## Best Practices

- Use OpenZeppelin contracts for standards
- Follow CEI (Checks-Effects-Interactions) pattern
- Write comprehensive tests (>90% coverage)
- Get audits from reputable firms (Trail of Bits, OpenZeppelin, etc.)
- Use static analysis tools (Slither, Mythril, Manticore)
- Pack storage variables efficiently
- Use custom errors over revert strings
- Prefer pull over push payment patterns
- Implement circuit breakers (Pausable)
- Document thoroughly with NatSpec

## Deployment Tools

- **Hardhat**: Testing, deployment, debugging
- **Foundry**: Fast testing in Solidity, fuzzing
- **Tenderly**: Monitoring and simulation
- **Defender**: Automated operations and monitoring
