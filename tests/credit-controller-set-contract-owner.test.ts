import { describe, it } from 'vitest';
import { setContractOwner } from './functions/shared-set-helper-functions';
import { getContractOwner } from './functions/shared-read-only-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== CREDIT CONTROLLER SET CONTRACT OWNER TESTS ===', () => {
    it('=== CREDIT CONTROLLER SET CONTRACT OWNER PASS ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getContractOwner(deployer, 'credit-controller', deployer, disp);
        
        // STEP 2: Set contract owner to wallet1
        setContractOwner('credit-controller', wallet1, deployer, disp);
        getContractOwner(wallet1, 'credit-controller', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - CREDIT CONTROLLER ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getContractOwner(deployer, 'credit-controller', deployer, disp);
        
        // STEP 2: Attempt to set contract owner from unauthorized wallet
        setContractOwner('credit-controller', wallet1, wallet2, disp);
        
        // STEP 3: Verify owner hasn't changed
        getContractOwner(deployer, 'credit-controller', deployer, disp);
    });
});
