# Welsh Street Contracts

A decentralized exchange (DEX) to support $STREET, the world's first dedicated _meme rewards token_, built on Stacks blockchain. The DEX enables swaps between Welsh Corgi Coin (WELSH) and Street Token (STREET), liquidity provisioning, and a dedicated emission and rewards system for liquidity providers.

## Architecture

The contracts form an integrated DeFi ecosystem where:
- Users provide WELSH/STREET liquidity and receive CREDIT LP tokens
- Trading fees and STREET emissions accumulate in the rewards contract
- LP token holders can claim proportional rewards at any time

## Core Contracts

### Controller
- **Contract:** `controller.clar`
- Utility contract to transfer CREDIT between STX Accounts
- Manages the reward system adjustment and unclaimed reward tracking
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x7709d36dabb9139b022fb181f544bd5d4e3218a2ec2306e473af78649b791a02?chain=testnet)

### Credit
- **Contract:** `credit.clar`
- **LP Tokens**: Manages liquidity provider (LP) token issuance and tracking
- CREDIT tokens represent proportional ownership of liquidity pools
- Handles minting, burning, and balance management for LP positions
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x12c8b4e2b75d7a688119ca4f2ae13bedf057d0dcf9c16a8f1971b0de86422999?chain=testnet)

### Exchange

- **Contract:** `exchange.clar`
- **Core DEX**: Automated Market Maker (AMM) for WELSH/STREET trading
- Supports liquidity provision, removal with anti-whale provisions, and token swaps
- Implements slippage protection and fee collection (0.5% per side)
- Initial liquidity ratio: ~1 WELSH : 100 STREET
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x7c2b7ae9fa54d4d0618ffcba95a38e83939591fb17c383c825783c475ee986c9?chain=testnet)

### Rewards

- **Contract:** `rewards.clar`
- **Rewards Distribution**: Distributes trading fees and emissions to LP token holders
- Tracks reward global indices and accumulates rewards per share for fair distribution
- Supports claiming of both WELSH and STREET token rewards
- Handles pending rewards when no LP tokens exist
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x718378868dc939eec9dee056619175278e5829cad7e1eb8b339026e86714ed5f?chain=testnet)

### Street

- **Contract:** `street.clar`
- **STREET Token**: Secondary fungible token (10B total supply)
- Features emission-based minting with epochs and community mint cap (4B)
- Automatic emissions every block interval for rewards distribution
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x2d372fd7853b51ebfc2ed6374c61187b28e5c807af148a387222c42c01fd5bc7?chain=testnet)

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
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xf3566805dd4ff8303e05e4c76d10b4ef86692b4ba18369d9a897b4e340b351df?chain=testnet)

## Key Features

- **AMM Trading**: Constant product formula (x*y=k) with fee integration
- **Liquidity Mining**: LP token holders earn trading fees from both tokens
- **Emission Rewards**: STREET token emissions distributed to liquidity providers
- **Slippage Protection**: Configurable slippage limits for trades