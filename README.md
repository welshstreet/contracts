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
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x031b4f129ff52fdfd7d3092a1d5656548621737e42be11064d9c2f6348315b71?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x4272f4e8ab3f5c0b0a4c22fce973abed38bef2f2af46584f3b1f5ca203627065?chain=mainnet)

### credit-token

- **Contract:** `credit-token.clar`
- **LP Tokens**: Manages liquidity provider (LP) token issuance and tracking
- CREDIT tokens represent proportional ownership of liquidity pools
- Handles minting, burning, and balance management for LP positions
- Implements SIP-010 fungible token standard
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x576bda22ec032b2a3705271225cd5fc279034a02ed7463d8cb9d9089bc985cc6?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x8ba8fb222426f3289b018e5ef96815ef272da5b0a46e237bcd3d9d4d22d9fa0a?chain=mainnet)

### emission-controller

- **Contract:** `emission-controller.clar`
- **Emission System**: Controls fixed-emission STREET minting for rewards distribution
- Mints STREET tokens on a per-block schedule to maintain perpetual rewards
- Enforces emission intervals and eligibility requirements
- Automatically routes emissions to the rewards contract
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x4e2df147b90993902dbc2f1193f80a210fed194352e7b913b44f1b5de105edb4?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x969ab6a71d30a5e0ced91782cb61396286e5ba7c01c635fe9be15423b786dd8e?chain=mainnet)

### street-controller

- **Contract:** `street-controller.clar`
- **Genesis NFT Controller**: Manages the Genesis NFT mint event
- Coordinates STREET distribution and NFT minting during genesis event
- Collects WELSH donations for the rewards pool (1,000 WELSH per mint)
- Enforces mint cap (21,000 NFTs) and per-user limits (2 NFTs)
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xc6ce6169598a8ea61c3a40bb615c1d414305f0097868a40521acaeec20daa406?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x00334230ea12bee405d28b26c07953b1dd043adca53c132683e2fc37d693b39a?chain=mainnet)

### street-market

- **Contract:** `street-market.clar`
- **Core DEX**: Automated Market Maker (AMM) for WELSH/STREET trading
- Supports five liquidity functions: initial, provide, remove, lock, and burn
- Implements token swaps with fee collection (0.5% per side)
- Features locked liquidity tracking and withdrawal tax (1%)
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x6fc6488d9451503b5dd7980e6253127322a8a557314ba66585d88c57d98c024a?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0xee93c4b66571ff6b4812d846c4a8418679d09910130bdb5181db9a07a55aa9d5?chain=mainnet)

### street-nft

- **Contract:** `street-nft.clar`
- **Genesis NFT**: Commemorative NFT collection for genesis event participants
- Mints 21,000 unique NFTs with token type and background attributes
- Tracks user ownership (max 2 per user) and supports transfers
- Non-fungible token representing participation in STREET distribution
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x604ade0e118196208aac9faf260105d2e5f7b16158c576bb0ceb9767b44a163b?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x34a33b43f68e2b1e1e47da434f567885dfa4bddc699ad34530a685fe0fe77411?chain=mainnet)

### street-rewards

- **Contract:** `street-rewards.clar`
- **Rewards Distribution**: Distributes trading fees and emissions to LP token holders
- Implements zero-debt cumulative distribution with global index accounting
- Supports claiming of both WELSH and STREET token rewards
- Handles cleanup of dust amounts and donation mechanisms
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x245aea740bf160bd5455df357a7fec89a8a0f705d5ec44df47dab3f509ff3e9c?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x1df6dfbafbfafe93750addfc3709784c0b977c9c708934827c17c2637ced4f48?chain=mainnet)

### street-token

- **Contract:** `street-token.clar`
- **STREET Token**: Rewards token with fixed-emission issuance
- Initial supply: 2B STREET for liquidity + 3B for genesis distribution
- Minted by emission-controller and street-controller only
- Implements SIP-010 fungible token standard
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x6417495fcad2e559feda4c2d18eae4ea3358e3febf74c2a5119719017dcee97f?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/0x2c510f5ccb8faf0a8df85eef6c7be83bfbfd855a379a89a753779842dc051b91?chain=mainnet)

### welsh-faucet

- **Contract:** `welsh-faucet.clar`
- **Testnet Faucet**: Provides testnet WELSH for development and testing
- Implements cooldown period between requests
- Testnet-only contract, not deployed to mainnet
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xb101c92acf12cca1b8abcee57b9a2f0f787987928e16a2716ee42918ed07cd4a?chain=testnet)

### welshcorgicoin

- **Contract:** `welshcorgicoin.clar` (testnet) `welshcorgicoin-token` (mainnet)
- **WELSH Token**: Fixed-supply community token (10B total)
- Exact replica of mainnet welshcorgicoin for testing purposes
- Implements SIP-010 standard with transfer, balance, and metadata functions
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x224c79c6de8465b0646c2b865d9eb693be90a0a5b4fc89e5b29a0160663fa23d?chain=testnet) [Mainnet](https://explorer.hiro.so/txid/SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin?chain=mainnet)