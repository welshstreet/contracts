import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, BASIS, FEE, TAX } from "./vitestconfig"
import { getMarketInfo, removeLiquidity } from "./functions/street-market-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== REMOVE LIQUIDITY TESTS ===", () => {
    it("=== REMOVE LIQUIDITY PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        let { marketData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: Deployer removes their liquidity
        let amountLpToRemove = userData.deployer.balances.credit;

        // Calculate expected values for remove-liquidity (using contract logic)
        let availA = marketData.availA;
        let availB = marketData.availB;
        let totalSupplyLp = supplyData.credit;

        // Contract calculations for remove-liquidity
        let amountA = Number((BigInt(amountLpToRemove) * BigInt(availA)) / BigInt(totalSupplyLp));
        let amountB = Number((BigInt(amountLpToRemove) * BigInt(availB)) / BigInt(totalSupplyLp));
        let taxA = Number((BigInt(amountA) * BigInt(TAX)) / BigInt(BASIS));
        let taxB = Number((BigInt(amountB) * BigInt(TAX)) / BigInt(BASIS));
        let userA = amountA - taxA;
        let userB = amountB - taxB;

        // deployer remove liquidity
        removeLiquidity(
            amountLpToRemove, // burnedLpExpected
            taxA,             // taxAExpected
            taxB,             // taxBExpected
            userA,            // userAExpected
            userB,            // userBExpected
            deployer,
            disp
        );

        // STEP 3: Check market info after remove liquidity
        // Market still has liquidity from wallet1 and wallet2
        // Calculate expected values based on the removal
        // Available liquidity = reserves - locked
        // After removal: reserves reduced by userA/userB, locked increased by taxA/taxB
        let reserveA = marketData.reserveA - userA;
        let reserveB = marketData.reserveB - userB;
        let lockedA = marketData.lockedA + taxA;
        let lockedB = marketData.lockedB + taxB;
        availA = reserveA - lockedA;
        availB = reserveB - lockedB;
        
        getMarketInfo(
            availA,          // availAExpected
            availB,          // availBExpected
            FEE,             // fee
            lockedA,         // lockedAExpected
            lockedB,         // lockedBExpected
            reserveA,        // reserveAExpected
            reserveB,        // reserveBExpected
            TAX,             // tax
            deployer,
            disp
        );
        
        // STEP 4: Check deployer's credit balance after removal
        getBalance(0, "credit-token", deployer, deployer, disp);
    });
});