import { describe, it } from "vitest";
import { disp, BASIS, LOCK_WELSH, SWAP_STREET } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getMarketInfo, lockLiquidity, swapBA } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== SWAP TESTS ===", () => {
    it("=== PROPORTIONAL LOCKED ADJUSTMENT DURING LARGE SWAP ===", () => {
        // STEP 1: Setup liquidity and user state
        let { marketData } = setupLiquidityUsers(disp);

        // Extract initial market state from setupLiquidityUsers
        let availA = marketData.availA;
        let availB = marketData.availB;
        let fee = marketData.fee;
        let lockedA = marketData.lockedA;
        let lockedB = marketData.lockedB;
        let reserveA = marketData.reserveA;
        let reserveB = marketData.reserveB;
        let tax = marketData.tax;

        // Verify initial state
        getMarketInfo(
            availA,
            availB,
            fee,
            lockedA,
            lockedB,
            reserveA,
            reserveB,
            tax,
            deployer,
            disp
        );

        if (disp) {
            console.log(" === STEP 1 COMPLETE: INITIAL STATE ===");
            console.log(`Reserve A: ${reserveA.toLocaleString()}`);
            console.log(`Reserve B: ${reserveB.toLocaleString()}`);
            console.log(`Locked A: ${lockedA.toLocaleString()}`);
            console.log(`Locked B: ${lockedB.toLocaleString()}`);
            console.log(`Available A: ${availA.toLocaleString()}`);
            console.log(`Available B: ${availB.toLocaleString()}`);
            console.log(`Fee: ${fee} basis points`);
            console.log(`Tax: ${tax} basis points`);
            console.log(`   Initial state verified - ready for lock operation`);
        }

        // STEP 2: Lock additional liquidity to create locked vs available split
        let lockAmountA = LOCK_WELSH;
        let lockAmountB = Math.floor((lockAmountA * reserveB) / reserveA);

        if (disp) {
            console.log(" === STEP 2: LOCK ADDITIONAL LIQUIDITY ===");
            console.log(`Locking: ${lockAmountA.toLocaleString()} WELSH, ${lockAmountB.toLocaleString()} STREET`);
        }

        lockLiquidity(lockAmountA, lockAmountB, deployer, disp);

        // Update state after locking
        reserveA = reserveA + lockAmountA;
        reserveB = reserveB + lockAmountB;
        lockedA = lockAmountA;
        lockedB = lockAmountB;
        availA = reserveA - lockedA;
        availB = reserveB - lockedB;

        // Update marketData in place
        marketData.reserveA = reserveA;
        marketData.reserveB = reserveB;
        marketData.lockedA = lockedA;
        marketData.lockedB = lockedB;
        marketData.availA = availA;
        marketData.availB = availB;

        // Verify state after locking
        getMarketInfo(
            availA,
            availB,
            fee,
            lockedA,
            lockedB,
            reserveA,
            reserveB,
            tax,
            deployer,
            disp
        );

        if (disp) {
            console.log(" === STEP 2 COMPLETE: STATE AFTER LOCKING ===");
            console.log(`Reserve A: ${reserveA.toLocaleString()} (+${lockAmountA.toLocaleString()})`);
            console.log(`Reserve B: ${reserveB.toLocaleString()} (+${lockAmountB.toLocaleString()})`);
            console.log(`Locked A: ${lockedA.toLocaleString()}`);
            console.log(`Locked B: ${lockedB.toLocaleString()}`);
            console.log(`Available A: ${availA.toLocaleString()}`);
            console.log(`Available B: ${availB.toLocaleString()}`);
            console.log(`   Liquidity locked - ready for swap test`);
        }

        // STEP 3: Perform large swap and verify proportional locked adjustment
        let extremeSwapB = SWAP_STREET * 10
        
        if (disp) {
            console.log(" === STEP 3: PERFORM LARGE SWAP (B → A) ===");
            console.log(`Swapping: ${extremeSwapB.toLocaleString()} STREET → WELSH`);
            console.log(`This large swap will test proportional locked adjustment`);
        }

        // Store pre-swap values for percentage change calculations
        let oldReserveA = reserveA;
        let oldReserveB = reserveB;
        let oldLockedA = lockedA;
        let oldLockedB = lockedB;

        // Calculate fees (no revenue in this contract version)
        let feeB = Math.floor((extremeSwapB * fee) / BASIS);
        let swapAmountBNet = extremeSwapB - feeB;

        // AMM calculation for amount out (constant product formula)
        // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        let amountOutA = Math.floor((swapAmountBNet * reserveA) / (reserveB + swapAmountBNet));

        // Calculate new reserves after swap
        let newReserveA = reserveA - amountOutA;
        let newReserveB = reserveB + swapAmountBNet;

        // Execute the swap
        swapBA(
            extremeSwapB,    // amountB input
            amountOutA,      // amount-a (Welsh output - net)
            feeB,            // feeBExpected
            reserveA,        // resAExpected (OLD reserves)
            newReserveA,     // resANewExpected (NEW reserves)
            reserveB,        // resBExpected (OLD reserves)
            newReserveB,     // resBNewExpected (NEW reserves)
            deployer,
            disp
        );

        // STEP 4: Calculate expected proportional locked amounts after swap  
        // The proportional fix maintains: lock_new = (lock_old * reserve_new) / reserve_old
        // Use BigInt to ensure precise integer arithmetic matching the contract
        let lockedABig = BigInt(lockedA);
        let lockedBBig = BigInt(lockedB);
        let reserveABig = BigInt(reserveA);
        let reserveBBig = BigInt(reserveB);
        let newReserveABig = BigInt(newReserveA);
        let newReserveBBig = BigInt(newReserveB);
        
        let expectedLockedA = Number((lockedABig * newReserveABig) / reserveABig);
        let expectedLockedB = Number((lockedBBig * newReserveBBig) / reserveBBig);
        
        // Calculate expected available amounts (contract does: avail = reserve - locked)
        let expectedAvailA = newReserveA - expectedLockedA;
        let expectedAvailB = newReserveB - expectedLockedB;

        // Update state after swap
        reserveA = newReserveA;
        reserveB = newReserveB;
        lockedA = expectedLockedA;
        lockedB = expectedLockedB;
        availA = expectedAvailA;
        availB = expectedAvailB;

        // Update marketData in place
        marketData.reserveA = reserveA;
        marketData.reserveB = reserveB;
        marketData.lockedA = lockedA;
        marketData.lockedB = lockedB;
        marketData.availA = availA;
        marketData.availB = availB;

        // STEP 5: Validate that the proportional fix worked
        getMarketInfo(
            expectedAvailA,  // availAExpected (should be positive with proportional fix)
            expectedAvailB,  // availBExpected
            fee,             // feeExpected
            expectedLockedA, // lockedAExpected (proportionally reduced)
            expectedLockedB, // lockedBExpected (proportionally increased)
            newReserveA,     // reserveAExpected (reduced by swap)
            newReserveB,     // reserveBExpected (increased by swap)
            tax,             // taxExpected
            deployer,
            disp
        );

        if (disp) {
            console.log(" === STEP 3 COMPLETE: STATE AFTER LARGE SWAP ===");
            console.log(`Swap executed: ${extremeSwapB.toLocaleString()} STREET → ${amountOutA.toLocaleString()} WELSH`);
            console.log(`Fee collected: ${feeB.toLocaleString()} STREET`);
            
            // Calculate percentage changes
            let reserveAChangePercent = ((newReserveA - oldReserveA) / oldReserveA) * 100;
            let reserveBChangePercent = ((newReserveB - oldReserveB) / oldReserveB) * 100;
            let lockedAChangePercent = ((lockedA - oldLockedA) / oldLockedA) * 100;
            let lockedBChangePercent = ((lockedB - oldLockedB) / oldLockedB) * 100;
            
            console.log(` Reserves After Swap:`);
            console.log(`  Reserve A: ${reserveA.toLocaleString()} (reduced by ${amountOutA.toLocaleString()})`);
            console.log(`  Reserve B: ${reserveB.toLocaleString()} (increased by ${swapAmountBNet.toLocaleString()})`);
            console.log(` Proportional Locked Adjustment:`);
            console.log(`  Locked A: ${lockedA.toLocaleString()} (proportionally reduced)`);
            console.log(`  Locked B: ${lockedB.toLocaleString()} (proportionally increased)`);
            console.log(` Percentage Changes (verifying proportional adjustment):`);
            console.log(`  Reserve A: ${reserveAChangePercent.toFixed(6)}%`);
            console.log(`  Locked A:  ${lockedAChangePercent.toFixed(6)}%`);
            console.log(`  Reserve B: ${reserveBChangePercent.toFixed(6)}%`);
            console.log(`  Locked B:  ${lockedBChangePercent.toFixed(6)}%`);
            console.log(`   ✓ A changes match: ${Math.abs(reserveAChangePercent - lockedAChangePercent) < 0.0001 ? 'YES' : 'NO'} (diff: ${Math.abs(reserveAChangePercent - lockedAChangePercent).toFixed(8)}%)`);
            console.log(`  ✓ B changes match: ${Math.abs(reserveBChangePercent - lockedBChangePercent) < 0.0001 ? 'YES' : 'NO'} (diff: ${Math.abs(reserveBChangePercent - lockedBChangePercent).toFixed(8)}%)`);
            console.log(` Available After Adjustment:`);
            console.log(`  Available A: ${availA.toLocaleString()} (should be positive!)`);
            console.log(`  Available B: ${availB.toLocaleString()}`);
            console.log(`   Proportional locked adjustment working correctly`);
            console.log(`  Available liquidity remains positive despite large swap`);
        }
    });
});
