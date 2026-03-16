import { describe, it, expect } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT } from "./vitestconfig";
import { getNftOwner, getUserMintedTokens } from "./functions/street-nft-helper-functions";
import { streetMint } from "./functions/street-controller-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== STREET NFT MINT TESTS ===", () => {
    it("=== STREET NFT MINT - MULTIPLE USERS PASS ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        // setupLiquidityUsers completes 3 mints:
        //   - Deployer: count 1, NFT #1
        //   - Wallet1: count 2, NFT #2
        //   - Wallet2: count 3, NFT #3
        setupLiquidityUsers(disp);
        
        // STEP 2: Verify NFTs from setup
        let owner1 = getNftOwner(1, disp);
        expect(owner1).toEqual(deployer);
        
        let owner2 = getNftOwner(2, disp);
        expect(owner2).toEqual(wallet1);
        
        let owner3 = getNftOwner(3, disp);
        expect(owner3).toEqual(wallet2);
        
        // STEP 3: Wallet1 mints their SECOND NFT (count 4, NFT #4)
        // Users can mint up to 2 times per the contract
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, 3, 4, wallet1, disp);
        let owner4 = getNftOwner(4, disp);
        expect(owner4).toEqual(wallet1);
        
        // Verify wallet1 now has both tokens [2, 4]
        let wallet1Tokens = getUserMintedTokens(wallet1, disp);
        expect(wallet1Tokens).toEqual([2, 4]);
        
        // STEP 4: Wallet2 mints their SECOND NFT (count 5, NFT #5)
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, 3, 5, wallet2, disp);
        let owner5 = getNftOwner(5, disp);
        expect(owner5).toEqual(wallet2);
        
        // Verify wallet2 now has both tokens [3, 5]
        let wallet2Tokens = getUserMintedTokens(wallet2, disp);
        expect(wallet2Tokens).toEqual([3, 5]);
        
        if (disp) {
            console.log(`✅ Successfully minted NFTs to multiple users`);
            console.log(`   NFT #1: ${deployer} (from setup)`);
            console.log(`   NFT #2: ${wallet1} (from setup)`);
            console.log(`   NFT #3: ${wallet2} (from setup)`);
            console.log(`   NFT #4: ${wallet1} (second mint)`);
            console.log(`   NFT #5: ${wallet2} (second mint)`);
            console.log(`   Wallet1 tokens: [${wallet1Tokens}]`);
            console.log(`   Wallet2 tokens: [${wallet2Tokens}]`);
        }
    });
});
