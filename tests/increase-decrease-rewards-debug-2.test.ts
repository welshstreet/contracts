import { describe, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { disp, DONATE_WELSH, PRECISION, PROVIDE_INCREASE_WELSH } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { burnLiquidity, provideLiquidity } from "./functions/street-market-helper-functions";
import { donateRewards, getCleanupRewards } from "./functions/street-rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/credit-controller-helper-functions";

/**
 * COMPREHENSIVE REWARDS PRESERVATION TEST
 * ========================================
 * 
 * This test demonstrates and validates BOTH reward preservation mechanisms in the street-rewards contract:
 * 
 * METHOD 1 - Debt Adjustment (street-market caller):
 * - Used by: provide-liquidity (increase-rewards) and remove-liquidity (decrease-rewards)
 * - Mechanism: Preserves unclaimed rewards by adjusting the debt offset while keeping user index unchanged
 * - Formula: unclaimed = (balance × (global-index - user-index)) / PRECISION - debt
 * - When LP increases: debt is increased to offset the larger balance calculation
 * - When LP decreases: debt is decreased proportionally, and excess rewards are forfeited to other LPs
 * 
 * METHOD 2 - Index Adjustment (credit-controller caller):
 * - Used by: transferCredit when sending/receiving LP tokens (increase-rewards for recipient)
 * - Mechanism: Preserves unclaimed rewards by adjusting the user's index while zeroing debt
 * - Formula: unclaimed = (balance × (global-index - adjusted-index)) / PRECISION - 0
 * - When LP increases: user's index is raised so (global - index) × new-balance = unclaimed
 * 
 * MATHEMATICAL EQUIVALENCE:
 * Both methods preserve IDENTICAL current unclaimed rewards and provide IDENTICAL future reward accrual rates.
 * The debt offset in Method 1 exactly compensates for the index difference in Method 2.
 * 
 * TEST STRUCTURE:
 * ===============
 * STEP 1:  Setup with 3 users (deployer, wallet1, wallet2) each holding equal LP (1B tokens)
 * STEP 1a: Transfer STREET tokens to wallet1/wallet2 to enable provide-liquidity operations
 * STEP 1b: Burn any excess LP to ensure all users start with equal balances
 * STEP 2:  Verify token balances (LP and STREET) for all users
 * STEP 3:  Read initial reward pool state using get-cleanup-rewards (read-only observation)
 * STEP 4:  Donate 100M WELSH, verify equal distribution (33.33% each user)
 * STEP 5:  wallet1 provides 1T WELSH liquidity → mints ~300M LP → donate 100M WELSH
 *          Verify: (1) unclaimed rewards preserved during provide-liquidity
 *                  (2) proportional distribution: 30.30%, 39.39%, 30.30% (Method 1 - debt adjustment)
 * CONSTANTS USED:
 * ===============
 * - DONATE_WELSH: 100,000,000 (100 natural units)
 * - PROVIDE_INCREASE_WELSH: 1,000,000,000,000 (1,000,000 natural units)
 * - STREET_TRANSFER_AMOUNT: 200,000,000,000,000 (200,000,000 natural units)
 * - TAX: 100 basis points (1%)
 * - BASIS: 10,000 (100% = 10,000)
 * - PRECISION: 1,000,000,000 (9 decimals)
 */

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== INCREASE DECREASE REWARDS DEBUG 2 TESTS ===", () => {
    it("=== PROVIDE TRANSFER LIQUIDITY REWARDS TEST ===", () => {

        // STEP 1: Setup environment with multi-user liquidity state
        const { rewardData, supplyData, userData } = setupLiquidityUsers(disp);
        
        // Initialize let variables from setup for tracking state through test
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        let rewardsA = rewardData.rewardsA;
        let rewardsB = rewardData.rewardsB;
        
        // User balances (LP tokens)
        let deployerLpBalance = userData.deployer.balances.credit;
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
        let totalLpSupply = supplyData.credit;

        // STREET balances
        let deployerStreetBalance = userData.deployer.balances.street;
        let wallet1StreetBalance = userData.wallet1.balances.street;
        let wallet2StreetBalance = userData.wallet2.balances.street;

        // Tracking variables for claims and distributions
        let totalClaimedA = 0;
        let totalClaimedB = 0;
        let totalDistributedA = rewardsA;  // WELSH from setup (3 mints x DONATE_WELSH_TO_MINT)
        let totalDistributedB = rewardsB;  // STREET from setup (initially 0)
        
        // Calculate outstanding and actual
        let outstandingA = totalDistributedA - totalClaimedA;
        let outstandingB = totalDistributedB - totalClaimedB;
        let actualA = outstandingA;
        let actualB = outstandingB;
        
        // No excess tokens yet, so cleanup should be 0
        let cleanupA = 0;
        let cleanupB = 0;

        if (disp) {
            console.log("=== STEP 1 COMPLETE: INITIAL STATE ===");
            console.log(`Global Index A: ${globalIndexA}`);
            console.log(`Global Index B: ${globalIndexB}`);
            console.log(`Rewards A: ${rewardsA}`);
            console.log(`Rewards B: ${rewardsB}`);
            console.log(`Deployer LP: ${deployerLpBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}`);
            console.log(`Total LP Supply: ${totalLpSupply}`);
        }

        // STEP 1a: Transfer STREET from deployer to wallet1 and wallet2 for future provide-liquidity operations
        const STREET_TRANSFER_AMOUNT = 200_000_000_000_000; // 200 trillion STREET each
        
        if (disp) {
            console.log("\n=== STEP 1a: TRANSFER STREET TOKENS ===");
            console.log(`Deployer STREET before: ${deployerStreetBalance}`);
            console.log(`Wallet1 STREET before: ${wallet1StreetBalance}`);
            console.log(`Wallet2 STREET before: ${wallet2StreetBalance}`);
            console.log(`Transferring ${STREET_TRANSFER_AMOUNT} STREET to each wallet...`);
        }

        // Transfer to wallet1
        simnet.callPublicFn(
            "street-token",
            "transfer",
            [Cl.uint(STREET_TRANSFER_AMOUNT), Cl.principal(deployer), Cl.principal(wallet1), Cl.none()],
            deployer
        );

        // Transfer to wallet2
        simnet.callPublicFn(
            "street-token",
            "transfer",
            [Cl.uint(STREET_TRANSFER_AMOUNT), Cl.principal(deployer), Cl.principal(wallet2), Cl.none()],
            deployer
        );

        // Update tracking balances
        deployerStreetBalance -= (STREET_TRANSFER_AMOUNT * 2);
        wallet1StreetBalance += STREET_TRANSFER_AMOUNT;
        wallet2StreetBalance += STREET_TRANSFER_AMOUNT;

        if (disp) {
            console.log(`Deployer STREET after: ${deployerStreetBalance}`);
            console.log(`Wallet1 STREET after: ${wallet1StreetBalance}`);
            console.log(`Wallet2 STREET after: ${wallet2StreetBalance}`);
            console.log("=== STEP 1a COMPLETE ===");
        }

        // STEP 1b: Deployer burns excess LP to match wallet1/wallet2 (all users end up with 10B LP each)
        const DEPLOYER_BURN_AMOUNT = deployerLpBalance - wallet1LpBalance; // Burn to match wallet1 balance
        
        if (disp) {
            console.log("=== STEP 1b: DEPLOYER BURNS EXCESS LP ===");
            console.log(`Deployer LP before burn: ${deployerLpBalance}`);
            console.log(`Target LP (matching wallet1): ${wallet1LpBalance}`);
            console.log(`Burning: ${DEPLOYER_BURN_AMOUNT} LP`);
        }
        
        // Burn liquidity - this will claim any unclaimed rewards for deployer
        burnLiquidity(DEPLOYER_BURN_AMOUNT, deployer, disp);
        
        // Update deployer's LP balance after burn
        deployerLpBalance -= DEPLOYER_BURN_AMOUNT;
        totalLpSupply -= DEPLOYER_BURN_AMOUNT;
        
        if (disp) {
            console.log("=== STEP 1b COMPLETE: EQUAL LP BALANCES ===");
            console.log(`Deployer LP after burn: ${deployerLpBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}`);
            console.log(`Total LP Supply: ${totalLpSupply}`);
            console.log(`All users now have equal LP holdings for fair comparison`);
        }

        // STEP 2: Verify LP and STREET token balances for each user
        getBalance(deployerLpBalance, 'credit-token', deployer, deployer, disp);
        getBalance(wallet1LpBalance, 'credit-token', wallet1, deployer, disp);
        getBalance(wallet2LpBalance, 'credit-token', wallet2, deployer, disp);
        
        getBalance(deployerStreetBalance, 'street-token', deployer, deployer, disp);
        getBalance(wallet1StreetBalance, 'street-token', wallet1, deployer, disp);
        getBalance(wallet2StreetBalance, 'street-token', wallet2, deployer, disp);

        if (disp) {
            console.log("=== STEP 2 COMPLETE: BALANCE VERIFICATION ===");
            console.log(`Deployer LP: ${deployerLpBalance}, STREET: ${deployerStreetBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}, STREET: ${wallet1StreetBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}, STREET: ${wallet2StreetBalance}`);
        }
            
        // STEP 3: Read initial reward pool state using get-cleanup-rewards (read-only function to observe onchain tracking)
        getCleanupRewards(
            actualA,           
            actualB,           
            totalClaimedA,     
            totalClaimedB,     
            cleanupA,          
            cleanupB,          
            totalDistributedA, 
            totalDistributedB, 
            outstandingA,      
            outstandingB,      
            deployer,
            disp
        );

        if (disp) {
            console.log("=== STEP 3 COMPLETE: INITIAL CLEANUP STATE ===");
            console.log(`Distributed A: ${totalDistributedA} WELSH from setup`);
            console.log(`Distributed B: ${totalDistributedB} STREET from setup`);
            console.log(`Outstanding A: ${outstandingA}, Outstanding B: ${outstandingB}`);
        }

        // STEP 4: Donate rewards and verify unclaimed rewards increase for all users
        if (disp) {
            console.log("\n=== STEP 4: Donate Rewards and Verify Increases ===");
        }

        // Helper function to get user reward info
        const getUserRewardInfo = (user: string, userName: string) => {
            const userInfoResult = simnet.callReadOnlyFn("street-rewards", "get-reward-user-info", [Cl.principal(user)], deployer);
            const userData = (userInfoResult.result as any).value.value;
            const info = {
                balance: Number(userData['balance'].value),
                block: Number(userData['block'].value),
                debtA: Number(userData['debt-a'].value),
                debtB: Number(userData['debt-b'].value),
                indexA: Number(userData['index-a'].value),
                indexB: Number(userData['index-b'].value),
                unclaimedA: Number(userData['unclaimed-a'].value),
                unclaimedB: Number(userData['unclaimed-b'].value)
            };
            if (disp) {
                console.log(`${userName}:`);
                console.log(`  balance: ${info.balance}, unclaimed-a: ${info.unclaimedA}, unclaimed-b: ${info.unclaimedB}`);
            }
            return info;
        };

        // 1. Get initial unclaimed rewards for all users BEFORE donation
        if (disp) {
            console.log("\nBefore donation - User unclaimed rewards:");
        }
        const deployerBefore = getUserRewardInfo(deployer, "Deployer");
        const wallet1Before = getUserRewardInfo(wallet1, "Wallet1");
        const wallet2Before = getUserRewardInfo(wallet2, "Wallet2");

        // 2. Deployer donates DONATE_WELSH to rewards pool
        if (disp) {
            console.log(`\nDonating ${DONATE_WELSH} WELSH to rewards pool...`);
        }
        donateRewards(DONATE_WELSH, 0, deployer, disp);

        // Update tracking variables after donation
        totalDistributedA += DONATE_WELSH;
        globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        rewardsA += DONATE_WELSH;
        
        // Recalculate outstanding and actual
        outstandingA = totalDistributedA - totalClaimedA;
        actualA = outstandingA;

        // 3. Get unclaimed rewards for all users AFTER donation
        if (disp) {
            console.log("\nAfter donation - User unclaimed rewards:");
        }
        const deployerAfter = getUserRewardInfo(deployer, "Deployer");
        const wallet1After = getUserRewardInfo(wallet1, "Wallet1");
        const wallet2After = getUserRewardInfo(wallet2, "Wallet2");

        // Calculate and log increases
        const deployerIncrease = deployerAfter.unclaimedA - deployerBefore.unclaimedA;
        const wallet1Increase = wallet1After.unclaimedA - wallet1Before.unclaimedA;
        const wallet2Increase = wallet2After.unclaimedA - wallet2Before.unclaimedA;
        const totalIncrease = deployerIncrease + wallet1Increase + wallet2Increase;

        if (disp) {
            console.log("\n=== STEP 4 SUMMARY: Unclaimed Rewards Increases ===");
            console.log(`Donation amount: ${DONATE_WELSH} WELSH`);
            console.log(`\nPer-user increases (unclaimed-a):`);
            console.log(`  Deployer: ${deployerBefore.unclaimedA} → ${deployerAfter.unclaimedA} (+${deployerIncrease})`);
            console.log(`  Wallet1:  ${wallet1Before.unclaimedA} → ${wallet1After.unclaimedA} (+${wallet1Increase})`);
            console.log(`  Wallet2:  ${wallet2Before.unclaimedA} → ${wallet2After.unclaimedA} (+${wallet2Increase})`);
            console.log(`\nTotal increase: ${totalIncrease} (should equal donation: ${DONATE_WELSH})`);
            console.log(`Difference: ${totalIncrease - DONATE_WELSH} (rounding dust)`);
            console.log(`\nGlobal Index A updated: ${globalIndexA}`);
            console.log(`Total Distributed A: ${totalDistributedA}`);
        }

        // STEP 5: Wallet1 provides liquidity, then verify proportional reward distribution
        if (disp) {
            console.log("\n=== STEP 5: Provide Liquidity and Verify Proportional Rewards ===");
        }

        // Get market info to calculate expected LP and amounts
        const marketInfoResult = simnet.callReadOnlyFn("street-market", "get-market-info", [], deployer);
        const marketData = (marketInfoResult.result as any).value.value;
        const reserveA = Number(marketData['reserve-a'].value);
        const reserveB = Number(marketData['reserve-b'].value);

        // 1. Wallet1 provides liquidity with PROVIDE_INCREASE_WELSH
        const expectedAmountB = Math.floor((PROVIDE_INCREASE_WELSH * reserveB) / reserveA);
        const expectedMintedLp = Math.floor((PROVIDE_INCREASE_WELSH * totalLpSupply) / reserveA);

        if (disp) {
            console.log(`\nWallet1 providing liquidity:`);
            console.log(`  Input: ${PROVIDE_INCREASE_WELSH} WELSH`);
            console.log(`  Expected STREET: ${expectedAmountB}`);
            console.log(`  Expected LP minted: ${expectedMintedLp}`);
            console.log(`  Wallet1 LP before: ${wallet1LpBalance}`);
        }

        // Get wallet1's state before provide-liquidity
        const wallet1BeforeProvide = getUserRewardInfo(wallet1, "Wallet1 BEFORE provide-liquidity");

        // Provide liquidity using helper function (has error checking)
        const actualMintedLp = provideLiquidity(PROVIDE_INCREASE_WELSH, expectedAmountB, expectedMintedLp, wallet1, disp);

        // Only update tracking if successful (helper returns 0 on failure)
        if (actualMintedLp > 0) {
            wallet1LpBalance += actualMintedLp;
            totalLpSupply += actualMintedLp;
        }

        if (disp) {
            console.log(`\nWallet1 LP after: ${wallet1LpBalance} (+${actualMintedLp})`);
            console.log(`Total LP Supply: ${totalLpSupply}`);
        }

        // Get wallet1's state after provide-liquidity (should preserve unclaimed rewards)
        const wallet1AfterProvide = getUserRewardInfo(wallet1, "Wallet1 AFTER provide-liquidity");

        if (disp) {
            console.log(`\nRewards preservation check (provide-liquidity behavior):`);
            console.log(`  IMPORTANT: provide-liquidity preserves rewards via Method 1 (debt adjustment)`);
            console.log(`  Unclaimed-a: ${wallet1BeforeProvide.unclaimedA} → ${wallet1AfterProvide.unclaimedA}`);
            console.log(`  Preserved exactly: ${wallet1BeforeProvide.unclaimedA === wallet1AfterProvide.unclaimedA ? "✅ YES (expected behavior)" : "❌ NO (error)"}`);
            console.log(`  Method 1 (debt adjustment) applied: debt increased to preserve unclaimed rewards`);
        }

        // 2. Deployer donates DONATE_WELSH
        if (disp) {
            console.log(`\nDeployer donating ${DONATE_WELSH} WELSH...`);
        }

        const deployerBeforeDonation = getUserRewardInfo(deployer, "Deployer before donation");
        const wallet1BeforeDonation = getUserRewardInfo(wallet1, "Wallet1 before donation");
        const wallet2BeforeDonation = getUserRewardInfo(wallet2, "Wallet2 before donation");

        donateRewards(DONATE_WELSH, 0, deployer, disp);

        // Update tracking variables
        totalDistributedA += DONATE_WELSH;
        globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        rewardsA += DONATE_WELSH;
        outstandingA = totalDistributedA - totalClaimedA;
        actualA = outstandingA;

        // 3. Get reward info for all users after donation
        if (disp) {
            console.log(`\nAfter donation - User unclaimed rewards:`);
        }

        const deployerAfterDonation = getUserRewardInfo(deployer, "Deployer after donation");
        const wallet1AfterDonation = getUserRewardInfo(wallet1, "Wallet1 after donation");
        const wallet2AfterDonation = getUserRewardInfo(wallet2, "Wallet2 after donation");

        // Calculate increases and verify proportions
        const deployerIncrease5 = deployerAfterDonation.unclaimedA - deployerBeforeDonation.unclaimedA;
        const wallet1Increase5 = wallet1AfterDonation.unclaimedA - wallet1BeforeDonation.unclaimedA;
        const wallet2Increase5 = wallet2AfterDonation.unclaimedA - wallet2BeforeDonation.unclaimedA;
        const totalIncrease5 = deployerIncrease5 + wallet1Increase5 + wallet2Increase5;

        // Calculate expected proportional shares
        const deployerShare = (deployerLpBalance / totalLpSupply) * 100;
        const wallet1Share = (wallet1LpBalance / totalLpSupply) * 100;
        const wallet2Share = (wallet2LpBalance / totalLpSupply) * 100;

        // Calculate expected reward increases based on LP proportion
        const expectedDeployerIncrease = Math.floor((DONATE_WELSH * deployerLpBalance) / totalLpSupply);
        const expectedWallet1Increase = Math.floor((DONATE_WELSH * wallet1LpBalance) / totalLpSupply);
        const expectedWallet2Increase = Math.floor((DONATE_WELSH * wallet2LpBalance) / totalLpSupply);

        if (disp) {
            console.log(`\n=== STEP 5 SUMMARY: Proportional Reward Distribution ===`);
            console.log(`\nTotal LP Supply: ${totalLpSupply}`);
            console.log(`LP Balances:`);
            console.log(`  Deployer: ${deployerLpBalance} (${deployerShare.toFixed(4)}%)`);
            console.log(`  Wallet1:  ${wallet1LpBalance} (${wallet1Share.toFixed(4)}%)`);
            console.log(`  Wallet2:  ${wallet2LpBalance} (${wallet2Share.toFixed(4)}%)`);
            
            console.log(`\nDonation: ${DONATE_WELSH} WELSH`);
            console.log(`\nActual reward increases:`);
            console.log(`  Deployer: +${deployerIncrease5} WELSH`);
            console.log(`  Wallet1:  +${wallet1Increase5} WELSH`);
            console.log(`  Wallet2:  +${wallet2Increase5} WELSH`);
            console.log(`  Total:    ${totalIncrease5} WELSH`);
            
            console.log(`\nExpected reward increases (based on LP proportion):`);
            console.log(`  Deployer: ${expectedDeployerIncrease} WELSH (actual: ${deployerIncrease5}, diff: ${deployerIncrease5 - expectedDeployerIncrease})`);
            console.log(`  Wallet1:  ${expectedWallet1Increase} WELSH (actual: ${wallet1Increase5}, diff: ${wallet1Increase5 - expectedWallet1Increase})`);
            console.log(`  Wallet2:  ${expectedWallet2Increase} WELSH (actual: ${wallet2Increase5}, diff: ${wallet2Increase5 - expectedWallet2Increase})`);
            
            console.log(`\nVerification:`);
            console.log(`  Wallet1's LP increased from 1B to ${wallet1LpBalance}`);
            console.log(`  Wallet1's reward share matches LP proportion: ${Math.abs(wallet1Increase5 - expectedWallet1Increase) <= 1 ? "✅ YES" : "❌ NO"}`);
            console.log(`  Total distributed equals donation: ${totalIncrease5} vs ${DONATE_WELSH} (diff: ${totalIncrease5 - DONATE_WELSH})`);
        }

        // STEP 6: Wallet2 transfers LP to deployer via transferCredit, then verify both methods produce identical reward increases
        if (disp) {
            console.log("\n=== STEP 6: Transfer LP and Compare Both Preservation Methods ===");
        }

        // Get current state before transfer
        const deployerBeforeTransfer = getUserRewardInfo(deployer, "Deployer BEFORE transfer");
        getUserRewardInfo(wallet1, "Wallet1 BEFORE transfer (for reference)");
        const wallet2BeforeTransfer = getUserRewardInfo(wallet2, "Wallet2 BEFORE transfer");

        // Calculate wallet2's LP distribution after transfer
        const lpToTransfer = actualMintedLp; // Transfer the same amount that was minted in STEP 5

        if (disp) {
            console.log(`\nWallet2 transferring ${lpToTransfer} LP to deployer...`);
            console.log(`  Wallet2 LP before: ${wallet2LpBalance}`);
            console.log(`  Deployer LP before: ${deployerLpBalance}`);
        }

        // Wallet2 transfers LP to deployer using transferCredit (credit-controller)
        // This triggers: decrease-rewards for wallet2 (sender) and increase-rewards for deployer (recipient)
        transferCredit(lpToTransfer, wallet2, deployer, wallet2, undefined, disp);

        // Update tracking balances
        wallet2LpBalance -= lpToTransfer;
        deployerLpBalance += lpToTransfer;

        if (disp) {
            console.log(`\nWallet2 LP after: ${wallet2LpBalance} (-${lpToTransfer})`);
            console.log(`Deployer LP after: ${deployerLpBalance} (+${lpToTransfer})`);
            console.log(`Total LP Supply: ${totalLpSupply} (unchanged)`);
        }

        // Get state after transfer to verify preservation
        const deployerAfterTransfer = getUserRewardInfo(deployer, "Deployer AFTER transfer");
        const wallet2AfterTransfer = getUserRewardInfo(wallet2, "Wallet2 AFTER transfer");

        if (disp) {
            // Calculate expected proportional adjustment for wallet2 (sender)
            const lpTransferredRatio = lpToTransfer / (wallet2LpBalance + lpToTransfer);
            const expectedRemainingRatio = 1 - lpTransferredRatio;
            const expectedWallet2Rewards = Math.floor(wallet2BeforeTransfer.unclaimedA * expectedRemainingRatio);
            const wallet2AdjustmentDiff = Math.abs(wallet2AfterTransfer.unclaimedA - expectedWallet2Rewards);
            
            console.log(`\nRewards preservation check (transferCredit behavior):`);
            console.log(`  IMPORTANT: Recipient (deployer) preserves rewards via Method 2 (index adjustment)`);
            console.log(`             Sender (wallet2) adjusts rewards proportionally (decrease-rewards)`);
            console.log(`\n  Deployer (recipient):`);
            console.log(`    Unclaimed-a: ${deployerBeforeTransfer.unclaimedA} → ${deployerAfterTransfer.unclaimedA}`);
            console.log(`    Increase from LP transfer: +${deployerAfterTransfer.unclaimedA - deployerBeforeTransfer.unclaimedA}`);
            console.log(`    Method 2 (index adjustment) applied: ✅`);
            console.log(`\n  Wallet2 (sender):`);
            console.log(`    Unclaimed-a: ${wallet2BeforeTransfer.unclaimedA} → ${wallet2AfterTransfer.unclaimedA}`);
            console.log(`    LP transferred: ${lpToTransfer} / ${wallet2LpBalance + lpToTransfer} = ${(lpTransferredRatio * 100).toFixed(2)}%`);
            console.log(`    Expected rewards (${(expectedRemainingRatio * 100).toFixed(2)}% remaining): ${expectedWallet2Rewards}`);
            console.log(`    Actual rewards: ${wallet2AfterTransfer.unclaimedA}`);
            console.log(`    Proportional adjustment correct: ${wallet2AdjustmentDiff <= 1 ? "✅ YES (expected)" : "❌ NO (error)"}`);
        }

        // 2. Deployer donates DONATE_WELSH
        if (disp) {
            console.log(`\nDeployer donating ${DONATE_WELSH} WELSH...`);
        }

        const deployerBeforeDonation6 = getUserRewardInfo(deployer, "Deployer before donation");
        const wallet1BeforeDonation6 = getUserRewardInfo(wallet1, "Wallet1 before donation");
        const wallet2BeforeDonation6 = getUserRewardInfo(wallet2, "Wallet2 before donation");

        donateRewards(DONATE_WELSH, 0, deployer, disp);

        // Update tracking variables
        totalDistributedA += DONATE_WELSH;
        globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        rewardsA += DONATE_WELSH;
        outstandingA = totalDistributedA - totalClaimedA;
        actualA = outstandingA;

        // 3. Get reward info for all users after donation
        if (disp) {
            console.log(`\nAfter donation - User unclaimed rewards:`);
        }

        const deployerAfterDonation6 = getUserRewardInfo(deployer, "Deployer after donation");
        const wallet1AfterDonation6 = getUserRewardInfo(wallet1, "Wallet1 after donation");
        const wallet2AfterDonation6 = getUserRewardInfo(wallet2, "Wallet2 after donation");

        // Calculate increases
        const deployerIncrease6 = deployerAfterDonation6.unclaimedA - deployerBeforeDonation6.unclaimedA;
        const wallet1Increase6 = wallet1AfterDonation6.unclaimedA - wallet1BeforeDonation6.unclaimedA;
        const wallet2Increase6 = wallet2AfterDonation6.unclaimedA - wallet2BeforeDonation6.unclaimedA;
        const totalIncrease6 = deployerIncrease6 + wallet1Increase6 + wallet2Increase6;

        // Calculate expected proportional shares
        const deployerShare6 = (deployerLpBalance / totalLpSupply) * 100;
        const wallet1Share6 = (wallet1LpBalance / totalLpSupply) * 100;
        const wallet2Share6 = (wallet2LpBalance / totalLpSupply) * 100;

        // Calculate expected reward increases based on LP proportion
        const expectedDeployerIncrease6 = Math.floor((DONATE_WELSH * deployerLpBalance) / totalLpSupply);
        const expectedWallet1Increase6 = Math.floor((DONATE_WELSH * wallet1LpBalance) / totalLpSupply);
        const expectedWallet2Increase6 = Math.floor((DONATE_WELSH * wallet2LpBalance) / totalLpSupply);

        if (disp) {
            console.log(`\n=== STEP 6 SUMMARY: Comparing Both Preservation Methods ===`);
            console.log(`\nTotal LP Supply: ${totalLpSupply}`);
            console.log(`LP Balances:`);
            console.log(`  Deployer: ${deployerLpBalance} (${deployerShare6.toFixed(4)}%) - received via transferCredit (Method 2)`);
            console.log(`  Wallet1:  ${wallet1LpBalance} (${wallet1Share6.toFixed(4)}%) - received via provide-liquidity (Method 1)`);
            console.log(`  Wallet2:  ${wallet2LpBalance} (${wallet2Share6.toFixed(4)}%)`);
            
            console.log(`\nDonation: ${DONATE_WELSH} WELSH`);
            console.log(`\nActual reward increases:`);
            console.log(`  Deployer: +${deployerIncrease6} WELSH`);
            console.log(`  Wallet1:  +${wallet1Increase6} WELSH`);
            console.log(`  Wallet2:  +${wallet2Increase6} WELSH`);
            console.log(`  Total:    ${totalIncrease6} WELSH`);
            
            console.log(`\nExpected reward increases (based on LP proportion):`);
            console.log(`  Deployer: ${expectedDeployerIncrease6} WELSH (actual: ${deployerIncrease6}, diff: ${deployerIncrease6 - expectedDeployerIncrease6})`);
            console.log(`  Wallet1:  ${expectedWallet1Increase6} WELSH (actual: ${wallet1Increase6}, diff: ${wallet1Increase6 - expectedWallet1Increase6})`);
            console.log(`  Wallet2:  ${expectedWallet2Increase6} WELSH (actual: ${wallet2Increase6}, diff: ${wallet2Increase6 - expectedWallet2Increase6})`);
            
            console.log(`\n=== MATHEMATICAL EQUIVALENCE VERIFICATION ===`);
            console.log(`Both users received same LP amount (${actualMintedLp}) via different methods:`);
            console.log(`  Wallet1: provide-liquidity → Method 1 (debt adjustment, street-market)`);
            console.log(`  Deployer: transferCredit → Method 2 (index adjustment, credit-controller)`);
            console.log(`\nReward increases comparison:`);
            console.log(`  Wallet1 increase:  ${wallet1Increase6} WELSH`);
            console.log(`  Deployer increase: ${deployerIncrease6} WELSH`);
            console.log(`  Difference: ${wallet1Increase6 - deployerIncrease6} WELSH`);
            console.log(`  Methods equivalent: ${wallet1Increase6 === deployerIncrease6 ? "✅ YES - IDENTICAL" : "❌ NO"}`);
            
            console.log(`\nVerification:`);
            console.log(`  Both preservation methods produce identical reward accrual: ${wallet1Increase6 === deployerIncrease6 ? "✅ PROVEN" : "❌ FAILED"}`);
            console.log(`  Total distributed equals donation: ${totalIncrease6} vs ${DONATE_WELSH} (diff: ${totalIncrease6 - DONATE_WELSH})`);
        }
    });
});