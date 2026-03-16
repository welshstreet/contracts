import { describe, it } from "vitest";
import { disp, PRECISION } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardUserInfo } from "./functions/street-rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/credit-controller-helper-functions";
import {  burnLiquidity } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT CONTROLLER LOSS TEST WALLET1 AND WALLET2  ===", () => {
    it("=== CREDIT CONTROLLER LOSS TEST WALLET1 AND WALLET2 ===", () => {
        // TEST REQUIREMENT       
        // STEP 1: Setup environment (deployer + wallet1 + wallet2)
        // STEP 2: Deployer burns all liquidity to avoid further reward accumulation. 
        // STEP 3: Verify wallet1 and wallet2 unclaimed rewards after receiving deployer rewards
        // STEP 4: wallet1 transfers 100% CREDIT to wallet2
        // STEP 5: wallet2 transfers 100% CREDIT back to wallet1. 
        // STEP 6: Verify unclaimable balance of each account
        // STEP 7: Summarize the test and result

        // STEP 1: Setup liquidity and user state
        if (disp) { console.log("\n=== STEP 1: Setup environment (deployer + wallet1 + wallet2) ==="); }
        let { marketData, rewardData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Deployer burns all liquidity to avoid further reward accumulation. 
        if (disp) { console.log("\n=== STEP 2: Deployer burns all liquidity ==="); }
        let burnAmount = userData.deployer.balances.credit;
        let burnWelsh = Math.floor((burnAmount * marketData.reserveA) / supplyData.credit);
        let burnStreet = Math.floor((burnAmount * marketData.reserveB) / supplyData.credit);
        
        burnLiquidity(burnAmount, deployer, disp);

        // Update in-memory model to reflect the burn
        userData.deployer.balances.credit -= burnAmount;
        userData.deployer.balances.welsh += burnWelsh;
        userData.deployer.balances.street += burnStreet;
        supplyData.credit -= burnAmount;
        marketData.reserveA -= burnWelsh;
        marketData.reserveB -= burnStreet;

        // STEP 3: Verify wallet1 and wallet2 unclaimed rewards after receiving deployer rewards
        if (disp) { console.log("\n=== STEP 3: Verify wallet1 and wallet2 unclaimed rewards after receiving deployer rewards ==="); }
        // Capture wallet1 and wallet2 reward state
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
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

        // Deployer burned 100% LP — forfeits all unclaimed rewards
        let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        let deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;

        // Calculate redistribution from deployer's forfeit to remaining LP holders
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        const totalLpAfterBurn = wallet1LpBalance + wallet2LpBalance;
        
        // Use BigInt to match contract uint arithmetic exactly
        const redistributionA = Number((BigInt(deployerUnclaimedA) * BigInt(PRECISION)) / BigInt(totalLpAfterBurn));
        const redistributionB = Number((BigInt(deployerUnclaimedB) * BigInt(PRECISION)) / BigInt(totalLpAfterBurn));

        globalIndexA = globalIndexA + redistributionA;
        globalIndexB = globalIndexB + redistributionB;

        // Update rewardData
        rewardData.globalIndexA = globalIndexA;
        rewardData.globalIndexB = globalIndexB;

        // Calculate wallet1 and wallet2 unclaimed using BigInt
        let wallet1UnclaimedA = Number((BigInt(wallet1LpBalance) * BigInt(globalIndexA - wallet1UserIndexA)) / BigInt(PRECISION)) - wallet1DebtA;
        let wallet1UnclaimedB = Number((BigInt(wallet1LpBalance) * BigInt(globalIndexB - wallet1UserIndexB)) / BigInt(PRECISION)) - wallet1DebtB;
        let wallet2UnclaimedA = Number((BigInt(wallet2LpBalance) * BigInt(globalIndexA - wallet2UserIndexA)) / BigInt(PRECISION)) - wallet2DebtA;
        let wallet2UnclaimedB = Number((BigInt(wallet2LpBalance) * BigInt(globalIndexB - wallet2UserIndexB)) / BigInt(PRECISION)) - wallet2DebtB;

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

        // STEP 4: wallet1 transfers 100% CREDIT to wallet2
        if (disp) { console.log("\n=== STEP 4: wallet1 transfers 100% CREDIT to wallet2 ==="); }
        // decrease-rewards(wallet1): wallet1 forfeits all unclaimed → redistributed to wallet2 (only remaining LP holder)
        let wallet1ForfeitA = wallet1UnclaimedA; // 100% forfeited — transferring all LP
        let wallet1ForfeitB = wallet1UnclaimedB;

        // Use BigInt to match contract uint arithmetic exactly
        const redistributionABig = (BigInt(wallet1ForfeitA) * BigInt(PRECISION)) / BigInt(wallet2LpBalance);
        const redistributionBBig = (BigInt(wallet1ForfeitB) * BigInt(PRECISION)) / BigInt(wallet2LpBalance);
        globalIndexA += Number(redistributionABig);
        globalIndexB += Number(redistributionBBig);

        // wallet2's unclaimed recalculated against new global; then wallet1's LP added for preserve-idx calc
        const wallet2EarnedABig = (BigInt(wallet2LpBalance) * BigInt(globalIndexA - wallet2UserIndexA)) / BigInt(PRECISION);
        const wallet2TempUnclaimedA = Number(wallet2EarnedABig) - wallet2DebtA;
        wallet2LpBalance += wallet1LpBalance;

        // increase-rewards(wallet2): preserve-idx path (credit-controller caller)
        wallet2UserIndexA = wallet2TempUnclaimedA > 0
            ? globalIndexA - Number((BigInt(wallet2TempUnclaimedA) * BigInt(PRECISION)) / BigInt(wallet2LpBalance))
            : globalIndexA;
        
        // Recalculate unclaimed after preserve-idx (floor division causes 1-unit rounding)
        const wallet2FinalEarnedA = (BigInt(wallet2LpBalance) * BigInt(globalIndexA - wallet2UserIndexA)) / BigInt(PRECISION);
        wallet2UnclaimedA = Number(wallet2FinalEarnedA) - wallet2DebtA;

        transferCredit(wallet1LpBalance, wallet1, wallet2, wallet1, undefined, disp);

        // Update state after transfer
        rewardData.globalIndexA = globalIndexA;
        rewardData.globalIndexB = globalIndexB;
        wallet1LpBalance = 0;
        wallet1UnclaimedA = 0; // wallet1 entry deleted
        userData.wallet1.balances.credit = 0;
        userData.wallet2.balances.credit = wallet2LpBalance;
        wallet2DebtA = 0;
        wallet2DebtB = 0;
        wallet2Block = simnet.blockHeight;

        // Verify wallet1 credit balance = 0
        getBalance(0, "credit-token", wallet1, wallet1, disp);

        // Verify wallet2 credit balance = combined
        getBalance(wallet2LpBalance, "credit-token", wallet2, wallet2, disp);

        // Verify wallet1 reward state — entry deleted, defaults to all zeros
        getRewardUserInfo(wallet1, 0, 0, 0, 0, 0, 0, 0, 0, wallet1, disp);

        // Verify wallet2 reward state after receiving wallet1's LP
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

        // STEP 5: wallet2 transfers 100% CREDIT back to wallet1
        if (disp) { console.log("\n=== STEP 5: wallet2 transfers 100% CREDIT back to wallet1 ==="); }
        // decrease-rewards(wallet2, wallet2LpBalance):
        //   balance (after token transfer) = 0, old-balance = wallet2LpBalance
        //   other-lp = total-lp - old-balance = wallet2LpBalance - wallet2LpBalance = 0
        //   forfeit-a = 100% of wallet2's unclaimed, but redistributed-a = 0 (no remaining LP holders)
        //   → wallet2's unclaimed rewards are LOST (the "loss" scenario)
        //   → globalIndexA unchanged
        // increase-rewards(wallet1, wallet2LpBalance):
        //   wallet1 had no entry → new entry created at current global indices
        //   → wallet1 starts with 0 unclaimed

        transferCredit(wallet2LpBalance, wallet2, wallet1, wallet2, undefined, disp);

        // Update state after transfer — globalIndex unchanged (no redistribution recipient)
        wallet1LpBalance = wallet2LpBalance; // wallet1 receives all of wallet2's LP
        wallet2LpBalance = 0;
        userData.wallet1.balances.credit = wallet1LpBalance;
        userData.wallet2.balances.credit = 0;
        // wallet1 gets fresh entry at current global indices — unclaimed starts at 0
        wallet1UserIndexA = globalIndexA;
        wallet1UserIndexB = globalIndexB;
        wallet1DebtA = 0;
        wallet1DebtB = 0;
        wallet1UnclaimedA = 0;
        wallet1UnclaimedB = 0;
        wallet1Block = simnet.blockHeight;

        // Verify wallet2 credit balance = 0
        getBalance(0, "credit-token", wallet2, wallet2, disp);

        // Verify wallet1 credit balance = wallet1LpBalance
        getBalance(wallet1LpBalance, "credit-token", wallet1, wallet1, disp);

        // Verify wallet2 reward state — entry deleted, defaults to all zeros
        getRewardUserInfo(wallet2, 0, 0, 0, 0, 0, 0, 0, 0, wallet2, disp);

        // Verify wallet1 reward state — fresh entry, unclaimed = 0
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

        // STEP 6: Verify unclaimable balance of each account
        if (disp) { console.log("\n=== STEP 6: Verify unclaimable balance of each account ==="); }
        // Summary of reward losses through the transfer cycle:
        // - deployer: burned 100% LP in STEP 2 → forfeited 2,999,900 unclaimed (redistributed to wallet1/wallet2 ✓)
        // - wallet1: transferred 100% CREDIT in STEP 4 → forfeited all unclaimed (redistributed to wallet2 ✓)
        // - wallet2: transferred 100% CREDIT in STEP 5 → forfeited all unclaimed, but other-lp=0 → LOST FOREVER ✗
        // - wallet1: received fresh entry at current global index → 0 unclaimed

        // deployer: no LP, no entry → all zeros
        getRewardUserInfo(deployer, 0, 0, 0, 0, 0, 0, 0, 0, deployer, disp);

        // wallet1: holds all LP but 0 unclaimed (fresh entry at current global index)
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            wallet1Block,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA, // 0
            wallet1UnclaimedB, // 0
            wallet1,
            disp
        );

        // wallet2: no LP, no entry → all zeros
        getRewardUserInfo(wallet2, 0, 0, 0, 0, 0, 0, 0, 0, wallet2, disp);

        if (disp) {
            console.log("\n=== STEP 6 SUMMARY ===");
            console.log(`wallet1 LP balance: ${wallet1LpBalance}`);
            console.log(`wallet1 unclaimed A: ${wallet1UnclaimedA} (lost via wallet2 transfer)`);
            console.log(`wallet2 LP balance: ${wallet2LpBalance}`);
            console.log(`wallet2 unclaimed A: ${wallet2UnclaimedA} (LOST — redistributed to no one)`);
            console.log(`deployer LP balance: 0`);
        }

        // STEP 7: Summarize the test and result
        if (disp) { console.log("\n=== STEP 7: Test Summary ==="); }
        if (disp) {
            console.log("\n--- SCENARIO ---");
            console.log("Three users (deployer, wallet1, wallet2) each hold equal LP and accumulate rewards.");
            console.log("Deployer burns all LP → rewards redistributed to wallet1 and wallet2 (no loss).");
            console.log("wallet1 transfers 100% CREDIT to wallet2 → wallet1 forfeits all unclaimed,");
            console.log("  redistributed to wallet2 who is still an LP holder (no loss).");
            console.log("wallet2 transfers 100% CREDIT back to wallet1 → wallet2 forfeits all unclaimed,");
            console.log("  but other-lp = 0 (no remaining LP holders) → rewards LOST FOREVER.");

            console.log("\n--- REWARD ACCOUNTING ---");
            console.log(`Total rewards distributed (rewardsA): ${rewardData.rewardsA}`);
            console.log(`Final global index A: ${globalIndexA}`);
            console.log(`wallet1 final unclaimed A: ${wallet1UnclaimedA} (0 — fresh entry after receiving back LP)`);
            console.log(`wallet2 final unclaimed A: ${wallet2UnclaimedA} (LOST — ~30B forfeited to no one)`);
            console.log(`deployer final unclaimed A: 0 (properly redistributed in STEP 2)`);

            console.log("\n--- CONCLUSION ---");
            console.log("credit-controller.transfer causes permanent reward loss when the sender is");
            console.log("the sole LP holder at the time of transfer — their unclaimed rewards are");
            console.log("forfeited with no recipients, destroying value in the reward pool.");
        }
    })
});