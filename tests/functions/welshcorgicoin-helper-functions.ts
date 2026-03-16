import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

function toPrincipalArg(who: string | { address: string; contractName?: string }) {
  if (typeof who === "string") {
    return Cl.principal(who);
  }
  if (who.contractName) {
    return Cl.contractPrincipal(who.address, who.contractName);
  }
  return Cl.principal(who.address);
}

export function transfer(
  amount: number,
  sender: string | { address: string; contractName?: string },
  recipient: string | { address: string; contractName?: string },
  caller: any,
  memo?: Uint8Array,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== transfer: ${amount} from ${sender} to ${recipient} ===`);
    console.log(`Caller: ${caller}`);
    if (memo) {
      console.log(`Memo: ${new TextDecoder().decode(memo)}`);
    }
  }
  
  const memoArg = memo ? Cl.some(Cl.bufferFromUtf8(new TextDecoder().decode(memo))) : Cl.none();
  
  const test = simnet.callPublicFn(
    "welshcorgicoin",
    "transfer",
    [
      Cl.uint(amount),
      toPrincipalArg(sender),
      toPrincipalArg(recipient),
      memoArg
    ],
    caller
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Check for errors
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    if (disp) {
      let errorMsg = '';
      switch(errorCode) {
        case 961:
          errorMsg = 'ERR_ZERO_AMOUNT';
          break;
        case 963:
          errorMsg = 'ERR_NOT_TOKEN_OWNER';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Transfer failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Transfer successful: ${amount} from ${sender} to ${recipient}`);
  }
  
  return true;
}
