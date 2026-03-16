import { describe, it } from "vitest";
import { streetMint } from "./functions/street-token-helper-functions";
import { disp, MINT_STREET_AMOUNT } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== STREET MINT TESTS ===", () => {
    it("=== STREET MINT AUTH 1 ===", () => {
        streetMint(MINT_STREET_AMOUNT, deployer, deployer, disp);
    });
    it("=== STREET MINT AUTH 2 ===", () => {
        streetMint(MINT_STREET_AMOUNT, wallet1, deployer, disp);
    });
    it("=== STREET MINT AUTH 3 ===", () => {
        streetMint(MINT_STREET_AMOUNT, deployer, wallet1, disp);
    });
})