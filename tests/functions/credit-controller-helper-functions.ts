import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function transferCredit(
    amount: number,
    sender: string,
    recipient: string,
    caller: any,
    memo?: Uint8Array,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== transferCredit: ${amount} from ${sender} to ${recipient} ===`);
        console.log(`Caller: ${caller}`);
        if (memo) {
            console.log(`Memo: ${new TextDecoder().decode(memo)}`);
        }
    }
    
    const memoArg = memo ? Cl.some(Cl.bufferFromUtf8(new TextDecoder().decode(memo))) : Cl.none();
    
    const test = simnet.callPublicFn(
        "credit-controller",
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
                case 911:
                    errorMsg = 'ERR_ZERO_AMOUNT';
                    break;
                case 912:
                    errorMsg = 'ERR_NOT_CONTRACT_OWNER';
                    break;
                case 913:
                    errorMsg = 'ERR_NOT_TOKEN_OWNER';
                    break;
                case 914:
                    errorMsg = 'ERR_BALANCE';
                    break;
                default:
                    errorMsg = `Unknown error: ${errorCode}`;
            }
            console.log(`☑️ Transfer failed: ${errorMsg}`);
        }
        
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        return false;
    }
    
    // Success case - expect (ok { amount: amount })
    expect(test.result).toEqual(Cl.ok(Cl.tuple({
        'amount': Cl.uint(amount)
    })));
    
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Credit transfer successful: ${amount} from ${sender} to ${recipient}`);
    }
    
    return true;
}
