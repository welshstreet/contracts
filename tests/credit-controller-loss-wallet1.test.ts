import { describe, it } from "vitest";
import { disp, PRECISION } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardUserInfo, claimRewards } from "./functions/street-rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/credit-controller-helper-functions";
import { burnLiquidity } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT CONTROLLER LOSS TEST WALLET1  ===", () => {
    it("=== CREDIT CONTROLLER LOSS TEST WALLET1 ===", () => {
        // TEST REQUIREMENT       
        // STEP 1: Setup environment (deployer + wallet1 + wallet2)
        // STEP 2: Deployer burns all liquidity to avoid further reward accumulation. 
        // STEP 3: Verify wallet1 and wallet2 unclaimed rewards after receiving deployer rewards
        // STEP 4: wallet1 transfers 50% CREDIT to wallet2
        // STEP 5: wallet2 claims all rewards
        // STEP 6: wallet2 transfers 100% CREDIT back to wallet1. 
        // STEP 7: Verify unclaimable balance of each account
        // STEP 8: Summarize the test results    

        // STEP 1: Setup liquidity and user state
        if (disp) console.log("\n=== STEP 1: SETUP LIQUIDITY USERS ===");
        let { marketData, rewardData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Deployer burns all liquidity to avoid further reward accumulation.
        if (disp) console.log("\n=== STEP 2: DEPLOYER BURNS ALL LIQUIDITY ===");
        let burnAmount = userData.deployer.balances.credit;
        let burnWelsh = Math.floor((burnAmount * marketData.reserveA) / supplyData.credit);
        let burnStreet = Math.floor((burnAmount * marketData.reserveB) / supplyData.credit);

        // Deployer forfeits 100% of unclaimed rewards (burning all LP)
        let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        let deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;

        burnLiquidity(burnAmount, deployer, disp);

        // Update in-memory model to reflect the burn
        userData.deployer.balances.credit -= burnAmount;
        userData.deployer.balances.welsh += burnWelsh;
        userData.deployer.balances.street += burnStreet;
        supplyData.credit -= burnAmount;
        marketData.reserveA -= burnWelsh;
        marketData.reserveB -= burnStreet;

        // Capture LP balances for remaining holders
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
        const totalLpAfterBurn = wallet1LpBalance + wallet2LpBalance;

        // Redistribution: deployer's forfeited unclaimed spread across remaining LP holders
        const redistributionA = Math.floor((deployerUnclaimedA * PRECISION) / totalLpAfterBurn);
        const redistributionB = Math.floor((deployerUnclaimedB * PRECISION) / totalLpAfterBurn);

        let globalIndexA = rewardData.globalIndexA + redistributionA;
        let globalIndexB = rewardData.globalIndexB + redistributionB;
        rewardData.globalIndexA = globalIndexA;
        rewardData.globalIndexB = globalIndexB;

        if (disp) {
            console.log(`Deployer unclaimed A forfeited: ${deployerUnclaimedA}`);
            console.log(`Deployer unclaimed B forfeited: ${deployerUnclaimedB}`);
            console.log(`Redistribution A per LP unit: ${redistributionA}`);
            console.log(`Redistribution B per LP unit: ${redistributionB}`);
            console.log(`New global index A: ${globalIndexA}`);
            console.log(`New global index B: ${globalIndexB}`);
            console.log(`Remaining LP (wallet1 + wallet2): ${totalLpAfterBurn}`);
        }

        // STEP 3: Verify wallet1 and wallet2 unclaimed rewards after receiving deployer rewards
        if (disp) console.log("\n=== STEP 3: VERIFY WALLET1 AND WALLET2 UNCLAIMED REWARDS ===");

        // Extract wallet1 and wallet2 reward state from userData
        let wallet1UserIndexA = userData.wallet1.rewardUserInfo.indexA;
        let wallet1UserIndexB = userData.wallet1.rewardUserInfo.indexB;
        let wallet1DebtA = userData.wallet1.rewardUserInfo.debtA;
        let wallet1DebtB = userData.wallet1.rewardUserInfo.debtB;
        let wallet1Block = userData.wallet1.rewardUserInfo.block;

        let wallet2UserIndexA = userData.wallet2.rewardUserInfo.indexA;
        let wallet2UserIndexB = userData.wallet2.rewardUserInfo.indexB;
        let wallet2DebtA = userData.wallet2.rewardUserInfo.debtA;
        let wallet2DebtB = userData.wallet2.rewardUserInfo.debtB;
        let wallet2Block = userData.wallet2.rewardUserInfo.block;

        // Calculate wallet1 and wallet2 unclaimed using updated global indices
        let wallet1UnclaimedA = Math.floor((wallet1LpBalance * (globalIndexA - wallet1UserIndexA)) / PRECISION) - wallet1DebtA;
        let wallet1UnclaimedB = Math.floor((wallet1LpBalance * (globalIndexB - wallet1UserIndexB)) / PRECISION) - wallet1DebtB;
        let wallet2UnclaimedA = Math.floor((wallet2LpBalance * (globalIndexA - wallet2UserIndexA)) / PRECISION) - wallet2DebtA;
        let wallet2UnclaimedB = Math.floor((wallet2LpBalance * (globalIndexB - wallet2UserIndexB)) / PRECISION) - wallet2DebtB;

        // Verify wallet1 unclaimed rewards on-chain
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            wallet1Block,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA,
            wallet1UnclaimedB,
            wallet1,
            disp
        );

        // Verify wallet2 unclaimed rewards on-chain
        getRewardUserInfo(
            wallet2,
            wallet2LpBalance,
            wallet2Block,
            wallet2DebtA,
            wallet2DebtB,
            wallet2UserIndexA,
            wallet2UserIndexB,
            wallet2UnclaimedA,
            wallet2UnclaimedB,
            wallet2,
            disp
        );

        if (disp) {
            console.log(`wallet1 unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`wallet1 unclaimed B: ${wallet1UnclaimedB}`);
            console.log(`wallet2 unclaimed A: ${wallet2UnclaimedA}`);
            console.log(`wallet2 unclaimed B: ${wallet2UnclaimedB}`);
        }

        // STEP 4: wallet1 transfers 50% CREDIT to wallet2
        if (disp) console.log("\n=== STEP 4: WALLET1 TRANSFERS 50% CREDIT TO WALLET2 ===");

        // decrease-rewards(wallet1, transferAmount):
        //   forfeit = (unclaimed * transferAmount) / old-balance  → 50% of wallet1's unclaimed
        //   redistributed to wallet2 (only remaining LP holder)
        //   wallet1 preserves the other 50% with a new index
        let transferAmount = wallet1LpBalance / 2; // 50% transfer
        let wallet1ForfeitA = Math.floor((wallet1UnclaimedA * transferAmount) / wallet1LpBalance);
        let wallet1ForfeitB = Math.floor((wallet1UnclaimedB * transferAmount) / wallet1LpBalance);
        let wallet1PreserveA = wallet1UnclaimedA - wallet1ForfeitA;
        let wallet1PreserveB = wallet1UnclaimedB - wallet1ForfeitB;

        // Forfeit redistributed to wallet2 → raises globalIndex
        globalIndexA += Math.floor((wallet1ForfeitA * PRECISION) / wallet2LpBalance);
        globalIndexB += Math.floor((wallet1ForfeitB * PRECISION) / wallet2LpBalance);

        // wallet1 new balance after transfer
        wallet1LpBalance -= transferAmount;

        // wallet1 new index adjusted to preserve remaining unclaimed
        wallet1UserIndexA = wallet1PreserveA > 0
            ? globalIndexA - Math.floor((wallet1PreserveA * PRECISION) / wallet1LpBalance)
            : globalIndexA;
        wallet1UserIndexB = wallet1PreserveB > 0
            ? globalIndexB - Math.floor((wallet1PreserveB * PRECISION) / wallet1LpBalance)
            : globalIndexB;
        wallet1UnclaimedA = wallet1PreserveA;
        wallet1UnclaimedB = wallet1PreserveB;
        wallet1DebtA = 0;
        wallet1DebtB = 0;

        // increase-rewards(wallet2, transferAmount):
        //   wallet2 unclaimed recalculated at new global before LP added
        //   then wallet2LpBalance grows, new index set to preserve unclaimed
        wallet2UnclaimedA = Math.floor((wallet2LpBalance * (globalIndexA - wallet2UserIndexA)) / PRECISION) - wallet2DebtA;
        wallet2UnclaimedB = Math.floor((wallet2LpBalance * (globalIndexB - wallet2UserIndexB)) / PRECISION) - wallet2DebtB;
        wallet2LpBalance += transferAmount;

        wallet2UserIndexA = wallet2UnclaimedA > 0
            ? globalIndexA - Math.floor((wallet2UnclaimedA * PRECISION) / wallet2LpBalance)
            : globalIndexA;
        wallet2UserIndexB = wallet2UnclaimedB > 0
            ? globalIndexB - Math.floor((wallet2UnclaimedB * PRECISION) / wallet2LpBalance)
            : globalIndexB;
        wallet2DebtA = 0;
        wallet2DebtB = 0;

        transferCredit(transferAmount, wallet1, wallet2, wallet1, undefined, disp);

        // Capture block after transfer executes
        wallet1Block = simnet.blockHeight;
        wallet2Block = simnet.blockHeight;

        // Update state after transfer
        rewardData.globalIndexA = globalIndexA;
        rewardData.globalIndexB = globalIndexB;
        userData.wallet1.balances.credit = wallet1LpBalance;
        userData.wallet2.balances.credit = wallet2LpBalance;
        supplyData.credit = wallet1LpBalance + wallet2LpBalance;

        // Verify wallet1 credit balance
        getBalance(wallet1LpBalance, "credit-token", wallet1, wallet1, disp);

        // Verify wallet2 credit balance
        getBalance(wallet2LpBalance, "credit-token", wallet2, wallet2, disp);

        // Verify wallet1 reward state after 50% transfer
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            wallet1Block,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA,
            wallet1UnclaimedB,
            wallet1,
            disp
        );

        // Verify wallet2 reward state after receiving wallet1's 50% LP
        getRewardUserInfo(
            wallet2,
            wallet2LpBalance,
            wallet2Block,
            wallet2DebtA,
            wallet2DebtB,
            wallet2UserIndexA,
            wallet2UserIndexB,
            wallet2UnclaimedA,
            wallet2UnclaimedB,
            wallet2,
            disp
        );

        if (disp) {
            console.log(`wallet1 LP balance: ${wallet1LpBalance}, unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`wallet2 LP balance: ${wallet2LpBalance}, unclaimed A: ${wallet2UnclaimedA}`);
        }

        // STEP 5: wallet2 claims all rewards
        if (disp) console.log("\n=== STEP 5: WALLET2 CLAIMS ALL REWARDS ===");

        // Capture wallet2's unclaimed before claiming (to compute new debt)
        let wallet2ClaimA = wallet2UnclaimedA;
        let wallet2ClaimB = wallet2UnclaimedB;

        claimRewards(wallet2ClaimA, wallet2ClaimB, wallet2, disp);

        // After claiming: debt += unclaimed, unclaimed = 0
        // Contract: unclaimed = (balance * (global - index)) / PRECISION - debt
        // New debt = old_debt + claimed → makes unclaimed = 0
        // Note: block does NOT change on claim — only updates when LP balance changes
        wallet2DebtA += wallet2ClaimA;
        wallet2DebtB += wallet2ClaimB;
        wallet2UnclaimedA = 0;
        wallet2UnclaimedB = 0;

        // Verify wallet2 reward state after claiming
        getRewardUserInfo(
            wallet2,
            wallet2LpBalance,
            wallet2Block,
            wallet2DebtA,
            wallet2DebtB,
            wallet2UserIndexA,
            wallet2UserIndexB,
            wallet2UnclaimedA,
            wallet2UnclaimedB,
            wallet2,
            disp
        );

        if (disp) {
            console.log(`wallet2 claimed A: ${wallet2ClaimA}`);
            console.log(`wallet2 new debt A: ${wallet2DebtA}`);
            console.log(`wallet2 unclaimed A after claim: ${wallet2UnclaimedA}`);
        }

        // STEP 6: wallet2 transfers 100% CREDIT back to wallet1
        if (disp) console.log("\n=== STEP 6: WALLET2 TRANSFERS 100% CREDIT BACK TO WALLET1 ===");

        // decrease-rewards(wallet2, wallet2LpBalance):
        //   wallet2 claimed all rewards in STEP 5 → unclaimed = 0 → forfeit = 0
        //   globalIndex unchanged — no redistribution occurs
        //   wallet2 entry deleted (balance → 0)
        // increase-rewards(wallet1, wallet2LpBalance):
        //   wallet1 current unclaimed preserved via preserve-idx at new combined balance
        let wallet2ForfeitA = 0; // wallet2 unclaimed = 0 after STEP 5 claim → no forfeit

        // globalIndex unchanged (no redistribution)
        // wallet1 unclaimed before LP is added
        let wallet1UnclaimedBeforeAdd = Math.floor((wallet1LpBalance * (globalIndexA - wallet1UserIndexA)) / PRECISION) - wallet1DebtA;

        // wallet1 new balance after receiving wallet2's LP
        wallet1LpBalance += wallet2LpBalance;

        // preserve-idx for wallet1: lock in existing unclaimed at new balance
        wallet1UserIndexA = wallet1UnclaimedBeforeAdd > 0
            ? globalIndexA - Math.floor((wallet1UnclaimedBeforeAdd * PRECISION) / wallet1LpBalance)
            : globalIndexA;
        wallet1UserIndexB = wallet1UnclaimedB > 0
            ? globalIndexB - Math.floor((wallet1UnclaimedB * PRECISION) / wallet1LpBalance)
            : globalIndexB;
        // Recompute unclaimed via preserve-idx round-trip — integer division loses a few units
        wallet1UnclaimedA = Math.floor((wallet1LpBalance * (globalIndexA - wallet1UserIndexA)) / PRECISION) - wallet1DebtA;
        wallet1UnclaimedB = Math.floor((wallet1LpBalance * (globalIndexB - wallet1UserIndexB)) / PRECISION) - wallet1DebtB;
        wallet1DebtA = 0;
        wallet1DebtB = 0;

        transferCredit(wallet2LpBalance, wallet2, wallet1, wallet2, undefined, disp);

        // Capture block after transfer
        wallet1Block = simnet.blockHeight;
        wallet2LpBalance = 0;
        userData.wallet1.balances.credit = wallet1LpBalance;
        userData.wallet2.balances.credit = 0;
        supplyData.credit = wallet1LpBalance;

        // Verify wallet2 credit balance = 0
        getBalance(0, "credit-token", wallet2, wallet2, disp);

        // Verify wallet1 credit balance = full supply
        getBalance(wallet1LpBalance, "credit-token", wallet1, wallet1, disp);

        // Verify wallet2 reward state — entry deleted, all zeros
        getRewardUserInfo(wallet2, 0, 0, 0, 0, 0, 0, 0, 0, wallet2, disp);

        // Verify wallet1 reward state after receiving wallet2's LP
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            wallet1Block,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA,
            wallet1UnclaimedB,
            wallet1,
            disp
        );

        if (disp) {
            console.log(`wallet2 forfeit A: ${wallet2ForfeitA} (no loss — wallet2 claimed first)`);
            console.log(`wallet1 LP balance: ${wallet1LpBalance}, unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`wallet2 LP balance: ${wallet2LpBalance} (entry deleted)`);
        }

        // STEP 7: Verify unclaimable balance of each account
        if (disp) console.log("\n=== STEP 7: VERIFY UNCLAIMABLE BALANCE OF EACH ACCOUNT ===");

        // deployer: burned all LP in STEP 2 → entry deleted, no unclaimed
        getRewardUserInfo(deployer, 0, 0, 0, 0, 0, 0, 0, 0, deployer, disp);

        // wallet1: holds all LP, has preserved 50% of original unclaimed — still claimable
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            wallet1Block,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA,
            wallet1UnclaimedB,
            wallet1,
            disp
        );

        // wallet2: transferred all LP in STEP 6 → entry deleted, nothing to claim
        // Key contrast vs credit-controller-loss-wallet1-and-wallet2:
        //   In that test: wallet2 forfeited ~29.9B because it did NOT claim before transferring
        //   In this test: wallet2 claimed in STEP 5 first → unclaimed=0 at transfer → forfeit=0 → no loss
        getRewardUserInfo(wallet2, 0, 0, 0, 0, 0, 0, 0, 0, wallet2, disp);

        // STEP 8: Summarize the test results
        if (disp) console.log("\n=== STEP 8: SUMMARIZE TEST RESULTS ===");

        // Accounting summary: total rewards = rewardsA from setup
        let rewardsA = rewardData.rewardsA;
        let totalClaimed = wallet2ClaimA;     // wallet2 claimed in STEP 5
        let totalUnclaimed = wallet1UnclaimedA; // wallet1 still holds unclaimed
        let precisionLoss = rewardsA - totalClaimed - totalUnclaimed;

        if (disp) {
            console.log("--- REWARD ACCOUNTING ---");
            console.log(`Total rewards distributed (rewardsA): ${rewardsA}`);
            console.log(`wallet2 claimed in STEP 5:            ${totalClaimed}`);
            console.log(`wallet1 still unclaimed:               ${totalUnclaimed}`);
            console.log(`Precision loss (integer division):     ${precisionLoss}`);
            console.log("");
            console.log("--- CONCLUSION ---");
            console.log("wallet2 claimed rewards BEFORE transferring CREDIT back to wallet1.");
            console.log("unclaimed=0 at transfer → forfeit=0 → no rewards lost.");
            console.log("");
            console.log("contrast: credit-controller-loss-wallet1-and-wallet2.test.ts");
            console.log("  wallet2 transfers WITHOUT claiming → forfeit=~29.9B → LOST permanently");
            console.log("");
            console.log("LESSON: always claim rewards before transferring CREDIT tokens.");
        }
    })
});