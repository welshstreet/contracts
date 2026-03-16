import { describe, it } from "vitest";
import { disp, INITIAL_PROVIDE_WELSH, INITIAL_PROVIDE_STREET } from "./vitestconfig"
import { initialLiquidity } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== INITIAL LIQUIDITY ERROR TESTS ===", () => {
    it("=== ERR_ZERO_AMOUNT - AMOUNT A ===", () => {
        // Test with zero amount A
        const amountA = 0;  // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const amountB = INITIAL_PROVIDE_STREET;
        const mintedLpExpected = 0; // Won't be used due to error

        initialLiquidity(
            amountA,
            amountB,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT - AMOUNT B ===", () => {

        // Test with zero amount B
        const amountA = INITIAL_PROVIDE_WELSH;
        const amountB = 0;  // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const mintedLpExpected = 0; // Won't be used due to error

        initialLiquidity(
            amountA,
            amountB,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_CONTRACT_OWNER ===", () => {

        // Test with unauthorized sender (wallet1 instead of deployer)
        const amountA = INITIAL_PROVIDE_WELSH;
        const amountB = INITIAL_PROVIDE_STREET;
        const mintedLpExpected = 0; // Won't be used due to error

        initialLiquidity(
            amountA,
            amountB,
            mintedLpExpected,
            wallet1,  // Unauthorized sender
            disp
        );
    });
    
    it("=== ERR_ALREADY_INITIALIZED ===", () => {

        // STEP 1: Provide initial liquidity successfully (first time)
        const amountA = INITIAL_PROVIDE_WELSH;
        const amountB = INITIAL_PROVIDE_STREET;
        const mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));

        initialLiquidity(
            amountA,
            amountB,
            mintedLpExpected,
            deployer,
            disp
        );

        // STEP 2: Try to provide initial liquidity again (should fail with ERR_ALREADY_INITIALIZED)
        const secondAmountA = INITIAL_PROVIDE_WELSH;
        const secondAmountB = INITIAL_PROVIDE_STREET;
        const secondMintedLpExpected = 0; // Won't be used due to error

        initialLiquidity(
            secondAmountA,
            secondAmountB,
            secondMintedLpExpected,
            deployer,
            disp
        );
    });
});