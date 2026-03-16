import { describe, it } from 'vitest';
import { setTokenUri } from './functions/set-token-uri-helper-functions';
import { getTokenUri } from './functions/shared-read-only-helper-functions';
import { disp, STREET_URI } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== STREET TOKEN SET TOKEN URI TESTS ===', () => {
    it('=== STREET SET TOKEN URI PASS ===', () => {
        const initialStreetUri = STREET_URI;
        getTokenUri(initialStreetUri, 'street-token', deployer, disp);

        const newStreetUri = "https://new-street-uri.example.com";
        setTokenUri('street-token', newStreetUri, deployer, disp);
        getTokenUri(newStreetUri, 'street-token', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - STREET ===', () => {
        const initialStreetUri = STREET_URI;
        getTokenUri(initialStreetUri, 'street-token', deployer, disp);

        const unauthorizedUri = "https://unauthorized-street-uri.example.com";
        setTokenUri('street-token', unauthorizedUri, wallet2);
        getTokenUri(initialStreetUri, 'street-token', deployer, disp);
    });
});
