import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function emissionMint(
  amount: number,
  recipient: string,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== emissionMint ===`);
    console.log(`Amount: ${amount}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    'street-token',
    "mint",
    [
      Cl.uint(amount),
      Cl.principal(recipient)
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
        case 984:
          errorMsg = 'ERR_NOT_AUTHORIZED';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Emission mint failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Emission mint successful: ${amount} to ${recipient}`);
  }
  
  return true;
}

export function streetMint(
  amount: number,
  recipient: string,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== streetMint ===`);
    console.log(`Amount: ${amount}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    'street-token',
    "mint",
    [
      Cl.uint(amount),
      Cl.principal(recipient)
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
        case 984:
          errorMsg = 'ERR_NOT_AUTHORIZED';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Street mint failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Street mint successful: ${amount} to ${recipient}`);
  }
  
  return true;
}

export function setTokenUri(
  uri: string,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== setTokenUri ===`);
    console.log(`URI: ${uri}`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    "street-token",
    "set-token-uri",
    [Cl.stringUtf8(uri)],
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
        case 982:
          errorMsg = 'ERR_NOT_CONTRACT_OWNER';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Set token URI failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Token URI set to: ${uri}`);
  }
  
  return true;
}

export function transfer(
  amount: number,
  sender: string,
  recipient: string,
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
    "street-token",
    "transfer",
    [
      Cl.uint(amount),
      Cl.principal(sender),
      Cl.principal(recipient),
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
        case 981:
          errorMsg = 'ERR_ZERO_AMOUNT';
          break;
        case 983:
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
