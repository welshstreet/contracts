# Contracts

Welsh Street is a decentralized exchange (DEX) to support STREET, and the Meme Rewards Protocol, built on Stacks blockchain. The DEX enables swaps between Welsh Corgi Coin (WELSH) and Street Token (STREET), liquidity provisioning, and a dedicated emission and rewards system for liquidity providers.

## Architecture

The contracts form an integrated DeFi ecosystem where:
- Users provide WELSH/STREET liquidity and receive CREDIT LP tokens
- Trading fees and STREET emissions accumulate in the rewards contract
- LP token holders can claim proportional rewards at any time

## Core Contracts

### credit-controller

- **Contract:** `credit-controller.clar`
- Utility contract to transfer CREDIT tokens between accounts
- Manages CREDIT transfers with authorization controls and balance validation
- Enables user-to-user LP token transfers outside of liquidity operations
- Maintains accurate rewards accounting during LP token transfers
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x9ee4b659896e1af3b37b87f8e79515697dfa0e50c13aa18ce71e75a3686a0aac?chain=testnet)

### credit-token

- **Contract:** `credit-token.clar`
- **LP Tokens**: Manages liquidity provider (LP) token issuance and tracking
- CREDIT tokens represent proportional ownership of liquidity pools
- Handles minting, burning, and balance management for LP positions
- Implements SIP-010 fungible token standard
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x4bd86c3929599dfbd09a963e131a3a3f7bb894d00fdd9023d021b1408522b770?chain=testnet)

### emission-controller

- **Contract:** `emission-controller.clar`
- **Emission System**: Controls fixed-emission STREET minting for rewards distribution
- Mints STREET tokens on a per-block schedule to maintain perpetual rewards
- Enforces emission intervals and eligibility requirements
- Automatically routes emissions to the rewards contract
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x7ba045e99a36d6c9cbf7a87c8e8e1b39ad7940cd721bbb838bfd55b3609ae97d?chain=testnet)

### street-controller

- **Contract:** `street-controller.clar`
- **Genesis NFT Controller**: Manages the Genesis NFT mint event
- Coordinates STREET distribution and NFT minting during genesis event
- Collects WELSH donations for the rewards pool (1,000 WELSH per mint)
- Enforces mint cap (21,000 NFTs) and per-user limits (2 NFTs)
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x0eb58ec2f441bd98421c8ba4c5c0ce4926986d4702736f414808b6101b35f189?chain=testnet)

### street-market

- **Contract:** `street-market.clar`
- **Core DEX**: Automated Market Maker (AMM) for WELSH/STREET trading
- Supports five liquidity functions: initial, provide, remove, lock, and burn
- Implements token swaps with fee collection (0.5% per side)
- Features locked liquidity tracking and withdrawal tax (1%)
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x82f21946bfde3e05ef2998fe97c3cf9255953e9ccc481288f54eceb45825fc4a?chain=testnet)

### street-nft

- **Contract:** `street-nft.clar`
- **Genesis NFT**: Commemorative NFT collection for genesis event participants
- Mints 21,000 unique NFTs with token type and background attributes
- Tracks user ownership (max 2 per user) and supports transfers
- Non-fungible token representing participation in STREET distribution
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x9c427633ba6a8eb96f0c79fd15607ce087e40ee8cf9015e83bd190f1bae572ef?chain=testnet)

### street-rewards

- **Contract:** `street-rewards.clar`
- **Rewards Distribution**: Distributes trading fees and emissions to LP token holders
- Implements zero-debt cumulative distribution with global index accounting
- Supports claiming of both WELSH and STREET token rewards
- Handles cleanup of dust amounts and donation mechanisms
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x96a36e466a5c781868c3bc087668942b3d3e4bc3d8fb065b209657f112b66a5c?chain=testnet)

### street-token

- **Contract:** `street-token.clar`
- **STREET Token**: Rewards token with fixed-emission issuance
- Initial supply: 2B STREET for liquidity + 3B for genesis distribution
- Minted by emission-controller and street-controller only
- Implements SIP-010 fungible token standard
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xbf979b1ba3938888fac622a2792e1def682ddbf8cfda717a6d61bd63f5f3085b?chain=testnet)

### welsh-faucet

- **Contract:** `welsh-faucet.clar`
- **Testnet Faucet**: Provides testnet WELSH for development and testing
- Implements cooldown period between requests
- Testnet-only contract, not deployed to mainnet
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x4de816e9f3b600d3a69bd0f6da6b917caca29712cf7bcbff5b3e8afa977a68ce?chain=testnet)

### welshcorgicoin

- **Contract:** `welshcorgicoin.clar`
- **WELSH Token**: Fixed-supply community token (10B total)
- Exact replica of mainnet welshcorgicoin for testing purposes
- Implements SIP-010 standard with transfer, balance, and metadata functions
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xdfd6c2dd79880e950fdd3267a07acea59045ca8a4248ae73f6029e6ac46227dc?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin?chain=mainnet)