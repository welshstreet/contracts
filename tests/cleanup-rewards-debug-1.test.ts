import { describe, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { disp, DONATE_STREET, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== CLEANUP REWARDS DEBUG 1 TEST ===", () => {
    it("=== CLEANUP REWARDS DEBUG 1 DEMONSTRATION ===", () => {
        // TEST SUMMARY
        // This test demonstrates the cleanup-rewards functionality by:
        // 1. Setting up market with 3 users
        // 2. Accidentally transferring tokens directly to rewards contract (simulating user error)
        // 3. Checking get-cleanup-rewards to detect the excess tokens
        // 4. Calling cleanup-rewards to redistribute the excess
        // 5. Verifying the tokens are properly distributed via global index increases

        // STEP 1: Setup liquidity and user state
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

        // STEP 2: Check initial reward pool state (BEFORE accidental transfers)
        // Note: Already has 30B WELSH from setup mints, not empty
        let poolInfoInitialResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        let poolInfoInitial = (poolInfoInitialResult.result as any).value.value;
        let globalIndexA_check = Number(poolInfoInitial['global-index-a'].value);
        let globalIndexB_check = Number(poolInfoInitial['global-index-b'].value);
        let rewardsA_check = Number(poolInfoInitial['rewards-a'].value);
        let rewardsB_check = Number(poolInfoInitial['rewards-b'].value);

        if (disp) {
            console.log("=== STEP 2: Initial Reward Pool State ===");
            console.log(`Global index A: ${globalIndexA_check} (matches setup: ${globalIndexA_check === globalIndexA})`);
            console.log(`Global index B: ${globalIndexB_check} (matches setup: ${globalIndexB_check === globalIndexB})`);
            console.log(`Rewards A in contract: ${rewardsA_check} (matches setup: ${rewardsA_check === rewardsA})`);
            console.log(`Rewards B in contract: ${rewardsB_check} (matches setup: ${rewardsB_check === rewardsB})`);
        }

        // STEP 3: Check initial get-cleanup-rewards (should show zero excess)
        // actual (30B) should equal distributed (30B), so cleanup = 0
        let cleanupInitialResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        let cleanupInitial = (cleanupInitialResult.result as any).value.value;
        let actualA = Number(cleanupInitial['actual-a'].value);
        let actualB = Number(cleanupInitial['actual-b'].value);
        let distributedA = Number(cleanupInitial['distributed-a'].value);
        let distributedB = Number(cleanupInitial['distributed-b'].value);
        let claimedA = Number(cleanupInitial['claimed-a'].value);
        let claimedB = Number(cleanupInitial['claimed-b'].value);
        let outstandingA = Number(cleanupInitial['outstanding-a'].value);
        let outstandingB = Number(cleanupInitial['outstanding-b'].value);
        let cleanupA = Number(cleanupInitial['cleanup-a'].value);
        let cleanupB = Number(cleanupInitial['cleanup-b'].value);

        if (disp) {
            console.log("=== STEP 3: Initial Cleanup Rewards Check ===");
            console.log(`actual-a (balance in contract): ${actualA}`);
            console.log(`actual-b (balance in contract): ${actualB}`);
            console.log(`distributed-a: ${distributedA}`);
            console.log(`distributed-b: ${distributedB}`);
            console.log(`claimed-a: ${claimedA}`);
            console.log(`claimed-b: ${claimedB}`);
            console.log(`outstanding-a: ${outstandingA}`);
            console.log(`outstanding-b: ${outstandingB}`);
            console.log(`cleanup-a (excess to redistribute): ${cleanupA}`);
            console.log(`cleanup-b (excess to redistribute): ${cleanupB}`);
        }

        // STEP 4: User accidentally transfers tokens directly to rewards contract
        // (bypassing donate-rewards function, so global index doesn't update)
        let transferAmountA = DONATE_WELSH; // 100B WELSH
        let transferAmountB = DONATE_STREET; // 10T STREET

        // Transfer WELSH directly to rewards contract
        simnet.callPublicFn(
            "welshcorgicoin",
            "transfer",
            [
                Cl.uint(transferAmountA),
                Cl.principal(deployer),
                Cl.contractPrincipal(deployer, "street-rewards"),
                Cl.none()
            ],
            deployer
        );

        // Transfer STREET directly to rewards contract
        simnet.callPublicFn(
            "street-token",
            "transfer",
            [
                Cl.uint(transferAmountB),
                Cl.principal(deployer),
                Cl.contractPrincipal(deployer, "street-rewards"),
                Cl.none()
            ],
            deployer
        );

        if (disp) {
            console.log("=== STEP 4: Accidental Direct Transfers ===");
            console.log(`Transferred ${transferAmountA} WELSH directly to rewards contract`);
            console.log(`Transferred ${transferAmountB} STREET directly to rewards contract`);
            console.log("⚠️ NOTE: These transfers bypass donate-rewards, so global index NOT updated");
        }

        // STEP 5: Check reward pool after accidental transfers
        // (tokens are in contract but global index unchanged)
        let poolInfoAfterTransferResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        let poolInfoAfterTransfer = (poolInfoAfterTransferResult.result as any).value.value;
        let globalIndexA_afterTransfer = Number(poolInfoAfterTransfer['global-index-a'].value);
        let globalIndexB_afterTransfer = Number(poolInfoAfterTransfer['global-index-b'].value);
        
        // Update our main let variables to reflect new state
        rewardsA = Number(poolInfoAfterTransfer['rewards-a'].value);
        rewardsB = Number(poolInfoAfterTransfer['rewards-b'].value);

        if (disp) {
            console.log("=== STEP 5: Reward Pool After Accidental Transfers ===");
            console.log(`Global index A: ${globalIndexA_afterTransfer} (unchanged from ${globalIndexA})`);
            console.log(`Global index B: ${globalIndexB_afterTransfer} (unchanged from ${globalIndexB})`);
            console.log(`Rewards A in contract: ${rewardsA} (was ${rewardsA_check} + ${transferAmountA})`);
            console.log(`Rewards B in contract: ${rewardsB} (was ${rewardsB_check} + ${transferAmountB})`);
        }

        // STEP 6: Check get-cleanup-rewards to detect the excess tokens
        // Update cleanup tracking variables
        let cleanupBeforeResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        let cleanupBefore = (cleanupBeforeResult.result as any).value.value;
        actualA = Number(cleanupBefore['actual-a'].value);
        actualB = Number(cleanupBefore['actual-b'].value);
        distributedA = Number(cleanupBefore['distributed-a'].value);
        distributedB = Number(cleanupBefore['distributed-b'].value);
        claimedA = Number(cleanupBefore['claimed-a'].value);
        claimedB = Number(cleanupBefore['claimed-b'].value);
        outstandingA = Number(cleanupBefore['outstanding-a'].value);
        outstandingB = Number(cleanupBefore['outstanding-b'].value);
        cleanupA = Number(cleanupBefore['cleanup-a'].value);
        cleanupB = Number(cleanupBefore['cleanup-b'].value);

        if (disp) {
            console.log("=== STEP 6: Cleanup Detection (Before Cleanup) ===");
            console.log(`actual-a (balance in contract): ${actualA}`);
            console.log(`actual-b (balance in contract): ${actualB}`);
            console.log(`distributed-a (tracked donations): ${distributedA}`);
            console.log(`distributed-b (tracked donations): ${distributedB}`);
            console.log(`claimed-a: ${claimedA}`);
            console.log(`claimed-b: ${claimedB}`);
            console.log(`outstanding-a (distributed - claimed): ${outstandingA}`);
            console.log(`outstanding-b (distributed - claimed): ${outstandingB}`);
            console.log(` cleanup-a (EXCESS DETECTED): ${cleanupA}`);
            console.log(` cleanup-b (EXCESS DETECTED): ${cleanupB}`);
            console.log(`💡 Cleanup calculation: cleanup = actual - (distributed - claimed)`);
            console.log(`   cleanup-a = ${actualA} - (${distributedA} - ${claimedA}) = ${cleanupA}`);
            console.log(`   cleanup-b = ${actualB} - (${distributedB} - ${claimedB}) = ${cleanupB}`);
        }

        // STEP 7: Call cleanup-rewards to redistribute the excess tokens
        let cleanupExecuteResult = simnet.callPublicFn(
            "street-rewards",
            "cleanup-rewards",
            [],
            deployer
        );

        if (disp) {
            console.log("=== STEP 7: Execute Cleanup ===");
            if (cleanupExecuteResult.result.type === 'ok') {
                let cleanupReturn = (cleanupExecuteResult.result as any).value.value;
                let amountA = Number(cleanupReturn['amount-a'].value);
                let amountB = Number(cleanupReturn['amount-b'].value);
                console.log(` Cleanup successful`);
                console.log(`   Redistributed amount-a: ${amountA}`);
                console.log(`   Redistributed amount-b: ${amountB}`);
            } else {
                console.log(`❌ Cleanup failed:`, cleanupExecuteResult.result);
            }
        }

        // STEP 8: Check reward pool after cleanup
        // (global index should now be updated to distribute the excess tokens)
        let poolInfoAfterCleanupResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        let poolInfoAfterCleanup = (poolInfoAfterCleanupResult.result as any).value.value;
        let globalIndexA_afterCleanup = Number(poolInfoAfterCleanup['global-index-a'].value);
        let globalIndexB_afterCleanup = Number(poolInfoAfterCleanup['global-index-b'].value);
        let rewardsA_afterCleanup = Number(poolInfoAfterCleanup['rewards-a'].value);
        let rewardsB_afterCleanup = Number(poolInfoAfterCleanup['rewards-b'].value);

        // Calculate expected global index increases and final values
        let cleanupIncreaseA = Math.floor((transferAmountA * PRECISION) / totalLpSupply);
        let cleanupIncreaseB = Math.floor((transferAmountB * PRECISION) / totalLpSupply);
        let expectedGlobalIndexA = globalIndexA + cleanupIncreaseA;
        let expectedGlobalIndexB = globalIndexB + cleanupIncreaseB;

        if (disp) {
            console.log("=== STEP 8: Reward Pool After Cleanup ===");
            console.log(`Global index A: ${globalIndexA_afterCleanup}`);
            console.log(`  Starting index: ${globalIndexA}`);
            console.log(`  Cleanup increase: ${cleanupIncreaseA}`);
            console.log(`  Expected final: ${expectedGlobalIndexA}`);
            console.log(`  Match: ${globalIndexA_afterCleanup === expectedGlobalIndexA ? '✓' : '✗'}`);
            console.log(`Global index B: ${globalIndexB_afterCleanup}`);
            console.log(`  Starting index: ${globalIndexB}`);
            console.log(`  Cleanup increase: ${cleanupIncreaseB}`);
            console.log(`  Expected final: ${expectedGlobalIndexB}`);
            console.log(`  Match: ${globalIndexB_afterCleanup === expectedGlobalIndexB ? '✓' : '✗'}`);
            console.log(`Rewards A in contract: ${rewardsA_afterCleanup}`);
            console.log(`Rewards B in contract: ${rewardsB_afterCleanup}`);
        }

        // STEP 9: Check get-cleanup-rewards after cleanup
        // (cleanup values should now be zero, distributed should be updated)
        let cleanupAfterResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        let cleanupAfter = (cleanupAfterResult.result as any).value.value;
        let actualA_after = Number(cleanupAfter['actual-a'].value);
        let actualB_after = Number(cleanupAfter['actual-b'].value);
        let distributedA_after = Number(cleanupAfter['distributed-a'].value);
        let distributedB_after = Number(cleanupAfter['distributed-b'].value);
        let claimedA_after = Number(cleanupAfter['claimed-a'].value);
        let claimedB_after = Number(cleanupAfter['claimed-b'].value);
        let outstandingA_after = Number(cleanupAfter['outstanding-a'].value);
        let outstandingB_after = Number(cleanupAfter['outstanding-b'].value);
        let cleanupA_after = Number(cleanupAfter['cleanup-a'].value);
        let cleanupB_after = Number(cleanupAfter['cleanup-b'].value);

        if (disp) {
            console.log("=== STEP 9: Cleanup Detection (After Cleanup) ===");
            console.log(`actual-a (balance in contract): ${actualA_after}`);
            console.log(`actual-b (balance in contract): ${actualB_after}`);
            console.log(`distributed-a (now includes cleanup): ${distributedA_after}`);
            console.log(`distributed-b (now includes cleanup): ${distributedB_after}`);
            console.log(`claimed-a: ${claimedA_after}`);
            console.log(`claimed-b: ${claimedB_after}`);
            console.log(`outstanding-a (distributed - claimed): ${outstandingA_after}`);
            console.log(`outstanding-b (distributed - claimed): ${outstandingB_after}`);
            console.log(` cleanup-a (should be 0): ${cleanupA_after}`);
            console.log(` cleanup-b (should be 0): ${cleanupB_after}`);
        }

        // STEP 10: Verify users can now claim the redistributed rewards
        let wallet1InfoResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(wallet1)],
            deployer
        );
        let wallet1Info = (wallet1InfoResult.result as any).value.value;
        let wallet1UnclaimedA = Number(wallet1Info['unclaimed-a'].value);
        let wallet1UnclaimedB = Number(wallet1Info['unclaimed-b'].value);

        if (disp) {
            console.log("=== STEP 10: User Claims Available ===");
            console.log(`wallet1 unclaimed-a: ${wallet1UnclaimedA}`);
            console.log(`wallet1 unclaimed-b: ${wallet1UnclaimedB}`);
            console.log(" CLEANUP TEST COMPLETE");
            console.log("Summary:");
            console.log(`  - Detected ${cleanupA} WELSH and ${cleanupB} STREET accidentally transferred`);
            console.log(`  - Cleanup redistributed excess via global index increases`);
            console.log(`  - Global index A increased by ${globalIndexA_afterCleanup - globalIndexA}`);
            console.log(`  - Global index B increased by ${globalIndexB_afterCleanup - globalIndexB}`);
            console.log(`  - Users can now claim their proportional share of the excess tokens`);
        }
    })
});
