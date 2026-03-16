import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { disp } from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== STREET NFT MINT AUTH TESTS ===", () => {
    it("=== STREET NFT MINT - UNAUTHORIZED DIRECT CALL FAIL ===", () => {
        // STEP 1: Attempt to mint NFT directly (should fail)
        // Only street-controller contract can mint NFTs
        const tokenId = 1;
        
        const test = simnet.callPublicFn(
            'street-nft',
            "mint",
            [
                Cl.uint(tokenId),
                Cl.principal(deployer)
            ],
            deployer
        );
        
        // Should fail with ERR_NOT_AUTHORIZED (962)
        expect(test.result).toEqual(Cl.error(Cl.uint(962)));
        
        if (disp) {
            console.log(`☑️ NFT mint correctly rejected - Only street-controller can mint`);
        }
    });
});
