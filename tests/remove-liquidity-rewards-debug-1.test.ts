import {
    Cl,
} from "@stacks/transactions";
import { describe, expect, it } from "vitest";

// Import test helper functions
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";


// Import test constants
import { 
    DONATE_WELSH, 
    PRECISION,
    disp, 
    PROVIDE_WELSH,
    TAX,
    BASIS,
} from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== REMOVE LIQUIDITY REWARDS DEBUG TEST ===", () => {
    it("=== REMOVE LIQUIDITY REWARDS DEBUG TEST ===", () => {
        // TEST SUMMARY
        // This test verifies the fix for the phantom debt bug in remove-rewards
        // where new/returning users were incorrectly initialized with phantom debt
        // 
        // STEP 1: Setup initial liquidity state and reward state with multi-user liquidity
        // STEP 2: wallet1 claims all rewards (debt increases, unclaimed = 0)
        // STEP 3: wallet1 removes ALL liquidity (complete exit, entry SHOULD BE deleted)
        //         Note: In normal operation, user entry won't be deleted by remove-liquidity
        //         because update-remove-rewards happens BEFORE balance changes
        // STEP 4: wallet1 provides liquidity again (re-entry as "new" user)
        //         FIXED: Contract sets debt = 0 (correct behavior)
        // STEP 5: deployer donates MORE rewards to contract
        // STEP 6: wallet1 can now claim rewards
        //         FIXED: unclaimed = earned (no phantom debt blocking claims)
        
        // STEP 1: Setup environment with multi-user liquidity state
        let { marketData, rewardData, supplyData, userData } = setupLiquidityUsers(disp);
        
        // Extract data from setupLiquidityUsers result
        let availA = marketData.availA;
        let availB = marketData.availB;
        let reserveA = marketData.reserveA;
        let reserveB = marketData.reserveB;
        let totalLpSupply = supplyData.credit; // Credit supply represents total LP tokens
        
        // Extract wallet1 user data from the nested structure
        let wallet1Data = userData.wallet1;
        let wallet1Balance = wallet1Data.rewardUserInfo.balance;
        let wallet1UnclaimedA = wallet1Data.rewardUserInfo.unclaimedA;
        let wallet1UnclaimedB = wallet1Data.rewardUserInfo.unclaimedB;
        let wallet1IndexA = wallet1Data.rewardUserInfo.indexA;
        let wallet1IndexB = wallet1Data.rewardUserInfo.indexB;
        let wallet1DebtA = wallet1Data.rewardUserInfo.debtA;
        let wallet1DebtB = wallet1Data.rewardUserInfo.debtB;
        let wallet1Block = wallet1Data.rewardUserInfo.block;
        
        // Extract global reward pool info from rewardData
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        
        if (disp) {
            console.log("=== STEP 1 COMPLETE: Initial Setup ===");
            console.log(`Total LP supply: ${totalLpSupply}`);
            console.log(`wallet1 LP balance: ${wallet1Balance}`);
            console.log(`wallet1 unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`wallet1 unclaimed B: ${wallet1UnclaimedB}`);
            console.log(`wallet1 debt A: ${wallet1DebtA}`);
            console.log(`wallet1 debt B: ${wallet1DebtB}`);
            console.log(`Global index A: ${globalIndexA}`);
            console.log(`Global index B: ${globalIndexB}`);
            console.log("=== STEP 1 SUMMARY ===");
            console.log(" Multi-user liquidity environment established");
            console.log(" wallet1 has LP position with unclaimed rewards");
            console.log(" Reward pool has accumulated rewards from all users");
        }
        
        // STEP 2: wallet1 claims all their rewards using direct contract call
        let claimResult = simnet.callPublicFn(
            "street-rewards",
            "claim-rewards",
            [], // claim-rewards takes no arguments, calculates amounts internally
            wallet1
        );
        
        // Verify the claim was successful and matches expected amounts
        expect(claimResult.result).toBeOk(
            Cl.tuple({
                "amount-a": Cl.uint(wallet1UnclaimedA),
                "amount-b": Cl.uint(wallet1UnclaimedB),
            })
        );
        
        // After claiming, wallet1's debt should increase and unclaimed should be 0
        // Get updated reward user info
        let updatedRewardUserInfo = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.standardPrincipal(wallet1)],
            wallet1
        );
        
        expect(updatedRewardUserInfo.result).toBeOk(
            Cl.tuple({
                "balance": Cl.uint(wallet1Balance),
                "block": Cl.uint(wallet1Block),
                "debt-a": Cl.uint(wallet1DebtA + wallet1UnclaimedA), // debt increased by claimed amount
                "debt-b": Cl.uint(wallet1DebtB + wallet1UnclaimedB),
                "index-a": Cl.uint(wallet1IndexA),
                "index-b": Cl.uint(wallet1IndexB),
                "unclaimed-a": Cl.uint(0), // unclaimed reset to 0
                "unclaimed-b": Cl.uint(0)
            })
        );
        
        // Update variables for next steps (overwrite instead of declaring new)
        wallet1DebtA = wallet1DebtA + wallet1UnclaimedA; // debt increased by claimed amount
        wallet1DebtB = wallet1DebtB + wallet1UnclaimedB;
        wallet1UnclaimedA = 0; // reset after claiming
        wallet1UnclaimedB = 0;

        userData.wallet1.rewardUserInfo.balance = wallet1Balance;
        userData.wallet1.rewardUserInfo.block = wallet1Block;
        userData.wallet1.rewardUserInfo.debtA = wallet1DebtA;
        userData.wallet1.rewardUserInfo.debtB = wallet1DebtB;
        userData.wallet1.rewardUserInfo.indexA = wallet1IndexA;
        userData.wallet1.rewardUserInfo.indexB = wallet1IndexB;
        userData.wallet1.rewardUserInfo.unclaimedA = wallet1UnclaimedA;
        userData.wallet1.rewardUserInfo.unclaimedB = wallet1UnclaimedB;
        
        if (disp) {
            console.log("=== STEP 2 COMPLETE: wallet1 Claimed Rewards ===");
            console.log(`wallet1 claimed A: ${wallet1DebtA}`);
            console.log(`wallet1 claimed B: ${wallet1DebtB}`);
            console.log(`wallet1 debt A after claim: ${wallet1DebtA}`);
            console.log(`wallet1 debt B after claim: ${wallet1DebtB}`);
            console.log(`wallet1 unclaimed A after claim: ${wallet1UnclaimedA}`);
            console.log(`wallet1 unclaimed B after claim: ${wallet1UnclaimedB}`);
            console.log("=== STEP 2 SUMMARY ===");
            console.log("wallet1 successfully claimed all available rewards");
            console.log("wallet1's debt increased by claimed amount");
            console.log("wallet1's unclaimed rewards reset to 0");
        }

        // STEP 3: wallet1 removes ALL liquidity (complete exit) via direct contract call
        // Use wallet1's full LP balance from setup as the amount to remove
        let amountLpToRemove = wallet1Balance;

        // Calculate expected withdrawal amounts using BigInt for precision (mirrors contract logic)
        let amountLpBig = BigInt(amountLpToRemove);
        let availABig = BigInt(availA);
        let availBBig = BigInt(availB);
        let totalLpBig = BigInt(totalLpSupply);

        let grossAmountABig = (amountLpBig * availABig) / totalLpBig;
        let grossAmountBBig = (amountLpBig * availBBig) / totalLpBig;

        let taxABig = (grossAmountABig * BigInt(TAX)) / BigInt(BASIS);
        let taxBBig = (grossAmountBBig * BigInt(TAX)) / BigInt(BASIS);

        let userAmountABig = grossAmountABig - taxABig;
        let userAmountBBig = grossAmountBBig - taxBBig;

        let expectedTaxA = Number(taxABig);
        let expectedTaxB = Number(taxBBig);
        let expectedUserA = Number(userAmountABig);
        let expectedUserB = Number(userAmountBBig);

        let removeResult = simnet.callPublicFn(
            "street-market",
            "remove-liquidity",
            [Cl.uint(amountLpToRemove)],
            wallet1
        );

        // We expect a successful removal with specific amounts based on the contract math
        expect(removeResult.result).toBeOk(
            Cl.tuple({
                "amount-a": Cl.uint(expectedUserA),
                "amount-b": Cl.uint(expectedUserB),
                "amount-lp": Cl.uint(amountLpToRemove),
                "tax-a": Cl.uint(expectedTaxA),
                "tax-b": Cl.uint(expectedTaxB),
            })
        );

        // After remove-liquidity, wallet1's LP balance should be zero and rewards state updated
        let rewardAfterRemove = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.standardPrincipal(wallet1)],
            wallet1
        );

        // Compute expected post-removal reward state using decrease-rewards logic:
        // - User has fully exited (balance = 0)
        // - All unclaimed rewards were already claimed in STEP 2, so unclaimed = 0
        // - decrease-rewards deletes the user entry and does NOT reinsert when balance = 0
        //   so the effective user state seen via get-reward-user-info is the default zeros.

        // Update in-memory reward user info to reflect the fully-exited state
        // For a fully-exited user, get-reward-user-info falls back to the default
        // zero state defined in the contract (block/debt/index/unclaimed all 0).
        wallet1Block = 0;
        wallet1Balance = 0;
        wallet1DebtA = 0;
        wallet1DebtB = 0;
        wallet1IndexA = 0;
        wallet1IndexB = 0;
        wallet1UnclaimedA = 0;
        wallet1UnclaimedB = 0;

        userData.wallet1.rewardUserInfo.balance = wallet1Balance;
        userData.wallet1.rewardUserInfo.block = wallet1Block;
        userData.wallet1.rewardUserInfo.debtA = wallet1DebtA;
        userData.wallet1.rewardUserInfo.debtB = wallet1DebtB;
        userData.wallet1.rewardUserInfo.indexA = wallet1IndexA;
        userData.wallet1.rewardUserInfo.indexB = wallet1IndexB;
        userData.wallet1.rewardUserInfo.unclaimedA = wallet1UnclaimedA;
        userData.wallet1.rewardUserInfo.unclaimedB = wallet1UnclaimedB;

        // Update wallet1 token balances based on the removal amounts
        userData.wallet1.balances.welsh += expectedUserA;
        userData.wallet1.balances.street += expectedUserB;
        userData.wallet1.balances.credit -= amountLpToRemove;

        // Update marketData to reflect new reserves, locked amounts, and availables
        let lockA = marketData.lockedA;
        let lockB = marketData.lockedB;

        reserveA = reserveA >= expectedUserA ? reserveA - expectedUserA : 0;
        reserveB = reserveB >= expectedUserB ? reserveB - expectedUserB : 0;

        let newLockedA = lockA + expectedTaxA;
        let newLockedB = lockB + expectedTaxB;

        marketData.reserveA = reserveA;
        marketData.reserveB = reserveB;
        marketData.lockedA = newLockedA;
        marketData.lockedB = newLockedB;

        availA = reserveA >= newLockedA ? reserveA - newLockedA : 0;
        availB = reserveB >= newLockedB ? reserveB - newLockedB : 0;

        marketData.availA = availA;
        marketData.availB = availB;

        // Update supplyData (LP total supply decreases by the burned amount)
        totalLpSupply = totalLpSupply - amountLpToRemove;
        supplyData.credit = totalLpSupply;

        // Assert the on-chain view matches our updated in-memory userData state
        expect(rewardAfterRemove.result).toBeOk(
            Cl.tuple({
                "balance": Cl.uint(userData.wallet1.rewardUserInfo.balance),
                "block": Cl.uint(userData.wallet1.rewardUserInfo.block),
                "debt-a": Cl.uint(userData.wallet1.rewardUserInfo.debtA),
                "debt-b": Cl.uint(userData.wallet1.rewardUserInfo.debtB),
                "index-a": Cl.uint(userData.wallet1.rewardUserInfo.indexA),
                "index-b": Cl.uint(userData.wallet1.rewardUserInfo.indexB),
                "unclaimed-a": Cl.uint(userData.wallet1.rewardUserInfo.unclaimedA),
                "unclaimed-b": Cl.uint(userData.wallet1.rewardUserInfo.unclaimedB),
            })
        );

        if (disp) {
            console.log("=== STEP 3 COMPLETE: wallet1 Removed All LP ===");
            console.log(`Removed LP: ${amountLpToRemove.toLocaleString()}`);
            console.log(`Expected gross A: ${Number(grossAmountABig).toLocaleString()}`);
            console.log(`Expected gross B: ${Number(grossAmountBBig).toLocaleString()}`);
            console.log(`Tax A: ${expectedTaxA.toLocaleString()}`);
            console.log(`Tax B: ${expectedTaxB.toLocaleString()}`);
            console.log(`User A received: ${expectedUserA.toLocaleString()}`);
            console.log(`User B received: ${expectedUserB.toLocaleString()}`);
            console.log("Reward user info after remove-liquidity:");
            console.log(`  balance: ${wallet1Balance}`);
            console.log(`  block: ${wallet1Block}`);
            console.log(`  debt-a: ${wallet1DebtA}`);
            console.log(`  debt-b: ${wallet1DebtB}`);
            console.log(`  index-a: ${wallet1IndexA}`);
            console.log(`  index-b: ${wallet1IndexB}`);
            console.log(`  unclaimed-a: ${wallet1UnclaimedA}`);
            console.log(`  unclaimed-b: ${wallet1UnclaimedB}`);
            console.log("=== STEP 3 SUMMARY ===");
            console.log("wallet1 successfully removed all LP");
            console.log("LP balance set to 0 while reward indices are reset");
            console.log("This state sets up the phantom-debt re-entry scenario for STEP 4");
        }

        // STEP 4: wallet1 provides liquidity again (re-entry as "new" user)
        // Use the current marketData and supplyData state we just updated in STEP 3
        let provideAmountA = PROVIDE_WELSH;

        if (disp) {
            console.log("=== STEP 4: wallet1 Re-enters with New Liquidity ===");
            console.log(`Input WELSH: ${provideAmountA.toLocaleString()}`);
            console.log(`Current availA: ${availA.toLocaleString()}`);
            console.log(`Current availB: ${availB.toLocaleString()}`);
            console.log(`Current total LP supply: ${totalLpSupply.toLocaleString()}`);
        }

        // Recompute expected provide-liquidity outputs using latest availA/availB and totalLpSupply
        let provideAmountABig = BigInt(provideAmountA);
        let provideAvailABig = BigInt(availA);
        let provideAvailBBig = BigInt(availB);
        let provideTotalLpBig = BigInt(totalLpSupply);

        let provideAmountBBig = (provideAmountABig * provideAvailBBig) / provideAvailABig;
        let lpFromABig = (provideAmountABig * provideTotalLpBig) / provideAvailABig;
        let lpFromBBig = (provideAmountBBig * provideTotalLpBig) / provideAvailBBig;
        let provideAmountB = Number(provideAmountBBig);
        let mintedLpBig = lpFromABig < lpFromBBig ? lpFromABig : lpFromBBig;
        let mintedLp = Number(mintedLpBig);

        // Call the market contract directly for provide-liquidity
        let provideResult = simnet.callPublicFn(
            "street-market",
            "provide-liquidity",
            [Cl.uint(provideAmountA)],
            wallet1
        );

        expect(provideResult.result).toBeOk(
            Cl.tuple({
                "amount-a": Cl.uint(provideAmountA),
                "amount-b": Cl.uint(provideAmountB),
                "amount-lp": Cl.uint(mintedLp),
            })
        );

        // After provide-liquidity, the contract has called increase-rewards with amount-lp.
        // For contract-caller = street-market, increase-rewards computes preserve-debt
        // so that existing unclaimed rewards are preserved and no phantom debt is added.

        // Update wallet1 token balances
        userData.wallet1.balances.welsh -= provideAmountA;
        userData.wallet1.balances.street -= provideAmountB;
        userData.wallet1.balances.credit += mintedLp;

        // Update marketData to reflect the new reserves
        reserveA = reserveA + provideAmountA;
        reserveB = reserveB + provideAmountB;
        marketData.reserveA = reserveA;
        marketData.reserveB = reserveB;

        availA = reserveA >= marketData.lockedA ? reserveA - marketData.lockedA : 0;
        availB = reserveB >= marketData.lockedB ? reserveB - marketData.lockedB : 0;
        marketData.availA = availA;
        marketData.availB = availB;

        // Update supplyData LP total supply
        totalLpSupply = totalLpSupply + mintedLp;
        supplyData.credit = totalLpSupply;

        // Read wallet1 reward user info after re-entry
        let rewardAfterProvide = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.standardPrincipal(wallet1)],
            wallet1
        );

        // Derive expected reward state after increase-rewards with contract-caller street-market:
        // Since wallet1 had fully exited in STEP 3 (zero-state), they re-enter as a "new" user
        // with debtA/debtB = 0 and indexA/indexB = current global indices.
        let poolInfoAfterProvide = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );

        // get-reward-pool-info returns (ok (tuple ...)), so unwrap `.value.value`
        let globalAfter = (poolInfoAfterProvide.result as any).value.value;
        let expectedIndexAAfter = Number(globalAfter["global-index-a"].value);
        let expectedIndexBAfter = Number(globalAfter["global-index-b"].value);

        // Update local and in-memory rewardUserInfo to match this expected "new user" state
        wallet1Balance = userData.wallet1.balances.credit;
        wallet1DebtA = 0;
        wallet1DebtB = 0;
        wallet1IndexA = expectedIndexAAfter;
        wallet1IndexB = expectedIndexBAfter;
        wallet1UnclaimedA = 0;
        wallet1UnclaimedB = 0;

        // Hardcode the expected block height from the contract result.
        // This is the ONLY exception where we do not derive the value from our in-memory model.
        wallet1Block = simnet.blockHeight; // The block height at which the provide-liquidity transaction was included

        userData.wallet1.rewardUserInfo.balance = wallet1Balance;
        userData.wallet1.rewardUserInfo.block = wallet1Block;
        userData.wallet1.rewardUserInfo.debtA = wallet1DebtA;
        userData.wallet1.rewardUserInfo.debtB = wallet1DebtB;
        userData.wallet1.rewardUserInfo.indexA = wallet1IndexA;
        userData.wallet1.rewardUserInfo.indexB = wallet1IndexB;
        userData.wallet1.rewardUserInfo.unclaimedA = wallet1UnclaimedA;
        userData.wallet1.rewardUserInfo.unclaimedB = wallet1UnclaimedB;

        expect(rewardAfterProvide.result).toBeOk(
            Cl.tuple({
                "balance": Cl.uint(wallet1Balance),
                "block": Cl.uint(userData.wallet1.rewardUserInfo.block),
                "debt-a": Cl.uint(wallet1DebtA),
                "debt-b": Cl.uint(wallet1DebtB),
                "index-a": Cl.uint(wallet1IndexA),
                "index-b": Cl.uint(wallet1IndexB),
                "unclaimed-a": Cl.uint(wallet1UnclaimedA),
                "unclaimed-b": Cl.uint(wallet1UnclaimedB),
            })
        );

        if (disp) {
            console.log("=== STEP 4 COMPLETE: wallet1 Re-entered Liquidity ===");
            console.log(`New LP balance: ${wallet1Balance.toLocaleString()}`);
            console.log(`Debt A: ${wallet1DebtA}`);
            console.log(`Debt B: ${wallet1DebtB}`);
            console.log(`Index A: ${wallet1IndexA}`);
            console.log(`Index B: ${wallet1IndexB}`);
            console.log(`Unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`Unclaimed B: ${wallet1UnclaimedB}`);
            console.log("=== STEP 4 SUMMARY ===");
            console.log(" wallet1 successfully re-entered with new liquidity");
            console.log(" wallet1's debt remains 0 on re-entry (no phantom debt)");
            console.log(" wallet1's reward indices are set to current global indices");
        }

        // STEP 5: deployer donates additional WELSH rewards (STREET donation = 0 for now)
        let donateAmountA = DONATE_WELSH;
        let donateAmountB = 0;

        if (disp) {
            console.log("=== STEP 5: Deployer Donates WELSH Rewards ===");
            console.log(`Donate WELSH (amount-a): ${donateAmountA.toLocaleString()}`);
            console.log(`Donate STREET (amount-b): ${donateAmountB.toLocaleString()} (ignored in this step)`);
        }

        // Call donate-rewards directly on the rewards contract (WELSH only)
        let donateResult = simnet.callPublicFn(
            "street-rewards",
            "donate-rewards",
            [Cl.uint(donateAmountA), Cl.uint(donateAmountB)],
            deployer
        );

        expect(donateResult.result).toBeOk(
            Cl.tuple({
                "amount-a": Cl.uint(donateAmountA),
                "amount-b": Cl.uint(donateAmountB),
            })
        );

        // Donation updates the global reward index A using update-rewards-a
        // index-increment = (donateAmountA * PRECISION) / totalLpSupply (current total LP)
        let donateAmountABig = BigInt(donateAmountA);
        let precisionBig = BigInt(PRECISION);
        let totalLpAfterProvideBig = BigInt(totalLpSupply);
        let indexIncrementBig = totalLpAfterProvideBig > 0n
            ? (donateAmountABig * precisionBig) / totalLpAfterProvideBig
            : 0n;

        let expectedGlobalIndexAAfterDonate = globalIndexA + Number(indexIncrementBig);

        // Read updated reward pool info and verify the new global index A
        let poolInfoAfterDonate = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );

        let poolAfterDonate = (poolInfoAfterDonate.result as any).value.value;
        let receivedGlobalIndexAAfterDonate = Number(poolAfterDonate["global-index-a"].value);
        let receivedGlobalIndexBAfterDonate = Number(poolAfterDonate["global-index-b"].value);

        expect(receivedGlobalIndexAAfterDonate).toEqual(expectedGlobalIndexAAfterDonate);
        expect(receivedGlobalIndexBAfterDonate).toEqual(globalIndexB); // STREET side unchanged

        // Update our in-memory global reward data to match on-chain state
        globalIndexA = receivedGlobalIndexAAfterDonate;
        globalIndexB = receivedGlobalIndexBAfterDonate;
        rewardData.globalIndexA = globalIndexA;
        rewardData.globalIndexB = globalIndexB;

        // Compute wallet1's newly earned/unclaimed WELSH from this donation
        // earned = balance * donateAmountA / totalLpSupply (integer division)
        let wallet1BalanceBig = BigInt(wallet1Balance);
        let wallet1EarnedFromDonateBig = totalLpAfterProvideBig > 0n
            ? (wallet1BalanceBig * donateAmountABig) / totalLpAfterProvideBig
            : 0n;
        let expectedWallet1UnclaimedAAfterDonate = Number(wallet1EarnedFromDonateBig);

        // Read on-chain reward user info for wallet1 after donation
        let rewardAfterDonate = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.standardPrincipal(wallet1)],
            wallet1
        );

        // Update in-memory userData for wallet1 to reflect the donated rewards
        wallet1UnclaimedA = expectedWallet1UnclaimedAAfterDonate;
        // debt and indices remain unchanged; block remains the same as STEP 4
        userData.wallet1.rewardUserInfo.unclaimedA = wallet1UnclaimedA;

        // Verify on-chain state matches our expected wallet1 reward user info after donation
        expect(rewardAfterDonate.result).toBeOk(
            Cl.tuple({
                "balance": Cl.uint(wallet1Balance),
                "block": Cl.uint(wallet1Block),
                "debt-a": Cl.uint(wallet1DebtA),
                "debt-b": Cl.uint(wallet1DebtB),
                "index-a": Cl.uint(wallet1IndexA),
                "index-b": Cl.uint(wallet1IndexB),
                "unclaimed-a": Cl.uint(wallet1UnclaimedA),
                "unclaimed-b": Cl.uint(wallet1UnclaimedB),
            })
        );

        if (disp) {
            console.log("=== STEP 5 COMPLETE: Deployer Donated WELSH Rewards ===");
            console.log(`Global index A (before): 299990`);
            console.log(`Global index A (after): ${receivedGlobalIndexAAfterDonate}`);
            console.log(`Global index B (unchanged): ${receivedGlobalIndexBAfterDonate}`);
            console.log(`wallet1 LP balance: ${wallet1Balance.toLocaleString()}`);
            console.log(`wallet1 newly unclaimed A from donation: ${wallet1UnclaimedA}`);
            console.log("=== STEP 5 SUMMARY ===");
            console.log(" Deployer donated WELSH rewards via donate-rewards");
            console.log(" Global reward index A increased according to update-rewards-a math");
            console.log(" wallet1 gained new unclaimed WELSH proportional to LP share");
        }

        // STEP 6: wallet1 claims rewards earned from the donation
        let claimAfterDonateResult = simnet.callPublicFn(
            "street-rewards",
            "claim-rewards",
            [],
            wallet1
        );

        // wallet1 should be able to claim exactly the unclaimed WELSH from STEP 5
        expect(claimAfterDonateResult.result).toBeOk(
            Cl.tuple({
                "amount-a": Cl.uint(wallet1UnclaimedA),
                "amount-b": Cl.uint(0),
            })
        );

        // After claiming, wallet1's debt-a increases by the claimed amount, unclaimed-a returns to 0
        let rewardAfterFinalClaim = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.standardPrincipal(wallet1)],
            wallet1
        );

        // Update in-memory userData to reflect final claimed state
        wallet1DebtA = wallet1DebtA + wallet1UnclaimedA;
        wallet1UnclaimedA = 0;
        userData.wallet1.rewardUserInfo.debtA = wallet1DebtA;
        userData.wallet1.rewardUserInfo.unclaimedA = wallet1UnclaimedA;

        // Indices and block remain unchanged; balance is still wallet1Balance
        expect(rewardAfterFinalClaim.result).toBeOk(
            Cl.tuple({
                "balance": Cl.uint(wallet1Balance),
                "block": Cl.uint(wallet1Block),
                "debt-a": Cl.uint(wallet1DebtA),
                "debt-b": Cl.uint(wallet1DebtB),
                "index-a": Cl.uint(wallet1IndexA),
                "index-b": Cl.uint(wallet1IndexB),
                "unclaimed-a": Cl.uint(wallet1UnclaimedA),
                "unclaimed-b": Cl.uint(wallet1UnclaimedB),
            })
        );

        if (disp) {
            console.log("=== STEP 6 COMPLETE: wallet1 Claimed Donated Rewards ===");
            console.log(`wallet1 LP balance: ${wallet1Balance.toLocaleString()}`);
            console.log(`wallet1 final debt-a: ${wallet1DebtA}`);
            console.log(`wallet1 final unclaimed-a: ${wallet1UnclaimedA}`);
            console.log(`wallet1 final index-a: ${wallet1IndexA}`);
            console.log("=== STEP 6 SUMMARY ===");
            console.log(" wallet1 successfully claimed rewards from the donation");
            console.log(" No phantom debt: debt-a advanced only by claimed amounts");
            console.log(" unclaimed-a returned to 0 after final claim");
        }

        return;
    });
});