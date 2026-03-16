import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-initial-liquidity-helper-function";
import { setupUserWallet } from "./functions/setup-user-wallet-helper-function";
import { getTokenBalances } from "./functions/utility-helper-functions";
import { disp } from './vitestconfig';

describe("=== SETUP USER WALLET TESTS ===", () => {
    it("=== SETUP USER WALLET PASS ===", () => {
        // Setup initial liquidity so the pool is initialized before wallet setup
        // Without this, provideLiquidity inside setupUserWallet fails (ERR_NOT_INITIALIZED)
        // and the block assertion in getRewardUserInfo would fail (userCredit=0 → no contract entry → block=0)
        let { rewardData, userData } = setupInitialLiquidity(disp);

        // burn-block-height stays constant at 3 in simnet tests (Bitcoin block, not Stacks block)
        // simnet.blockHeight increments with each transaction (Stacks block for reward tracking)
        // Since setupInitialLiquidity doesn't perform any mints, wallet_1 is the first mint (epoch 1)
        let result = setupUserWallet("wallet_1", rewardData, userData, disp, 3, 1);
        getTokenBalances(
            result.userData.wallet1.balances.welsh,
            result.userData.wallet1.balances.street,
            result.userData.wallet1.balances.credit,
            result.userData.wallet1.address, disp);
    });
});