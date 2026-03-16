import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getCleanupRewards } from "./functions/street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CLEANUP REWARDS TESTS ===", () => {
    it("=== GET CLEANUP REWARDS PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        const { rewardData, userData } = setupLiquidityUsers(disp);
        if (disp) {
            console.log("=== Liquidity user setup complete ===");
            console.log("Setup userData:", userData);
        }

        // STEP 2: Extract reward values from setup
        // After setupLiquidityUsers, rewards have been accumulated from minting operations
        const rewardsA = rewardData.rewardsA;
        const rewardsB = rewardData.rewardsB;
        
        // STEP 3: Verify cleanup values after setup (no claims yet)
        getCleanupRewards(
            rewardsA, // actual-a: tokens in rewards contract
            rewardsB, // actual-b: tokens in rewards contract
            0, // claimed-a: no claims yet
            0, // claimed-b: no claims yet
            0, // cleanup-a: no excess tokens (actual == outstanding)
            0, // cleanup-b: no excess tokens (actual == outstanding)
            rewardsA, // distributed-a: accumulated from minting
            rewardsB, // distributed-b: accumulated from minting
            rewardsA, // outstanding-a: distributed - claimed
            rewardsB, // outstanding-b: distributed - claimed
            deployer,
            disp
        );
        
        if (disp) {
            console.log("=== Cleanup rewards calculation verified ===");
        }
    })
});
