import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { disp, DONATE_STREET, DONATE_WELSH } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { transfer } from "./functions/transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CLEANUP REWARDS ERROR TESTS ===", () => {
    
    it("=== ERR_CLEANUP_INTERVAL ===", () => {
        // STEP 1: Setup liquidity and user state
        setupLiquidityUsers(disp);

        // STEP 2: Deployer transfers rewards to rewards contract
        transfer(DONATE_WELSH, 'welshcorgicoin', deployer, {address: deployer, contractName: 'street-rewards' }, disp);
        transfer(DONATE_STREET, 'street-token', deployer, {address: deployer, contractName: 'street-rewards' }, disp);

        // STEP 3: Try to cleanup rewards immediately without waiting CLEANUP_INTERVAL (144 blocks)
        // This should fail with ERR_CLEANUP_INTERVAL
        const result = simnet.callPublicFn(
            "street-rewards",
            "cleanup-rewards",
            [],
            deployer
        );

        // Should fail with ERR_CLEANUP_INTERVAL
        expect(result.result).toBeErr(Cl.uint(975));
        
        if (disp) {
            console.log("✓ ERR_CLEANUP_INTERVAL triggered: Cannot cleanup before 144 blocks have passed");
        }
    });
});
