import { describe, it, expect } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getNftContractOwner, getNftOwner, getNftTokenUri, getNftBaseUri, getUserMintedTokens, getLastTokenId } from "./functions/street-nft-helper-functions";
import { disp, NFT_BASE_URI } from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== STREET NFT READ ONLY FUNCTIONS TESTS ===", () => {
    it("=== GET NFT CONTRACT OWNER ===", () => {
        // STEP 1: Check initial NFT contract owner
        // The contract owner should be the deployer
        const owner = getNftContractOwner(disp);
        
        expect(owner).toEqual(deployer);
        
        if (disp) {
            console.log(`✅ NFT contract owner verified: ${owner}`);
        }
    });

    it("=== GET NFT TOKEN OWNER ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        // setupLiquidityUsers completes 3 mints:
        //   - Deployer: epoch 1, NFT #1
        //   - Wallet1: epoch 2, NFT #2
        //   - Wallet2: epoch 3, NFT #3
        setupLiquidityUsers(disp);

        // STEP 2: Check NFT #1 owner (should be deployer)
        const owner1 = getNftOwner(1, disp);
        expect(owner1).toEqual(deployer);

        // STEP 3: Check NFT #2 owner (should be wallet1)
        const owner2 = getNftOwner(2, disp);
        expect(owner2).toEqual(wallet1);

        // STEP 4: Check NFT #3 owner (should be wallet2)
        const owner3 = getNftOwner(3, disp);
        expect(owner3).toEqual(wallet2);

        // STEP 5: Check non-existent NFT #999 (should return null)
        const owner999 = getNftOwner(999, disp);
        expect(owner999).toEqual(null);

        if (disp) {
            console.log(`✅ All NFT token owners verified correctly`);
            console.log(`   NFT #1: ${owner1}`);
            console.log(`   NFT #2: ${owner2}`);
            console.log(`   NFT #3: ${owner3}`);
            console.log(`   NFT #999: ${owner999} (not minted)`);
        }
    });

    it("=== GET NFT TOKEN URI ===", () => {
        // STEP 1: Setup environment with multi-user liquidity state
        setupLiquidityUsers(disp);

        // STEP 2: Check NFT URI template (all tokens return the same template with {id} placeholder)
        // The contract follows NFT standard where clients replace {id} with the actual token ID
        const expectedUriTemplate = NFT_BASE_URI + "{id}.json";
        
        // STEP 3: Verify URI template for token #1
        const uri1 = getNftTokenUri(1, disp);
        expect(uri1).toEqual(expectedUriTemplate);

        // STEP 4: Verify URI template for token #2 (should be same template)
        const uri2 = getNftTokenUri(2, disp);
        expect(uri2).toEqual(expectedUriTemplate);

        // STEP 5: Verify URI template for token #3 (should be same template)
        const uri3 = getNftTokenUri(3, disp);
        expect(uri3).toEqual(expectedUriTemplate);

        if (disp) {
            console.log(`✅ All NFT token URIs return correct template`);
            console.log(`   Template: ${uri1}`);
            console.log(`   Note: Clients replace {id} with actual token ID`);
        }
    });

    it("=== GET NFT BASE URI ===", () => {
        // STEP 1: Check NFT base URI
        const expectedBaseUri = NFT_BASE_URI;
        const baseUri = getNftBaseUri(expectedBaseUri, disp);
        
        expect(baseUri).toEqual(expectedBaseUri);
        
        if (disp) {
            console.log(`✅ NFT base URI verified: ${baseUri}`);
        }
    });

    it("=== GET USER MINTED TOKENS ===", () => {
        // STEP 1: Check before any mints - should return null
        let deployerTokens = getUserMintedTokens(deployer, disp);
        expect(deployerTokens).toEqual(null);
        
        let wallet1Tokens = getUserMintedTokens(wallet1, disp);
        expect(wallet1Tokens).toEqual(null);
        
        // STEP 2: Setup environment with multi-user liquidity state
        // setupLiquidityUsers completes 3 mints:
        //   - Deployer: epoch 1, NFT #1
        //   - Wallet1: epoch 2, NFT #2
        //   - Wallet2: epoch 3, NFT #3
        setupLiquidityUsers(disp);
        
        // STEP 3: Check deployer's minted tokens (should have [1])
        deployerTokens = getUserMintedTokens(deployer, disp);
        expect(deployerTokens).toEqual([1]);
        
        // STEP 4: Check wallet1's minted tokens (should have [2])
        wallet1Tokens = getUserMintedTokens(wallet1, disp);
        expect(wallet1Tokens).toEqual([2]);
        
        // STEP 5: Check wallet2's minted tokens (should have [3])
        const wallet2Tokens = getUserMintedTokens(wallet2, disp);
        expect(wallet2Tokens).toEqual([3]);
        
        if (disp) {
            console.log(`✅ All user minted tokens verified correctly`);
            console.log(`   Deployer: [${deployerTokens}]`);
            console.log(`   Wallet1: [${wallet1Tokens}]`);
            console.log(`   Wallet2: [${wallet2Tokens}]`);
        }
    });

    it("=== GET LAST TOKEN ID ===", () => {
        // STEP 1: Check initial last token ID (should be 0 before any mints)
        // last-token-id starts at u1, get-last-token-id returns (last-token-id - 1) = 0
        let lastTokenId = getLastTokenId(disp);
        expect(lastTokenId).toEqual(0);
        
        if (disp) {
            console.log(`✅ Initial last token ID: ${lastTokenId} (no tokens minted yet)`);
        }
        
        // STEP 2: Setup environment with multi-user liquidity state
        // setupLiquidityUsers completes 3 mints:
        //   - Deployer: epoch 1, NFT #1
        //   - Wallet1: epoch 2, NFT #2
        //   - Wallet2: epoch 3, NFT #3
        setupLiquidityUsers(disp);
        
        // STEP 3: Check last token ID after 3 mints (should be 3)
        lastTokenId = getLastTokenId(disp);
        expect(lastTokenId).toEqual(3);
        
        if (disp) {
            console.log(`✅ Last token ID after 3 mints: ${lastTokenId}`);
            console.log(`   Tokens minted: #1 (deployer), #2 (wallet1), #3 (wallet2)`);
        }
    });
});
