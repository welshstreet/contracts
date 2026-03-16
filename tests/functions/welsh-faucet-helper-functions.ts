import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

// Public: request
export function requestFaucet(
	sender: any,
	disp: boolean = false
){
	const test = simnet.callPublicFn(
		"welsh-faucet",
		"request",
		[],
		sender
	);

	if (test.result.type === 'err') {
		const errorCode = Number((test.result as any).value.value);
		expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
		if (disp) {
			switch (errorCode) {
				case 991:
					console.log(`☑️ ERR_NOT_CONTRACT_OWNER`);
					break;
				case 992:
					console.log(`☑️ ERR_COOLDOWN`);
					break;
				default:
					console.log(`☑️ request failed with error: ${errorCode}`);
					break;
			}
		}
		return false;
	}

	expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
	if (disp && test.result.type === 'ok') {
		console.log(`✅ Faucet request successful`);
	}
	return true;
}

// Public: set-contract-owner
export function setFaucetContractOwner(
	newOwner: string,
	sender: any,
	disp: boolean = false
){
	const test = simnet.callPublicFn(
		"welsh-faucet",
		"set-contract-owner",
		[Cl.principal(newOwner)],
		sender
	);

	if (test.result.type === 'err') {
		const errorCode = Number((test.result as any).value.value);
		expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
		if (disp) {
			switch (errorCode) {
				case 991:
					console.log(`☑️ ERR_NOT_CONTRACT_OWNER`);
					break;
				default:
					console.log(`☑️ set-contract-owner failed with error: ${errorCode}`);
					break;
			}
		}
		return false;
	}

	expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
	if (disp && test.result.type === 'ok') {
		console.log(`✅ set-contract-owner successful: new owner ${newOwner}`);
	}
	return true;
}

// Public: set-cooldown
export function setFaucetCooldown(
	blocks: number,
	sender: any,
	disp: boolean = false
){
	const test = simnet.callPublicFn(
		"welsh-faucet",
		"set-cooldown",
		[Cl.uint(blocks)],
		sender
	);

	if (test.result.type === 'err') {
		const errorCode = Number((test.result as any).value.value);
		expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
		if (disp) {
			switch (errorCode) {
				case 991:
					console.log(`☑️ ERR_NOT_CONTRACT_OWNER`);
					break;
				default:
					console.log(`☑️ set-cooldown failed with error: ${errorCode}`);
					break;
			}
		}
		return 0;
	}

	const tuple = (test.result as any).value.value;
	const receivedCooldown = Number(tuple["cooldown"].value);
	expect(receivedCooldown).toEqual(blocks);

	if (disp && test.result.type === 'ok') {
		console.log(`✅ set-cooldown successful: cooldown = ${receivedCooldown}`);
	}
	return receivedCooldown;
}

// Read-only: get-balance
export function getFaucetBalance(
	balanceExpected: number,
	sender: any,
	disp: boolean = false
){
	const test = simnet.callReadOnlyFn(
		"welsh-faucet",
		"get-balance",
		[],
		sender
	);

	const received = Number((test.result as any).value.value);
	expect(received).toEqual(balanceExpected);

	if (disp) {
		console.log(`✅ getFaucetBalance: expected ${balanceExpected}, received ${received}`);
	}

	return received;
}

// Read-only: get-cooldown
export function getFaucetCooldown(
	cooldownExpected: number,
	sender: any,
	disp: boolean = false
){
	const test = simnet.callReadOnlyFn(
		"welsh-faucet",
		"get-cooldown",
		[],
		sender
	);

	const received = Number((test.result as any).value.value);
	expect(received).toEqual(cooldownExpected);

	if (disp) {
		console.log(`✅ getFaucetCooldown: expected ${cooldownExpected}, received ${received}`);
	}

	return received;
}

// helper to build principal arg for user-based read-only calls
function toPrincipalArg(who: string | { address: string; contractName?: string }) {
	if (typeof who === 'string') {
		return Cl.principal(who);
	}
	if (who.contractName) {
		return Cl.contractPrincipal(who.address, who.contractName);
	}
	return Cl.principal(who.address);
}

// Read-only: get-last-request
export function getLastRequest(
	blockExpected: number | null,
	user: string | { address: string; contractName?: string },
	sender: any,
	disp: boolean = false
){
	const test = simnet.callReadOnlyFn(
		"welsh-faucet",
		"get-last-request",
		[toPrincipalArg(user)],
		sender
	);

	const opt = (test.result as any).value;
	let received: number | null;
	if (opt.type === 'none') {
		received = null;
	} else {
		const tuple = opt.value.value;
		received = Number(tuple["block"].value);
	}

	if (blockExpected !== null) {
		expect(received).toEqual(blockExpected);
	}

	if (disp) {
		console.log(`✅ getLastRequest: expected ${blockExpected}, received ${received}`);
	}

	return received;
}

// Read-only: get-next-request
export function getNextRequest(
	blocksRemainingExpected: number | null,
	user: string | { address: string; contractName?: string },
	sender: any,
	disp: boolean = false
){
	const test = simnet.callReadOnlyFn(
		"welsh-faucet",
		"get-next-request",
		[toPrincipalArg(user)],
		sender
	);

	const received = Number((test.result as any).value.value);
	if (blocksRemainingExpected !== null) {
		expect(received).toEqual(blocksRemainingExpected);
	}

	if (disp) {
		console.log(`✅ getNextRequest: expected ${blocksRemainingExpected}, received ${received}`);
	}

	return received;
}

// Read-only: get-faucet-info
export function getFaucetInfo(
	blocksRemainingExpected: number | null,
	cooldownExpected: number | null,
	lastRequestExpected: number | null,
	user: string | { address: string; contractName?: string },
	sender: any,
	disp: boolean = false
){
	const test = simnet.callReadOnlyFn(
		"welsh-faucet",
		"get-faucet-info",
		[toPrincipalArg(user)],
		sender
	);

	const info = (test.result as any).value.value;
	const receivedBlocksRemaining = Number(info["blocks-remaining"].value);
	const receivedCooldown = Number(info["cooldown"].value);

	const lastReqOpt = info["last-request"];
	let receivedLastRequest: number | null;
	if (lastReqOpt.type === 'none') {
		receivedLastRequest = null;
	} else {
		receivedLastRequest = Number(lastReqOpt.value.value);
	}

	if (blocksRemainingExpected !== null) {
		expect(receivedBlocksRemaining).toEqual(blocksRemainingExpected);
	}
	if (cooldownExpected !== null) {
		expect(receivedCooldown).toEqual(cooldownExpected);
	}
	if (lastRequestExpected !== null) {
		expect(receivedLastRequest).toEqual(lastRequestExpected);
	}

	if (disp) {
		console.log(
			`✅ getFaucetInfo: blocks-remaining=${receivedBlocksRemaining}, cooldown=${receivedCooldown}, last-request=${receivedLastRequest}`
		);
	}

	return {
		blocksRemaining: receivedBlocksRemaining,
		cooldown: receivedCooldown,
		lastRequest: receivedLastRequest,
	};
}

