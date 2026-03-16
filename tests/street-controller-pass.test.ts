import { describe, it } from "vitest";
import { disp, MINT_STREET_AMOUNT, DONATE_WELSH_TO_MINT, INITIAL_MINT_WELSH, INITIAL_MINT_STREET, INITIAL_PROVIDE_WELSH, INITIAL_PROVIDE_STREET } from "./vitestconfig"
import { streetMint } from "./functions/street-controller-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== STREET CONTROLLER TESTS ===", () => {
    it("=== STREET CONTROLLER TEST - PASS ===", () => {
        // STEP 1: Setup initial liquidity (required for mint to work)
        setupInitialLiquidity(disp);
        
        // STEP 2: Deployer balance check after initial liquidity
        let deployerWelsh = INITIAL_MINT_WELSH - INITIAL_PROVIDE_WELSH;
        let deployerStreet = INITIAL_MINT_STREET - INITIAL_PROVIDE_STREET;
        let rewardsWelsh = 0;

        // STEP 3: deployer calls mint from street-controller to mint STREET tokens
        let blockExpected = 3; // burn-block-height at time of mint
        let countExpected = 1; // First mint is count=1 (mint-count starts at 0, increments to 1)
        streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, deployer, disp);
        
        // STEP 4: Check deployer balances after minting STREET tokens
        deployerWelsh = deployerWelsh - DONATE_WELSH_TO_MINT;
        deployerStreet = deployerStreet + MINT_STREET_AMOUNT;
        rewardsWelsh = rewardsWelsh + DONATE_WELSH_TO_MINT;

        getBalance(deployerWelsh, 'welshcorgicoin', deployer, deployer, disp);
        getBalance(deployerStreet, 'street-token', deployer, deployer, disp);
        getBalance(rewardsWelsh, 'welshcorgicoin', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
    });
});