import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { disp,  DONATE_WELSH, DONATE_STREET, PRECISION } from "./vitestconfig"
import { burnLiquidity, } from "./functions/street-market-helper-functions";
import { donateRewards, getRewardUserInfo } from "./functions/street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== BURN LIQUIDITY DONATE TESTS ===", () => {
    it("=== BURN LIQUIDITY DONATE REWARDS ===", () => {
        // STEP 1: Setup liquidity and user state
        let { rewardData, supplyData, userData } = setupLiquidityUsers(disp);

        // Use the correct global indices from rewardData (now matches on-chain state)
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        let rewardsA = rewardData.rewardsA;
        let rewardsB = rewardData.rewardsB;
        
        // User balances (LP tokens)
        let deployerLpBalance = userData.deployer.balances.credit;
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
        let totalLpSupply = supplyData.credit;
        
        // User reward state
        let wallet1UserIndexA = userData.wallet1.rewardUserInfo.indexA;
        let wallet1UserIndexB = userData.wallet1.rewardUserInfo.indexB;
        let wallet1DebtA = userData.wallet1.rewardUserInfo.debtA;
        let wallet1DebtB = userData.wallet1.rewardUserInfo.debtB;
        let wallet1Block = userData.wallet1.rewardUserInfo.block;
        
        let wallet2UserIndexA = userData.wallet2.rewardUserInfo.indexA;
        let wallet2UserIndexB = userData.wallet2.rewardUserInfo.indexB;
        let wallet2DebtA = userData.wallet2.rewardUserInfo.debtA;
        let wallet2DebtB = userData.wallet2.rewardUserInfo.debtB;
        let wallet2Block = userData.wallet2.rewardUserInfo.block;
        
        if (disp) {
            console.log("=== STEP 1 COMPLETE: INITIAL STATE ===");
            console.log(`Global Index A: ${globalIndexA}`);
            console.log(`Global Index B: ${globalIndexB}`);
            console.log(`Deployer LP: ${deployerLpBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}`);
            console.log(`Total LP Supply: ${totalLpSupply}`);
        }
        // STEP 2: Deployer burns ALL their liquidity (complete exit BEFORE rewards)
        // This causes deployer's unclaimed rewards to be redistributed to remaining LP holders
        
        // Deployer's unclaimed is already calculated correctly in setupLiquidityUsers
        // No additional earning since no operations occurred between setup and this burn
        let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        let deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;
        
        burnLiquidity(deployerLpBalance, deployer, disp);
        
        // Update state after deployer burn using BigInt
        const PRECISION_BIG = BigInt(PRECISION);
        totalLpSupply = wallet1LpBalance + wallet2LpBalance;
        const totalLpSupplyBig = BigInt(totalLpSupply);
        const deployerRedistributionABig = (BigInt(deployerUnclaimedA) * PRECISION_BIG) / totalLpSupplyBig;
        const deployerRedistributionBBig = (BigInt(deployerUnclaimedB) * PRECISION_BIG) / totalLpSupplyBig;
        
        let globalIndexABig = BigInt(globalIndexA) + deployerRedistributionABig;
        let globalIndexBBig = BigInt(globalIndexB) + deployerRedistributionBBig;
        globalIndexA = Number(globalIndexABig);
        globalIndexB = Number(globalIndexBBig);
        deployerLpBalance = 0;
        
        if (disp) {
            console.log("=== STEP 2 COMPLETE: DEPLOYER BURNED LP ===");
            console.log(`Deployer unclaimed A: ${deployerUnclaimedA}`);
            console.log(`Deployer unclaimed B: ${deployerUnclaimedB}`);
            console.log(`Redistribution A: ${Number(deployerRedistributionABig)}`);
            console.log(`Redistribution B: ${Number(deployerRedistributionBBig)}`);
            console.log(`New Global Index A: ${globalIndexA}`);
            console.log(`New Global Index B: ${globalIndexB}`);
            console.log(`Remaining LP: ${totalLpSupply}`);
        }
        
        // STEP 3: Donate rewards - only wallet1 and wallet2 should benefit
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        // Update state after donation using BigInt
        const donationIndexIncreaseABig = (BigInt(DONATE_WELSH) * PRECISION_BIG) / totalLpSupplyBig;
        const donationIndexIncreaseBBig = (BigInt(DONATE_STREET) * PRECISION_BIG) / totalLpSupplyBig;
        globalIndexABig = globalIndexABig + donationIndexIncreaseABig;
        globalIndexBBig = globalIndexBBig + donationIndexIncreaseBBig;
        globalIndexA = Number(globalIndexABig);
        globalIndexB = Number(globalIndexBBig);
        rewardsA = rewardsA + DONATE_WELSH;
        rewardsB = rewardsB + DONATE_STREET;
        
        if (disp) {
            console.log("=== STEP 3 COMPLETE: DONATED REWARDS ===");
            console.log(`New Global Index A: ${globalIndexA}`);
            console.log(`New Global Index B: ${globalIndexB}`);
            console.log(`Total Rewards A: ${rewardsA}`);
            console.log(`Total Rewards B: ${rewardsB}`);
        }
        
        // STEP 4: Verify wallet1's unclaimed rewards after donation
        // wallet1's unclaimed = (balance * (globalIndex - userIndex)) / PRECISION - debt
        const wallet1LpBalanceBig = BigInt(wallet1LpBalance);
        const wallet1UserIndexABig = BigInt(wallet1UserIndexA);
        const wallet1UserIndexBBig = BigInt(wallet1UserIndexB);
        let wallet1UnclaimedA = Number((wallet1LpBalanceBig * (globalIndexABig - wallet1UserIndexABig)) / PRECISION_BIG) - wallet1DebtA;
        let wallet1UnclaimedB = Number((wallet1LpBalanceBig * (globalIndexBBig - wallet1UserIndexBBig)) / PRECISION_BIG) - wallet1DebtB;
        
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            wallet1Block,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA,
            wallet1UnclaimedB,
            wallet1,
            disp
        );
        
        if (disp) {
            console.log("=== STEP 4 COMPLETE: WALLET1 REWARDS VERIFIED ===");
            console.log(`Wallet1 LP Balance: ${wallet1LpBalance}`);
            console.log(`Wallet1 User Index A: ${wallet1UserIndexA}`);
            console.log(`Wallet1 User Index B: ${wallet1UserIndexB}`);
            console.log(`Wallet1 Unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`Wallet1 Unclaimed B: ${wallet1UnclaimedB}`);
        }
        

        // STEP 5: Verify wallet2's unclaimed rewards after donation
        const wallet2LpBalanceBig = BigInt(wallet2LpBalance);
        const wallet2UserIndexABig = BigInt(wallet2UserIndexA);
        const wallet2UserIndexBBig = BigInt(wallet2UserIndexB);
        let wallet2UnclaimedA = Number((wallet2LpBalanceBig * (globalIndexABig - wallet2UserIndexABig)) / PRECISION_BIG) - wallet2DebtA;
        let wallet2UnclaimedB = Number((wallet2LpBalanceBig * (globalIndexBBig - wallet2UserIndexBBig)) / PRECISION_BIG) - wallet2DebtB;
        
        getRewardUserInfo(
            accounts.get("wallet_2")!,
            wallet2LpBalance,
            wallet2Block,
            wallet2DebtA,
            wallet2DebtB,
            wallet2UserIndexA,
            wallet2UserIndexB,
            wallet2UnclaimedA,
            wallet2UnclaimedB,
            accounts.get("wallet_2")!,
            disp
        );
        
        if (disp) {
            console.log("=== STEP 5 COMPLETE: WALLET2 REWARDS VERIFIED ===");
            console.log(`Wallet2 LP Balance: ${wallet2LpBalance}`);
            console.log(`Wallet2 Unclaimed A: ${wallet2UnclaimedA}`);
            console.log(`Wallet2 Unclaimed B: ${wallet2UnclaimedB}`);
        }
        
        // STEP 6: wallet1 burns 50% of their liquidity
        const wallet1BurnAmount = wallet1LpBalance / 2;
        const wallet1BurnAmountBig = BigInt(wallet1BurnAmount);
        
        // Calculate how much of wallet1's unclaimed gets forfeited vs preserved using BigInt
        const wallet1UnclaimedABig = BigInt(wallet1UnclaimedA);
        const wallet1UnclaimedBBig = BigInt(wallet1UnclaimedB);
        const forfeitABig = (wallet1UnclaimedABig * wallet1BurnAmountBig) / wallet1LpBalanceBig;
        const forfeitBBig = (wallet1UnclaimedBBig * wallet1BurnAmountBig) / wallet1LpBalanceBig;
        const preserveABig = wallet1UnclaimedABig - forfeitABig;
        const preserveBBig = wallet1UnclaimedBBig - forfeitBBig;
        const forfeitA = Number(forfeitABig);
        const forfeitB = Number(forfeitBBig);
        const preserveA = Number(preserveABig);
        const preserveB = Number(preserveBBig);
        
        burnLiquidity(wallet1BurnAmount, wallet1, disp);
        
        // Update state after wallet1 burn using BigInt
        const remainingLpAfterWallet1Burn = wallet2LpBalance; // Only wallet2 remains with full LP
        const remainingLpAfterWallet1BurnBig = BigInt(remainingLpAfterWallet1Burn);
        const redistributionToWallet2ABig = (forfeitABig * PRECISION_BIG) / remainingLpAfterWallet1BurnBig;
        const redistributionToWallet2BBig = (forfeitBBig * PRECISION_BIG) / remainingLpAfterWallet1BurnBig;
        
        globalIndexABig = globalIndexABig + redistributionToWallet2ABig;
        globalIndexBBig = globalIndexBBig + redistributionToWallet2BBig;
        globalIndexA = Number(globalIndexABig);
        globalIndexB = Number(globalIndexBBig);
        
        // Update wallet1 state after burn
        wallet1LpBalance = wallet1LpBalance / 2; // Burned 50%
        const wallet1LpBalanceAfterBurnBig = BigInt(wallet1LpBalance);
        totalLpSupply = wallet1LpBalance + wallet2LpBalance;
        
        // wallet1's user index is set to preserve their remaining rewards using BigInt
        const wallet1UserIndexAAfterBurnBig = globalIndexABig - (preserveABig * PRECISION_BIG) / wallet1LpBalanceAfterBurnBig;
        const wallet1UserIndexBAfterBurnBig = globalIndexBBig - (preserveBBig * PRECISION_BIG) / wallet1LpBalanceAfterBurnBig;
        wallet1UserIndexA = Number(wallet1UserIndexAAfterBurnBig);
        wallet1UserIndexB = Number(wallet1UserIndexBAfterBurnBig);
        wallet1DebtA = 0;
        wallet1DebtB = 0;
        wallet1UnclaimedA = preserveA;
        wallet1UnclaimedB = preserveB;
        
        if (disp) {
            console.log("=== STEP 6 COMPLETE: WALLET1 BURNED 50% LP ===");
            console.log(`Wallet1 Burn Amount: ${wallet1BurnAmount}`);
            console.log(`Forfeit A: ${forfeitA}, Forfeit B: ${forfeitB}`);
            console.log(`Preserve A: ${preserveA}, Preserve B: ${preserveB}`);
            console.log(`Redistribution to wallet2 A: ${Number(redistributionToWallet2ABig)}`);
            console.log(`Redistribution to wallet2 B: ${Number(redistributionToWallet2BBig)}`);
            console.log(`New Global Index A: ${globalIndexA}`);
            console.log(`New Global Index B: ${globalIndexB}`);
            console.log(`New Wallet1 LP Balance: ${wallet1LpBalance}`);
            console.log(`New Wallet1 User Index A: ${wallet1UserIndexA}`);
            console.log(`New Wallet1 User Index B: ${wallet1UserIndexB}`);
        }
        
        // STEP 7: Verify wallet1's state after burn
        getRewardUserInfo(
            wallet1,
            wallet1LpBalance,
            simnet.blockHeight,
            wallet1DebtA,
            wallet1DebtB,
            wallet1UserIndexA,
            wallet1UserIndexB,
            wallet1UnclaimedA,
            wallet1UnclaimedB,
            wallet1,
            disp
        );
        
        if (disp) {
            console.log("=== STEP 7 COMPLETE: WALLET1 STATE AFTER BURN VERIFIED ===");
            console.log(`Wallet1 preserved rewards correctly`);
        }
        
        // STEP 8: Verify wallet2 received the redistributed rewards
        wallet2UnclaimedA = Number((wallet2LpBalanceBig * (globalIndexABig - wallet2UserIndexABig)) / PRECISION_BIG) - wallet2DebtA;
        wallet2UnclaimedB = Number((wallet2LpBalanceBig * (globalIndexBBig - wallet2UserIndexBBig)) / PRECISION_BIG) - wallet2DebtB;
        
        getRewardUserInfo(
            accounts.get("wallet_2")!,
            wallet2LpBalance,
            wallet2Block,
            wallet2DebtA,
            wallet2DebtB,
            wallet2UserIndexA,
            wallet2UserIndexB,
            wallet2UnclaimedA,
            wallet2UnclaimedB,
            accounts.get("wallet_2")!,
            disp
        );
        
        if (disp) {
            console.log("=== STEP 8 COMPLETE: WALLET2 RECEIVED REDISTRIBUTION ===");
            console.log(`Wallet2 Unclaimed A: ${wallet2UnclaimedA}`);
            console.log(`Wallet2 Unclaimed B: ${wallet2UnclaimedB}`);
            console.log(`Total unclaimed by wallet1 + wallet2: ${wallet1UnclaimedA + wallet2UnclaimedA}`);
        }
        
        // FINAL VERIFICATION: Check if rewards accounting is correct
        if (disp) {
            console.log("=== FINAL VERIFICATION ===");
            console.log(`Rewards contract balance A: ${DONATE_WELSH}`);
            console.log(`Total user unclaimed A: ${wallet1UnclaimedA + wallet2UnclaimedA}`);
            
            if (wallet1UnclaimedA + wallet2UnclaimedA === DONATE_WELSH) {
                console.log(" Perfect precision: Total unclaimed exactly matches donation");
            } else {
                console.log(`Difference: ${DONATE_WELSH - (wallet1UnclaimedA + wallet2UnclaimedA)}`);
            }
        }
    });
});
