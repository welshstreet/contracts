import { describe, it } from "vitest";
import { disp, TRANSFER_CREDIT } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { transferCredit } from "./functions/credit-controller-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT CONTROLLER PASS TESTS ===", () => {
    it("=== CREDIT CONTROLLER PASS - TRANSFER ===", () => {
        // STEP 1: Setup liquidity so wallet1 and wallet2 have CREDIT
        const { userData } = setupLiquidityUsers(disp);

        let wallet1Credit = userData.wallet1.balances.credit;
        let wallet2Credit = userData.wallet2.balances.credit;

        // STEP 2: Check initial credit balances
        getBalance(wallet1Credit, "credit-token", wallet1, wallet1, disp);
        getBalance(wallet2Credit, "credit-token", wallet2, wallet2, disp);

        // STEP 3: wallet1 transfers TRANSFER_CREDIT to wallet2
        transferCredit(TRANSFER_CREDIT, wallet1, wallet2, wallet1, undefined, disp);

        // STEP 4: Update expected balances and verify
        wallet1Credit = wallet1Credit - TRANSFER_CREDIT;
        wallet2Credit = wallet2Credit + TRANSFER_CREDIT;

        getBalance(wallet1Credit, "credit-token", wallet1, wallet1, disp);
        getBalance(wallet2Credit, "credit-token", wallet2, wallet2, disp);
    });
});
