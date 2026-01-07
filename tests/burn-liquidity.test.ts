import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { disp, MINT_AMOUNT, TOTAL_SUPPLY_WELSH } from "./vitestconfig"
import { getExchangeInfo, burnLiquidity } from "./functions/exchange-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== BURN LIQUIDITY TESTS ===", () => {
    it("=== BURN LIQUIDITY PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Get balances before burn
        let expectedWelshBalance = TOTAL_SUPPLY_WELSH - setup.amountA;
        let expectedStreetBalance = MINT_AMOUNT - setup.amountB;
        let expectedLpBalance = setup.mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 3: Check LP total supply before burn
        getTotalSupply(setup.mintedLpExpected, "credit", deployer, disp);

        // STEP 4: Deployer Burns all their liquidity
        const amountLpToBurn = setup.mintedLpExpected;
        const burnedLpExpected = setup.mintedLpExpected;
        burnLiquidity(amountLpToBurn, burnedLpExpected, deployer, disp);

        // STEP 5: Get balances after burn
        expectedLpBalance = 0
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 6: Check LP total supply before burn
        getTotalSupply(expectedLpBalance, "credit", deployer, disp);

        // STEP 7: Confirm exchange state after burn - nothing changes since liquidity burn does not change exchange info.
        getExchangeInfo(
            setup.availAExpected,
            setup.availBExpected,
            100,
            0,
            0,
            setup.reserveAExpected,
            setup.reserveBExpected,
            100,
            100,
            deployer,
            disp
        );
    });
    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Get balances before burn
        let expectedWelshBalance = TOTAL_SUPPLY_WELSH - setup.amountA;
        let expectedStreetBalance = MINT_AMOUNT - setup.amountB;
        let expectedLpBalance = setup.mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 3: Check LP total supply before burn
        getTotalSupply(setup.mintedLpExpected, "credit", deployer, disp);

        // STEP 4: Deployer Burns all their liquidity
        const amountLpToBurn = 0;
        const burnedLpExpected = 0;
        burnLiquidity(amountLpToBurn, burnedLpExpected, deployer, disp);

        // STEP 5: Get balances after burn
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 6: Check LP total supply before burn
        getTotalSupply(expectedLpBalance, "credit", deployer, disp);
    });
});