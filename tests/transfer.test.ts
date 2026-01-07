import { describe, it } from "vitest";
import { disp, TRANSFER_STREET } from "./vitestconfig";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { transfer } from "./functions/transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== TRANSFER TESTS ===", () => {
    it("=== CREDIT TRANSFER PASS ===", () => {
        // STEP 1: Setup initial liquidity to create LP tokens (CREDIT tokens)
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Transfer CREDIT tokens from deployer to wallet1
        // Deployer should have LP tokens from providing initial liquidity
        const transferAmount = Math.floor(setup.mintedLpExpected / 2); // Transfer half of LP tokens

        transfer(
            transferAmount,
            'credit',
            deployer,
            wallet1,
            disp
        );
    });

    it("=== STREET TRANSFER PASS ===", () => {
        // STEP 1: Setup initial liquidity (this mints STREET tokens to deployer)
        setupInitialLiquidity(disp);

        // STEP 2: Transfer STREET tokens from deployer to wallet1
        // Deployer should have STREET tokens from the setup process
        const transferAmount = TRANSFER_STREET;

        transfer(
            transferAmount,
            'street',
            deployer,
            wallet1,
            disp
        );
    });
});
