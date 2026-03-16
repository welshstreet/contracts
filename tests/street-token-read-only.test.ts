import { describe, it } from "vitest";
import { disp, INITIAL_MINT_STREET, FEE, TAX, STREET_URI } from "./vitestconfig"
import { getBalance, getTotalSupply, getContractOwner, getDecimals, getName, getSymbol, getTokenUri } from "./functions/shared-read-only-helper-functions";
import { getBlocks, getMarketInfo } from "./functions/street-market-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== STREET TOKEN READ ONLY FUNCTION TESTS ===", () => {
    it("=== GET TOTAL SUPPLY ===", () => {
        getTotalSupply(INITIAL_MINT_STREET, 'street-token', deployer, disp);
    });

    it("=== GET CONTRACT OWNER ===", () => {
        const contractOwnerExpected = deployer;
        getContractOwner(contractOwnerExpected, 'street-token', deployer, disp);
    });

    it("=== GET DECIMALS ===", () => {
        const decimalsExpected = 6;
        getDecimals(decimalsExpected, 'street-token', deployer, disp);
    });

    it("=== GET NAME ===", () => {
        const nameExpected = "Welsh Street Token";
        getName(nameExpected, 'street-token', deployer, disp);
    });

    it("=== GET SYMBOL ===", () => {
        const symbolExpected = "STREET";
        getSymbol(symbolExpected, 'street-token', deployer, disp);
    });

    it("=== GET NAME ===", () => {
        const nameExpected = "Welsh Street Token";
        getName(nameExpected, 'street-token', deployer, disp);
    });

    it("=== GET SYMBOL ===", () => {
        const symbolExpected = "STREET";
        getSymbol(symbolExpected, 'street-token', deployer, disp);
    });

    it("=== GET TOKEN URI ===", () => {
        const tokenUriExpected = STREET_URI;
        getTokenUri(tokenUriExpected, 'street-token', deployer, disp);
    });
});