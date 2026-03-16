import { describe, it } from "vitest";
import { disp, TRANSFER_STREET_SMALL } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { transfer } from "./functions/transfer-helper-function";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== STREET TRANSFER TESTS ===", () => {
    it("=== STREET TRANSFER PASS ===", () => {
        // STEP 1: Setup exchange with multiple LP holders
        let { userData } = setupLiquidityUsers(disp);

        // Verify balances before transfer
        let wallet1Street = userData.wallet1.balances.street
        let wallet2Street = userData.wallet2.balances.street

        getBalance(wallet1Street, 'street-token', wallet1, deployer, disp);
        getBalance(wallet2Street, 'street-token', wallet2, deployer, disp);
        
        // STEP 2: Transfer STREET tokens from deployer to wallet1
        // Deployer should have STREET tokens from the setup process
        const transferAmount = TRANSFER_STREET_SMALL;

        transfer(
            transferAmount,
            'street-token',
            wallet1,
            wallet2,
            disp
        );

        // STEP 3: Verify balances after transfer
        wallet1Street = userData.wallet1.balances.street - transferAmount;
        wallet2Street = userData.wallet2.balances.street + transferAmount;
        
        getBalance(wallet1Street, 'street-token', wallet1, deployer, disp);
        getBalance(wallet2Street, 'street-token', wallet2, deployer, disp);
        
        // Update in-memory model to reflect the transfer
        userData.wallet1.balances.street = wallet1Street;
        userData.wallet2.balances.street = wallet2Street;
    });
});
