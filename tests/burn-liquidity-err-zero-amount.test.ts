import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp } from "./vitestconfig"
import { burnLiquidity } from "./functions/street-market-helper-functions";
import { getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { getTokenBalances } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== BURN LIQUIDITY TESTS ===", () => {
    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup liquidity and user state
        const { supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Get balances before burn
        // Note: setupLiquidityUsers already accounts for all transfers and operations
        const deployerBalances = getTokenBalances(
            userData.deployer.balances.welsh,
            userData.deployer.balances.street,
            userData.deployer.balances.credit,
            deployer,
            disp
        );

        // STEP 3: Check LP total supply before burn
        getTotalSupply(supplyData.credit, "credit-token", deployer, disp);

        // STEP 4: Deployer Burns all their liquidity
        const amountLpToBurn = 0;
        burnLiquidity(amountLpToBurn, deployer, disp);

        // STEP 5: Get balances after burn - should be unchanged since burn failed
        getTokenBalances(
            deployerBalances.welsh,
            deployerBalances.street,
            deployerBalances.credit,
            deployer,
            disp
        );

        // STEP 6: Check LP total supply after burn - should be unchanged
        getTotalSupply(supplyData.credit, "credit-token", deployer, disp);
    });
});