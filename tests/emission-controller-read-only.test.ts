import { describe, it } from "vitest";
import { disp } from "./vitestconfig"
import { getCurrentEpoch, getLastBurnBlock} from "./functions/emission-controller-helper-functions";

describe("=== EMISSION CONTROLLER READ ONLY TESTS ===", () => {
    it("=== GET CURRENT EPOCH ===", () => {
        const epochExpected = 0;
        getCurrentEpoch(epochExpected, disp);
    });

    it("=== GET LAST MINT BLOCK ===", () => {
        const blockExpected = 0;
        getLastBurnBlock(blockExpected, disp);
    });
});