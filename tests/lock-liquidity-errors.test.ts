import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { lockLiquidity } from "./functions/street-market-helper-functions";
import { disp } from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== LOCK LIQUIDITY ERROR TESTS ===", () => {
    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup initial liquidity
        setupInitialLiquidity(disp);

        // STEP 2: Try to lock zero amount
        let lockedAExpected = 0;  // Won't be used due to error
        let lockedBExpected = 0;  // Won't be used due to error

        lockLiquidity(
            lockedAExpected,
            lockedBExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_INITIALIZED ===", () => {
        // STEP 1: Fresh test state (no liquidity provided)
        // Do NOT call setupInitialLiquidity() - we want reserves to be zero

        // STEP 2: Try to lock liquidity as unauthorized sender when not initialized
        let lockedAExpected = 0;  // Won't be used due to error
        let lockedBExpected = 0;  // Won't be used due to error

        lockLiquidity(
            lockedAExpected,
            lockedBExpected,
            wallet1, // Unauthorized sender when reserves are zero
            disp
        );
    });
});