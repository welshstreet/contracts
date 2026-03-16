import { describe, it } from 'vitest';
import { setTokenUri } from './functions/set-token-uri-helper-functions';
import { getTokenUri } from './functions/shared-read-only-helper-functions';
import { disp, CREDIT_URI } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('=== CREDIT TOKEN SET TOKEN URI TESTS ===', () => {
    it('=== CREDIT SET TOKEN URI PASS ===', () => {
        const initialCreditUri = CREDIT_URI;
        getTokenUri(initialCreditUri, 'credit-token', deployer, disp);

        const newCreditUri = "https://new-credit-uri.example.com";
        setTokenUri('credit-token', newCreditUri, deployer, disp);
        getTokenUri(newCreditUri, 'credit-token', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - CREDIT ===', () => {
        const initialCreditUri = CREDIT_URI;
        getTokenUri(initialCreditUri, 'credit-token', deployer, disp);

        const unauthorizedUri = "https://unauthorized-credit-uri.example.com";
        setTokenUri('credit-token', unauthorizedUri, wallet1);
        getTokenUri(initialCreditUri, 'credit-token', deployer, disp);
    });
});
