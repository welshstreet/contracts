import { describe, it } from "vitest";
import { disp, BASIS, SWAP_WELSH, FEE, TAX } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getMarketInfo, swapAB} from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== SWAP TESTS ===", () => {
    it("=== SWAP-A-B PASS ===", () => {
        // STEP 1: Setup liquidity and user state
        let { marketData } = setupLiquidityUsers(disp);
        if (disp) {console.log("Initial Market State:", marketData)};

        // STEP 2: fetch total reserves from setup (already includes all user contributions)
        let resA = marketData.reserveA
        let resB = marketData.reserveB
        
        // STEP 3: Calculate expected swap values
        // Using AMM formula: amount_out = (amount_in_net * reserve_out) / (reserve_in + amount_in_net)
        // Where amount_in_net = amount_in - fees
        const amountA = SWAP_WELSH;
        const feeAExpected = Math.floor((amountA * marketData.fee) / BASIS);
        const amountANet = amountA - feeAExpected;

        // AMM calculation
        const amountOut = Math.floor((amountANet * resB) / (resA + amountANet));

        // Calculate new reserve values after swap
        const resANew = resA + amountANet;
        const resBNew = resB - amountOut;

        // STEP 4: Deployer swaps SWAP_WELSH
        swapAB(
            amountA,        // amount-a (Welsh input)
            amountOut,      // amount-b (Street output - net)
            feeAExpected,   // fee-a
            resA,           // res-a (initial)
            resANew,        // res-a-new (updated)
            resB,           // res-b (initial)
            resBNew,        // res-b-new (updated)
            deployer,
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
