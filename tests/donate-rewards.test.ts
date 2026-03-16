import { describe, it } from "vitest";
import { disp, DONATE_STREET, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardPoolInfo, donateRewards, getRewardUserInfo, claimRewards } from "./functions/street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== DONATE REWARDS TESTS ===", () => {
    it("=== DONATE REWARDS BUG TEST ===", () => {
        // STEP 1: Setup liquidity and user state
        const { rewardData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Check initial reward pool state (has WELSH from setup mints)
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        let rewardsA = rewardData.rewardsA;
        let rewardsB = rewardData.rewardsB;
        
        getRewardPoolInfo(
            globalIndexA,  // global-index-a from setup
            globalIndexB,  // global-index-b from setup
            rewardsA,      // rewards-a balance from setup
            rewardsB,      // rewards-b balance from setup
            deployer,
            disp
        )
        // STEP 3: Check deployer's initial user reward info (after providing LP)
        let deployerLpBalance = userData.deployer.balances.credit;
        let deployerIndexA = userData.deployer.rewardUserInfo.indexA;
        let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        let deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;
        let deployerBlock = userData.deployer.rewardUserInfo.block;
        
        getRewardUserInfo(
            deployer,
            deployerLpBalance,   // balanceExpected: LP balance from setup
            deployerBlock,       // blockExpected: use actual deployer block from userData
            0,  // debtAExpected: should be 0 initially
            0,  // debtBExpected: should be 0 initially
            deployerIndexA,  // indexAExpected: use actual deployer index from userData
            0,  // indexBExpected: should be 0 from initial LP
            deployerUnclaimedA,  // unclaimedAExpected: use actual unclaimed from userData
            deployerUnclaimedB,  // unclaimedBExpected: use actual unclaimed from userData
            deployer,
            disp
        );
        
        // STEP 4: Deployer donates rewards to rewards contract
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp)

        // STEP 5: Update values after donation
        const totalLpSupply = supplyData.credit;
        const donationIndexIncreaseA = Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        const donationIndexIncreaseB = Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);
        globalIndexA += donationIndexIncreaseA;
        globalIndexB += donationIndexIncreaseB;
        rewardsA += DONATE_WELSH;
        rewardsB += DONATE_STREET;

        // STEP 6: Verify global indexes updated correctly
        getRewardPoolInfo(
            globalIndexA,
            globalIndexB,
            rewardsA,  // Updated rewards after donation
            rewardsB,  // Updated rewards after donation
            deployer,
            disp
        )

        // STEP 7: Check deployer's unclaimed rewards after donation  
        // CRITICAL TEST: Deployer should be able to claim the donated rewards
        // Calculate deployer's share based on their LP holdings and the donation increase
        deployerUnclaimedA = deployerUnclaimedA + Math.floor((deployerLpBalance * donationIndexIncreaseA) / PRECISION);
        deployerUnclaimedB = Math.floor((deployerLpBalance * donationIndexIncreaseB) / PRECISION);
        
        if (disp) {
            console.log(`Expected unclaimed A: ${deployerUnclaimedA} (original + donation share)`);
            console.log(`Expected unclaimed B: ${deployerUnclaimedB} (donated ${DONATE_STREET})`);
        }

        getRewardUserInfo(
            deployer,
            deployerLpBalance,   // balanceExpected: LP balance unchanged
            deployerBlock,       // blockExpected: use deployer block (unchanged by donation)
            0,  // debtAExpected: should still be 0
            0,  // debtBExpected: should still be 0  
            deployerIndexA,  // indexAExpected: user index remains unchanged from before donation
            0,  // indexBExpected: should still be 0 from initial LP - NOT updated by donation
            deployerUnclaimedA,  // unclaimedAExpected: calculated from LP share
            deployerUnclaimedB,  // unclaimedBExpected: calculated from LP share
            deployer,
            disp
        );

        // STEP 8: THE CRITICAL TEST - Can deployer actually claim the donated rewards?
        if (disp) {
            console.log(`CRITICAL TEST: Attempting to claim donated rewards...`);
        }
        
        claimRewards(
            deployerUnclaimedA,  // Should be able to claim calculated WELSH
            deployerUnclaimedB,  // Should be able to claim calculated STREET
            deployer,
            disp
        );

        if (disp) {
            console.log(`SUCCESS: Deployer can claim their own donated rewards!`);
        }
    })
});
