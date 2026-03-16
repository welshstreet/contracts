import { describe, it } from "vitest";
import { disp, MINT_STREET_AMOUNT, DONATE_WELSH_TO_MINT, TRANSFER_WELSH } from "./vitestconfig"
import { streetMint } from "./functions/street-controller-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transfer } from "./functions/transfer-helper-function";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!

describe("=== STREET CONTROLLER ERROR TESTS ===", () => {
    it("=== STREET CONTROLLER TEST - FAIL - ALREADY MINTED===", () => {
        // STEP 1: Setup initial liquidity (required for mint to work)
        setupInitialLiquidity(disp);
        
        // STEP 2: Deployer transfer WELSH to wallet1
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);

        let wallet1Welsh = getBalance(TRANSFER_WELSH, 'welshcorgicoin', wallet1, deployer, disp);
        let wallet1Street = 0;
        let rewardsWelsh = 0;

        // STEP 3: wallet1 calls mint from street-controller to mint STREET tokens
        let blockExpected = 3; // burn-block-height at time of mint
        let countExpected = 1; // First mint is count 1 (mint-count starts at 0, increments to 1)
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, wallet1, disp);
        
        // STEP 4: Check user balances after minting STREET tokens
        wallet1Welsh = wallet1Welsh - DONATE_WELSH_TO_MINT;
        wallet1Street = wallet1Street + MINT_STREET_AMOUNT;
        rewardsWelsh = rewardsWelsh + DONATE_WELSH_TO_MINT;

        getBalance(wallet1Welsh, 'welshcorgicoin', wallet1, deployer, disp);
        getBalance(wallet1Street, 'street-token', wallet1, deployer, disp);
        getBalance(rewardsWelsh, 'welshcorgicoin', { address: deployer, contractName: 'street-rewards' }, deployer, disp);

        // STEP 5: wallet1 calls street-controller again (second mint, count 2)
        countExpected = 2; // Second mint is count 2
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, wallet1, disp);
    });

     it("=== STREET CONTROLLER TEST - FAIL - YOU POOR ===", () => {
        // STEP 1: check wallet1 balance (should be low on WELSH)
        let wallet1Welsh = 0;
        let wallet1Street = 0;
        let rewardsWelsh = 0;

        // STEP 2: wallet1 calls mint from street-controller to mint STREET tokens (should fail - no WELSH)
        let blockExpected = 3; // burn-block-height at time of mint
        let countExpected = 1; // Would be count 1 if successful (but will fail)
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, wallet1, disp);
        
        // STEP 3: Check user balances after minting STREET tokens
        wallet1Welsh = wallet1Welsh - 0;
        wallet1Street = wallet1Street + 0;
        rewardsWelsh = rewardsWelsh + 0

        getBalance(wallet1Welsh, 'welshcorgicoin', wallet1, deployer, disp);
        getBalance(wallet1Street, 'street-token', wallet1, deployer, disp);
        getBalance(rewardsWelsh, 'welshcorgicoin', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
    });

    it("=== STREET CONTROLLER TEST - FAIL - NO LIQUIDITY ===", () => {
        // STEP 1: Deployer transfer WELSH to wallet1 (no liquidity setup)
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);

        let wallet1Welsh = getBalance(TRANSFER_WELSH, 'welshcorgicoin', wallet1, deployer, disp);
        let wallet1Street = 0;
        let rewardsWelsh = 0;

        // STEP 2: wallet1 tries to mint without liquidity pool (should fail with ERR_NO_LIQUIDITY - 984)
        let blockExpected = 3;
        let countExpected = 1;
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, wallet1, disp);
        
        // STEP 3: Check balances remain unchanged
        getBalance(wallet1Welsh, 'welshcorgicoin', wallet1, deployer, disp);
        getBalance(wallet1Street, 'street-token', wallet1, deployer, disp);
        getBalance(rewardsWelsh, 'welshcorgicoin', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
    });
});