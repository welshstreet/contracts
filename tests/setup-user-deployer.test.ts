import { describe, it } from "vitest";
import { setupUserDeployer } from "./functions/setup-user-deployer-helper-function";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { getTokenBalances } from "./functions/utility-helper-functions";
import { disp } from './vitestconfig';

describe("=== SETUP USER DEPLOYER TESTS ===", () => {
    it("=== SETUP USER DEPLOYER PASS ===", () => {
        // STEP 1: Setup initial liquidity (required for mint to work)
        let { rewardData, userData } = setupInitialLiquidity(disp);

        // STEP 2: Call setupUserDeployer to mint STREET tokens
        // STEP 2: Call setupUserDeployer to mint STREET tokens
        ({ rewardData, userData } = setupUserDeployer(rewardData, userData, disp));

        // STEP 3: Verify final balances
        getTokenBalances(
            userData.deployer.balances.welsh,
            userData.deployer.balances.street, 
            userData.deployer.balances.credit,
            userData.deployer.address,
            disp
        );
    });
});