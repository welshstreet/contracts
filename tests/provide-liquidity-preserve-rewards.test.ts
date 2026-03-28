import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, PROVIDE_WELSH, DONATE_WELSH, DONATE_STREET, PRECISION } from "./vitestconfig"
import { provideLiquidity } from "./functions/street-market-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { donateRewards, getRewardPoolInfo, getRewardUserInfo } from "./functions/street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== PROVIDE LIQUIDITY PRESERVE REWARDS TEST ===", () => {
    it("=== PROVIDE LIQUIDITY PRESERVE REWARDS TEST ===", () => {
        // STEP 1: Setup exchange with multiple LP holders
        let { marketData, rewardData, supplyData, userData } = setupLiquidityUsers(disp);
        
        if (disp) {
            console.log("INITIAL LP DISTRIBUTION:");
            console.log(`Total LP: ${supplyData.credit.toLocaleString()}`);
            console.log(`Deployer: ${userData.deployer.balances.credit.toLocaleString()}`);
            console.log(`Wallet1:  ${userData.wallet1.balances.credit.toLocaleString()}`);
            console.log(`Wallet2:  ${userData.wallet2.balances.credit.toLocaleString()}`);
        }
        // STEP 2: Donate rewards to create the scenario where timing matters
        if (disp) {
            console.log("REWARD DONATION:");
            console.log(`Donating: ${DONATE_WELSH.toLocaleString()} WELSH, ${DONATE_STREET.toLocaleString()} STREET`);
        }
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        // STEP 3: Check wallet1's reward state BEFORE providing additional liquidity
        if (disp) {
            console.log("WALLET1 BEFORE ADDITIONAL LIQUIDITY:");
        }
        
        // Calculate expected global indices after donation using BigInt (avoids precision loss)
        // setupLiquidityUsers now uses BigInt internally, so rewardData has the best Number approximation
        const PRECISION_BIG = BigInt(PRECISION);
        const totalLpBig = BigInt(supplyData.credit);
        
        // Calculate index increments from donation
        const indexIncrementABig = (BigInt(DONATE_WELSH) * PRECISION_BIG) / totalLpBig;
        const indexIncrementBBig = (BigInt(DONATE_STREET) * PRECISION_BIG) / totalLpBig;
        
        // Calculate expected global indices (keep as BigInt for precision)
        const expectedGlobalABig = BigInt(rewardData.globalIndexA) + indexIncrementABig;
        const expectedGlobalBBig = BigInt(rewardData.globalIndexB) + indexIncrementBBig;
        
        // Update rewardData with calculated values (stored as Number for compatibility)
        rewardData.globalIndexA = Number(expectedGlobalABig);
        rewardData.globalIndexB = Number(expectedGlobalBBig);
        rewardData.rewardsA += DONATE_WELSH;
        rewardData.rewardsB += DONATE_STREET;

        // Verify our calculated values match the contract and get TRUE BigInt values back
        const poolInfo = getRewardPoolInfo(
            rewardData.globalIndexA,
            rewardData.globalIndexB,
            rewardData.rewardsA,
            rewardData.rewardsB,
            deployer,
            disp
        );
        
        // Extract the TRUE BigInt values from contract for precise calculations
        const globalAAfterDonate = poolInfo.globalIndexA;
        const globalBAfterDonate = poolInfo.globalIndexB;

        // Compute wallet1's unclaimed using the integrated formula (matches contract exactly)
        const w1BalanceBig = BigInt(userData.wallet1.balances.credit);
        const w1IndexABig = BigInt(userData.wallet1.rewardUserInfo.indexA);
        const w1IndexBBig = BigInt(userData.wallet1.rewardUserInfo.indexB);
        const w1DebtABig = BigInt(userData.wallet1.rewardUserInfo.debtA);
        const w1DebtBBig = BigInt(userData.wallet1.rewardUserInfo.debtB);
        const earnedABig = w1BalanceBig * (globalAAfterDonate - w1IndexABig) / PRECISION_BIG;
        const earnedBBig = w1BalanceBig * (globalBAfterDonate - w1IndexBBig) / PRECISION_BIG;
        userData.wallet1.rewardUserInfo.unclaimedA = Number(earnedABig > w1DebtABig ? earnedABig - w1DebtABig : 0n);
        userData.wallet1.rewardUserInfo.unclaimedB = Number(earnedBBig > w1DebtBBig ? earnedBBig - w1DebtBBig : 0n);

        getRewardUserInfo(
            wallet1,
            userData.wallet1.balances.credit,
            userData.wallet1.rewardUserInfo.block,
            userData.wallet1.rewardUserInfo.debtA,
            userData.wallet1.rewardUserInfo.debtB,
            userData.wallet1.rewardUserInfo.indexA,
            userData.wallet1.rewardUserInfo.indexB,
            userData.wallet1.rewardUserInfo.unclaimedA,
            userData.wallet1.rewardUserInfo.unclaimedB,
            wallet1,
            disp
        );
        
        // UPDATE userData with verified contract state after STEP 3
        // Note: index-a stays at OLD value (20000000000000) because donation doesn't update user's stored index
        // Only the computed unclaimed values have changed based on new global indices
        userData.wallet1.rewardUserInfo.block = simnet.blockHeight;
        // Keep indexA and indexB at their stored values from setup (donation doesn't write to user state)
        // userData.wallet1.rewardUserInfo.indexA unchanged
        // userData.wallet1.rewardUserInfo.indexB unchanged
        // Unclaimed values are already set from calculations above
        
        if (disp) {
            console.log("WALLET1 VALUES:");
            console.log(`LP tokens: ${userData.wallet1.balances.credit.toLocaleString()}`);
            console.log(`Unclaimed WELSH: ${userData.wallet1.rewardUserInfo.unclaimedA.toLocaleString()}`);
            console.log(`Unclaimed STREET: ${userData.wallet1.rewardUserInfo.unclaimedB.toLocaleString()}`);
        }

        // STEP 4: wallet1 provides additional liquidity - demonstrates timing behavior
        if (disp) {
            console.log("PROVIDING ADDITIONAL LIQUIDITY:");
            console.log(`Input: ${PROVIDE_WELSH.toLocaleString()} WELSH`);
        }
        
        // Calculate expected values for additional liquidity provision using existing market data
        let expectedAmountB = Math.floor((PROVIDE_WELSH * marketData.reserveB) / marketData.reserveA);
        let expectedMintedLp = Math.floor((PROVIDE_WELSH * supplyData.credit) / marketData.reserveA);
        
        if (disp) {
            console.log(`Expected LP minted: ${expectedMintedLp.toLocaleString()}`);
            console.log(`LP balance change: ${userData.wallet1.balances.credit.toLocaleString()} → ${(userData.wallet1.balances.credit + expectedMintedLp).toLocaleString()}`);
            console.log(`Timing: Mint LP first, then update rewards`);
            console.log(`Expected unclaimed preservation: ${userData.wallet1.rewardUserInfo.unclaimedA.toLocaleString()} WELSH (unchanged)`);
        }
        
        provideLiquidity(PROVIDE_WELSH, expectedAmountB, expectedMintedLp, wallet1, disp);

        // Verify pool state after provide-liquidity (global indices unchanged - no new rewards distributed)
        getRewardPoolInfo(
            Number(globalAAfterDonate),
            Number(globalBAfterDonate),
            rewardData.rewardsA,  // Already includes donation from contract query
            rewardData.rewardsB,  // Already includes donation from contract query
            deployer,
            disp
        );

        // STEP 5: Analyze wallet1's reward state AFTER additional liquidity (CORRECT BEHAVIOR!)
        if (disp) {
            console.log("WALLET1 AFTER:");
        }
        
        // Update wallet1's LP balance with the newly minted LP
        const oldBalance = userData.wallet1.balances.credit;
        userData.wallet1.balances.credit += expectedMintedLp;
        let newBalance = userData.wallet1.balances.credit;
        
        if (disp) {
            console.log(`Expected NEW LP balance: ${newBalance.toLocaleString()}`);
        }
        
        // CRITICAL: The contract's increase-rewards calculates unclaimed using the OLD stored index
        // from BEFORE provide-liquidity (stored value = 20000000000000 from setup, unchanged by donation)
        const oldBalanceBig = BigInt(oldBalance);
        const newBalanceBig = BigInt(newBalance);
        const oldStoredIndexABig = BigInt(userData.wallet1.rewardUserInfo.indexA); // 20000000000000 from setup
        const oldStoredIndexBBig = BigInt(userData.wallet1.rewardUserInfo.indexB); // 0 from setup
        const oldDebtABig = BigInt(userData.wallet1.rewardUserInfo.debtA); // 0
        const oldDebtBBig = BigInt(userData.wallet1.rewardUserInfo.debtB); // 0
        
        if (disp) {
            console.log("DEBUG STEP 5 CALCULATION:");
            console.log(`  oldBalance: ${oldBalance}`);
            console.log(`  newBalance: ${newBalance}`);
            console.log(`  oldStoredIndexA: ${userData.wallet1.rewardUserInfo.indexA}`);
            console.log(`  globalAAfterDonate: ${globalAAfterDonate}`);
            console.log(`  PRECISION: ${PRECISION}`);
        }
        
        // Contract calculates earned using OLD balance and OLD stored index (not the global from donation!)
        const contractEarnedABig = oldBalanceBig * (globalAAfterDonate - oldStoredIndexABig) / PRECISION_BIG;
        const contractEarnedBBig = oldBalanceBig * (globalBAfterDonate - oldStoredIndexBBig) / PRECISION_BIG;
        const contractUnclaimedABig = contractEarnedABig > oldDebtABig ? contractEarnedABig - oldDebtABig : 0n;
        const contractUnclaimedBBig = contractEarnedBBig > oldDebtBBig ? contractEarnedBBig - oldDebtBBig : 0n;

        if (disp) {
            console.log(`  contractEarnedA: ${contractEarnedABig}`);
            console.log(`  contractUnclaimedA: ${contractUnclaimedABig}`);
        }

        // Method 2 (index adjustment): preserve unclaimed by adjusting index backward, zeroing debt
        // preserve-idx = global - floor(unclaimed * PRECISION / new-balance)
        const preserveIdxABig = contractUnclaimedABig > 0n
            ? globalAAfterDonate - (contractUnclaimedABig * PRECISION_BIG) / newBalanceBig
            : globalAAfterDonate;
        const preserveIdxBBig = contractUnclaimedBBig > 0n
            ? globalBAfterDonate - (contractUnclaimedBBig * PRECISION_BIG) / newBalanceBig
            : globalBAfterDonate;

        if (disp) {
            console.log(`  preserveIdxA: ${preserveIdxABig}`);
        }

        userData.wallet1.rewardUserInfo.indexA = Number(preserveIdxABig);
        userData.wallet1.rewardUserInfo.indexB = Number(preserveIdxBBig);

        // Debt is zeroed with Method 2
        userData.wallet1.rewardUserInfo.debtA = 0;
        userData.wallet1.rewardUserInfo.debtB = 0;

        // Recalculate expected unclaimed from the new index (matches contract exactly)
        const recalcUnclaimedABig = newBalanceBig * (globalAAfterDonate - preserveIdxABig) / PRECISION_BIG;
        const recalcUnclaimedBBig = newBalanceBig * (globalBAfterDonate - preserveIdxBBig) / PRECISION_BIG;
        userData.wallet1.rewardUserInfo.unclaimedA = Number(recalcUnclaimedABig);
        userData.wallet1.rewardUserInfo.unclaimedB = Number(recalcUnclaimedBBig);
        
        // Block number gets updated
        userData.wallet1.rewardUserInfo.block = simnet.blockHeight; // Updated to block of provide-liquidity transaction
        
        // Check contract results - rewards should be preserved (±1 from truncation)
        getRewardUserInfo(
            wallet1,
            userData.wallet1.balances.credit,  // NEW LP balance (old + minted)
            userData.wallet1.rewardUserInfo.block,
            userData.wallet1.rewardUserInfo.debtA,
            userData.wallet1.rewardUserInfo.debtB,
            userData.wallet1.rewardUserInfo.indexA,
            userData.wallet1.rewardUserInfo.indexB,
            userData.wallet1.rewardUserInfo.unclaimedA,
            userData.wallet1.rewardUserInfo.unclaimedB,
            wallet1,
            disp
        );
        
        if (disp) {
            console.log("CALCULATION VERIFICATION:");
            console.log(`LP tokens: ${userData.wallet1.balances.credit.toLocaleString()} (increased)`);
            console.log(`Unclaimed WELSH: ${userData.wallet1.rewardUserInfo.unclaimedA.toLocaleString()} (preserved)`);
            console.log(`Unclaimed STREET: ${userData.wallet1.rewardUserInfo.unclaimedB.toLocaleString()} (preserved)`);
            console.log(`Block: ${userData.wallet1.rewardUserInfo.block} (updated)`);
        }

        // STEP 6: Verify rewards contract balance for precision check
        if (disp) {
            console.log("REWARDS CONTRACT BALANCE VERIFICATION:");
        }
        
        // Contract holds: rewardData.rewardsA already includes the donation (updated in STEP 3)
        let expectedWelshBalance = rewardData.rewardsA;
        
        getBalance(
            expectedWelshBalance,
            "welshcorgicoin",
            { address: deployer, contractName: "street-rewards" },
            deployer,
            disp
        );
        
        if (disp) {
            console.log(`Contract holds ${expectedWelshBalance.toLocaleString()} WELSH total`);
            console.log(`  - Includes all setup and donated rewards`);
            console.log("(This confirms rewards are properly managed and preserved)");
        }
    });
})
