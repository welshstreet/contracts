import { describe, it } from "vitest";
import { disp, TRANSFER_CREDIT } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { transferCredit } from "./functions/credit-controller-helper-functions";
import { setContractOwner } from "./functions/shared-set-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT CONTROLLER ERROR TESTS ===", () => {
    it("=== CREDIT CONTROLLER FAIL - ZERO AMOUNT ===", () => {
        // STEP 1: Setup liquidity so wallet1 has CREDIT
        const { userData } = setupLiquidityUsers(disp);

        userData.wallet1.balances.credit;

        // STEP 2: wallet1 tries to transfer 0 CREDIT (should fail with ERR_ZERO_AMOUNT 911)
        transferCredit(0, wallet1, wallet2, wallet1, undefined, disp);

        // Balance should be unchanged
        // (no balance check needed — transferCredit asserts the error internally)
    });

    it("=== CREDIT CONTROLLER FAIL - NOT TOKEN OWNER ===", () => {
        // STEP 1: Setup liquidity so wallet1 has CREDIT
        const { userData } = setupLiquidityUsers(disp);

        userData.wallet1.balances.credit;

        // STEP 2: wallet2 tries to transfer wallet1's CREDIT (caller != sender)
        // This should fail with ERR_NOT_TOKEN_OWNER (913)
        transferCredit(TRANSFER_CREDIT, wallet1, wallet2, wallet2, undefined, disp);
    });

    it("=== CREDIT CONTROLLER FAIL - INSUFFICIENT BALANCE ===", () => {
        // STEP 1: Setup liquidity so wallet1 has CREDIT
        const { userData } = setupLiquidityUsers(disp);

        let wallet1Credit = userData.wallet1.balances.credit;

        // STEP 2: wallet1 tries to transfer more than their balance
        // This should fail with ERR_BALANCE (914)
        let overAmount = wallet1Credit + TRANSFER_CREDIT; // exceeds balance
        transferCredit(overAmount, wallet1, wallet2, wallet1, undefined, disp);
    });

    it("=== CREDIT CONTROLLER FAIL - NOT CONTRACT OWNER ===", () => {
        // STEP 1: wallet1 (not the contract owner) tries to set a new contract owner
        // This should fail with ERR_NOT_CONTRACT_OWNER (912)
        setContractOwner('credit-controller', wallet2, wallet1, disp);
    });
});
