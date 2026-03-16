import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function burnLiquidity(
    amountLp: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "burn-liquidity",
        [Cl.uint(amountLp)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 951:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                default:
                    console.log(`☑️ Burn liquidity failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-lp": Cl.uint(amountLp),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Burn liquidity successful: ${amountLp} LP burned`);
        const resultValue = (test.result as any).value;
        console.log("burn-liquidity result:", JSON.stringify(resultValue, null, 2));
    }

    return amountLp;
}

export function lockLiquidity(
    amountA: number,
    lockedBExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "lock-liquidity",
        [Cl.uint(amountA)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 951:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                case 953:
                    console.log(`☑️ ERR_NOT_INITIALIZED`);
                    break;
                default:
                    console.log(`☑️ Lock liquidity failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-a": Cl.uint(amountA),
                "amount-b": Cl.uint(lockedBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Lock liquidity successful: ${amountA} WELSH locked`);
        console.log("lock-liquidity result:");

        const resultValue = (test.result as any).value.value;
        console.log(`  amount-a: ${Number(resultValue['amount-a'].value)}`);
        console.log(`  amount-b: ${Number(resultValue['amount-b'].value)}`);
    }

    return {lockedAExpected: amountA, lockedBExpected};
}

export function initialLiquidity(
    amountA: number,
    amountB: number,
    mintedLpExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "initial-liquidity",
        [Cl.uint(amountA), Cl.uint(amountB)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 951:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                case 952:
                    console.log(`☑️ ERR_NOT_CONTRACT_OWNER`);
                    break;
                case 954:
                    console.log(`☑️ ERR_INITIALIZED`);
                    break;
                default:
                    console.log(`☑️ initial liquidity failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-a": Cl.uint(amountA),
                "amount-b": Cl.uint(amountB),
                "amount-lp": Cl.uint(BigInt(mintedLpExpected)),
            })
        )
    );
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Provide initial liquidity successful: ${amountA} WELSH + ${amountB} STREET → ${mintedLpExpected} LP`);
        const resultValue = (test.result as any).value;
        console.log("initial-liquidity result:", resultValue);
    }
    return mintedLpExpected;
}

export function provideLiquidity(
    amountA: number,           // Contract input
    amountBExpected: number,    // Expected return value
    mintedLpExpected: number,  // Expected return value
    sender: any,               // Transaction sender
    disp: boolean = false      // Optional with default false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "provide-liquidity",
        [Cl.uint(amountA)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 951:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                case 953:
                    console.log(`☑️ ERR_NOT_INITIALIZED`);
                    break;
                default:
                    console.log(`☑️ Provide liquidity failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-a": Cl.uint(amountA),
                "amount-b": Cl.uint(amountBExpected),
                "amount-lp": Cl.uint(mintedLpExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Provide liquidity successful: ${amountA} WELSH + ${amountBExpected} STREET → ${mintedLpExpected} LP`);
        console.log("provide-liquidity result:");

        const resultValue = (test.result as any).value.value;
        console.log(`  amount-a: ${Number(resultValue['amount-a'].value)}`);
        console.log(`  amount-b: ${Number(resultValue['amount-b'].value)}`);
        console.log(`  amount-lp: ${Number(resultValue['amount-lp'].value)}`);
    }

    return mintedLpExpected;
}

export function removeLiquidity(
    amountLp: number,
    taxAExpected: number,
    taxBExpected: number,
    userAExpected: number,
    userBExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "remove-liquidity",
        [Cl.uint(amountLp)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 951:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                case 953:
                    console.log(`☑️ ERR_NOT_INITIALIZED`);
                    break;
                default:
                    console.log(`☑️ Remove liquidity failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-a": Cl.uint(userAExpected),
                "amount-b": Cl.uint(userBExpected),
                "amount-lp": Cl.uint(amountLp),
                "tax-a": Cl.uint(taxAExpected),
                "tax-b": Cl.uint(taxBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Remove liquidity successful: ${amountLp} LP → ${userAExpected} WELSH + ${userBExpected} STREET (tax: ${taxAExpected} WELSH + ${taxBExpected} STREET)`);
        const result = (test.result as any).value.value;
        console.log(`remove-liquidity result:`);
        console.log(`  amount-a: ${result['amount-a'].value}`);
        console.log(`  amount-b: ${result['amount-b'].value}`);
        console.log(`  amount-lp: ${result['amount-lp'].value}`);
        console.log(`  tax-a: ${result['tax-a'].value}`);
        console.log(`  tax-b: ${result['tax-b'].value}`);
    }

    return amountLp;
}

export function swapAB(
    amountA: number,              // Input: Welsh amount (always A)
    amountBExpected: number,      // Expected Street amount returned (output amount - net after fees)
    feeAExpected: number,
    resAExpected: number,
    resANewExpected: number,
    resBExpected: number,
    resBNewExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "swap-a-b",
        [Cl.uint(amountA)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 941:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                case 943:
                    console.log(`☑️ ERR_NOT_INITIALIZED`);
                    break;
                case 945:
                    console.log(`☑️ ERR_INVALID_AMOUNT`);
                    break;
                default:
                    console.log(`☑️ Swap A-B failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-a": Cl.uint(amountA),     // Welsh amount (input)
                "amount-b": Cl.uint(amountBExpected),     // Street amount (output - net)
                "fee-a": Cl.uint(feeAExpected),
                "res-a": Cl.uint(resAExpected),
                "res-a-new": Cl.uint(resANewExpected),
                "res-b": Cl.uint(resBExpected),
                "res-b-new": Cl.uint(resBNewExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Swap A-B successful: ${amountA} WELSH → ${amountBExpected} STREET`);
        console.log(`  Fee A: ${feeAExpected}`);
        console.log(`  Reserves: A ${resAExpected} → ${resANewExpected}, B ${resBExpected} → ${resBNewExpected}`);
    }

    return amountBExpected; // Return net Street amount received
}

