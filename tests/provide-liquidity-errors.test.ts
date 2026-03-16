import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { disp, TAX, BASIS, PROVIDE_WELSH } from "./vitestconfig"
import { provideLiquidity, removeLiquidity } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== PROVIDE LIQUIDITY ERROR TESTS ===", () => {
    it("=== ERR_ZERO_AMOUNT - AMOUNT A ===", () => {
        // STEP 1: Setup initial liquidity
        setupInitialLiquidity(disp);

        // STEP 2: Try to provide zero amount A
        let amountA = 0; // Zero amount (should trigger ERR_ZERO_AMOUNT)
        let addedBExpected = 0;  // Won't be used due to error
        let mintedLpExpected = 0; // Won't be used due to error

        provideLiquidity(
            amountA,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY ===", () => {
        // STEP 1: Setup initial liquidity (using new market/reward/supply/user state objects)
        let { marketData, supplyData } = setupInitialLiquidity(disp);
        
        // STEP 2: Remove ALL liquidity to make avail-a = 0
        // When avail-a = 0, the provide-liquidity calculation will result in amount-b = 0
        // Contract logic: (amount-b (if (is-eq avail-a u0) u0 (/ (* amount-a avail-b) avail-a)))
        
        // Remove all LP tokens (current total LP supply is supplyData.credit)
        let amountLpToRemove = supplyData.credit;
        
        // Calculate expected values for remove-liquidity (using current marketData and supplyData)
        let availA = marketData.availA;
        let availB = marketData.availB; 
        let totalSupplyLp = supplyData.credit;
        
        // Contract calculations for remove-liquidity
        let amountA = Number((BigInt(amountLpToRemove) * BigInt(availA)) / BigInt(totalSupplyLp));
        let amountB = Number((BigInt(amountLpToRemove) * BigInt(availB)) / BigInt(totalSupplyLp));
        let taxA = Number((BigInt(amountA) * BigInt(TAX)) / BigInt(BASIS));
        let taxB = Number((BigInt(amountB) * BigInt(TAX)) / BigInt(BASIS));
        let userA = amountA - taxA;
        let userB = amountB - taxB;

        // Remove all liquidity - this will make avail-a = 0 and avail-b = 0
        removeLiquidity(
            amountLpToRemove, // burnedLpExpected
            taxA,             // taxAExpected  
            taxB,             // taxBExpected
            userA,            // userAExpected
            userB,            // userBExpected
            deployer,
            disp
        );

        // STEP 3: Now try to provide liquidity when avail-a = 0
        // This will cause amount-b calculation to be 0, triggering ERR_ZERO_AMOUNT
        let amountAToProvide = PROVIDE_WELSH; // Any amount > 0
        let addedBExpected = 0;  // Won't be used due to error  
        let mintedLpExpected = 0; // Won't be used due to error

        provideLiquidity(
            amountAToProvide,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_INITIALIZED ===", () => {
        // STEP 1: Fresh test state (no liquidity provided)
        // Do NOT call setupInitialLiquidity() - we want reserves to be zero

        // STEP 2: Try to provide liquidity as unauthorized sender when not initialized
        let amountA = PROVIDE_WELSH;
        let addedBExpected = 0;  // Won't be used due to error
        let mintedLpExpected = 0; // Won't be used due to error

        provideLiquidity(
            amountA,
            addedBExpected,
            mintedLpExpected,
            wallet1, // Unauthorized sender when avail-a and res-a are zero
            disp
        );
    });
})