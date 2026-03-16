import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function emissionMint(
  amountExpected: number,
  blockExpected: number,
  epochExpected: number,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== emissionMint ===`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    'emission-controller',
    "mint",
    [],
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
        case 931:
          errorMsg = 'ERR_EMISSION_INTERVAL';
          break;
        case 932:
          errorMsg = 'ERR_NOT_CONTRACT_OWNER';
          break;
        case 933:
          errorMsg = 'ERR_NOT_ELIGIBLE';
          break;
        case 934:
          errorMsg = 'ERR_NO_LIQUIDITY';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Emission mint failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok { amount: uint, block: uint, epoch: uint })
  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "amount": Cl.uint(amountExpected),
        "block": Cl.uint(blockExpected),
        "epoch": Cl.uint(epochExpected),
      })
    )
  );
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Emission mint successful: Block ${blockExpected}, Epoch ${epochExpected}`);
    console.log(`   Amount: ${amountExpected}`);
    const resultTuple = (test.result as any).value;
    console.log("emission-mint result:", resultTuple);
  }
  
  return { amount: amountExpected, block: blockExpected, epoch: epochExpected };
}


export function getCurrentEpoch(
  expectedEpoch: number,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getCurrentEpoch ===`);
  }
  
  const test = simnet.callReadOnlyFn(
    'emission-controller',
    "get-current-epoch",
    [],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }

  // Success case - expect (ok uint) and compare with expectedEpoch
  expect(test.result.type).toEqual('ok');

  const epoch = Number((test.result as any).value.value);

  expect(epoch).toEqual(expectedEpoch);

  if (disp) {
    console.log(`✅ Current epoch: ${epoch} (matches expected: ${expectedEpoch})`);
  }

  return epoch;
}

export function getLastBurnBlock(
  expectedLastBurnBlock: number,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getLastBurnBlock( ===`);
  }
  
  const test = simnet.callReadOnlyFn(
    'emission-controller',
    "get-last-burn-block",
    [],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }

  // Success case - expect (ok uint) and compare with expectedLastBurnBlock
  expect(test.result.type).toEqual('ok');

  const block = Number((test.result as any).value.value);

  expect(block).toEqual(expectedLastBurnBlock);

  if (disp) {
    console.log(`✅ Last mint block: ${block} (matches expected: ${expectedLastBurnBlock})`);
  }

  return block;
}

export function getLastWinner(
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getLastWinner ===`);
  }
  
  const test = simnet.callReadOnlyFn(
    'emission-controller',
    "get-last-winner",
    [],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Success case - expect (ok (optional principal))
  expect(test.result.type).toEqual('ok');
  
  const winner = (test.result as any).value;
  
  if (winner.type === 'none') {
    if (disp) {
      console.log(`✅ Last winner: none`);
    }
    return null;
  }
  
  const winnerPrincipal = winner.value.value;
  
  if (disp) {
    console.log(`✅ Last winner: ${winnerPrincipal}`);
  }
  
  return winnerPrincipal;
}