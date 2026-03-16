import { describe, it } from "vitest";
import { disp, CREDIT_AMOUNT } from "./vitestconfig"
import { creditBurn } from "./functions/credit-token-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CREDIT BURN TESTS ===", () => {
    it("=== CREDIT BURN PASS ===", () => {
        const amountExpected = CREDIT_AMOUNT;
        creditBurn(amountExpected, deployer, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        const amountExpected = 0;
        creditBurn(amountExpected, deployer, disp);
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        const amountExpected = CREDIT_AMOUNT;
        creditBurn(amountExpected, deployer, disp);
    });
});