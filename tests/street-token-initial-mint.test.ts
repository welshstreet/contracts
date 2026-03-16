import { describe, it } from "vitest";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { disp, INITIAL_MINT_STREET } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== STREET TOKEN INITIAL MINT TESTS ===", () => {
    it("=== STREET TOKEN INITIAL MINT PASS ===", () => {
        getBalance(INITIAL_MINT_STREET, 'street-token', deployer, deployer, disp);
    });

    it("=== VERIFY TOTAL SUPPLY ===", () => {
        getTotalSupply(INITIAL_MINT_STREET, 'street-token', deployer, disp);
    });
})