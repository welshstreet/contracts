import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, PROVIDE_WELSH, DONATE_WELSH, DONATE_STREET, PRECISION } from "./vitestconfig"
import { provideLiquidity } from "./functions/street-market-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { donateRewards, getRewardUserInfo } from "./functions/street-rewards-helper-functions";

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
        
        // Use existing unclaimed rewards from setup data and add donation rewards
        userData.wallet1.rewardUserInfo.unclaimedA += Math.floor((userData.wallet1.balances.credit * Math.floor((DONATE_WELSH * PRECISION) / supplyData.credit)) / PRECISION);
        userData.wallet1.rewardUserInfo.unclaimedB += Math.floor((userData.wallet1.balances.credit * Math.floor((DONATE_STREET * PRECISION) / supplyData.credit)) / PRECISION);
        
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

        // STEP 5: Analyze wallet1's reward state AFTER additional liquidity (CORRECT BEHAVIOR!)
        if (disp) {
            console.log("WALLET1 AFTER:");
        }
        
        // Update wallet1's LP balance with the newly minted LP
        userData.wallet1.balances.credit += expectedMintedLp;
        let newBalance = userData.wallet1.balances.credit;
        
        if (disp) {
            console.log(`Expected NEW LP balance: ${newBalance.toLocaleString()}`);
        }
        
        // Calculate new earned amounts with the NEW balance
        // This is what the contract calculates: new-earned = (new-balance * (global-index - user-index)) / PRECISION
        let globalIndexA = rewardData.globalIndexA + Math.floor((DONATE_WELSH * PRECISION) / supplyData.credit);
        let globalIndexB = rewardData.globalIndexB + Math.floor((DONATE_STREET * PRECISION) / supplyData.credit);
        
        let newEarnedA = Math.floor((newBalance * (globalIndexA - userData.wallet1.rewardUserInfo.indexA)) / PRECISION);
        let newEarnedB = Math.floor((newBalance * (globalIndexB - userData.wallet1.rewardUserInfo.indexB)) / PRECISION);
        
        // The debt is set to preserve existing unclaimed rewards
        // preserve-debt = if new-earned > unclaimed then (new-earned - unclaimed) else 0
        userData.wallet1.rewardUserInfo.debtA = newEarnedA > userData.wallet1.rewardUserInfo.unclaimedA 
            ? newEarnedA - userData.wallet1.rewardUserInfo.unclaimedA 
            : 0;
        userData.wallet1.rewardUserInfo.debtB = newEarnedB > userData.wallet1.rewardUserInfo.unclaimedB 
            ? newEarnedB - userData.wallet1.rewardUserInfo.unclaimedB 
            : 0;
        
        // User's index values stay unchanged during provide-liquidity (preservation mechanism)
        // indexA and indexB remain at their previous values
        
        // Block number gets updated
        userData.wallet1.rewardUserInfo.block = simnet.blockHeight; // Updated to block of provide-liquidity transaction
        
        // Check contract results - rewards should be preserved unchanged
        getRewardUserInfo(
            wallet1,
            userData.wallet1.balances.credit,  // NEW LP balance (old + minted)
            userData.wallet1.rewardUserInfo.block,
            userData.wallet1.rewardUserInfo.debtA,
            userData.wallet1.rewardUserInfo.debtB,
            userData.wallet1.rewardUserInfo.indexA,
            userData.wallet1.rewardUserInfo.indexB,
            userData.wallet1.rewardUserInfo.unclaimedA,  // Preserved unchanged!
            userData.wallet1.rewardUserInfo.unclaimedB,  // Preserved unchanged!
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
        
        // Contract holds: setup rewardsA (30B) + donated WELSH (1B) = 31B total  
        let expectedWelshBalance = rewardData.rewardsA + DONATE_WELSH;
        
        getBalance(
            expectedWelshBalance,
            "welshcorgicoin",
            { address: deployer, contractName: "street-rewards" },
            deployer,
            disp
        );
        
        if (disp) {
            console.log(`Contract holds ${expectedWelshBalance.toLocaleString()} WELSH total`);
            console.log(`  - ${rewardData.rewardsA.toLocaleString()} from setup`);
            console.log(`  - ${DONATE_WELSH.toLocaleString()} from donation`);
            console.log("(This confirms rewards are properly managed and preserved)");
        }
    });
})
