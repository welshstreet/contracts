import { describe, it } from "vitest";
import { disp, DONATE_STREET, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardPoolInfo, cleanupRewards } from "./functions/street-rewards-helper-functions";
import { transfer } from "./functions/transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CLEANUP REWARDS TESTS ===", () => {
    it("=== CLEANUP REWARDS PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        const { rewardData, supplyData } = setupLiquidityUsers(disp);

        // Initialize let variables from setup for tracking state through test
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        let rewardsA = rewardData.rewardsA;
        let rewardsB = rewardData.rewardsB;
        let totalLpSupply = supplyData.credit;

        // STEP 2: Deployer transfer rewards instead of donates rewards to rewards contract
        transfer(DONATE_WELSH, 'welshcorgicoin', deployer, {address: deployer, contractName: 'street-rewards' }, disp);
        transfer(DONATE_STREET, 'street-token', deployer, {address: deployer, contractName: 'street-rewards' }, disp);

        // Advance burn blocks to meet CLEANUP_INTERVAL requirement (144 blocks)
        simnet.mineEmptyBurnBlocks(141);
        
        cleanupRewards(DONATE_WELSH, DONATE_STREET, deployer, disp)

        // Calculate expected global indexes after cleanup
        let expectedGlobalIndexA = globalIndexA + Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        let expectedGlobalIndexB = globalIndexB + Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);
        
        // Update rewards to include the cleanup amounts
        rewardsA += DONATE_WELSH;
        rewardsB += DONATE_STREET;

        getRewardPoolInfo(
            expectedGlobalIndexA,
            expectedGlobalIndexB,
            rewardsA,
            rewardsB,
            deployer,
            disp
        )
    })
});
