import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardPoolInfo, getRewardUserInfo } from "./functions/street-rewards-helper-functions";
import { disp } from "./vitestconfig"

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== REWARDS READ ONLY FUNCTIONS TESTS ===", () => {
    it("=== GET REWARD POOL INFO ===", () => {
        // STEP 1: Check initial reward pool info
        // Initially: no rewards distributed, so all values should be 0
        const globalIndexAExpected = 0;  // No rewards distributed yet
        const globalIndexBExpected = 0;  // No rewards distributed yet
        const rewardsAExpected = 0;      // No WELSH tokens in rewards contract yet
        const rewardsBExpected = 0;      // No STREET tokens in rewards contract yet

        getRewardPoolInfo(
            globalIndexAExpected,
            globalIndexBExpected,
            rewardsAExpected,
            rewardsBExpected,
            deployer,
            disp
        );
    });

    it("=== GET REWARD USER INFO ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        let { userData } = setupLiquidityUsers(disp);

        // STEP 2: Check deployer's reward info
        // After initial liquidity provision, deployer should have LP tokens but no rewards yet
        // IMPORTANT: initial-liquidity NOW calls increase-rewards
        // This creates the user-rewards map entry (needed for capital burn redistribution)
        const balanceExpected = userData.deployer.balances.credit // LP tokens from setup
        const blockExpected = simnet.blockHeight;       // Updated by initial-liquidity
        const debtAExpected = userData.deployer.rewardUserInfo.debtA; // Calculated based on global index at time of liquidity provision
        const debtBExpected = userData.deployer.rewardUserInfo.debtB; // Calculated based on global index at time of liquidity provision
        const indexAExpected = userData.deployer.rewardUserInfo.indexA;   // Should match global index at time of liquidity provision
        const indexBExpected = userData.deployer.rewardUserInfo.indexB;   // Should match global index at time of liquidity provision
        const unclaimedAExpected = userData.deployer.rewardUserInfo.unclaimedA
        const unclaimedBExpected = userData.deployer.rewardUserInfo.unclaimedB

        getRewardUserInfo(
            deployer,
            balanceExpected,      // balanceExpected: LP tokens from setup
            blockExpected,        // blockExpected: Updated by initial-liquidity
            debtAExpected,          // debtAExpected: No debt initially
            debtBExpected,          // debtBExpected: No debt initially
            indexAExpected,         // indexAExpected: Initial index
            indexBExpected,         // indexBExpected: Initial index
            unclaimedAExpected,     // unclaimedAExpected: No unclaimed WELSH rewards
            unclaimedBExpected,     // unclaimedBExpected: No unclaimed STREET rewards
            deployer,
            disp
        );
    });
});