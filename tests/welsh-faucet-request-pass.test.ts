import { describe, it } from "vitest";
import { disp, FAUCET_SETUP, FAUCET_REQUEST } from "./vitestconfig";
import { requestFaucet, getFaucetBalance, getLastRequest, getFaucetInfo } from "./functions/welsh-faucet-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transfer as welshTransfer } from "./functions/welshcorgicoin-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== WELSH FAUCET REQUEST PASS TESTS ===", () => {
	it("=== FAUCET REQUEST - FIRST TIME (NO COOLDOWN) ===", () => {
		// Seed faucet with WELSH so it can serve requests
		welshTransfer(FAUCET_SETUP, deployer, { address: deployer, contractName: "welsh-faucet" }, deployer);

		// Faucet WELSH balance should now equal FAUCET_SETUP
		getFaucetBalance(FAUCET_SETUP, deployer, disp);

		// Wallet1 initial WELSH balance should be 0
		getBalance(0, "welshcorgicoin", wallet1, deployer, disp);

		// Call faucet request from wallet1
		requestFaucet(wallet1, disp);

		getBalance(FAUCET_REQUEST, "welshcorgicoin", wallet1, deployer, disp);

		// Faucet balance should have decreased by FAUCET_REQUEST
		getFaucetBalance(FAUCET_SETUP - FAUCET_REQUEST, deployer, disp);

		// We don't know exact block number for last-request; just read it
		const lastBlock = getLastRequest(null, wallet1, deployer, disp);

		// Verify cooldown is still the default (10) and last-request is set
		const info = getFaucetInfo(null, 10, lastBlock, wallet1, deployer, disp);
		if (disp) {
			console.log("Faucet info after first request:", info);
		}
	});
});

