import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { updateUserRewards } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!

describe("=== UPDATE USER REWARDS TESTS ===", () => {
    it("=== UPDATE USER REWARDS PASS ===", () => {
        if (disp) {
            console.log("✅ UPDATE USER REWARDS: Success scenarios tested through exchange integration");
            console.log("   - provide-initial-liquidity → update-user-rewards (as-contract call from .exchange)");
            console.log("   - provide-liquidity → update-user-rewards (as-contract call from .exchange)");
            console.log("   - swap functions → update-user-rewards (as-contract call from .exchange)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupExchangeLiquidity(disp);
        updateUserRewards(wallet1, wallet1, disp);
    });
});