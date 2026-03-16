import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardPoolInfo, getRewardUserInfo, claimRewards } from "./functions/street-rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== CLAIM REWARDS TESTS ===", () => {
    it("=== CLAIM REWARDS PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        const { rewardData, userData } = setupLiquidityUsers(disp);
        
        // STEP 2: Get wallet1's reward state from setup
        const wallet1RewardInfo = userData.wallet1.rewardUserInfo;
        const wallet1Balance = wallet1RewardInfo.balance;
        const unclaimedA = wallet1RewardInfo.unclaimedA;
        const unclaimedB = wallet1RewardInfo.unclaimedB;
        
        // STEP 3: Verify reward pool state before claim
        const globalIndexA = rewardData.globalIndexA;
        const globalIndexB = rewardData.globalIndexB;
        const rewardsA = rewardData.rewardsA;
        const rewardsB = rewardData.rewardsB;
        
        getRewardPoolInfo(
            globalIndexA,
            globalIndexB,
            rewardsA,
            rewardsB,
            deployer,
            disp
        );
        
        // STEP 4: Verify balances in rewards contract before claim
        getBalance(rewardsA, 'welshcorgicoin', {address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getBalance(rewardsB, 'street-token', {address: deployer, contractName: 'street-rewards' }, deployer, disp);

        // STEP 5: wallet1 claims rewards
        claimRewards(
            unclaimedA,
            unclaimedB,
            wallet1,
            disp
        )

        // STEP 6: Verify final balances in rewards contract after claim
        getBalance(rewardsA - unclaimedA, 'welshcorgicoin', {address: deployer, contractName: 'street-rewards' }, deployer, disp);
        getBalance(rewardsB - unclaimedB, 'street-token', {address: deployer, contractName: 'street-rewards' }, deployer, disp);

        // STEP 7: Verify reward pool state after claiming rewards
        getRewardPoolInfo(
            globalIndexA,
            globalIndexB,
            rewardsA - unclaimedA,
            rewardsB - unclaimedB,
            deployer,
            disp
        )

        // STEP 8: Verify wallet1's reward state after claiming
        // Note: Claiming rewards doesn't update the user's index, only their debt
        getRewardUserInfo(
            wallet1,
            wallet1Balance,
            wallet1RewardInfo.block,
            wallet1RewardInfo.debtA + unclaimedA,
            wallet1RewardInfo.debtB + unclaimedB,
            wallet1RewardInfo.indexA,  // User's index remains unchanged after claim
            wallet1RewardInfo.indexB,  // User's index remains unchanged after claim
            0,
            0,
            deployer,
            disp
        )
    });
})