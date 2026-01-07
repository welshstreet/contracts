import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { disp, MINT_AMOUNT, PROVIDE_WELSH, TOTAL_SUPPLY_WELSH } from "./vitestconfig"
import { getExchangeInfo, provideLiquidity, removeLiquidity } from "./functions/exchange-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== PROVIDE LIQUIDITY TESTS ===", () => {
    it("=== PROVIDE LIQUIDITY PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Get balances before provide liquidity
        let expectedWelshBalance = TOTAL_SUPPLY_WELSH - setup.amountA;
        let expectedStreetBalance = MINT_AMOUNT - setup.amountB;
        let expectedLpBalance = setup.mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 3: Check LP total supply before burn
        getTotalSupply(setup.mintedLpExpected, "credit", deployer, disp);

        // STEP 4: Deployer provides additional liquidity
        const amountA = PROVIDE_WELSH;
        const reserveA = setup.reserveAExpected;
        const reserveB = setup.reserveBExpected;

        // Calculate proportional amount-b (from contract logic) using BigInt for precision
        const amountABig = BigInt(amountA);
        const reserveABig = BigInt(reserveA);
        const reserveBBig = BigInt(reserveB);
        const amountBBig = (amountABig * reserveBBig) / reserveABig;
        const amountB = Number(amountBBig);
        const addedAExpected = amountA;
        const addedBExpected = amountB;

        // Calculate LP amount (from contract logic) using BigInt for precision
        const totalSupplyLp = setup.mintedLpExpected;
        const totalSupplyLpBig = BigInt(totalSupplyLp);
        const lpFromABig = (amountABig * totalSupplyLpBig) / reserveABig;
        const lpFromBBig = (amountBBig * totalSupplyLpBig) / reserveBBig;
        const mintedLpExpected = Number(lpFromABig < lpFromBBig ? lpFromABig : lpFromBBig);

        provideLiquidity(amountA,addedAExpected, addedBExpected, mintedLpExpected, deployer, disp);

        // STEP 5: Get balances after provide liquidity
        expectedWelshBalance -= amountA;
        expectedStreetBalance -= amountB;
        expectedLpBalance += mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 6: Check LP total supply before burn
        getTotalSupply(expectedLpBalance, "credit", deployer, disp);

        // STEP 7: Confirm exchange state after burn - nothing changes since liquidity burn does not change exchange info.
        getExchangeInfo(
            setup.availAExpected += amountA,
            setup.availBExpected += amountB,
            100,
            0,
            0,
            setup.reserveAExpected += amountA,
            setup.reserveBExpected += amountB,
            100,
            100,
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT - AMOUNT A ===", () => {
        // STEP 1: Setup initial liquidity
        setupInitialLiquidity(disp);

        // STEP 2: Try to provide zero amount A
        const amountA = 0; // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const addedAExpected = 0;  // Won't be used due to error
        const addedBExpected = 0;  // Won't be used due to error
        const mintedLpExpected = 0; // Won't be used due to error

        provideLiquidity(
            amountA,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Remove ALL liquidity to make avail-a = 0
        // When avail-a = 0, the provide-liquidity calculation will result in amount-b = 0
        // Contract logic: (amount-b (if (is-eq avail-a u0) u0 (/ (* amount-a avail-b) avail-a)))
        
        const amountLpToRemove = setup.mintedLpExpected; // Remove all LP tokens
        
        // Calculate expected values for remove-liquidity (using contract logic)
        const availA = setup.availAExpected;
        const availB = setup.availBExpected; 
        const totalSupplyLp = setup.mintedLpExpected;
        
        // Contract calculations for remove-liquidity
        const amountA = Math.floor((amountLpToRemove * availA) / totalSupplyLp);
        const amountB = Math.floor((amountLpToRemove * availB) / totalSupplyLp);
        const taxA = Math.floor((amountA * 100) / 10000); // tax = 100, BASIS = 10000
        const taxB = Math.floor((amountB * 100) / 10000);
        const userA = amountA - taxA;
        const userB = amountB - taxB;

        // Remove all liquidity - this will make avail-a = 0 and avail-b = 0
        removeLiquidity(
            amountLpToRemove,
            amountLpToRemove, // burnedLpExpected
            taxA,             // taxAExpected  
            taxB,             // taxBExpected
            userA,            // userAExpected
            userB,            // userBExpected
            deployer,
            disp
        );

        // STEP 3: Now try to provide liquidity when avail-a = 0
        // This will cause amount-b calculation to be 0, triggering ERR_ZERO_AMOUNT
        const amountAToProvide = 1000000; // Any amount > 0
        const addedAExpected = 0;  // Won't be used due to error
        const addedBExpected = 0;  // Won't be used due to error  
        const mintedLpExpected = 0; // Won't be used due to error

        provideLiquidity(
            amountAToProvide,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_INITIALIZED ===", () => {
        // STEP 1: Fresh test state (no liquidity provided)
        // Do NOT call setupInitialLiquidity() - we want reserves to be zero

        // STEP 2: Try to provide liquidity as unauthorized sender when not initialized
        const amountA = 1000000;
        const addedAExpected = 0;  // Won't be used due to error
        const addedBExpected = 0;  // Won't be used due to error
        const mintedLpExpected = 0; // Won't be used due to error

        provideLiquidity(
            amountA,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            wallet1, // Unauthorized sender when avail-a and res-a are zero
            disp
        );
    });
})