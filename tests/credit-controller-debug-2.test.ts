import { describe, it } from "vitest";
import { disp, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getCleanupRewards, donateRewards, claimRewards } from "./functions/street-rewards-helper-functions";
import { transferCredit } from "./functions/credit-controller-helper-functions";
import { updateUserRewards } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT CONTROLLER DEBUG TESTS ===", () => {
    it("=== CREDIT CONTROLLER DEBUG 2 ===", () => {
        // TEST REQUIREMENTS
        // STEP 1: Setup environment (deployer + wallet1 + wallet2)
        // STEP 2: initialize `lifetimeClaimRewards` variables to 0 for all three accounts. This is an offchain variable to track the total rewards claimed by each account across multiple claim actions in this test. 
        // STEP 3: deployer donates DONATE_WELSH rewards (ignore STREET rewards for this test)
        // STEP 4: wallet1 transfers 10% of CREDIT to wallet2. Update in-memory model 
        // STEP 5: all 3 wallets claim rewards. Update in-memory model and lifetimeClaimRewards with claim results
        // STEP 6: deployer donates DONATE_WELSH rewards (ignore STREET rewards for this test)
        // STEP 7: wallet2 transfers 10% of CREDIT to deployer. Update in-memory model 
        // STEP 8: all 3 wallets claim rewards. Update in-memory model and lifetimeClaimRewards with claim results
        // STEP 9: deployer donates DONATE_WELSH rewards (ignore STREET rewards for this test)
        // STEP 10: deployer transfers 10% of CREDIT to wallet1. Update in-memory model 
        // STEP 11: all 3 wallets claim rewards. Update in-memory model and lifetimeClaimRewards with claim results
        // STEP 12: call getCleanupRewards to view the state of the rewards pool.  Compare the claimedA amount onchain to the lifetimeClaimsRewards
        
        // This test is a debug test so you are permitted to use the `updateUserRewards()` helper function to update the state after each step

        // STEP 1: Setup environment with multi-user liquidity state
        let { supplyData, rewardData, userData } = setupLiquidityUsers(disp);

        // STEP 2: initialize `lifetimeClaimRewards` variables to 0 for all three accounts.
        if (disp) console.log("\n=== STEP 2: INITIALIZE LIFETIME CLAIM REWARDS ===");

        // Off-chain accumulators — track total WELSH (tokenA) claimed by each account across all claim actions
        let deployerLifetimeClaimA = 0;
        let wallet1LifetimeClaimA = 0;
        let wallet2LifetimeClaimA = 0;

        if (disp) {
            console.log(`deployerLifetimeClaimA: ${deployerLifetimeClaimA}`);
            console.log(`wallet1LifetimeClaimA:  ${wallet1LifetimeClaimA}`);
            console.log(`wallet2LifetimeClaimA:  ${wallet2LifetimeClaimA}`);
        }

        // STEP 3: deployer donates DONATE_WELSH rewards (ignore STREET rewards for this test)
        if (disp) console.log("\n=== STEP 3: DEPLOYER DONATES DONATE_WELSH ===");

        donateRewards(DONATE_WELSH, 0, deployer, disp);

        // Sync state from chain after donation
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // Update rewardData: globalIndexA increases by donation / totalLp
        let totalLpSupply = supplyData.credit;
        rewardData.globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        rewardData.rewardsA += DONATE_WELSH;

        if (disp) {
            console.log(`DONATE_WELSH:     ${DONATE_WELSH}`);
            console.log(`totalLpSupply:    ${totalLpSupply}`);
            console.log(`globalIndexA:     ${rewardData.globalIndexA}`);
            console.log(`rewardsA:         ${rewardData.rewardsA}`);
            console.log(`deployer unclaimed A: ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A: ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A: ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 4: wallet1 transfers 10% of CREDIT to wallet2. Update in-memory model 
        if (disp) console.log("\n=== STEP 4: WALLET1 TRANSFERS 10% CREDIT TO WALLET2 ===");

        let wallet1LpBalance = userData.wallet1.rewardUserInfo.balance;
        let transferAmount = Math.floor(wallet1LpBalance / 10); // 10%

        transferCredit(transferAmount, wallet1, wallet2, wallet1, undefined, disp);

        // Sync state from chain after transfer
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // Update LP balances in userData
        userData.wallet1.balances.credit -= transferAmount;
        userData.wallet2.balances.credit += transferAmount;

        if (disp) {
            console.log(`transferAmount:          ${transferAmount}`);
            console.log(`wallet1 LP balance:      ${userData.wallet1.balances.credit}`);
            console.log(`wallet2 LP balance:      ${userData.wallet2.balances.credit}`);
            console.log(`deployer unclaimed A:    ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A:    ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A:    ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 5: all 3 wallets claim rewards. Update in-memory model and lifetimeClaimRewards
        if (disp) console.log("\n=== STEP 5: ALL 3 WALLETS CLAIM REWARDS ===");

        // Capture unclaimed amounts before claiming
        let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        let wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        let wallet2UnclaimedA = userData.wallet2.rewardUserInfo.unclaimedA;

        claimRewards(deployerUnclaimedA, 0, deployer, disp);
        claimRewards(wallet1UnclaimedA, 0, wallet1, disp);
        claimRewards(wallet2UnclaimedA, 0, wallet2, disp);

        // Accumulate into lifetime trackers
        deployerLifetimeClaimA += deployerUnclaimedA;
        wallet1LifetimeClaimA += wallet1UnclaimedA;
        wallet2LifetimeClaimA += wallet2UnclaimedA;

        // Sync state from chain after all claims
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        if (disp) {
            console.log(`deployer claimed A:          ${deployerUnclaimedA}`);
            console.log(`wallet1  claimed A:          ${wallet1UnclaimedA}`);
            console.log(`wallet2  claimed A:          ${wallet2UnclaimedA}`);
            console.log(`deployerLifetimeClaimA:      ${deployerLifetimeClaimA}`);
            console.log(`wallet1LifetimeClaimA:       ${wallet1LifetimeClaimA}`);
            console.log(`wallet2LifetimeClaimA:       ${wallet2LifetimeClaimA}`);
            console.log(`deployer unclaimed A (post): ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A (post): ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A (post): ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 6: deployer donates DONATE_WELSH rewards (ignore STREET rewards for this test)
        if (disp) console.log("\n=== STEP 6: DEPLOYER DONATES DONATE_WELSH ===");

        donateRewards(DONATE_WELSH, 0, deployer, disp);

        // Sync state from chain after donation
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // totalLpSupply unchanged — transfers don't change total supply
        rewardData.globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        rewardData.rewardsA += DONATE_WELSH;

        if (disp) {
            console.log(`DONATE_WELSH:         ${DONATE_WELSH}`);
            console.log(`totalLpSupply:        ${totalLpSupply}`);
            console.log(`globalIndexA:         ${rewardData.globalIndexA}`);
            console.log(`rewardsA:             ${rewardData.rewardsA}`);
            console.log(`deployer unclaimed A: ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A: ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A: ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 7: wallet2 transfers 10% of CREDIT to deployer. Update in-memory model
        if (disp) console.log("\n=== STEP 7: WALLET2 TRANSFERS 10% CREDIT TO DEPLOYER ===");

        let wallet2LpBalance = userData.wallet2.rewardUserInfo.balance;
        let transferAmount2 = Math.floor(wallet2LpBalance / 10); // 10%

        transferCredit(transferAmount2, wallet2, deployer, wallet2, undefined, disp);

        // Sync state from chain after transfer
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // Update LP balances in userData
        userData.wallet2.balances.credit -= transferAmount2;
        userData.deployer.balances.credit += transferAmount2;

        if (disp) {
            console.log(`transferAmount2:         ${transferAmount2}`);
            console.log(`deployer LP balance:     ${userData.deployer.balances.credit}`);
            console.log(`wallet1  LP balance:     ${userData.wallet1.balances.credit}`);
            console.log(`wallet2  LP balance:     ${userData.wallet2.balances.credit}`);
            console.log(`deployer unclaimed A:    ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A:    ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A:    ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 8: all 3 wallets claim rewards. Update in-memory model and lifetimeClaimRewards
        if (disp) console.log("\n=== STEP 8: ALL 3 WALLETS CLAIM REWARDS ===");

        // Capture unclaimed amounts before claiming
        deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        wallet2UnclaimedA = userData.wallet2.rewardUserInfo.unclaimedA;

        claimRewards(deployerUnclaimedA, 0, deployer, disp);
        claimRewards(wallet1UnclaimedA, 0, wallet1, disp);
        claimRewards(wallet2UnclaimedA, 0, wallet2, disp);

        // Accumulate into lifetime trackers
        deployerLifetimeClaimA += deployerUnclaimedA;
        wallet1LifetimeClaimA += wallet1UnclaimedA;
        wallet2LifetimeClaimA += wallet2UnclaimedA;

        // Sync state from chain after all claims
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        if (disp) {
            console.log(`deployer claimed A:          ${deployerUnclaimedA}`);
            console.log(`wallet1  claimed A:          ${wallet1UnclaimedA}`);
            console.log(`wallet2  claimed A:          ${wallet2UnclaimedA}`);
            console.log(`deployerLifetimeClaimA:      ${deployerLifetimeClaimA}`);
            console.log(`wallet1LifetimeClaimA:       ${wallet1LifetimeClaimA}`);
            console.log(`wallet2LifetimeClaimA:       ${wallet2LifetimeClaimA}`);
            console.log(`deployer unclaimed A (post): ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A (post): ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A (post): ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 9: deployer donates DONATE_WELSH rewards (ignore STREET rewards for this test)
        if (disp) console.log("\n=== STEP 9: DEPLOYER DONATES DONATE_WELSH ===");

        donateRewards(DONATE_WELSH, 0, deployer, disp);

        // Sync state from chain after donation
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // totalLpSupply unchanged — transfers don't change total supply
        rewardData.globalIndexA += Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        rewardData.rewardsA += DONATE_WELSH;

        if (disp) {
            console.log(`DONATE_WELSH:         ${DONATE_WELSH}`);
            console.log(`totalLpSupply:        ${totalLpSupply}`);
            console.log(`globalIndexA:         ${rewardData.globalIndexA}`);
            console.log(`rewardsA:             ${rewardData.rewardsA}`);
            console.log(`deployer unclaimed A: ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A: ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A: ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 10: deployer transfers 10% of CREDIT to wallet1. Update in-memory model
        if (disp) console.log("\n=== STEP 10: DEPLOYER TRANSFERS 10% CREDIT TO WALLET1 ===");

        let deployerLpBalance = userData.deployer.rewardUserInfo.balance;
        let transferAmount3 = Math.floor(deployerLpBalance / 10); // 10%

        transferCredit(transferAmount3, deployer, wallet1, deployer, undefined, disp);

        // Sync state from chain after transfer
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // Update LP balances in userData
        userData.deployer.balances.credit -= transferAmount3;
        userData.wallet1.balances.credit += transferAmount3;

        if (disp) {
            console.log(`deployerLpBalance:       ${deployerLpBalance}`);
            console.log(`transferAmount3:         ${transferAmount3}`);
            console.log(`deployer LP balance:     ${userData.deployer.balances.credit}`);
            console.log(`wallet1  LP balance:     ${userData.wallet1.balances.credit}`);
            console.log(`wallet2  LP balance:     ${userData.wallet2.balances.credit}`);
            console.log(`deployer unclaimed A:    ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A:    ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A:    ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 11: all 3 wallets claim rewards. Update in-memory model and lifetimeClaimRewards
        if (disp) console.log("\n=== STEP 11: ALL 3 WALLETS CLAIM REWARDS ===");

        // Capture unclaimed amounts before claiming (reassign — declared with let in STEP 5)
        deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        wallet2UnclaimedA = userData.wallet2.rewardUserInfo.unclaimedA;

        claimRewards(deployerUnclaimedA, 0, deployer, disp);
        claimRewards(wallet1UnclaimedA, 0, wallet1, disp);
        claimRewards(wallet2UnclaimedA, 0, wallet2, disp);

        // Accumulate into lifetime trackers
        deployerLifetimeClaimA += deployerUnclaimedA;
        wallet1LifetimeClaimA += wallet1UnclaimedA;
        wallet2LifetimeClaimA += wallet2UnclaimedA;

        // Sync state from chain after all claims
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        if (disp) {
            console.log(`deployer claimed A:          ${deployerUnclaimedA}`);
            console.log(`wallet1  claimed A:          ${wallet1UnclaimedA}`);
            console.log(`wallet2  claimed A:          ${wallet2UnclaimedA}`);
            console.log(`deployerLifetimeClaimA:      ${deployerLifetimeClaimA}`);
            console.log(`wallet1LifetimeClaimA:       ${wallet1LifetimeClaimA}`);
            console.log(`wallet2LifetimeClaimA:       ${wallet2LifetimeClaimA}`);
            console.log(`deployer unclaimed A (post): ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`wallet1  unclaimed A (post): ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`wallet2  unclaimed A (post): ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        }

        // STEP 12: call getCleanupRewards to view rewards pool state; compare claimedA onchain vs lifetimeClaimRewards
        if (disp) console.log("\n=== STEP 12: GET CLEANUP REWARDS & COMPARE TO LIFETIME CLAIMS ===");

        // Read cleanup rewards directly from chain to get actual values
        const cleanupResult = simnet.callReadOnlyFn("street-rewards", "get-cleanup-rewards", [], deployer);
        const cleanupInfo = (cleanupResult.result as any).value.value;

        let actualA       = Number(cleanupInfo["actual-a"].value);
        let actualB       = Number(cleanupInfo["actual-b"].value);
        let claimedA      = Number(cleanupInfo["claimed-a"].value);
        let claimedB      = Number(cleanupInfo["claimed-b"].value);
        let cleanupA      = Number(cleanupInfo["cleanup-a"].value);
        let cleanupB      = Number(cleanupInfo["cleanup-b"].value);
        let distributedA  = Number(cleanupInfo["distributed-a"].value);
        let distributedB  = Number(cleanupInfo["distributed-b"].value);
        let outstandingA  = Number(cleanupInfo["outstanding-a"].value);
        let outstandingB  = Number(cleanupInfo["outstanding-b"].value);

        // Call getCleanupRewards with actual chain values (debug — confirming values match themselves)
        getCleanupRewards(
            actualA, actualB,
            claimedA, claimedB,
            cleanupA, cleanupB,
            distributedA, distributedB,
            outstandingA, outstandingB,
            deployer, disp
        );

        // Off-chain lifetime total
        let lifetimeClaimATotal = deployerLifetimeClaimA + wallet1LifetimeClaimA + wallet2LifetimeClaimA;

        if (disp) {
            console.log(`\n=== STEP 12 COMPARISON ===`);
            console.log(`On-chain  claimedA:       ${claimedA}`);
            console.log(`Off-chain lifetimeTotal:  ${lifetimeClaimATotal}`);
            console.log(`  deployer:               ${deployerLifetimeClaimA}`);
            console.log(`  wallet1:                ${wallet1LifetimeClaimA}`);
            console.log(`  wallet2:                ${wallet2LifetimeClaimA}`);
            console.log(`Difference (onchain - offchain): ${claimedA - lifetimeClaimATotal}`);
            console.log(`distributedA:             ${distributedA}`);
            console.log(`outstandingA:             ${outstandingA}`);
            console.log(`actualA (contract bal):   ${actualA}`);
            console.log(`cleanupA (reclaimable):   ${cleanupA}`);
        }

    });
});