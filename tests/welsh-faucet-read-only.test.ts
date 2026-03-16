import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { getFaucetBalance, getFaucetCooldown, getLastRequest, getNextRequest, getFaucetInfo } from "./functions/welsh-faucet-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== WELSH FAUCET READ ONLY TESTS ===", () => {
	it("=== GET FAUCET BALANCE AND COOLDOWN ===", () => {
		// Initial faucet token balance for deployer.welsh-faucet should be 0 in simnet
		getFaucetBalance(0, deployer, disp);

		// Default cooldown is 10 blocks
		getFaucetCooldown(10, deployer, disp);
	});

	it("=== GET LAST AND NEXT REQUEST (NO PRIOR REQUEST) ===", () => {
		// With no prior request, last-request should be none and next-request 0
		getLastRequest(null, wallet1, deployer, disp);
		getNextRequest(0, wallet1, deployer, disp);

		// Faucet info should show blocks-remaining 0 and last-request none
		getFaucetInfo(0, 10, null, wallet1, deployer, disp);
	});
});

