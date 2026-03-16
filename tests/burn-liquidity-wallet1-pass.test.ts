import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, FEE, TAX, CREDIT_AMOUNT } from "./vitestconfig"
import { getMarketInfo, burnLiquidity } from "./functions/street-market-helper-functions";
import { getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { getTokenBalances } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== BURN LIQUIDITY WALLET1 TESTS ===", () => {
    it("=== BURN LIQUIDITY WALLET1 PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        const { marketData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Get wallet1 balances before burn
        const wallet1Balances = getTokenBalances(
            userData.wallet1.balances.welsh,
            userData.wallet1.balances.street,
            userData.wallet1.balances.credit,
            wallet1,
            disp
        );

        // STEP 3: Check LP total supply before burn
        getTotalSupply(supplyData.credit, "credit-token", deployer, disp);

        // STEP 4: wallet1 burns CREDIT_AMOUNT
        const amountLpToBurn = CREDIT_AMOUNT;
        burnLiquidity(amountLpToBurn, wallet1, disp);

        // STEP 5: Get wallet1 balances after burn
        getTokenBalances(
            wallet1Balances.welsh,
            wallet1Balances.street,
            wallet1Balances.credit - CREDIT_AMOUNT, // credit reduced by CREDIT_AMOUNT
            wallet1,
            disp
        );

        // STEP 6: Check LP total supply after burn
        // Total supply should be reduced by CREDIT_AMOUNT
        const expectedTotalSupply = supplyData.credit - CREDIT_AMOUNT;
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