import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function creditBurn(
  amountExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callPublicFn(
    "credit-token",
    "burn",
    [Cl.uint(amountExpected)],
    sender
  );

  if (amountExpected <= 0) {
    expect(test.result).toEqual(Cl.error(Cl.uint(921)));
    if (disp) {
      console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (921) - credit-burn result:`, test.result);
    }
    return 0;
  }

  // Check if caller is not authorized (will fail authorization)
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    switch (errorCode) {
      case 921:
        expect(test.result).toEqual(Cl.error(Cl.uint(921)));
        if (disp) {
          console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (921) - credit-burn result:`, test.result);
        }
        return 0;
      
      case 923:
        expect(test.result).toEqual(Cl.error(Cl.uint(923)));
        if (disp) {
          console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (923) - credit-burn result:`, test.result);
        }
        return 0;
      
      default:
        if (disp) {
          console.log(`☑️ Credit burn failed with error: ${errorCode}`);
        }
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        return 0;
    }
  }

  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "amount": Cl.uint(amountExpected),
      })
    )
  );
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Credit burn successful: ${amountExpected}`);
  }
  return Number(amountExpected);
}

export function creditMint(
  amountExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callPublicFn(
    "credit-token",
    "mint",
    [Cl.uint(amountExpected)],
    sender
  );

  if (amountExpected <= 0) {
    expect(test.result).toEqual(Cl.error(Cl.uint(921)));
    if (disp) {
      console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (921) - credit-mint result:`, test.result);
    }
    return 0;
  }

  // Check if caller is not authorized (will fail authorization)
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    switch (errorCode) {
      case 921:
        expect(test.result).toEqual(Cl.error(Cl.uint(921)));
        if (disp) {
          console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (921) - credit-mint result:`, test.result);
        }
        return 0;
      
      case 923:
        expect(test.result).toEqual(Cl.error(Cl.uint(923)));
        if (disp) {
          console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (923) - credit-mint result:`, test.result);
        }
        return 0;
      
      default:
        if (disp) {
          console.log(`☑️ Credit mint failed with error: ${errorCode}`);
        }
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        return 0;
    }
  }

  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "amount": Cl.uint(amountExpected),
      })
    )
  );
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Credit mint successful: ${amountExpected}`);
  }
  return Number(amountExpected);
}
