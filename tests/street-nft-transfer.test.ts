import { describe, it, expect } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp } from "./vitestconfig";
import { getNftOwner, nftTransfer } from "./functions/street-nft-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== STREET NFT TRANSFER TESTS ===", () => {
    it("=== NFT TRANSFER PASS ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        // setupLiquidityUsers completes 3 mints:
        //   - Deployer: epoch 1, NFT #1
        //   - Wallet1: epoch 2, NFT #2
        //   - Wallet2: epoch 3, NFT #3
        setupLiquidityUsers(disp);
        
        // STEP 2: Verify deployer owns NFT #1
        let owner1 = getNftOwner(1, disp);
        expect(owner1).toEqual(deployer);
        
        // STEP 3: Transfer NFT #1 from deployer to wallet1
        nftTransfer(1, deployer, wallet1, deployer, disp);
        
        // STEP 4: Verify wallet1 now owns NFT #1
        let newOwner1 = getNftOwner(1, disp);
        expect(newOwner1).toEqual(wallet1);
        
        if (disp) {
            console.log(`✅ Successfully transferred NFT #1 from ${deployer} to ${wallet1}`);
        }
    });

    it("=== ERR_NOT_AUTHORIZED - NFT TRANSFER ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        setupLiquidityUsers(disp);
        
        // STEP 2: Verify wallet1 owns NFT #2
        let owner2 = getNftOwner(2, disp);
        expect(owner2).toEqual(wallet1);
        
        // STEP 3: Wallet2 tries to transfer wallet1's NFT (should fail)
        // tx-sender (wallet2) is not the sender (wallet1), so ERR_NOT_AUTHORIZED (992)
        nftTransfer(2, wallet1, wallet2, wallet2, disp);
        
        // STEP 4: Verify wallet1 still owns NFT #2
        let stillOwner2 = getNftOwner(2, disp);
        expect(stillOwner2).toEqual(wallet1);
        
        if (disp) {
            console.log(`✅ NFT transfer correctly rejected - unauthorized caller`);
        }
    });

    it("=== ERR_NOT_OWNER - NFT TRANSFER ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        setupLiquidityUsers(disp);
        
        // STEP 2: Verify deployer owns NFT #1
        let owner1 = getNftOwner(1, disp);
        expect(owner1).toEqual(deployer);
        
        // STEP 3: Deployer tries to transfer with wrong sender parameter (should fail)
        // Deployer is tx-sender and caller, but claims wallet1 is sender - ERR_NOT_OWNER (994)
        nftTransfer(1, wallet1, wallet2, deployer, disp);
        
        // STEP 4: Verify deployer still owns NFT #1
        let stillOwner1 = getNftOwner(1, disp);
        expect(stillOwner1).toEqual(deployer);
        
        if (disp) {
            console.log(`✅ NFT transfer correctly rejected - sender not owner`);
        }
    });

    it("=== ERR_NOT_FOUND - NFT TRANSFER ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        setupLiquidityUsers(disp);
        
        // STEP 2: Try to transfer non-existent NFT #999 (should fail)
        // Token doesn't exist - ERR_NOT_FOUND (993)
        nftTransfer(999, deployer, wallet1, deployer, disp);
        
        // STEP 3: Verify NFT #999 doesn't exist
        let owner999 = getNftOwner(999, disp);
        expect(owner999).toEqual(null);
        
        if (disp) {
            console.log(`✅ NFT transfer correctly rejected - token not found`);
        }
    });
});
