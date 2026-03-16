import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { getContractOwner } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CREDIT CONTROLLER READ ONLY TESTS ===", () => {
    it("=== GET CONTRACT OWNER ===", () => {
        // Deployer is set as contract owner at deployment
        getContractOwner(deployer, 'credit-controller', deployer, disp);
    });
});
