import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, FEE, TAX } from "./vitestconfig"
import { getMarketInfo, burnLiquidity } from "./functions/street-market-helper-functions";
import { getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { getTokenBalances } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== BURN LIQUIDITY DEPLOYER TESTS ===", () => {
    it("=== BURN LIQUIDITY DEPLOYER PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        const { marketData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Get deployer balances before burn from setup
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
        const amountLpToBurn = userData.deployer.balances.credit;
        burnLiquidity(amountLpToBurn, deployer, disp);

        // STEP 5: Get balances after burn
        getTokenBalances(
            deployerBalances.welsh,
            deployerBalances.street,
            0, // credit burned to 0
            deployer,
            disp
        );

        // STEP 6: Check LP total supply after burn
        // Total supply should be wallet1 + wallet2 LP tokens only
        const expectedTotalSupply = userData.wallet1.balances.credit + 
                                   userData.wallet2.balances.credit;
        getTotalSupply(expectedTotalSupply, "credit-token", deployer, disp);

        // STEP 7: Confirm exchange state after burn - reserves unchanged since burning LP doesn't affect pool
        getMarketInfo(
            marketData.availA,
            marketData.availB,
            FEE,
            0,
            0,
            marketData.reserveA,
            marketData.reserveB,
            TAX,
            deployer,
            disp
        );
    });
});