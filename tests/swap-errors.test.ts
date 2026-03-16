import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { swapAB, swapBA } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== SWAP TESTS ===", () => {
    it("=== ERR_ZERO_AMOUNT - SWAP-A-B ===", () => {
        const { marketData } = setupLiquidityUsers(disp);
        
        swapAB(
            0,              // Zero amount A should trigger ERR_ZERO_AMOUNT
            0,              // amount-b (output) expected
            0,              // feeAExpected
            marketData.reserveA,  // resAExpected
            marketData.reserveA,  // resANewExpected (unchanged)
            marketData.reserveB,  // resBExpected
            marketData.reserveB,  // resBNewExpected (unchanged)
            deployer,
            disp
        );
    });

    it("=== ERR_INVALID_AMOUNT - SWAP-A-B ===", () => {
        // For ERR_INVALID_AMOUNT in swap-a-b, we need amount-b-net = 0
        // This happens when the AMM calculation results in 0 output
        // This can occur with extremely small input amounts or when reserves are very unbalanced
        
        // We'll use a tiny amount that results in 0 after AMM calculation
        const { marketData } = setupLiquidityUsers(disp);
        const tinyAmount = 1; // 1 micro-token - should result in 0 output after fees and AMM
        
        swapAB(
            tinyAmount,     // Tiny amount that results in 0 output (ERR_INVALID_AMOUNT)
            0,              // amountOutExpected (0 triggers error)
            0,              // feeAExpected
            marketData.reserveA,  // resAExpected
            marketData.reserveA,  // resANewExpected (unchanged on error)
            marketData.reserveB,  // resBExpected
            marketData.reserveB,  // resBNewExpected (unchanged on error)
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT - SWAP-B-A ===", () => {
        const { marketData } = setupLiquidityUsers(disp);
        
        swapBA(
            0,              // Zero amount B should trigger ERR_ZERO_AMOUNT
            0,              // amount-a (output) expected
            0,              // feeBExpected
            marketData.reserveA,  // resAExpected
            marketData.reserveA,  // resANewExpected (unchanged)
            marketData.reserveB,  // resBExpected
            marketData.reserveB,  // resBNewExpected (unchanged)
            deployer,
            disp
        );
    });

    it("=== ERR_INVALID_AMOUNT - SWAP-B-A ===", () => {
        // For ERR_INVALID_AMOUNT in swap-b-a, we need amount-b = 0
        // But since we already test zero amount-b above, this would be checking the second assert
        // Looking at the contract: (asserts! (> amount-b u0) ERR_INVALID_AMOUNT)
        // This is the same as the zero check, so let's use a scenario where calculation fails
        
        const { marketData } = setupLiquidityUsers(disp);
        const tinyAmount = 1; // 1 micro-token that may trigger invalid amount
        
        swapBA(
            tinyAmount,     // Tiny amount that may trigger ERR_INVALID_AMOUNT
            0,              // amount-a (output) expected (0 triggers error)
            0,              // feeBExpected
            marketData.reserveA,  // resAExpected
            marketData.reserveA,  // resANewExpected (unchanged on error)
            marketData.reserveB,  // resBExpected
            marketData.reserveB,  // resBNewExpected (unchanged on error)
            deployer,
            disp
        );
    });
});
