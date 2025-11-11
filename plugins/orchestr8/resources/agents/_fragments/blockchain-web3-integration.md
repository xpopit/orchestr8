---
id: blockchain-web3-integration
category: agent
tags: [blockchain, web3, ethereum, ethers, viem, wallets, transactions, events, dapp, frontend]
capabilities:
  - Web3 library integration (ethers.js, viem)
  - Wallet connection (MetaMask, WalletConnect)
  - Smart contract interaction from frontend
  - Transaction signing and broadcasting
  - Event listening and indexing
  - Testing blockchain integrations
useWhen:
  - Integrating Web3 wallets with MetaMask, WalletConnect, or Coinbase Wallet using ethers.js or web3.js for connecting, signing transactions, and reading blockchain data
  - Implementing wallet authentication using message signing (signMessage) for off-chain authentication, verifying signatures on backend, and managing user sessions
  - Interacting with smart contracts from frontend using Contract ABI, calling view functions, sending transactions with gas estimation, and handling transaction receipts
  - Building dApps with Web3 technologies including IPFS for decentralized storage, The Graph for indexing blockchain data, and ENS for human-readable addresses
  - Handling Web3 transactions with proper error handling for user rejections, insufficient gas, and using ethers.js events (once, on) for monitoring transaction status
  - Testing Web3 integrations with local blockchain (Hardhat Network, Ganache), mocking wallet interactions, and E2E testing with Synpress or Playwright
estimatedTokens: 680
---

# Web3 Integration Expert

Expert in integrating blockchain functionality into web applications using modern Web3 libraries, wallet connections, and smart contract interactions.

## Modern Web3 Stack (2025)

### Viem (Recommended for TypeScript)
```typescript
import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { parseEther, formatEther } from 'viem'

// Read-only client
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')
})

// Wallet client for transactions
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum) // MetaMask
})

// Type-safe contract interaction
import { contractABI } from './abi'

const contractAddress = '0x...' as const

// Read contract
const balance = await publicClient.readContract({
  address: contractAddress,
  abi: contractABI,
  functionName: 'balanceOf',
  args: ['0x...']
})

// Write contract
const { request } = await publicClient.simulateContract({
  address: contractAddress,
  abi: contractABI,
  functionName: 'transfer',
  args: ['0x...', parseEther('1.0')],
  account: '0x...'
})

const hash = await walletClient.writeContract(request)
const receipt = await publicClient.waitForTransactionReceipt({ hash })
```

### Ethers.js v6 (Widely Used)
```typescript
import { ethers } from 'ethers'

// Provider setup
const provider = new ethers.JsonRpcProvider(
  'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'
)

// Wallet from private key (backend)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

// Browser wallet (MetaMask)
const browserProvider = new ethers.BrowserProvider(window.ethereum)
const signer = await browserProvider.getSigner()

// Contract instance
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  ABI,
  signer
)

// Read contract
const balance = await contract.balanceOf('0x...')
console.log(ethers.formatEther(balance))

// Write contract with gas estimation
const tx = await contract.transfer('0x...', ethers.parseEther('1.0'), {
  gasLimit: 100000 // Optional override
})

const receipt = await tx.wait()
console.log('Transaction mined:', receipt.hash)
```

## Wallet Connection Patterns

### Multi-Wallet Support with Wagmi
```typescript
import { WagmiConfig, createConfig, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
)

// Create config with multiple connectors
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'YOUR_PROJECT_ID',
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'My dApp',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

// Wrap app
function App() {
  return (
    <WagmiConfig config={config}>
      <YourApp />
    </WagmiConfig>
  )
}
```

### React Wallet Connection Hook
```typescript
import { useConnect, useAccount, useDisconnect } from 'wagmi'

function WalletConnect() {
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          {isLoading && connector.id === pendingConnector?.id && ' (connecting)'}
        </button>
      ))}
      {error && <div>{error.message}</div>}
    </div>
  )
}
```

## Contract Interaction Patterns

### Type-Safe Contract Hook (React)
```typescript
import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'

// Read hook
function useTokenBalance(address?: string) {
  const { data, isError, isLoading } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true, // Re-fetch on new blocks
    enabled: !!address, // Only run if address exists
  })

  return {
    balance: data,
    isError,
    isLoading,
  }
}

// Write hook with preparation
function useTransferToken(to?: string, amount?: string) {
  const { config } = usePrepareContractWrite({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'transfer',
    args: [to, amount ? parseEther(amount) : 0n],
    enabled: !!to && !!amount,
  })

  const { write, data, isLoading, isSuccess, error } = useContractWrite(config)

  return {
    transfer: write,
    txHash: data?.hash,
    isLoading,
    isSuccess,
    error,
  }
}

// Usage in component
function TransferToken() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const { transfer, isLoading, isSuccess, error } = useTransferToken(to, amount)

  return (
    <div>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To address" />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      <button onClick={() => transfer?.()} disabled={!transfer || isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {isSuccess && <p>Transaction successful!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

## Event Listening and Indexing

### Listen to Contract Events (Viem)
```typescript
import { parseAbiItem } from 'viem'

