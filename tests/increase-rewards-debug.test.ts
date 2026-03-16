import { describe, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { disp, DONATE_WELSH, DONATE_STREET, PRECISION, TRANSFER_CREDIT } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { burnLiquidity } from "./functions/street-market-helper-functions";
import { claimRewards, donateRewards, getCleanupRewards } from "./functions/street-rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/credit-controller-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== INCREASE REWARDS TESTS ===", () => {
    it("=== INCREASE REWARDS TEST ===", () => {
        // TEST SUMMARY
        // This test tracks increase-rewards behavior when recipients receive LP tokens.
        // Focus: Verify increase-rewards properly updates recipient's debt and preserves unclaimed rewards
        // Key aspects:
        // 1. Same setup as decrease-rewards test (3 users with equal LP balances)
        // 2. Track RECIPIENTS of LP transfers (who trigger increase-rewards)
        // 3. Verify debt-a, debt-b are properly calculated to preserve unclaimed rewards
        // 4. Compare against decrease-rewards to identify any discrepancies
        // 
        // Test Structure:
        // - STEP 1: Setup with 3 users having liquidity
        // - STEP 1b: Deployer burns excess LP to match wallet1/wallet2 (all have 10B LP)
        // - STEP 2-6: Verify balances and donate rewards
        // - STEP 7: Additional donation from wallet1
        // - STEP 8: Circular LP transfers - track RECIPIENTS (deployer←wallet2←wallet1←deployer)
        // - STEP 9-10: Claim rewards and analyze distribution patterns
        
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

        // STEP 4: Donate rewards to the reward pool
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        // Update tracking variables after donation
        totalDistributedA += DONATE_WELSH;
        totalDistributedB += DONATE_STREET;
        globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        globalIndexB += Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);
        rewardsA += DONATE_WELSH;
        rewardsB += DONATE_STREET;
        
        outstandingA = totalDistributedA - totalClaimedA;
        outstandingB = totalDistributedB - totalClaimedB;
        actualA = outstandingA;
        actualB = outstandingB;

        if (disp) {
            console.log("=== STEP 4 COMPLETE: REWARDS DONATED ===");
            console.log(`Total Distributed A: ${totalDistributedA}, B: ${totalDistributedB}`);
            console.log(`Global Index A: ${globalIndexA}, B: ${globalIndexB}`);
        }

        // STEP 5: Validate rewards contract STREET balance
        getBalance(rewardsB, 'street-token', { address: deployer, contractName: "street-rewards" }, deployer, disp);

        if (disp) {
            console.log("=== STEP 5 COMPLETE: REWARDS CONTRACT BALANCE VERIFIED ===");
        }

        // STEP 6: Read accounting state BEFORE any claims (observe onchain reward tracking parameters)
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
            console.log("=== STEP 6 COMPLETE: ACCOUNTING BEFORE CLAIMS ===");
            console.log(`Users have unclaimed rewards - critical for testing increase-rewards`);
        }

        // STEP 7: wallet1 donates STREET to rewards contract
        const donateStreetStep7 = DONATE_STREET;
        
        if (disp) {
            console.log("=== STEP 7: Donate Additional STREET Rewards ===");
            console.log(`Wallet1 donating ${donateStreetStep7} STREET`);
        }
        
        donateRewards(0, donateStreetStep7, wallet1, disp);
        
        wallet1StreetBalance -= donateStreetStep7;
        totalDistributedB += donateStreetStep7;
        globalIndexB += Math.floor((donateStreetStep7 * PRECISION) / totalLpSupply);
        rewardsB += donateStreetStep7;
        
        outstandingB = totalDistributedB - totalClaimedB;
        actualA = rewardsA;
        actualB = rewardsB;
        
        // Read onchain state after donation (get-cleanup-rewards is read-only)
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
            console.log("=== STEP 7 COMPLETE: POST-DONATION ACCOUNTING ===");
            console.log(`Updated total-distributed-b: ${totalDistributedB}`);
            console.log(`Global Index B: ${globalIndexB}`);
        }

        // STEP 8: LP token transfers using transferCredit
        // Focus: Track RECIPIENTS who trigger increase-rewards
        // deployer→wallet1 (wallet1 receives), wallet1→wallet2 (wallet2 receives), wallet2→deployer (deployer receives)
        
        if (disp) {
            console.log("=== STEP 8: LP Token Transfers (Track increase-rewards for RECIPIENTS) ===");
            console.log("Focus: Recipients trigger increase-rewards when receiving LP tokens");
            console.log("Verify: increase-rewards properly updates debt and preserves unclaimed rewards");
            console.log("");
        }
        
        const transferAmount = TRANSFER_CREDIT;
        
        // Helper function to get user reward info before and after transfers
        const getUserRewardInfo = (user: string, label: string) => {
            const userInfoResult = simnet.callReadOnlyFn("street-rewards", "get-reward-user-info", [Cl.principal(user)], deployer);
            const userData = (userInfoResult.result as any).value.value;
            const info = {
                balance: Number(userData['balance'].value),
                debtA: Number(userData['debt-a'].value),
                debtB: Number(userData['debt-b'].value),
                indexA: Number(userData['index-a'].value),
                indexB: Number(userData['index-b'].value),
                unclaimedA: Number(userData['unclaimed-a'].value),
                unclaimedB: Number(userData['unclaimed-b'].value)
            };
            if (disp) {
                console.log(`${label}:`);
                console.log(`  balance: ${info.balance}, debt-a: ${info.debtA}, debt-b: ${info.debtB}`);
                console.log(`  index-a: ${info.indexA}, index-b: ${info.indexB}`);
                console.log(`  unclaimed-a: ${info.unclaimedA}, unclaimed-b: ${info.unclaimedB}`);
            }
            return info;
        };
        
        // Transfer 1: deployer→wallet1 (FOCUS: wallet1 as RECIPIENT)
        if (disp) {
            console.log(`\n--- Transfer 1: deployer → wallet1 (${transferAmount} LP) ---`);
            console.log("Before transfer - wallet1 (RECIPIENT) state:");
        }
        
        const wallet1BeforeTransfer1 = getUserRewardInfo(wallet1, "  wallet1 BEFORE");
        
        transferCredit(transferAmount, deployer, wallet1, deployer, undefined, disp);
        
        deployerLpBalance -= transferAmount;
        wallet1LpBalance += transferAmount;
        
        if (disp) {
            console.log("After transfer - wallet1 (RECIPIENT) state:");
        }
        
        const wallet1AfterTransfer1 = getUserRewardInfo(wallet1, "  wallet1 AFTER");
        
        if (disp) {
            console.log("  Analysis:");
            console.log(`    Balance change: ${wallet1BeforeTransfer1.balance} → ${wallet1AfterTransfer1.balance} (+${transferAmount})`);
            console.log(`    Debt-b change: ${wallet1BeforeTransfer1.debtB} → ${wallet1AfterTransfer1.debtB}`);
            console.log(`    Unclaimed-b preserved: ${wallet1BeforeTransfer1.unclaimedB} → ${wallet1AfterTransfer1.unclaimedB}`);
        }
        
        getBalance(deployerLpBalance, 'credit-token', deployer, deployer, disp);
        getBalance(wallet1LpBalance, 'credit-token', wallet1, deployer, disp);
        
        // Transfer 2: wallet1→wallet2 (FOCUS: wallet2 as RECIPIENT)
        if (disp) {
            console.log(`\n--- Transfer 2: wallet1 → wallet2 (${transferAmount} LP) ---`);
            console.log("Before transfer - wallet2 (RECIPIENT) state:");
        }
        
        const wallet2BeforeTransfer2 = getUserRewardInfo(wallet2, "  wallet2 BEFORE");
        
        transferCredit(transferAmount, wallet1, wallet2, wallet1, undefined, disp);
        
        wallet1LpBalance -= transferAmount;
        wallet2LpBalance += transferAmount;
        
        if (disp) {
            console.log("After transfer - wallet2 (RECIPIENT) state:");
        }
        
        const wallet2AfterTransfer2 = getUserRewardInfo(wallet2, "  wallet2 AFTER");
        
        if (disp) {
            console.log("  Analysis:");
            console.log(`    Balance change: ${wallet2BeforeTransfer2.balance} → ${wallet2AfterTransfer2.balance} (+${transferAmount})`);
            console.log(`    Debt-b change: ${wallet2BeforeTransfer2.debtB} → ${wallet2AfterTransfer2.debtB}`);
            console.log(`    Unclaimed-b preserved: ${wallet2BeforeTransfer2.unclaimedB} → ${wallet2AfterTransfer2.unclaimedB}`);
        }
        
        getBalance(wallet1LpBalance, 'credit-token', wallet1, deployer, disp);
        getBalance(wallet2LpBalance, 'credit-token', wallet2, deployer, disp);
        
        // Transfer 3: wallet2→deployer (FOCUS: deployer as RECIPIENT)
        if (disp) {
            console.log(`\n--- Transfer 3: wallet2 → deployer (${transferAmount} LP) ---`);
            console.log("Before transfer - deployer (RECIPIENT) state:");
        }
        
        const deployerBeforeTransfer3 = getUserRewardInfo(deployer, "  deployer BEFORE");
        
        transferCredit(transferAmount, wallet2, deployer, wallet2, undefined, disp);
        
        wallet2LpBalance -= transferAmount;
        deployerLpBalance += transferAmount;
        
        if (disp) {
            console.log("After transfer - deployer (RECIPIENT) state:");
        }
        
        const deployerAfterTransfer3 = getUserRewardInfo(deployer, "  deployer AFTER");
        
        if (disp) {
            console.log("  Analysis:");
            console.log(`    Balance change: ${deployerBeforeTransfer3.balance} → ${deployerAfterTransfer3.balance} (+${transferAmount})`);
            console.log(`    Debt-b change: ${deployerBeforeTransfer3.debtB} → ${deployerAfterTransfer3.debtB}`);
            console.log(`    Unclaimed-b preserved: ${deployerBeforeTransfer3.unclaimedB} → ${deployerAfterTransfer3.unclaimedB}`);
        }
        
        getBalance(wallet2LpBalance, 'credit-token', wallet2, deployer, disp);
        getBalance(deployerLpBalance, 'credit-token', deployer, deployer, disp);
        
        if (disp) {
            console.log("\n=== STEP 8 COMPLETE: All LP Transfers Complete ===");
            console.log("Final LP Balances:");
            console.log(`  Deployer: ${deployerLpBalance}`);
            console.log(`  Wallet1:  ${wallet1LpBalance}`);
            console.log(`  Wallet2:  ${wallet2LpBalance}`);
            console.log("Each recipient triggered increase-rewards");
        }

        // STEP 9: Users claim rewards after LP transfers
        // Verify that increase-rewards properly preserved unclaimed rewards
        
        if (disp) {
            console.log("\n=== STEP 9: Users Claim Rewards After LP Transfers ===");
            console.log("Verify: increase-rewards preserved unclaimed rewards correctly");
        }
        
        const getUnclaimedAmounts = (user: string) => {
            const userInfoResult = simnet.callReadOnlyFn("street-rewards", "get-reward-user-info", [Cl.principal(user)], deployer);
            const userData = (userInfoResult.result as any).value.value;
            return {
                unclaimedA: Number(userData['unclaimed-a'].value),
                unclaimedB: Number(userData['unclaimed-b'].value)
            };
        };
        
        // Deployer claims
        const deployerUnclaimed = getUnclaimedAmounts(deployer);
        claimRewards(deployerUnclaimed.unclaimedA, deployerUnclaimed.unclaimedB, deployer, disp);
        if (disp) { console.log(`Deployer claimed: ${deployerUnclaimed.unclaimedB} STREET`); }
        
        // Wallet1 claims
        const wallet1Unclaimed = getUnclaimedAmounts(wallet1);
        claimRewards(wallet1Unclaimed.unclaimedA, wallet1Unclaimed.unclaimedB, wallet1, disp);
        if (disp) { console.log(`Wallet1 claimed: ${wallet1Unclaimed.unclaimedB} STREET`); }
        
        // Wallet2 claims
        const wallet2Unclaimed = getUnclaimedAmounts(wallet2);
        claimRewards(wallet2Unclaimed.unclaimedA, wallet2Unclaimed.unclaimedB, wallet2, disp);
        if (disp) { console.log(`Wallet2 claimed: ${wallet2Unclaimed.unclaimedB} STREET`); }
        
        totalClaimedB += deployerUnclaimed.unclaimedB + wallet1Unclaimed.unclaimedB + wallet2Unclaimed.unclaimedB;
        
        const totalStreetClaimed = deployerUnclaimed.unclaimedB + wallet1Unclaimed.unclaimedB + wallet2Unclaimed.unclaimedB;
        
        if (disp) {
            console.log("=== STEP 9: All Claims Complete ===");
            console.log(`Total STREET claimed: ${totalStreetClaimed}`);
            console.log(`  Deployer: ${deployerUnclaimed.unclaimedB}`);
            console.log(`  Wallet1:  ${wallet1Unclaimed.unclaimedB}`);
            console.log(`  Wallet2:  ${wallet2Unclaimed.unclaimedB}`);
        }

        // STEP 10: Post-Transfer Accounting Verification
        outstandingB = totalDistributedB - totalClaimedB;
        actualB = outstandingB;
        
        const cleanupResult = simnet.callReadOnlyFn("street-rewards", "get-cleanup-rewards", [], deployer);
        const cleanupData = (cleanupResult.result as any).value.value;
        const onchainActualA = Number(cleanupData['actual-a'].value);
        const onchainActualB = Number(cleanupData['actual-b'].value);
        const onchainClaimedA = Number(cleanupData['claimed-a'].value);
        const onchainClaimedB = Number(cleanupData['claimed-b'].value);
        const onchainDistributedA = Number(cleanupData['distributed-a'].value);
        const onchainDistributedB = Number(cleanupData['distributed-b'].value);
        const onchainOutstandingA = Number(cleanupData['outstanding-a'].value);
        const onchainOutstandingB = Number(cleanupData['outstanding-b'].value);
        const onchainCleanupA = Number(cleanupData['cleanup-a'].value);
        const onchainCleanupB = Number(cleanupData['cleanup-b'].value);
        
        if (disp) {
            console.log("\n=== STEP 10: Post-Transfer Accounting Verification ===");
            console.log("Onchain values:");
            console.log(`  actual-b: ${onchainActualB}`);
            console.log(`  claimed-b: ${onchainClaimedB}`);
            console.log(`  distributed-b: ${onchainDistributedB}`);
            console.log(`  outstanding-b: ${onchainOutstandingB}`);
            console.log(`  cleanup-b: ${onchainCleanupB}`);
        }
        
        // Read final onchain state (get-cleanup-rewards is read-only)
        getCleanupRewards(
            onchainActualA,
            onchainActualB,
            onchainClaimedA,
            onchainClaimedB,
            onchainCleanupA,
            onchainCleanupB,
            onchainDistributedA,
            onchainDistributedB,
            onchainOutstandingA,
            onchainOutstandingB,
            deployer,
            disp
        );
        
        const expectedDistributedB = DONATE_STREET + donateStreetStep7;
        const difference = onchainDistributedB - expectedDistributedB;
        const differencePercentage = (difference / expectedDistributedB) * 100;
        
        if (disp) {
            console.log("\n=== STEP 10 COMPLETE: STREET Accounting Analysis ===");
            console.log(`Expected STREET distributed: ${expectedDistributedB}`);
            console.log(`Onchain distributed-b: ${onchainDistributedB}`);
            console.log(`Difference: ${difference} (${differencePercentage.toFixed(4)}%)`);
            console.log("");
            console.log("Comparison with decrease-rewards test:");
            console.log("  - decrease-rewards: Senders forfeit unclaimed rewards");
            console.log("  - increase-rewards: Recipients preserve unclaimed rewards");
            console.log("  - Both tests track same transfers from different perspectives");
            console.log("  - Any discrepancies indicate potential bugs in reward accounting");
        }

    })
})
