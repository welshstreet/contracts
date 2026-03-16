import { describe, it } from 'vitest';
import { FEE, TAX } from './vitestconfig';
import { getMarketInfo } from './functions/street-market-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;

describe('=== GET MARKET INFO TESTS ===', () => {
    it('=== GEt MARKET INFO PASS ===', () => {
        getMarketInfo(0, 0, FEE, 0, 0, 0, 0, TAX, deployer, disp);
    });
});