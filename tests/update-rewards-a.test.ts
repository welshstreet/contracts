import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { updateRewardsA } from "./functions/street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!

describe("=== UPDATE REWARDS A TESTS ===", () => {
    it("=== UPDATE REWARDS A PASS ===", () => {
        if (disp) {
            console.log("UPDATE REWARDS A: Success scenarios tested through donate-rewards integration");
            console.log("   - donate-rewards → update-rewards-a (as-contract call from .street-rewards)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupLiquidityUsers(disp);
        updateRewardsA(1000, wallet1, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        setupLiquidityUsers(disp);
        updateRewardsA(0, wallet1, disp);
    });

});
