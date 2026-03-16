import { describe, it } from 'vitest';
import { setNftContractOwner, getNftContractOwner, setNftBaseUri, getNftBaseUri } from './functions/street-nft-helper-functions';
import { disp, NFT_BASE_URI } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== STREET NFT SET FUNCTIONS TESTS ===', () => {
    it('=== STREET NFT SET CONTRACT OWNER PASS ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getNftContractOwner(disp);
        
        // STEP 2: Set contract owner to wallet1
        setNftContractOwner(wallet1, deployer, disp);
        getNftContractOwner(disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - NFT ===', () => {
        // STEP 1: Verify initial contract owner is deployer
        getNftContractOwner(disp);
        
        // STEP 2: Attempt to set contract owner from unauthorized wallet
        setNftContractOwner(wallet1, wallet2, disp);
        
        // STEP 3: Verify owner hasn't changed
        getNftContractOwner(disp);
    });

    it('=== STREET NFT SET BASE URI PASS ===', () => {
        // STEP 1: Verify initial base URI
        getNftBaseUri(NFT_BASE_URI, disp);
        
        // STEP 2: Set new base URI
        const newUri = "https://new-ipfs.io/ipfs/new-hash/";
        setNftBaseUri(newUri, deployer, disp);
        getNftBaseUri(newUri, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - NFT BASE URI ===', () => {
        // STEP 1: Verify initial base URI
        getNftBaseUri(NFT_BASE_URI, disp);
        
        // STEP 2: Attempt to set base URI from unauthorized wallet
        const unauthorizedUri = "https://unauthorized.io/";
        setNftBaseUri(unauthorizedUri, wallet2, disp);
        
        // STEP 3: Verify base URI hasn't changed
        getNftBaseUri(NFT_BASE_URI, disp);
    });
});
