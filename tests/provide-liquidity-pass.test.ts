import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, FEE, PROVIDE_WELSH, TAX } from "./vitestconfig"
import { getMarketInfo, provideLiquidity, } from "./functions/street-market-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== PROVIDE LIQUIDITY TESTS ===", () => {
    it("=== PROVIDE LIQUIDITY PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        let { marketData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Deployer provides additional liquidity
        let amountA = PROVIDE_WELSH;
        let reserveA = marketData.reserveA;
        let reserveB = marketData.reserveB;

        // Calculate proportional amount-b (from contract logic) using BigInt for precision
        let amountABig = BigInt(amountA);
        let reserveABig = BigInt(reserveA);
        let reserveBBig = BigInt(reserveB);
        let amountBBig = (amountABig * reserveBBig) / reserveABig;
        let amountB = Number(amountBBig);

        // Calculate LP amount (from contract logic) using BigInt for precision
        let totalSupplyLp = supplyData.credit;
        let totalSupplyLpBig = BigInt(totalSupplyLp);
        let lpFromABig = (amountABig * totalSupplyLpBig) / reserveABig;
        let lpFromBBig = (amountBBig * totalSupplyLpBig) / reserveBBig;
        let mintedLpAmount = Number(lpFromABig < lpFromBBig ? lpFromABig : lpFromBBig);

        provideLiquidity(amountA, amountB, mintedLpAmount, deployer, disp);

        // STEP 3: Get balances after provide liquidity
        let welshBalance = userData.deployer.balances.welsh - amountA;
        let streetBalance = userData.deployer.balances.street - amountB;
        let lpBalance = userData.deployer.balances.credit + mintedLpAmount;
        getBalance(welshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(streetBalance, 'street-token', deployer, deployer, disp);
        getBalance(lpBalance, "credit-token", deployer, deployer, disp);

        // STEP 4: Check LP total supply after providing liquidity
        let newTotalSupplyLp = supplyData.credit + mintedLpAmount;
        getTotalSupply(newTotalSupplyLp, "credit-token", deployer, disp);

        // STEP 5: Confirm exchange state after providing liquidity
        let availA = marketData.availA + amountA;
        let availB = marketData.availB + amountB;
        reserveA = marketData.reserveA + amountA;
        reserveB = marketData.reserveB + amountB;
        
        getMarketInfo(
            availA,
            availB,
            FEE,
            marketData.lockedA, // locked amounts unchanged
            marketData.lockedB, // locked amounts unchanged
            reserveA,
            reserveB,
            TAX,
            deployer,
            disp
        );
    });
})