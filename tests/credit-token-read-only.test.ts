import { describe, it } from "vitest";
import { disp } from "./vitestconfig"
import { getBalance, getTotalSupply, getContractOwner, getDecimals, getName, getSymbol, getTokenUri } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CREDIT TOKEN READ ONLY FUNCTION TESTS ===", () => {
    it("=== GET BALANCE ===", () => {
        const balanceExpected = 0;
        getBalance(balanceExpected, 'credit-token', deployer, deployer, disp);
    });

    it("=== GET TOTAL SUPPLY ===", () => {
        const totalSupplyExpected = 0;
        getTotalSupply(totalSupplyExpected, 'credit-token', deployer, disp);
    });

    it("=== GET CONTRACT OWNER ===", () => {
        const contractOwnerExpected = deployer;
        getContractOwner(contractOwnerExpected, 'credit-token', deployer, disp);
    });

    it("=== GET DECIMALS ===", () => {
        const decimalsExpected = 6;
        getDecimals(decimalsExpected, 'credit-token', deployer, disp);
    });

    it("=== GET NAME ===", () => {
        const nameExpected = "Welsh Street Credit";
        getName(nameExpected, 'credit-token', deployer, disp);
    });

    it("=== GET SYMBOL ===", () => {
        const symbolExpected = "CREDIT";
        getSymbol(symbolExpected, 'credit-token', deployer, disp);
    });

    it("=== GET TOKEN URI ===", () => {
        const tokenUriExpected = "https://ipfs.io/ipfs/bafybeiexeg4tyoslafsnfpnob2kihdtl2lnhz4fupldtbtpp3y534ebkty/credit.json";
        getTokenUri(tokenUriExpected, 'credit-token', deployer, disp);
    });
});