import { describe, it } from "vitest";
import { disp, FAUCET_SETUP } from "./vitestconfig";
import { requestFaucet, setFaucetCooldown, getFaucetInfo } from "./functions/welsh-faucet-helper-functions";
import { transfer as welshTransfer } from "./functions/welshcorgicoin-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== WELSH FAUCET COOLDOWN PASS TESTS ===", () => {
	it("=== SET COOLDOWN AND REQUEST RESPECTING COOLDOWN ===", () => {
        // Seed faucet with WELSH
        welshTransfer(FAUCET_SETUP, deployer, { address: deployer, contractName: "welsh-faucet" }, deployer);

		// Set faucet cooldown to a custom value (e.g., 5 blocks)
		const newCooldown = 5;
		setFaucetCooldown(newCooldown, deployer, disp);

		// First request from wallet1 should succeed
		requestFaucet(wallet1, disp);

        // Faucet-info should reflect updated cooldown
        const info = getFaucetInfo(null, newCooldown, null, wallet1, deployer, disp);
		if (disp) {
			console.log("Faucet info after setting cooldown and first request:", info);
		}
	});
});

