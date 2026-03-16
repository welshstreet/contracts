import { describe, it } from "vitest";
import { disp, BASIS, SWAP_STREET, FEE, TAX } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getMarketInfo, swapBA } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== SWAP TESTS ===", () => {
    it("=== SWAP-B-A PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        const { marketData, userData } = setupLiquidityUsers(disp);
        
        if (disp) {
            console.log("=== USER BALANCES FROM SETUP ===");
            console.log("Wallet1 STREET balance:", userData.wallet1.balances.street);
            console.log("SWAP_STREET amount:", SWAP_STREET);
        }
        
        // STEP 2: Get current reserves from setup (already includes all user contributions)
        let resA = marketData.reserveA;
        let resB = marketData.reserveB;
        
        // STEP 3: Calculate expected swap values
        // Using AMM formula: amount_out = (amount_in_net * reserve_out) / (reserve_in + amount_in_net)
        // Where amount_in_net = amount_in - fees
        const amountB = SWAP_STREET;
        const feeBExpected = Math.floor((amountB * marketData.fee) / BASIS);
        const amountBNet = amountB - feeBExpected;

        // AMM calculation for B→A swap
        const amountOut = Math.floor((amountBNet * resA) / (resB + amountBNet));

        // Calculate new reserve values after swap
        const resANew = resA - amountOut;
        const resBNew = resB + amountBNet;

        // STEP 4: wallet1 swaps SWAP_STREET
        swapBA(
            amountB,        // amount-b (Street input)
            amountOut,      // amount-a (Welsh output - net)
            feeBExpected,   // fee-b
            resA,           // res-a (initial)
            resANew,        // res-a-new (updated)
            resB,           // res-b (initial)
            resBNew,        // res-b-new (updated)
            wallet1,
            disp
        );
        
        // Update running totals with new reserve values
        resA = resANew;
        resB = resBNew;

        // STEP 5: Confirm market state after swap
        getMarketInfo(
            resA,          // availA = updated reserve A
            resB,          // availB = updated reserve B
            FEE,
            0,             // locked-a unchanged
            0,             // locked-b unchanged
            resA,          // reserveA = updated reserve A
            resB,          // reserveB = updated reserve B
            TAX,
            deployer,
            disp
        );
    });

});
