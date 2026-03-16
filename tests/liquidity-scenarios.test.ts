import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp, BASIS, FEE, TAX, PROVIDE_WELSH, TOTAL_SUPPLY_WELSH } from "./vitestconfig"
import { getMarketInfo, provideLiquidity, initialLiquidity, removeLiquidity } from "./functions/street-market-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== LIQUIDITY SCENARIOS ===", () => {
    it("=== INITIAL LIQUIDITY, REMOVAL ALL LIQUIDITY, PROVIDE LIQUIDITY, INITIAL LIQUIDITY ===", () => {
        // STEP 1: Setup liquidity and user state
        let { marketData, supplyData, userData } = setupLiquidityUsers(disp);

        // STEP 2: All participants remove their liquidity
        // Get individual LP balances from setup (they are NOT equal)
        let deployerLpBalance = userData.deployer.balances.credit;
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
        
        if (disp) {
            console.log("=== STEP 2: Removing All Liquidity (Tax Creates Locked Funds) ===");
            console.log(`Deployer LP: ${deployerLpBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}`);
            console.log(`Total LP: ${supplyData.credit}`);
        }
        
        // Calculate deployer's remove amounts
        let deployerRemoveA = Number((BigInt(deployerLpBalance) * BigInt(marketData.availA)) / BigInt(supplyData.credit));
        let deployerRemoveB = Number((BigInt(deployerLpBalance) * BigInt(marketData.availB)) / BigInt(supplyData.credit));
        let deployerTaxA = Number((BigInt(deployerRemoveA) * BigInt(TAX)) / BigInt(BASIS));
        let deployerTaxB = Number((BigInt(deployerRemoveB) * BigInt(TAX)) / BigInt(BASIS));
        let deployerUserA = deployerRemoveA - deployerTaxA;
        let deployerUserB = deployerRemoveB - deployerTaxB;
        
        // Calculate wallet1's remove amounts  
        let wallet1RemoveA = Number((BigInt(wallet1LpBalance) * BigInt(marketData.availA)) / BigInt(supplyData.credit));
        let wallet1RemoveB = Number((BigInt(wallet1LpBalance) * BigInt(marketData.availB)) / BigInt(supplyData.credit));
        let wallet1TaxA = Number((BigInt(wallet1RemoveA) * BigInt(TAX)) / BigInt(BASIS));
        let wallet1TaxB = Number((BigInt(wallet1RemoveB) * BigInt(TAX)) / BigInt(BASIS));
        let wallet1UserA = wallet1RemoveA - wallet1TaxA;
        let wallet1UserB = wallet1RemoveB - wallet1TaxB;
        
        // Calculate wallet2's remove amounts
        let wallet2RemoveA = Number((BigInt(wallet2LpBalance) * BigInt(marketData.availA)) / BigInt(supplyData.credit));
        let wallet2RemoveB = Number((BigInt(wallet2LpBalance) * BigInt(marketData.availB)) / BigInt(supplyData.credit));
        let wallet2TaxA = Number((BigInt(wallet2RemoveA) * BigInt(TAX)) / BigInt(BASIS));
        let wallet2TaxB = Number((BigInt(wallet2RemoveB) * BigInt(TAX)) / BigInt(BASIS));
        let wallet2UserA = wallet2RemoveA - wallet2TaxA;
        let wallet2UserB = wallet2RemoveB - wallet2TaxB;
        
        // deployer removes liquidity
        removeLiquidity(deployerLpBalance, deployerTaxA, deployerTaxB, deployerUserA, deployerUserB, deployer, disp);
        
        // wallet1 removes liquidity
        removeLiquidity(wallet1LpBalance, wallet1TaxA, wallet1TaxB, wallet1UserA, wallet1UserB, wallet1, disp);
        
        // wallet2 removes liquidity
        removeLiquidity(wallet2LpBalance, wallet2TaxA, wallet2TaxB, wallet2UserA, wallet2UserB, wallet2, disp);

        // STEP 3: Check exchange info after remove liquidity
        // After all removals, locked funds equal total tax collected from all participants
        let totalTaxA = deployerTaxA + wallet1TaxA + wallet2TaxA;
        let totalTaxB = deployerTaxB + wallet1TaxB + wallet2TaxB;
        
        let state = getMarketInfo(
            0, // availAExpected
            0, // availBExpected
            FEE, // fee
            totalTaxA, // lockedAexpected
            totalTaxB, // lockedBexpected
            totalTaxA, //reserveAexpected
            totalTaxB, //reserveBexpected
            TAX, // tax
            deployer,
            disp
        );

        // STEP 4: Deployer tries to provide liquidity again after all liquidity was removed
        let reserveA = state.reserveA;
        let reserveB = state.reserveB;

        let amountAToProvide = PROVIDE_WELSH
        let addedAExpected = amountAToProvide;
        let addedBExpected = Math.floor((amountAToProvide * reserveB) / reserveA);
        let mintedLpExpectedForProvideLiquidity = Math.floor((amountAToProvide * TOTAL_SUPPLY_WELSH) / reserveA);

        // This should failed due to error 710 ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY
        provideLiquidity(
            addedAExpected,
            addedBExpected,
            mintedLpExpectedForProvideLiquidity,
            deployer,
            disp
        );

        // STEP 5: Deployer tries to provide initial liquidity after providing liquidity failed
        // After the fix, initial-liquidity always uses geometric mean when total-supply-lp = 0
        // LP = sqrt(amount-a * amount-b)
        let mintedLpExpected = Math.floor(Math.sqrt(amountAToProvide * addedBExpected));

        initialLiquidity(
            amountAToProvide,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );

        // STEP 6: Validate LP token balance
        getBalance(mintedLpExpected, 'credit-token', deployer, deployer, disp);
    })
});