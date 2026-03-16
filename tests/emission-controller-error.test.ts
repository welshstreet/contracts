import { describe, it } from "vitest";
import { disp, EMISSION_AMOUNT, INITIAL_MINT_WELSH, INITIAL_MINT_STREET } from './vitestconfig';
import { emissionMint } from "./functions/emission-controller-helper-functions";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { getTokenBalances } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== EMISSION CONTROLLER ERROR TESTS ===", () => {
    it("=== EMISSION CONTROLLER FAIL - EMISSION INTERVAL ===", () => {
        // STEP 1: Setup initial liquidity
        const { supplyData, userData } = setupInitialLiquidity(false);
        
        let deployerWelsh = userData.deployer.balances.welsh;
        let deployerStreet = userData.deployer.balances.street;
        let deployerCredit = userData.deployer.balances.credit;
        let rewardsPoolStreet = 0;
        let totalSupplyStreet = supplyData.street  

        // STEP 2: check balances before first mint
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);

        // STEP 3: call emission controller function successfully
        let blockExpected = 3;
        let epochExpected = 1;

        emissionMint(EMISSION_AMOUNT, blockExpected, epochExpected, deployer, disp);

        // STEP 4: update balances after first mint
        deployerWelsh = deployerWelsh;
        deployerStreet = deployerStreet; // no change (all goes to rewards)
        rewardsPoolStreet = rewardsPoolStreet + EMISSION_AMOUNT;
        totalSupplyStreet = totalSupplyStreet + EMISSION_AMOUNT;
        
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);

        // STEP 5: try to mint again in same block (should fail with ERR_EMISSION_INTERVAL)
        const amountExpected = 0; // no amount since mint should fail

        emissionMint(amountExpected, blockExpected, epochExpected, deployer, disp);

        // STEP 6: check balances after failed mint (should be unchanged)
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);
    });

    it("=== EMISSION CONTROLLER FAIL - NOT ELIGIBLE ===", () => {
        // STEP 1: Setup initial liquidity with deployer
        const { supplyData, userData } = setupInitialLiquidity(false);
        const wallet1 = accounts.get("wallet_1")!;
        
        let deployerCredit = userData.deployer.balances.credit;
        let wallet1Welsh = 0; // wallet1 has no Welsh (starts with 0)
        let wallet1Street = 0; // and no Street
        let wallet1Credit = 0; // and no credit (hasn't provided liquidity)
        let rewardsPoolStreet = 0;
        let totalSupplyStreet = supplyData.street;

        // STEP 2: check balances before mint attempt
        getBalance(deployerCredit, 'credit-token', deployer, deployer, disp);
        getTokenBalances(wallet1Welsh, wallet1Street, wallet1Credit, wallet1, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);

        // STEP 3: wallet1 (with no credit) tries to mint (should fail with ERR_NOT_ELIGIBLE)
        let blockExpected = simnet.blockHeight;
        let epochExpected = 1;
        const amountExpected = 0; // no amount since mint should fail

        emissionMint(amountExpected, blockExpected, epochExpected, wallet1, disp);

        // STEP 4: check balances after failed mint (should be unchanged)
        getTokenBalances(wallet1Welsh, wallet1Street, wallet1Credit, wallet1, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);
    });

    it("=== EMISSION CONTROLLER FAIL - NO LIQUIDITY ===", () => {
        // STEP 1: No liquidity setup - deployer tries to mint without pool
        let deployerWelsh = INITIAL_MINT_WELSH; // Deployer starts with genesis balance
        let deployerStreet = INITIAL_MINT_STREET; // Deployer starts with genesis balance
        let deployerCredit = 0; // No LP tokens (no liquidity pool)
        let rewardsPoolStreet = 0;
        let totalSupplyStreet = INITIAL_MINT_STREET; // Only deployer's initial mint exists

        // STEP 2: check balances before mint attempt (no liquidity pool)
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);

        // STEP 3: deployer tries to mint emission without liquidity (should fail with ERR_NO_LIQUIDITY - 933)
        let blockExpected = simnet.blockHeight;
        let epochExpected = 1;
        const amountExpected = 0; // no amount since mint should fail

        emissionMint(amountExpected, blockExpected, epochExpected, deployer, disp);

        // STEP 4: check balances after failed mint (should be unchanged)
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);
    });
});