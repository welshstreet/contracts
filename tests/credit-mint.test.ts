import { describe, it } from "vitest";
import { disp, CREDIT_AMOUNT } from "./vitestconfig"
import { creditMint } from "./functions/credit-token-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CREDIT MINT TESTS ===", () => {
    it("=== CREDIT MINT PASS ===", () => {
        const amountExpected = CREDIT_AMOUNT;
        creditMint(amountExpected, deployer, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        const amountExpected = 0;
        creditMint(amountExpected, deployer, disp);
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        const amountExpected = CREDIT_AMOUNT;
        creditMint(amountExpected, deployer, disp);
    });
});
