import { describe, it } from 'vitest';
import { setContractOwner } from './functions/shared-set-helper-functions';
import { getContractOwner } from './functions/shared-read-only-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== CREDIT TOKEN SET CONTRACT OWNER TESTS ===', () => {
    it('=== CREDIT TOKEN SET CONTRACT OWNER PASS ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getContractOwner(deployer, 'credit-token', deployer, disp);
        
        // STEP 2: Set contract owner to wallet1
        setContractOwner('credit-token', wallet1, deployer, disp);
        getContractOwner(wallet1, 'credit-token', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - CREDIT TOKEN ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getContractOwner(deployer, 'credit-token', deployer, disp);
        
        // STEP 2: Attempt to set contract owner from unauthorized wallet
        setContractOwner('credit-token', wallet1, wallet2, disp);
        
        // STEP 3: Verify owner hasn't changed
        getContractOwner(deployer, 'credit-token', deployer, disp);
    });
});
