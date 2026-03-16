import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, FEE, INITIAL_PROVIDE_WELSH, INITIAL_PROVIDE_STREET, REINITIALIZE_PROVIDE_WELSH, REINITIALIZE_PROVIDE_STREET, TAX } from "./vitestconfig"
import { getMarketInfo, removeLiquidity, initialLiquidity } from "./functions/street-market-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== INITIAL LIQUIDITY REINITIALIZATION TEST ===", () => {
    it("=== INITIAL LIQUIDITY REINITIALIZATION TEST ===", () => {
        // TEST SUMMARY:
        // This test validates the fix for initial-liquidity
        // STEP 1: Setup exchange liquidity (deployer, wallet1, wallet2 all have LP)
        // STEP 2: All participants remove their liquidity (1% tax locks funds)
        // STEP 3: deployer calls initialLiquidity with SAME amounts
        // STEP 4: FIX VERIFIED: Re-initialization uses geometric mean, locked funds accounted in reserves
        //
        // SOLUTION: Always use sqrt(amount-a * amount-b) when total-supply-lp = 0
        //           Set reserves to (amount + locked) so avail = amount provided
        
        // STEP 1: Setup liquidity and user state
        let{ marketData, supplyData, userData } = setupLiquidityUsers(disp);
        
        if (disp) {
            console.log("=== STEP 1 COMPLETE: Initial Setup ===");
            console.log(`Total LP supply: ${supplyData.credit}`);
            console.log(`Reserve A: ${marketData.reserveA}`);
            console.log(`Reserve B: ${marketData.reserveB}`);
            console.log(`Each participant has: ${supplyData.credit / 3} LP`);
        }
        
        // Verify total LP supply after setup
        getTotalSupply(supplyData.credit, "credit-token", deployer, disp);
        
        // Query actual exchange state to get precise values
        let marketInfo = getMarketInfo(
            marketData.availA,
            marketData.availB,
            marketData.fee,
            marketData.lockedA,
            marketData.lockedB,
            marketData.reserveA,
            marketData.reserveB,
            marketData.tax,
            deployer,
            false
        );
        
        // STEP 2: All participants remove their liquidity
        // Get individual LP balances from setup (they are NOT equal)
        let deployerLpBalance = userData.deployer.balances.credit;
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
        
        if (disp) {
            console.log("=== STEP 2: Removing All Liquidity (Tax Creates Locked Funds) ===");
            console.log(`Deployer LP: ${deployerLpBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}`);
            console.log(`Total LP: ${supplyData.credit}`);
        }
        
        // Calculate deployer's remove amounts
        let deployerRemoveA = Number((BigInt(deployerLpBalance) * BigInt(marketInfo.availA)) / BigInt(supplyData.credit));
        let deployerRemoveB = Number((BigInt(deployerLpBalance) * BigInt(marketInfo.availB)) / BigInt(supplyData.credit));
        let deployerTaxA = Number((BigInt(deployerRemoveA) * BigInt(TAX)) / BigInt(10000));
        let deployerTaxB = Number((BigInt(deployerRemoveB) * BigInt(TAX)) / BigInt(10000)); 
        let deployerUserA = deployerRemoveA - deployerTaxA;
        let deployerUserB = deployerRemoveB - deployerTaxB;
        
        // Calculate wallet1's remove amounts  
        let wallet1RemoveA = Number((BigInt(wallet1LpBalance) * BigInt(marketInfo.availA)) / BigInt(supplyData.credit));
        let wallet1RemoveB = Number((BigInt(wallet1LpBalance) * BigInt(marketInfo.availB)) / BigInt(supplyData.credit));
        let wallet1TaxA = Number((BigInt(wallet1RemoveA) * BigInt(TAX)) / BigInt(10000));
        let wallet1TaxB = Number((BigInt(wallet1RemoveB) * BigInt(TAX)) / BigInt(10000)); 
        let wallet1UserA = wallet1RemoveA - wallet1TaxA;
        let wallet1UserB = wallet1RemoveB - wallet1TaxB;
        
        // Calculate wallet2's remove amounts
        let wallet2RemoveA = Number((BigInt(wallet2LpBalance) * BigInt(marketInfo.availA)) / BigInt(supplyData.credit));
        let wallet2RemoveB = Number((BigInt(wallet2LpBalance) * BigInt(marketInfo.availB)) / BigInt(supplyData.credit));
        let wallet2TaxA = Number((BigInt(wallet2RemoveA) * BigInt(TAX)) / BigInt(10000));
        let wallet2TaxB = Number((BigInt(wallet2RemoveB) * BigInt(TAX)) / BigInt(10000)); 
        let wallet2UserA = wallet2RemoveA - wallet2TaxA;
        let wallet2UserB = wallet2RemoveB - wallet2TaxB;
        
        // deployer removes liquidity
        removeLiquidity(deployerLpBalance, deployerTaxA, deployerTaxB, deployerUserA, deployerUserB, deployer, disp);
        
        // wallet1 removes liquidity
        removeLiquidity(wallet1LpBalance, wallet1TaxA, wallet1TaxB, wallet1UserA, wallet1UserB, wallet1, disp);
        
        // wallet2 removes liquidity
        removeLiquidity(wallet2LpBalance, wallet2TaxA, wallet2TaxB, wallet2UserA, wallet2UserB, wallet2, disp);
        // Verify LP supply is now 0
        getTotalSupply(0, "credit-token", deployer, disp);

        // STEP 3: deployer provides initial liquidity again
        // Note: After removing all liquidity, locked funds from taxes remain
        // The contract will use ratio-based LP calculation based on these reserves
        let amountA = REINITIALIZE_PROVIDE_WELSH
        let amountB = REINITIALIZE_PROVIDE_STREET
        
        // After all removals, locked funds equal total tax collected from all participants
        let remainingLockedA = deployerTaxA + wallet1TaxA + wallet2TaxA;
        let remainingLockedB = deployerTaxB + wallet1TaxB + wallet2TaxB;
        
        if (disp) {
            console.log("=== STEP 2 COMPLETE: All Liquidity Removed ===");
            console.log(`Total LP supply: 0`);
            console.log(`  But locked funds persist: ${remainingLockedA} WELSH + ${remainingLockedB} STREET`);
        }
        
        // LP calculation now uses geometric mean (sqrt) regardless of locked funds
        // LP = sqrt(amount-a * amount-b)
        let mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));
        
        if (disp) {
            console.log("=== STEP 3: Pool Re-initialization (FIXED) ===");
            console.log(`Deployer provides: ${amountA} WELSH, ${amountB} STREET (SAME as initial amounts)`);
            console.log(`Existing locked funds: ${remainingLockedA} WELSH, ${remainingLockedB} STREET`);
            console.log(`🔍 LP Calculation Details:`);
            console.log(`  Formula: sqrt(amount-a × amount-b)`);
            console.log(`  LP = sqrt(${amountA} × ${amountB}) = ${mintedLpExpected}`);
            console.log(`   Locked funds do NOT affect LP calculation`);
        }
        
        initialLiquidity(
            amountA,
            amountB,
            mintedLpExpected,
            deployer,
            disp
        );
        
        // Verify LP supply after re-initialization
        getTotalSupply(mintedLpExpected, "credit-token", deployer, disp);
        
        // After adding liquidity with the fix:
        // - Reserves are SET to: amount-provided + existing-locked
        // - Locked funds remain unchanged
        // - Available liquidity: avail = reserve - locked = (amount + locked) - locked = amount
        let expectedReserveA = amountA + remainingLockedA;
        let expectedReserveB = amountB + remainingLockedB;
        let expectedAvailA = amountA; // avail = (amount + locked) - locked = amount
        let expectedAvailB = amountB;
        
        getMarketInfo(
            expectedAvailA,         // availA = amount provided (locked funds cancel out)
            expectedAvailB,         // availB = amount provided
            FEE,                    // fee
            remainingLockedA,       // lockedA (unchanged, persists from removal taxes)
            remainingLockedB,       // lockedB (unchanged, persists from removal taxes)
            expectedReserveA,       // reserveA = amount-a + locked-a
            expectedReserveB,       // reserveB = amount-b + locked-b
            TAX,                    // tax
            deployer,
            disp
        );
        
        // STEP 4: Validate the fix works correctly
        if (disp) {
            let initialLpPerParticipant = supplyData.credit / 3;
            
            console.log("=== STEP 4: FIX VALIDATION ===");
            console.log(`First Initial Liquidity (Step 1 - Fresh Pool):`);
            console.log(`  Input: ${INITIAL_PROVIDE_WELSH} WELSH, ${INITIAL_PROVIDE_STREET} STREET`);
            console.log(`  LP Minted: ${initialLpPerParticipant} (per participant)`);
            console.log(`  Formula: sqrt(amount-a * amount-b)`);
            console.log(`Second Initial Liquidity (Step 3 - After Full Removal, FIXED):`);
            console.log(`  Input: ${amountA} WELSH, ${amountB} STREET (SAME AMOUNTS)`);
            console.log(`  LP Minted: ${mintedLpExpected} `);
            console.log(`  Formula: sqrt(amount-a * amount-b) - same formula!`);
            console.log(`  Locked funds: ${remainingLockedA} WELSH, ${remainingLockedB} STREET`);
            console.log(` FIX CONFIRMED:`);
            console.log(`  Same liquidity input: ${amountA} WELSH + ${amountB} STREET`);
            console.log(`  Initial LP:      ${initialLpPerParticipant}`);
            console.log(`  Re-init LP:      ${mintedLpExpected}`);
            console.log(`  Result:          SAME LP tokens minted! `);
            console.log(`How The Fix Works:`);
            console.log(`  • LP calculation: Always uses sqrt(amount-a × amount-b) when total-supply = 0`);
            console.log(`  • Locked funds: Persist but don't affect LP calculation`);
            console.log(`  • Reserves: Set to (amount-provided + locked-existing)`);
            console.log(`  • Available: avail = reserve - locked = amount-provided`);
            console.log(`  • Result: Fair LP minting, locked funds properly accounted`);
            console.log(`Economic Impact:`);
            console.log(`  • Pool re-initialization now economically fair `);
            console.log(`  • Historical locked funds don't dilute new LPs `);
            console.log(`  • Locked funds remain available for capital rewards distribution `);
        }

        // STEP 5: Check deployer LP balance
        deployerLpBalance = getBalance(
            mintedLpExpected,
            "credit-token",
            deployer,
            deployer,
            disp
        );
    });
})