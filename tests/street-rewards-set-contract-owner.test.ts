import { describe, it } from 'vitest';
import { setContractOwner } from './functions/shared-set-helper-functions';
import { getContractOwner } from './functions/shared-read-only-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== STREET REWARDS SET CONTRACT OWNER TESTS ===', () => {
    it('=== STREET REWARDS SET CONTRACT OWNER PASS ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getContractOwner(deployer, 'street-rewards', deployer, disp);
        
        // STEP 2: Set contract owner to wallet1
        setContractOwner('street-rewards', wallet1, deployer, disp);
        getContractOwner(wallet1, 'street-rewards', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - STREET REWARDS ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getContractOwner(deployer, 'street-rewards', deployer, disp);
        
        // STEP 2: Attempt to set contract owner from unauthorized wallet
        setContractOwner('street-rewards', wallet1, wallet2, disp);
        
        // STEP 3: Verify owner hasn't changed
        getContractOwner(deployer, 'street-rewards', deployer, disp);
    });
});
