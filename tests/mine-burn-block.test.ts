import { describe, it } from "vitest";
import { disp,  } from "./vitestconfig";
import { mineBurnBlock } from "./functions/mine-burn-block-helper-function";

describe("=== MINE BURN BLOCK TESTS ===", () => {
    it("=== MINE BURN BLOCK PASS ===", () => {
        const blockExpected = 4;
        mineBurnBlock(blockExpected, disp);
    });

    it("=== MINE BURN BLOCK FAIL ===", () => {
        const blockExpected = 3;
        mineBurnBlock(blockExpected, disp);
    });
});
