# Welsh Street Contracts

A novel decentralized exchange (DEX) to support $STREET, the world's first dedicated _meme rewards token_, built on Stacks blockchain. The DEX enables swaps between Welsh Corgi Coin (WELSH) and Street Token (STREET), liquidity provisioning, and a dedicated emission and rewards system for liquidity providers.

## Architecture

The contracts form an integrated DeFi ecosystem where:
- Users provide WELSH/STREET liquidity and receive CREDIT LP tokens
- Trading fees and STREET emissions accumulate in the rewards contract
- LP token holders can claim proportional rewards at any time
- The system maintains token reserves and reward distributions automatically

## Core Contracts

### Comptroller
- **Contract:** `comtroller.clar`
- Utility contract to transfer CREDIT between STX Accounts
- Manages the reward system adjustment and unclaimed reward tracking
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xe242b6a6881f4fa5dd869574f7af3ccf58ae59117fe8d12fcbefa719519ccc4f?chain=testnet)

### Credit
- **Contract:** `credit.clar`
- **LP Tokens**: Manages liquidity provider (LP) token issuance and tracking
- CREDIT tokens represent proportional ownership of liquidity pools
- Handles minting, burning, and balance management for LP positions
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x4eae5c536f2b70242a1bcdd0961e2da7489a42f6d961a37608053c3233ca30ea?chain=testnet)

### Exchange

- **Contract:** `exchange.clar`
- **Core DEX**: Automated Market Maker (AMM) for WELSH/STREET trading
- Supports liquidity provision, removal with anti-whale provisions, and token swaps
- Implements slippage protection and fee collection (0.5% per side)
- Initial liquidity ratio: ~1 WELSH : 100 STREET
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xa60ea83c52558ce01f89e69296cc7e69b145391b57b8a2925fc64332fc809ba6?chain=testnet)

### Rewards

- **Contract:** `rewards.clar`
- **Rewards Distribution**: Distributes trading fees and emissions to LP token holders
- Tracks reward global indices and accumulates rewards per share for fair distribution
- Supports claiming of both WELSH and STREET token rewards
- Handles pending rewards when no LP tokens exist
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x9e02677acede98cfabf4d829a9d14c3ddcbfd08c9cde7df6aa1f6ab1f20a6a4d?chain=testnet)

### Street

- **Contract:** `street.clar`
- **STREET Token**: Secondary fungible token (10B total supply)
- Features emission-based minting with epochs and community mint cap (4B)
- Automatic emissions every block interval for rewards distribution
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xcced49a9d91002944e9a904d88310c65b18d56066137688a82773652700f5714?chain=testnet)

### Welshcorgicoin

- **Contract:** `welshcorgicoin.clar`
- **WELSH Token**: Main fungible token (10B total supply)
- A replica of the `welshcorgicoin.clar` for testing and development purposes.
- Implements SIP-010 standard with transfer, balance, and metadata functions
- Pre-minted supply allocated to contract creator and distributed to community through CTO
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xfe50b937651df24fd0bdfd7f42b551021f855b476f47cae0d29ba830681b49b7?chain=testnet)

### Genesis

- **Contract:** `genesis.clar`
- **Liquidity Generation Event**
- Facilitates the transfer of WELSH to the genesis-address
- Seed round to raise funds for the initial liquidity pool
- 1,000,000,000 (10% of total supply) $STREET tokens distributed to participants
- Initial liquidity burned by deployer over time to insure fair distribution of initial liquidity
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xede718555757891c9aab46ca65af62ff714c355f5cb114335f08b0e254089e30?chain=testnet)

## Key Features

- **AMM Trading**: Constant product formula (x*y=k) with fee integration
- **Liquidity Mining**: LP token holders earn trading fees from both tokens
- **Emission Rewards**: STREET token emissions distributed to liquidity providers
- **Slippage Protection**: Configurable slippage limits for trades