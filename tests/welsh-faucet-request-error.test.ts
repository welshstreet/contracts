import { describe, it } from "vitest";
import { disp, FAUCET_SETUP } from "./vitestconfig";
import { requestFaucet, setFaucetCooldown } from "./functions/welsh-faucet-helper-functions";
import { transfer as welshTransfer } from "./functions/welshcorgicoin-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== WELSH FAUCET REQUEST ERROR TESTS ===", () => {
	it("=== FAUCET REQUEST FAILS DUE TO COOLDOWN ===", () => {
        // Seed faucet with WELSH so failures are due to cooldown, not balance
        welshTransfer(FAUCET_SETUP, deployer, { address: deployer, contractName: "welsh-faucet" }, deployer);

		// Ensure a known cooldown value
		const cooldown = 3;
		setFaucetCooldown(cooldown, deployer, disp);

		// First request from wallet1 should pass
		requestFaucet(wallet1, disp);

        // Second request should now fail with ERR_COOLDOWN; helper will assert error
        requestFaucet(wallet1, disp);
	});
});

