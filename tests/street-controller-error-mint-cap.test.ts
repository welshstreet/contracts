import { describe, it } from "vitest";
import { disp, MINT_STREET_AMOUNT,DONATE_WELSH_TO_MINT, TRANSFER_WELSH, INITIAL_MINT_WELSH, INITIAL_MINT_STREET, INITIAL_PROVIDE_WELSH, INITIAL_PROVIDE_STREET } from "./vitestconfig"
import { streetMint } from "./functions/street-controller-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transfer } from "./functions/transfer-helper-function";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== STREET CONTROLLER TESTS ===", () => {
    it("=== STREET CONTROLLER TEST - FAIL - MINT CAP ===", () => {
        // STEP 1: Setup initial liquidity (required for mint to work)
        setupInitialLiquidity(disp);
        
        // STEP 2: Deployer transfer WELSH to wallet1 & wallet2
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);
        let wallet1Welsh = getBalance(TRANSFER_WELSH, 'welshcorgicoin', wallet1, deployer, disp);
        let wallet1Street = 0;
        
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet2, disp);
        
        let rewardsWelsh = 0;

        // STEP 3: deployer calls mint from street-controller to mint STREET tokens
        let deployerWelsh = INITIAL_MINT_WELSH - INITIAL_PROVIDE_WELSH - TRANSFER_WELSH * 2; // Account for initial liquidity and transfers
        let deployerStreet = INITIAL_MINT_STREET - INITIAL_PROVIDE_STREET;

        let blockExpected = 3; // burn-block-height at time of mint
        let countExpected = 1; // First mint is count 1 (mint-count starts at 0, increments to 1)
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, deployer, disp);

        deployerWelsh = deployerWelsh - DONATE_WELSH_TO_MINT;
        deployerStreet = deployerStreet + MINT_STREET_AMOUNT;
        rewardsWelsh = rewardsWelsh + DONATE_WELSH_TO_MINT;

        getBalance(deployerWelsh, 'welshcorgicoin', deployer, deployer, disp);
        getBalance(deployerStreet, 'street-token', deployer, deployer, disp);
        getBalance(rewardsWelsh, 'welshcorgicoin', { address: deployer, contractName: 'street-rewards' }, deployer, disp);

        // STEP 4: wallet1 calls mint from street-controller to mint STREET tokens
        countExpected = 2; // Second mint is count 2
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, wallet1, disp);
        
        wallet1Welsh = wallet1Welsh - DONATE_WELSH_TO_MINT;
        wallet1Street = wallet1Street + MINT_STREET_AMOUNT;
        rewardsWelsh = rewardsWelsh + DONATE_WELSH_TO_MINT;

        getBalance(wallet1Welsh, 'welshcorgicoin', wallet1, deployer, disp);
        getBalance(wallet1Street, 'street-token', wallet1, deployer, disp);
    });
});