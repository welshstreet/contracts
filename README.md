# Contracts

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
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x37d7b52dce6df587e67a8f1bae74e3791e819a2897e56ca9da4d8011c9b91351?chain=testnet)

### Credit
- **Contract:** `credit.clar`
- **LP Tokens**: Manages liquidity provider (LP) token issuance and tracking
- CREDIT tokens represent proportional ownership of liquidity pools
- Handles minting, burning, and balance management for LP positions
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x1b1f9d474cf0a65ebb840fa9bc7a94c4e05e2ad28f6b71239a175f14d3bb10f7?chain=testnet)

### Exchange

- **Contract:** `exchange.clar`
- **Core DEX**: Automated Market Maker (AMM) for WELSH/STREET trading
- Supports liquidity provision, removal with anti-whale provisions, and token swaps
- Implements slippage protection and fee collection (0.5% per side)
- Initial liquidity ratio: ~1 WELSH : 100 STREET
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x9522db22ead3113e883bfc667d9e865744e65a8b78a147021933fba2b44873de?chain=testnet)

### Rewards

- **Contract:** `rewards.clar`
- **Rewards Distribution**: Distributes trading fees and emissions to LP token holders
- Tracks reward global indices and accumulates rewards per share for fair distribution
- Supports claiming of both WELSH and STREET token rewards
- Handles pending rewards when no LP tokens exist
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xe55642db6adba0b22c4f74b4b0b93f75351d7433f67865dd98cbfb335117c2f8?chain=testnet)

### Street

- **Contract:** `street.clar`
- **STREET Token**: Secondary fungible token (10B total supply)
- Features emission-based minting with epochs and community mint cap (4B)
- Automatic emissions every block interval for rewards distribution
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x03be0b547ba04e51961e4b9adc1041c276304c872c57d17ed81a8424a1a406d8?chain=testnet)

### Welshcorgicoin

- **Contract:** `welshcorgicoin.clar`
- **WELSH Token**: Main fungible token (10B total supply)
- A replica of the `welshcorgicoin.clar` for testing and development purposes.
- Implements SIP-010 standard with transfer, balance, and metadata functions
- Pre-minted supply allocated to contract creator and distributed to community through CTO
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0x814c17c8e0695cc692df8659240ed2a1260497458f6d75d53a698137a577f36c?chain=testnet)

### Faucet
- **Contract:** `faucet.clar`
- A testnet only contract to provide testnet WELSH
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xd7d3ab88fc834e096019db33950dd29fe8a575fca346f6e74ca2307e6c99dee9?chain=testnet)

### Genesis

- **Contract:** `genesis.clar`
- **Liquidity Generation Event**
- Facilitates the transfer of WELSH to the genesis-address
- Seed round to raise funds for the initial liquidity pool
- 1,000,000,000 (10% of total supply) $STREET tokens distributed to participants
- Initial liquidity burned by deployer over time to insure fair distribution of initial liquidity
- **Contract Links:** [Testnet](https://explorer.hiro.so/txid/0xd2f0e80c5b482c7ada9714688c5bb7791ee5590de709eb947c70d7e6bbb7c91e?chain=testnet)