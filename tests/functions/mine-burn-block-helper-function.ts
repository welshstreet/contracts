import { expect } from "vitest";

export function mineBurnBlock(
  blockExpected: number,
  disp: boolean = false
  ){
  const test = simnet.mineEmptyBurnBlock();

  if (test === blockExpected) {
    expect(test).toEqual(blockExpected);
    if (disp) {
      console.log(`Mine burn block successful: Expected ${blockExpected}, Received ${test}`);
    }
  } else {
    expect(test).not.toEqual(blockExpected);
    if (disp) {
      console.error(`Mine burn block failed: Expected ${blockExpected}, Received ${test}`);
    }
  }
  return test;
}