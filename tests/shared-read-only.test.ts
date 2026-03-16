import { describe, it } from "vitest";
import { disp, INITIAL_MINT_STREET, FEE, TAX, STREET_URI } from "./vitestconfig"
import { getBalance, getTotalSupply, getContractOwner, getDecimals, getName, getSymbol, getTokenUri } from "./functions/shared-read-only-helper-functions";
import { getBlocks, getMarketInfo } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== SHARED READ ONLY FUNCTION TESTS ===", () => {
    it("=== GET BALANCE PRINCIPAL ===", () => {
        getBalance(INITIAL_MINT_STREET, 'street-token', deployer, deployer, disp);
    });

    it('=== GET BLOCKS PASS ===', () => {
        getBlocks(deployer, disp);
    });

    it("=== GET MARKET INFO ===", () => {
        const availAExpected = 0;
        const availBExpected = 0;
        const feeExpected = FEE;
        const lockedAExpected = 0;
        const lockedBExpected = 0;
        const reserveAExpected = 0;
        const reserveBExpected = 0;
        const taxExpected = TAX;
        getMarketInfo(
            availAExpected,
            availBExpected,
            feeExpected,
            lockedAExpected,
            lockedBExpected,
            reserveAExpected,
            reserveBExpected,
            taxExpected,
            deployer,
            disp
        );
    })
});