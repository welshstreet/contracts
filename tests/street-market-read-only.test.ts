import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { getBlocks, getMarketInfo } from "./functions/street-market-helper-functions";
import { FEE, TAX } from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("===MARKETREAD ONLY FUNCTION TESTS ===", () => {
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