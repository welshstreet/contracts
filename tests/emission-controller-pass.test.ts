import { describe, it } from "vitest";
import { disp, EMISSION_AMOUNT } from './vitestconfig';
import { emissionMint } from "./functions/emission-controller-helper-functions";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { getTokenBalances } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== EMISSION CONTROLLER TESTS ===", () => {
    it("=== EMISSION CONTROLLER PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const { supplyData, userData } = setupInitialLiquidity(false);

        let deployerWelsh = userData.deployer.balances.welsh;
        let deployerStreet = userData.deployer.balances.street;
        let deployerCredit = userData.deployer.balances.credit;
        let rewardsPoolStreet = 0; // rewards pool starts at 0
        let totalSupplyStreet = supplyData.street  

        // STEP 2: check deployer's welsh and street balances before setup
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);

        // STEP 3: call emission controller function to mint tokens to rewards pool
        let blockExpected = 3; // burn-block-height after setup
        let epochExpected = 1; // first mint

        emissionMint(EMISSION_AMOUNT, blockExpected, epochExpected, deployer, disp);

        // STEP 4: check deployer's welsh and street balances after mint
        
        deployerWelsh = deployerWelsh  // previous balance
        deployerStreet = deployerStreet; // no change (all goes to rewards)
        rewardsPoolStreet = rewardsPoolStreet + EMISSION_AMOUNT; // previous balance + amount
        totalSupplyStreet = totalSupplyStreet + EMISSION_AMOUNT; // previous total supply + amount
        
        getTokenBalances(deployerWelsh, deployerStreet, deployerCredit, deployer, disp);
        getBalance(rewardsPoolStreet, 'street-token', { address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getTotalSupply(totalSupplyStreet, "street-token", deployer, disp);
    });
});