export function swapBA(
    amountB: number,              // Input: Street amount (always B)
    amountAExpected: number,      // Expected Welsh amount returned (output amount - net after fees)
    feeBExpected: number,
    resAExpected: number,
    resANewExpected: number,
    resBExpected: number,
    resBNewExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "street-market",
        "swap-b-a",
        [Cl.uint(amountB)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            switch (errorCode) {
                case 941:
                    console.log(`☑️ ERR_ZERO_AMOUNT`);
                    break;
                case 943:
                    console.log(`☑️ ERR_NOT_INITIALIZED`);
                    break;
                case 945:
                    console.log(`☑️ ERR_INVALID_AMOUNT`);
                    break;
                default:
                    console.log(`☑️ Swap B-A failed with error: ${errorCode}`);
                    break;
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-a": Cl.uint(amountAExpected),     // Welsh amount (output - net)
                "amount-b": Cl.uint(amountB),     // Street amount (input)
                "fee-b": Cl.uint(feeBExpected),
                "res-a": Cl.uint(resAExpected),
                "res-a-new": Cl.uint(resANewExpected),
                "res-b": Cl.uint(resBExpected),
                "res-b-new": Cl.uint(resBNewExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Swap B-A successful: ${amountB} STREET → ${amountAExpected} WELSH`);
        console.log(`  Fee B: ${feeBExpected}`);
        console.log(`  Reserves: A ${resAExpected} → ${resANewExpected}, B ${resBExpected} → ${resBNewExpected}`);
    }
    return amountAExpected; // Return net Welsh amount received
}

export function getBlocks(
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "street-market",
        "get-blocks",
        [],
        sender
    );
    expect(test.result.type).toEqual('ok');
    const result = (test.result as any).value.value;
    const stacksBlock = Number(result['stacks-block'].value);
    const bitcoinBlock = Number(result['bitcoin-block'].value);

    if (disp) {
        console.log(`✅ getBlocks Pass: Stacks Block ${stacksBlock}, Bitcoin Block ${bitcoinBlock}`);
    }

    return {
        stacksBlock,
        bitcoinBlock
    };
}

export function getMarketInfo(
    availAExpected: number,
    availBExpected: number,
    feeExpected: number,
    lockedAExpected: number,
    lockedBExpected: number,
    reserveAExpected: number,
    reserveBExpected: number,
    taxExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "street-market",
        "get-market-info",
        [],
        sender
    );
    const info = (test.result as any).value.value;
    const receivedAvailA = Number(info['avail-a'].value);
    const receivedAvailB = Number(info['avail-b'].value);
    const receivedFee = Number(info['fee'].value);
    const receivedLockedA = Number(info['locked-a'].value);
    const receivedLockedB = Number(info['locked-b'].value);
    const receivedReserveA = Number(info['reserve-a'].value);
    const receivedReserveB = Number(info['reserve-b'].value);
    const receivedTax = Number(info['tax'].value);

    // Validate all expected values
    expect(receivedAvailA).toEqual(availAExpected);
    expect(receivedAvailB).toEqual(availBExpected);
    expect(receivedFee).toEqual(feeExpected);
    expect(receivedLockedA).toEqual(lockedAExpected);
    expect(receivedLockedB).toEqual(lockedBExpected);
    expect(receivedReserveA).toEqual(reserveAExpected);
    expect(receivedReserveB).toEqual(reserveBExpected);
    expect(receivedTax).toEqual(taxExpected);

    const allMatch = (
        receivedAvailA === availAExpected &&
        receivedAvailB === availBExpected &&
        receivedFee === feeExpected &&
        receivedLockedA === lockedAExpected &&
        receivedLockedB === lockedBExpected &&
        receivedReserveA === reserveAExpected &&
        receivedReserveB === reserveBExpected &&
        receivedTax === taxExpected
    );

    if (disp) {
        if (allMatch) {
            console.log(`✅ getMarketInfo Pass: All values match`);
        } else {
            console.log(`☑️ getMarketInfo Fail: Values mismatch`);
        }
        // Display all values line-by-line for clarity
        console.log(`MarketInfo:`);
        console.log(`  avail-a: ${receivedAvailA}`);
        console.log(`  avail-b: ${receivedAvailB}`);
        console.log(`  fee: ${receivedFee}`);
        console.log(`  locked-a: ${receivedLockedA}`);
        console.log(`  locked-b: ${receivedLockedB}`);
        console.log(`  reserve-a: ${receivedReserveA}`);
        console.log(`  reserve-b: ${receivedReserveB}`);
        console.log(`  tax: ${receivedTax}`);
    }

    return {
        availA: receivedAvailA,
        availB: receivedAvailB,
        fee: receivedFee,
        lockedA: receivedLockedA,
        lockedB: receivedLockedB,
        reserveA: receivedReserveA,
        reserveB: receivedReserveB,
        tax: receivedTax
    };
}