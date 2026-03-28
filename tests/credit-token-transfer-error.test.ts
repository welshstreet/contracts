import { describe, it, expect } from "vitest";
import { disp } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { transfer } from "./functions/transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== STREET TOKEN TRANSFER ERROR TESTS ===", () => {
    
    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup users with STREET tokens
        setupLiquidityUsers(disp);

        // STEP 2: Attempt to transfer zero amount - should fail with ERR_ZERO_AMOUNT
        const result = transfer(0, "street-token", wallet1, wallet2, disp);

        // Should return false (error occurred)
        expect(result).toBe(false);
        
        if (disp) {
            console.log("✓ ERR_ZERO_AMOUNT triggered: Cannot transfer zero STREET tokens");
        }
    });
    
    it("=== ERR_NOT_TOKEN_OWNER ===", () => {
        // STEP 1: Setup users with STREET tokens
        setupLiquidityUsers(disp);

        // STEP 2: wallet2 attempts to transfer wallet1's STREET tokens
        // This should fail because tx-sender (wallet2) != sender (wallet1)
        const result = transfer(
            1000000,
            "street-token",
            wallet1,      // Sender is wallet1
            deployer,     // Recipient
            disp,
            wallet2       // But tx-sender is wallet2 (not authorized)
        );

        // Should return false (error occurred - ERR_NOT_TOKEN_OWNER
        expect(result).toBe(false);
        
        if (disp) {
            console.log("✓ ERR_NOT_TOKEN_OWNER triggered: Cannot transfer someone else's STREET tokens");
        }
    });
});
