import { describe, it } from "vitest";
import { disp, INITIAL_PROVIDE_WELSH, INITIAL_PROVIDE_STREET,  FEE, TAX } from "./vitestconfig"
import { getMarketInfo, initialLiquidity } from "./functions/street-market-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== INITIAL LIQUIDITY PASS TEST ===", () => {
    it("=== INITIAL LIQUIDITY PASS ===", () => {
        // STEP 1: Calculate expected values for initial liquidity
        let amountA = INITIAL_PROVIDE_WELSH;
        let amountB = INITIAL_PROVIDE_STREET;
        let mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));

        // STEP 2: Provide initial liquidity to create the exchange pool
        initialLiquidity(
            amountA,
            amountB,
            mintedLpExpected,
            deployer,
            disp
        );

        // STEP 3: Validate exchange market state after providing liquidity
        let availAExpected = amountA;  // reserve-a - locked-a = INITIAL_PROVIDE_WELSH - 0
        let availBExpected = amountB; // reserve-b - locked-b = INITIAL_PROVIDE_STREET - 0
        let feeExpected = FEE;               // default fee from vitestconfig
        let lockedAExpected = 0;             // no locked liquidity initially
        let lockedBExpected = 0;             // no locked liquidity initially
        let reserveAExpected = amountA; // reserves now contain the liquidity
        let reserveBExpected = amountB;
        let taxExpected = TAX;               // default tax (same as fee) from vitestconfig

        getMarketInfo(
            availAExpected,
            availBExpected,
            feeExpected,
            lockedAExpected,
            lockedBExpected,
            reserveAExpected,
            reserveBExpected,
            taxExpected,
            deployer,
            disp
        );

        // STEP 4: Validate deployer's LP token balance
        getBalance(mintedLpExpected, 'credit-token', deployer, deployer, disp);
    });
});