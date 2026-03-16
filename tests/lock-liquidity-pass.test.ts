import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getMarketInfo, lockLiquidity } from "./functions/street-market-helper-functions";
import { disp, LOCK_WELSH, FEE, TAX } from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== LOCK LIQUIDITY TESTS ===", () => {
    it("=== LOCK LIQUIDITY PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        let { marketData } = setupLiquidityUsers(disp);

        // STEP 2: Calculate expected values for locking liquidity
        let amountA = LOCK_WELSH
        let reserveA = marketData.reserveA;
        let reserveB = marketData.reserveB;

        // Calculate proportional amount-b (from contract logic)
        let amountB = Math.floor((amountA * reserveB) / reserveA);

        let lockedAExpected = amountA;
        let lockedBExpected = amountB;

        // STEP 3: Lock liquidity
        lockLiquidity(
            lockedAExpected,
            lockedBExpected,
            deployer,
            disp
        );

        // STEP 4: Validate exchange state after locking
        let availAExpected = marketData.availA; // Available does not change
        let availBExpected = marketData.availB; // Available does not change
        let newLockedAExpected = amountA;     // Locked increases
        let newLockedBExpected = amountB;     // Locked increases
        let newReserveAExpected = marketData.reserveA + amountA; // Reserves increase
        let newReserveBExpected = marketData.reserveB + amountB; // Reserves increase

        getMarketInfo(
            availAExpected,
            availBExpected,
            FEE, // fee unchanged
            newLockedAExpected,
            newLockedBExpected,
            newReserveAExpected,
            newReserveBExpected,
            TAX, // tax unchanged
            deployer,
            disp
        );
    });
});