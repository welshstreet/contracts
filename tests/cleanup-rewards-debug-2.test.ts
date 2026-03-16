import { describe, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { disp, DONATE_STREET, } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CLEANUP REWARDS DEBUG 2 TESTS ===", () => {
    it("=== CLEANUP REWARDS DEBUG 2 DEMONSTRATION ===", () => {
        // TEST SUMMARY
        // This test tracks tokenB (STREET) rewards behavior during LP transfers.
        // We only track STREET in lifetime accounting because:
        // 1. WELSH (tokenA) rewards are only donated once at setup - no new WELSH rewards after that
        // 2. STREET (tokenB) rewards continue through emissions and donations - this is where behavior is most visible
        // 
        // DESIGN INTENTION - Forfeit and Redistribution:
        // When a user transfers LP tokens, they FORFEIT all unclaimed rewards proportional to the transfer amount.
        // Those forfeited rewards are REDISTRIBUTED to remaining LP holders via global index increases.
        // This is BY DESIGN: 
        // - The sender is the only participant negatively affected (loses unclaimed rewards)
        // - Non-participating LP holders gain proportional shares of forfeited rewards
        // - This incentivizes holding LP and discourages frequent transfers
        // 
        // Example: In Transfer 1 (deployer -> wallet1), wallet2 gains rewards despite not participating.
        // This is EXPECTED - wallet2 holds LP and is entitled to share in deployer's forfeited rewards.


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

        // STEP 2: Verify balances by calling get-balance directly (sanity check)
        // Get LP balances using simnet.callReadOnlyFn with Cl parameters
        let deployerLpResult = simnet.callReadOnlyFn(
            "credit-token",
            "get-balance",
            [Cl.principal(deployer)],
            deployer
        );
        let lpDeployer = Number((deployerLpResult.result as any).value.value);
        
        let wallet1LpResult = simnet.callReadOnlyFn(
            "credit-token",
            "get-balance",
            [Cl.principal(wallet1)],
            deployer
        );
        let lpWallet1 = Number((wallet1LpResult.result as any).value.value);
        
        let wallet2LpResult = simnet.callReadOnlyFn(
            "credit-token",
            "get-balance",
            [Cl.principal(wallet2)],
            deployer
        );
        let lpWallet2 = Number((wallet2LpResult.result as any).value.value);
        
        // Get STREET balances using simnet.callReadOnlyFn (STREET ONLY - ignore WELSH)
        let deployerStreetResult = simnet.callReadOnlyFn(
            "street-token",
            "get-balance",
            [Cl.principal(deployer)],
            deployer
        );
        let streetDeployer = Number((deployerStreetResult.result as any).value.value);
        
        let wallet1StreetResult = simnet.callReadOnlyFn(
            "street-token",
            "get-balance",
            [Cl.principal(wallet1)],
            deployer
        );
        let streetWallet1 = Number((wallet1StreetResult.result as any).value.value);
        
        let wallet2StreetResult = simnet.callReadOnlyFn(
            "street-token",
            "get-balance",
            [Cl.principal(wallet2)],
            deployer
        );
        let streetWallet2 = Number((wallet2StreetResult.result as any).value.value);
        
        if (disp) {
            console.log("=== STEP 2: Verify User Balances ===");
            console.log("LP Token Balances:");
            console.log(`  Deployer LP: ${lpDeployer} (matches setup: ${lpDeployer === deployerLpBalance})`);
            console.log(`  Wallet1 LP:  ${lpWallet1} (matches setup: ${lpWallet1 === wallet1LpBalance})`);
            console.log(`  Wallet2 LP:  ${lpWallet2} (matches setup: ${lpWallet2 === wallet2LpBalance})`);
            console.log("STREET Token Balances:");
            console.log(`  Deployer STREET: ${streetDeployer}`);
            console.log(`  Wallet1 STREET:  ${streetWallet1}`);
            console.log(`  Wallet2 STREET:  ${streetWallet2}`);
        }

        // STEP 3: Call get-cleanup-rewards to access onchain accounting values (STREET only)
        // NOTE: We use get-cleanup-rewards (read-only) to READ accounting data, NOT to test cleanup functionality.
        // The cleanup-rewards system has been extensively tested and works correctly.
        // get-cleanup-rewards returns a tuple with all accounting values including total-distributed-b and total-claimed-b.
        // We only care about distributed-b and claimed-b (STREET side) for tracking purposes.
        let cleanupResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        
        // Extract values from the returned tuple and store in our tracking variables
        let cleanupData = (cleanupResult.result as any).value.value;
        let totalDistributedB = Number(cleanupData['distributed-b'].value);
        let totalClaimedB = Number(cleanupData['claimed-b'].value);
        let actualB = Number(cleanupData['actual-b'].value);
        let outstandingB = Number(cleanupData['outstanding-b'].value);
        
        if (disp) {
            console.log("=== STEP 3: Onchain Accounting (STREET only - from get-cleanup-rewards) ===");
            console.log(`total-distributed-b: ${totalDistributedB} STREET`);
            console.log(`total-claimed-b: ${totalClaimedB} STREET`);
            console.log(`outstanding-b: ${outstandingB} STREET`);
            console.log(`actual-b (balance in contract): ${actualB} STREET`);
            console.log("");
            console.log(`Expected: distributed-b = ${DONATE_STREET} (from setup donation)`);
            console.log(`Expected: claimed-b = 0 (no claims yet)`);
        }


        // STEP 4: deployer donates STREET to the rewards contract using donate-rewards
        // Then check get-reward-user-info for deployer and get-cleanup-rewards to see updated accounting
        let donateAmount = DONATE_STREET // STREET
        
        // Call donate-rewards using simnet.callPublicFn with Cl parameters
        let donateResult = simnet.callPublicFn(
            "street-rewards",
            "donate-rewards",
            [Cl.uint(0), Cl.uint(donateAmount)], // 0 WELSH, 30T STREET
            deployer
        );
        
        // Extract result from donate-rewards
        if (donateResult.result.type === 'ok') {
            let donateData = (donateResult.result as any).value.value;
            let donatedA = Number(donateData['amount-a'].value);
            let donatedB = Number(donateData['amount-b'].value);
            
            if (disp) {
                console.log("=== STEP 4: Donate 30T STREET to Rewards Contract ===");
                console.log(`Donated: ${donatedA} WELSH, ${donatedB} STREET`);
            }
        }
        
        // Call get-reward-user-info for all three users to see unclaimed rewards after donation
        let deployerUserInfoResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(deployer)],
            deployer
        );
        
        let deployerUserData = (deployerUserInfoResult.result as any).value.value;
        let deployerBalance = Number(deployerUserData['balance'].value);
        let deployerUnclaimedB = Number(deployerUserData['unclaimed-b'].value);
        let deployerDebtB = Number(deployerUserData['debt-b'].value);
        let deployerIndexB = Number(deployerUserData['index-b'].value);
        
        let wallet1UserInfoResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(wallet1)],
            deployer
        );
        
        let wallet1UserData = (wallet1UserInfoResult.result as any).value.value;
        let wallet1Balance = Number(wallet1UserData['balance'].value);
        let wallet1UnclaimedB = Number(wallet1UserData['unclaimed-b'].value);
        let wallet1DebtB = Number(wallet1UserData['debt-b'].value);
        let wallet1IndexB = Number(wallet1UserData['index-b'].value);
        
        let wallet2UserInfoResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(wallet2)],
            deployer
        );
        
        let wallet2UserData = (wallet2UserInfoResult.result as any).value.value;
        let wallet2Balance = Number(wallet2UserData['balance'].value);
        let wallet2UnclaimedB = Number(wallet2UserData['unclaimed-b'].value);
        let wallet2DebtB = Number(wallet2UserData['debt-b'].value);
        let wallet2IndexB = Number(wallet2UserData['index-b'].value);
        
        // Call get-cleanup-rewards again to see updated accounting
        cleanupResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        
        cleanupData = (cleanupResult.result as any).value.value;
        totalDistributedB = Number(cleanupData['distributed-b'].value);
        totalClaimedB = Number(cleanupData['claimed-b'].value);
        actualB = Number(cleanupData['actual-b'].value);
        outstandingB = Number(cleanupData['outstanding-b'].value);
        
        if (disp) {
            console.log("=== STEP 4: All Users Info (after donation) ===");
            console.log(`Deployer - LP: ${deployerBalance}, unclaimed-b: ${deployerUnclaimedB} STREET, debt-b: ${deployerDebtB}, index-b: ${deployerIndexB}`);
            console.log(`Wallet1  - LP: ${wallet1Balance}, unclaimed-b: ${wallet1UnclaimedB} STREET, debt-b: ${wallet1DebtB}, index-b: ${wallet1IndexB}`);
            console.log(`Wallet2  - LP: ${wallet2Balance}, unclaimed-b: ${wallet2UnclaimedB} STREET, debt-b: ${wallet2DebtB}, index-b: ${wallet2IndexB}`);
            console.log("");
            console.log("=== STEP 4: Updated Onchain Accounting (STREET only) ===");
            console.log(`total-distributed-b: ${totalDistributedB} STREET`);
            console.log(`total-claimed-b: ${totalClaimedB} STREET`);
            console.log(`outstanding-b: ${outstandingB} STREET`);
            console.log(`actual-b (balance in contract): ${actualB} STREET`);
            console.log("");
            console.log(`Expected: distributed-b = ${DONATE_STREET + donateAmount} (donations: ${DONATE_STREET} + ${donateAmount})`);
            console.log(`Total unclaimed across all users: ${deployerUnclaimedB + wallet1UnclaimedB + wallet2UnclaimedB} STREET`);
        }

        // STEP 5: deployer transfers STREET directly to "street-rewards" contract address 
        // (not using donate-rewards) - this simulates an accidental direct transfer
        const transferAmount = DONATE_STREET; // 30T STREET
        
        // Direct transfer to rewards contract (bypasses donate-rewards)
        simnet.callPublicFn(
            "street-token",
            "transfer",
            [
                Cl.uint(transferAmount),
                Cl.principal(deployer),
                Cl.contractPrincipal(deployer, "street-rewards"),
                Cl.none()
            ],
            deployer
        );
        
        if (disp) {
            console.log("=== STEP 5: Direct Transfer (Accidental) ===");
            console.log(`Transferred ${transferAmount} STREET directly to rewards contract`);
            console.log("⚠️ NOTE: This bypasses donate-rewards, so global index NOT updated");
        }
        
        // Check get-cleanup-rewards to detect the excess (should show 30T cleanup-b)
        const cleanupBeforeResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        
        const cleanupBefore = (cleanupBeforeResult.result as any).value.value;
        const actualB_before = Number(cleanupBefore['actual-b'].value);
        const distributedB_before = Number(cleanupBefore['distributed-b'].value);
        const claimedB_before = Number(cleanupBefore['claimed-b'].value);
        const outstandingB_before = Number(cleanupBefore['outstanding-b'].value);
        const cleanupB_before = Number(cleanupBefore['cleanup-b'].value);
        
        // Get global index before cleanup
        const poolInfoBeforeCleanupResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        const poolInfoBeforeCleanup = (poolInfoBeforeCleanupResult.result as any).value.value;
        const globalIndexB_beforeCleanup = Number(poolInfoBeforeCleanup['global-index-b'].value);
        
        if (disp) {
            console.log("=== STEP 5: Cleanup Detection (Before Cleanup) ===");
            console.log(`actual-b (balance in contract): ${actualB_before} STREET`);
            console.log(`distributed-b (tracked donations): ${distributedB_before} STREET`);
            console.log(`claimed-b: ${claimedB_before} STREET`);
            console.log(`outstanding-b (distributed - claimed): ${outstandingB_before} STREET`);
            console.log(` cleanup-b (EXCESS DETECTED): ${cleanupB_before} STREET`);
            console.log(`global-index-b (before cleanup): ${globalIndexB_beforeCleanup}`);
            console.log("");
            console.log(`💡 Cleanup calculation: cleanup-b = actual-b - (distributed-b - claimed-b)`);
            console.log(`   cleanup-b = ${actualB_before} - (${distributedB_before} - ${claimedB_before}) = ${cleanupB_before}`);
        }

        // STEP 6: Call cleanup-rewards to trigger the cleanup process and observe the results
        const cleanupExecuteResult = simnet.callPublicFn(
            "street-rewards",
            "cleanup-rewards",
            [],
            deployer
        );
        
        if (disp) {
            console.log("=== STEP 6: Execute Cleanup ===");
            if (cleanupExecuteResult.result.type === 'ok') {
                const cleanupReturn = (cleanupExecuteResult.result as any).value.value;
                const amountA = Number(cleanupReturn['amount-a'].value);
                const amountB = Number(cleanupReturn['amount-b'].value);
                console.log(` Cleanup successful`);
                console.log(`   Redistributed amount-a: ${amountA} WELSH`);
                console.log(`   Redistributed amount-b: ${amountB} STREET`);
            } else {
                console.log(`❌ Cleanup failed:`, cleanupExecuteResult.result);
            }
        }
        
        // Check get-cleanup-rewards after cleanup (cleanup-b should now be 0)
        const cleanupAfterResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-cleanup-rewards",
            [],
            deployer
        );
        
        const cleanupAfter = (cleanupAfterResult.result as any).value.value;
        const actualB_after = Number(cleanupAfter['actual-b'].value);
        const distributedB_after = Number(cleanupAfter['distributed-b'].value);
        const claimedB_after = Number(cleanupAfter['claimed-b'].value);
        const outstandingB_after = Number(cleanupAfter['outstanding-b'].value);
        const cleanupB_after = Number(cleanupAfter['cleanup-b'].value);
        
        // Get global index after cleanup
        const poolInfoAfterCleanupResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        const poolInfoAfterCleanup = (poolInfoAfterCleanupResult.result as any).value.value;
        const globalIndexB_afterCleanup = Number(poolInfoAfterCleanup['global-index-b'].value);
        
        if (disp) {
            console.log("=== STEP 6: Cleanup Detection (After Cleanup) ===");
            console.log(`actual-b (balance in contract): ${actualB_after} STREET`);
            console.log(`distributed-b (now includes cleanup): ${distributedB_after} STREET`);
            console.log(`claimed-b: ${claimedB_after} STREET`);
            console.log(`outstanding-b (distributed - claimed): ${outstandingB_after} STREET`);
            console.log(` cleanup-b (should be 0): ${cleanupB_after} STREET`);
            console.log(`global-index-b (after cleanup): ${globalIndexB_afterCleanup}`);
            console.log("");
            console.log(`📊 Global index increase: ${globalIndexB_afterCleanup - globalIndexB_beforeCleanup}`);
            console.log(`   This represents the redistributed ${cleanupB_before} STREET across all LP holders`);
        }
        
        // Check user unclaimed rewards after cleanup
        const deployerInfoAfterResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(deployer)],
            deployer
        );
        const deployerInfoAfter = (deployerInfoAfterResult.result as any).value.value;
        const deployerUnclaimedB_after = Number(deployerInfoAfter['unclaimed-b'].value);
        
        const wallet1InfoAfterResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(wallet1)],
            deployer
        );
        const wallet1InfoAfter = (wallet1InfoAfterResult.result as any).value.value;
        const wallet1UnclaimedB_after = Number(wallet1InfoAfter['unclaimed-b'].value);
        
        const wallet2InfoAfterResult = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(wallet2)],
            deployer
        );
        const wallet2InfoAfter = (wallet2InfoAfterResult.result as any).value.value;
        const wallet2UnclaimedB_after = Number(wallet2InfoAfter['unclaimed-b'].value);
        
        if (disp) {
            console.log("=== STEP 6: User Rewards After Cleanup ===");
            console.log(`Deployer unclaimed-b: ${deployerUnclaimedB_after} STREET (was ${deployerUnclaimedB})`);
            console.log(`Wallet1 unclaimed-b:  ${wallet1UnclaimedB_after} STREET (was ${wallet1UnclaimedB})`);
            console.log(`Wallet2 unclaimed-b:  ${wallet2UnclaimedB_after} STREET (was ${wallet2UnclaimedB})`);
            console.log(`Total unclaimed: ${deployerUnclaimedB_after + wallet1UnclaimedB_after + wallet2UnclaimedB_after} STREET`);
            console.log("");
            console.log(" CLEANUP TEST COMPLETE");
            console.log("Summary:");
            console.log(`  - Initial state: ${distributedB_before} STREET distributed via donate-rewards`);
            console.log(`  - Accidental transfer: ${transferAmount} STREET sent directly to contract`);
            console.log(`  - Cleanup detected: ${cleanupB_before} STREET excess`);
            console.log(`  - Cleanup executed: Redistributed via global index increase`);
            console.log(`  - Final distributed-b: ${distributedB_after} STREET (${distributedB_before} + ${cleanupB_before})`);
            console.log(`  - Users can now claim their proportional share of all ${distributedB_after} STREET`);
        }

    })
})
