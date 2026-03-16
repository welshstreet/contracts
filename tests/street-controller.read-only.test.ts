import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { getMintCount } from "./functions/street-controller-helper-functions";
import { getContractOwner } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== STREET CONTROLLER READ ONLY TESTS ===", () => {
    it("=== GET CONTRACT OWNER ===", () => {
        const contractOwnerExpected = deployer;
        getContractOwner(contractOwnerExpected, 'street-controller', deployer, disp);
    });

    it("=== GET STREET MINTED ===", () => {
        getMintCount(disp);
    });
});