// Watch for Transfer events
const unwatch = publicClient.watchContractEvent({
  address: TOKEN_ADDRESS,
  abi: TOKEN_ABI,
  eventName: 'Transfer',
  args: {
    from: '0x...', // Optional filter
  },
  onLogs: (logs) => {
    logs.forEach((log) => {
      console.log('Transfer:', {
        from: log.args.from,
        to: log.args.to,
        amount: formatEther(log.args.value),
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      })
    })
  },
})

// Get historical events
const logs = await publicClient.getContractEvents({
  address: TOKEN_ADDRESS,
  abi: TOKEN_ABI,
  eventName: 'Transfer',
  fromBlock: 18000000n,
  toBlock: 'latest',
})
```

### Event Indexing with The Graph
```graphql
# schema.graphql
type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  value: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

# mapping.ts
import { Transfer as TransferEvent } from '../generated/MyToken/MyToken'
import { Transfer } from '../generated/schema'

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.timestamp = event.block.timestamp
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash

  entity.save()
}
```

## Transaction Management

### Error Handling and Retry
```typescript
async function sendTransactionWithRetry(
  contract: Contract,
  method: string,
  args: any[],
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Estimate gas
      const gasEstimate = await contract[method].estimateGas(...args)
      const gasLimit = gasEstimate.mul(120).div(100) // Add 20% buffer

      // Send transaction
      const tx = await contract[method](...args, {
        gasLimit,
        // Use EIP-1559 if available
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      })

      // Wait for confirmation
      const receipt = await tx.wait(2) // Wait for 2 confirmations

      if (receipt.status === 1) {
        return receipt
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error)

      if (i === maxRetries - 1) throw error

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000))
    }
  }
}
```

### Batch Transactions (Multicall)
```typescript
import { multicall } from '@wagmi/core'

// Read multiple contracts in one call
const results = await multicall({
  contracts: [
    {
      address: TOKEN_A,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    },
    {
      address: TOKEN_B,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    },
    {
      address: TOKEN_A,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, SPENDER],
    },
  ],
})

const [balanceA, balanceB, allowance] = results.map((r) => r.result)
```

## Testing Web3 Integrations

### Hardhat Network Testing
```typescript
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('Token Frontend Integration', function () {
  let token: Contract
  let owner: SignerWithAddress
  let user: SignerWithAddress

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('MyToken')
    token = await Token.deploy(owner.address)
  })

  it('Should handle transfer from frontend', async function () {
    // Mint tokens
    await token.mint(owner.address, ethers.parseEther('100'))

    // Simulate frontend call
    const tx = await token.connect(owner).transfer(
      user.address,
      ethers.parseEther('10')
    )

    // Wait and verify
    const receipt = await tx.wait()
    expect(receipt.status).to.equal(1)

    const balance = await token.balanceOf(user.address)
    expect(balance).to.equal(ethers.parseEther('10'))
  })

  it('Should handle events', async function () {
    await token.mint(owner.address, ethers.parseEther('100'))

    await expect(token.transfer(user.address, ethers.parseEther('10')))
      .to.emit(token, 'Transfer')
      .withArgs(owner.address, user.address, ethers.parseEther('10'))
  })
})
```

### Mock Provider for Unit Tests
```typescript
import { MockProvider } from 'ethereum-waffle'

describe('Frontend Component Tests', () => {
  let provider: MockProvider
  let wallets: Wallet[]

  beforeEach(() => {
    provider = new MockProvider()
    wallets = provider.getWallets()
  })

  it('Should connect wallet', async () => {
    const wallet = wallets[0]
    const address = await wallet.getAddress()
    expect(address).to.match(/^0x[a-fA-F0-9]{40}$/)
  })
})
```

## Best Practices

1. **Error Handling**
   - Handle user rejections gracefully
   - Display clear error messages
   - Implement retry mechanisms for network failures

2. **Gas Optimization**
   - Estimate gas before transactions
   - Add buffer (10-20%) to gas estimates
   - Use EIP-1559 for predictable fees

3. **Security**
   - Validate all user inputs
   - Never expose private keys in frontend
   - Use reputable providers (Alchemy, Infura)
   - Implement transaction confirmations

4. **User Experience**
   - Show loading states
   - Display transaction status
   - Provide transaction explorers links
   - Handle wallet switching/disconnection

5. **Performance**
   - Use multicall for batch reads
   - Cache contract instances
   - Debounce provider requests
   - Use The Graph for complex queries

6. **Testing**
   - Test with local Hardhat network
   - Use testnets before mainnet
   - Mock wallet interactions
   - Test error scenarios

## Common Patterns

**Authentication:** Sign message for backend verification
**Signatures:** EIP-712 for typed data signing
**IPFS Integration:** Upload metadata, pin content
**ENS Resolution:** Resolve .eth names to addresses
**Chain Switching:** Handle multi-chain dApps
**Transaction History:** Index events via The Graph
