import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

/**
 * Generic setContractOwner helper function
 * Works with any contract that has a set-contract-owner function
 * 
 * @param contract - Contract name (e.g., "credit-token", "street-market")
 * @param newOwner - Principal address of the new owner
 * @param caller - Transaction sender
 * @param disp - Display console logs
 * @returns boolean - true if successful, false if error
 */
export function setContractOwner(
  contract: string,
  newOwner: string,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== setContractOwner ===`);
    console.log(`Contract: ${contract}`);
    console.log(`New owner: ${newOwner}`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    contract,
    "set-contract-owner",
    [Cl.principal(newOwner)],
    caller
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    if (disp) {
      console.log(`☑️ Set contract owner failed: ERR_NOT_CONTRACT_OWNER (${errorCode})`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Contract owner set to: ${newOwner}`);
  }
  
  return true;
}
