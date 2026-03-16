import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { disp } from "./vitestconfig"
import { removeLiquidity } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== REMOVE LIQUIDITY ERRO TESTS ===", () => {
    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup initial liquidity
        setupInitialLiquidity(disp);

        // STEP 2: Try to remove zero LP amount
        const amountLp = 0; // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const taxAExpected = 0;      // Won't be used due to error
        const taxBExpected = 0;      // Won't be used due to error
        const userAExpected = 0;     // Won't be used due to error
        const userBExpected = 0;     // Won't be used due to error

        removeLiquidity(
            amountLp,
            taxAExpected,
            taxBExpected,
            userAExpected,
            userBExpected,
            deployer,
            disp
        );
    });
});