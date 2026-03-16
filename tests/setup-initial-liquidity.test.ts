import { describe, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { getMarketInfo } from "./functions/street-market-helper-functions";
import { disp } from './vitestconfig';

describe("=== SETUP INITIAL TESTS ===", () => {
    it("=== SETUP INITIAL LIQUIDITY PASS ===", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
        let { marketData, rewardData, supplyData, userData } = setupInitialLiquidity(disp);
        if (disp) {console.log("Initial Liquidity Setup:", { marketData, rewardData, supplyData, userData })};

        // STEP 2: Verify the setup exchange info by calling getMarketInfo
        getMarketInfo(
            marketData.availA,
            marketData.availB,
            marketData.fee,
            marketData.lockedA,
            marketData.lockedB,
            marketData.reserveA,
            marketData.reserveB,
            marketData.tax,
            deployer,
            disp
        );

        // STEP 3: Validate on-chain state after initial liquidity
        if (disp) {
            console.log(" === ON-CHAIN VALIDATION AFTER INITIAL LIQUIDITY ===");
            
            // Read global reward pool state
            const onChainPoolInfo = simnet.callReadOnlyFn(
                "street-rewards",
                "get-reward-pool-info",
                [],
                deployer
            );
            const onChainPoolValue = (onChainPoolInfo.result as any).value.value;
            const onChainGlobalIndexA = Number(onChainPoolValue["global-index-a"].value);
            const onChainGlobalIndexB = Number(onChainPoolValue["global-index-b"].value);
            const onChainRewardsA = Number(onChainPoolValue["rewards-a"].value);
            const onChainRewardsB = Number(onChainPoolValue["rewards-b"].value);

            console.log(" Global Pool State:");
            console.log(`  Global Index A: ${onChainGlobalIndexA} (expected: 0 - no mints yet)`);
            console.log(`  Global Index B: ${onChainGlobalIndexB} (expected: 0 - no mints yet)`);
            console.log(`  Rewards A: ${onChainRewardsA} (expected: 0 - no donations yet)`);
            console.log(`  Rewards B: ${onChainRewardsB} (expected: 0 - no donations yet)`);

            // Read deployer's reward user state
            const onChainDeployerInfo = simnet.callReadOnlyFn(
                "street-rewards",
                "get-reward-user-info",
                [Cl.principal(deployer)],
                deployer
            );
            const onChainDeployerValue = (onChainDeployerInfo.result as any).value.value;
            const deployerBalance = Number(onChainDeployerValue["balance"].value);
            const deployerBlock = Number(onChainDeployerValue["block"].value);
            const deployerDebtA = Number(onChainDeployerValue["debt-a"].value);
            const deployerDebtB = Number(onChainDeployerValue["debt-b"].value);
            const deployerIndexA = Number(onChainDeployerValue["index-a"].value);
            const deployerIndexB = Number(onChainDeployerValue["index-b"].value);
            const deployerUnclaimedA = Number(onChainDeployerValue["unclaimed-a"].value);
            const deployerUnclaimedB = Number(onChainDeployerValue["unclaimed-b"].value);

            console.log(" Deployer Reward User State:");
            console.log(`  Balance (LP): ${deployerBalance} (expected: ${userData.deployer.balances.credit})`);
            console.log(`  Block: ${deployerBlock} (tx block of initial liquidity)`);
            console.log(`  Debt A: ${deployerDebtA} (expected: 0 - no prior claims)`);
            console.log(`  Debt B: ${deployerDebtB} (expected: 0 - no prior claims)`);
            console.log(`  Index A: ${deployerIndexA} (expected: 0 - set at LP provision)`);
            console.log(`  Index B: ${deployerIndexB} (expected: 0 - set at LP provision)`);
            console.log(`  Unclaimed A: ${deployerUnclaimedA} (expected: 0 - no rewards earned yet)`);
            console.log(`  Unclaimed B: ${deployerUnclaimedB} (expected: 0 - no rewards earned yet)`);

            // Manual calculation verification
            console.log(" === MANUAL CALCULATION VERIFICATION ===");
            console.log("After initial liquidity provision:");
            console.log(`  Deployer provided ${marketData.reserveA} WELSH + ${marketData.reserveB} STREET`);
            console.log(`  Deployer received ${userData.deployer.balances.credit} LP tokens`);
            console.log(`  Global indices remain at 0 (no mints/donations yet)`);
            console.log(`  Deployer's user index set to 0 at LP provision`);
            console.log(`  Deployer's unclaimed: (${deployerBalance} * (${onChainGlobalIndexA} - ${deployerIndexA})) / 1000000000 = ${Math.floor((deployerBalance * (onChainGlobalIndexA - deployerIndexA)) / 1000000000)}`);
            
            // Validation checks
            console.log(" === VALIDATION CHECKS ===");
            console.log(`  Global Index A is 0: ${onChainGlobalIndexA === 0 ? '✓' : 'x'}`);
            console.log(`  Global Index B is 0: ${onChainGlobalIndexB === 0 ? '✓' : 'x'}`);
            console.log(`  Deployer LP balance matches: ${deployerBalance === userData.deployer.balances.credit ? '✓' : 'x'}`);
            console.log(`  Deployer user index A is 0: ${deployerIndexA === 0 ? '✓' : 'x'}`);
            console.log(`  Deployer unclaimed A is 0: ${deployerUnclaimedA === 0 ? '✓' : 'x'}`);
            
            console.log(" === BASELINE STATE ESTABLISHED ===");
            console.log("This is the deployer's state BEFORE any street-mint operations.");
            console.log("Next: setupUserDeployer will call street-mint, which will:");
            console.log("  1. Mint 1% of STREET supply (10,000,000,000) to rewards");
            console.log("  2. Update global-index-a by: (10,000,000,000 * 1,000,000,000) / deployer_lp");
            console.log("  3. Deployer will start earning rewards from subsequent mints");
        }
    });
});