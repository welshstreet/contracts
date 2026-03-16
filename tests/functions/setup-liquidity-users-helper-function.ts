import { PROVIDE_WELSH, PROVIDE_STREET, PRECISION } from "../vitestconfig";
import { setupInitialLiquidity } from "./setup-initial-liquidity-helper-function";
import { setupUserWallet } from "./setup-user-wallet-helper-function";
import { setupUserDeployer } from "./setup-user-deployer-helper-function";
import { burnLiquidity } from "./street-market-helper-functions";
import { getSupplyData, updateUserRewardInfo } from "./utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function setupLiquidityUsers(disp: boolean = false) {
    // STEP 1: Setup initial liquidity (deployer provides initial liquidity)
    let initialSetup = setupInitialLiquidity(disp);
    let { marketData, rewardData, supplyData } = initialSetup;
    let userData: any = initialSetup.userData;
    
    // STEP 2: Setup Deployer - mint STREET and update reward indices
    // burn-block-height stays at 3 in simnet (Bitcoin block), simnet.blockHeight tracks Stacks blocks
    ({ rewardData, userData } = setupUserDeployer(rewardData, userData, disp, 3));
    
    // STEP 3: Setup wallet1
    // burn-block-height remains 3 throughout test
    ({ rewardData, userData } = setupUserWallet("wallet_1", rewardData, userData, disp, 3));
    
    // Update deployer's unclaimed rewards after wallet1 minted STREET (increased globalIndexA)
    // Deployer has LP tokens and indexA=0, so unclaimed grows as global index incr
    // eases
    updateUserRewardInfo("deployer",rewardData, userData);
    
    // STEP 4: Setup wallet2
    // burn-block-height remains 3
    ({ rewardData, userData } = setupUserWallet("wallet_2", rewardData, userData, disp, 3));
    
    // Update deployer's and wallet1's unclaimed rewards after wallet2 minted STREET
    // Both have LP tokens and their unclaimed grows as global index increases from wallet2's mint
    updateUserRewardInfo("deployer", rewardData, userData);
    updateUserRewardInfo("wallet1", rewardData, userData);
    
    // STEP 5: Calculate deployer's unclaimed rewards for use in burn calculation
    // Extract current unclaimed values (already updated by updateUserRewardInfo above)
    let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
    let deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;

    // STEP 6: Deployer burns excess LP to match wallet1/wallet2 (all users end up with equal LP)
    //
    // ⚠️ CRITICAL EDGE CASE: This burn MUST happen AFTER wallet1 and wallet2 have provided liquidity!
    // 
    // In an index-based reward system, when a user burns liquidity:
    // - Their forfeited unclaimed rewards are redistributed to remaining LP holders
    // - If deployer burned BEFORE wallet1/wallet2 provided liquidity (when deployer is the only LP holder)
    //   the forfeited rewards would have NO ONE to redistribute to and would be LOST FOREVER
    // 
    // By burning AFTER wallet1/wallet2 have LP, the deployer's forfeited rewards are properly
    // redistributed to wallet1 and wallet2, preserving the reward accounting.
    //
    const DEPLOYER_BURN_AMOUNT = userData.deployer.balances.credit - userData.wallet1.balances.credit; // Burn to match wallet1 balance
    
    // Burn liquidity - this will redistribute deployer's unclaimed to wallet1/wallet2
    burnLiquidity(DEPLOYER_BURN_AMOUNT, deployer, disp);
    
    // Update deployer's LP balance after burn so it matches wallet1 and wallet2
    userData.deployer.balances.credit -= DEPLOYER_BURN_AMOUNT;
    
    // Calculate redistribution from deployer's burn
    // IMPORTANT: Deployer doesn't forfeit ALL unclaimed - only proportional to LP burned!
    // Contract logic: forfeit-a = (unclaimed-a * amount-burned) / old-balance
    const oldDeployerBalance = userData.deployer.balances.credit + DEPLOYER_BURN_AMOUNT;
    const deployerForfeitA = Math.floor((deployerUnclaimedA * DEPLOYER_BURN_AMOUNT) / oldDeployerBalance);
    const deployerForfeitB = Math.floor((deployerUnclaimedB * DEPLOYER_BURN_AMOUNT) / oldDeployerBalance);
    
    // Deployer preserves a proportional amount for their remaining LP
    const deployerPreserveA = deployerUnclaimedA - deployerForfeitA;
    const deployerPreserveB = deployerUnclaimedB - deployerForfeitB;
    
    // After burn, remaining LP holders are wallet1 and wallet2
    const totalLpAfterDeployerBurn = userData.wallet1.balances.credit + userData.wallet2.balances.credit;
    const deployerRedistributionA = Math.floor((deployerForfeitA * PRECISION) / totalLpAfterDeployerBurn);
    const deployerRedistributionB = Math.floor((deployerForfeitB * PRECISION) / totalLpAfterDeployerBurn);
    
    // Update global indices after deployer burn (add redistribution increment)
    rewardData.globalIndexA = rewardData.globalIndexA + deployerRedistributionA;
    rewardData.globalIndexB = rewardData.globalIndexB + deployerRedistributionB;
    
    // STEP 7: Update user reward info after deployer burn
    // Deployer's user index is adjusted to preserve their remaining unclaimed
    // Contract logic: preserve-idx-a = new-global-a - (preserve-a * PRECISION / remaining-balance)
    // This ensures: unclaimed = (balance * (global - index)) / PRECISION = preserve-a
    const deployerIndexA = userData.deployer.balances.credit > 0 && deployerPreserveA > 0
        ? rewardData.globalIndexA - Math.floor((deployerPreserveA * PRECISION) / userData.deployer.balances.credit)
        : rewardData.globalIndexA;
    const deployerIndexB = userData.deployer.balances.credit > 0 && deployerPreserveB > 0
        ? rewardData.globalIndexB - Math.floor((deployerPreserveB * PRECISION) / userData.deployer.balances.credit)
        : rewardData.globalIndexB;
    
    // Update deployer's rewardUserInfo in userData
    userData.deployer.rewardUserInfo.balance = userData.deployer.balances.credit;
    userData.deployer.rewardUserInfo.block = simnet.blockHeight; // Current block after burn
    userData.deployer.rewardUserInfo.indexA = deployerIndexA;
    userData.deployer.rewardUserInfo.indexB = deployerIndexB;
    userData.deployer.rewardUserInfo.unclaimedA = deployerPreserveA;
    userData.deployer.rewardUserInfo.unclaimedB = deployerPreserveB;
    
    // Update wallet1 and wallet2 unclaimed to include redistribution from deployer's forfeited rewards
    // Use updateUserRewardInfo helper to calculate based on new global indices
    updateUserRewardInfo("wallet1", rewardData, userData);
    updateUserRewardInfo("wallet2", rewardData, userData);
    
    // STEP 8: Update marketData to include wallet1 and wallet2 contributions
    marketData.availA += 2 * PROVIDE_WELSH;
    marketData.availB += 2 * PROVIDE_STREET;
    marketData.reserveA += 2 * PROVIDE_WELSH;
    marketData.reserveB += 2 * PROVIDE_STREET;
    
    // STEP 9: Calculate supply data and view summary
    // Total supply calculation:
    // marketData.reserveB includes all STREET in the pool (deployer + wallet1 + wallet2 contributions)
    // wallet1 and wallet2 may hold STREET outside the pool if they didn't provide all of it
    // deployer now has STREET from minting
    let expectedSupplyStreet = marketData.reserveB + userData.deployer.balances.street + userData.wallet1.balances.street + userData.wallet2.balances.street;
    let expectedSupplyCredit = userData.deployer.balances.credit + userData.wallet1.balances.credit + userData.wallet2.balances.credit; 

    supplyData = getSupplyData(
        expectedSupplyStreet,
        expectedSupplyCredit,
        disp
    );

    if (disp) {
        console.log("=== SETUP LIQUIDITY USER SUMMARY ===");
        console.log("Market Data:");
        console.log(`  Avail A: ${marketData.availA}`);
        console.log(`  Avail B: ${marketData.availB}`);
        console.log(`  Fee: ${marketData.fee}`);
        console.log(`  Locked A: ${marketData.lockedA}`);
        console.log(`  Locked B: ${marketData.lockedB}`);
        console.log(`  Reserve A: ${marketData.reserveA}`);
        console.log(`  Reserve B: ${marketData.reserveB}`);
        console.log(`  Tax: ${marketData.tax}`);
        
        console.log("Reward Data:");
        console.log(`  Global Index A: ${rewardData.globalIndexA}`);
        console.log(`  Global Index B: ${rewardData.globalIndexB}`);
        console.log(`  Rewards A: ${rewardData.rewardsA}`);
        console.log(`  Rewards B: ${rewardData.rewardsB}`);
        
        console.log("Supply Data:");
        console.log(`  STREET: ${supplyData.street}`);
        console.log(`  CREDIT: ${supplyData.credit}`);
        
        console.log("=== DEPLOYER ===");
        console.log(`Address: ${deployer}`);
        console.log("Balances:");
        console.log(`  WELSH: ${userData.deployer.balances.welsh}`);
        console.log(`  STREET: ${userData.deployer.balances.street}`);
        console.log(`  CREDIT: ${userData.deployer.balances.credit}`);
        console.log("Reward User Info:");
        console.log(`  Balance: ${userData.deployer.rewardUserInfo.balance}`);
        console.log(`  Block: ${userData.deployer.rewardUserInfo.block}`);
        console.log(`  Debt A: ${userData.deployer.rewardUserInfo.debtA}`);
        console.log(`  Debt B: ${userData.deployer.rewardUserInfo.debtB}`);
        console.log(`  Index A: ${userData.deployer.rewardUserInfo.indexA}`);
        console.log(`  Index B: ${userData.deployer.rewardUserInfo.indexB}`);
        console.log(`  Unclaimed A: ${userData.deployer.rewardUserInfo.unclaimedA}`);
        console.log(`  Unclaimed B: ${userData.deployer.rewardUserInfo.unclaimedB}`);
        
        console.log("=== WALLET1 ===");
        console.log(`Address: ${userData.wallet1.address}`);
        console.log("Balances:");
        console.log(`  WELSH: ${userData.wallet1.balances.welsh}`);
        console.log(`  STREET: ${userData.wallet1.balances.street}`);
        console.log(`  CREDIT: ${userData.wallet1.balances.credit}`);
        console.log("Reward User Info:");
        console.log(`  Balance: ${userData.wallet1.rewardUserInfo.balance}`);
        console.log(`  Block: ${userData.wallet1.rewardUserInfo.block}`);
        console.log(`  Debt A: ${userData.wallet1.rewardUserInfo.debtA}`);
        console.log(`  Debt B: ${userData.wallet1.rewardUserInfo.debtB}`);
        console.log(`  Index A: ${userData.wallet1.rewardUserInfo.indexA}`);
        console.log(`  Index B: ${userData.wallet1.rewardUserInfo.indexB}`);
        console.log(`  Unclaimed A: ${userData.wallet1.rewardUserInfo.unclaimedA}`);
        console.log(`  Unclaimed B: ${userData.wallet1.rewardUserInfo.unclaimedB}`);
        
        console.log("=== WALLET2 ===");
        console.log(`Address: ${userData.wallet2.address}`);
        console.log("Balances:");
        console.log(`  WELSH: ${userData.wallet2.balances.welsh}`);
        console.log(`  STREET: ${userData.wallet2.balances.street}`);
        console.log(`  CREDIT: ${userData.wallet2.balances.credit}`);
        console.log("Reward User Info:");
        console.log(`  Balance: ${userData.wallet2.rewardUserInfo.balance}`);
        console.log(`  Block: ${userData.wallet2.rewardUserInfo.block}`);
        console.log(`  Debt A: ${userData.wallet2.rewardUserInfo.debtA}`);
        console.log(`  Debt B: ${userData.wallet2.rewardUserInfo.debtB}`);
        console.log(`  Index A: ${userData.wallet2.rewardUserInfo.indexA}`);
        console.log(`  Index B: ${userData.wallet2.rewardUserInfo.indexB}`);
        console.log(`  Unclaimed A: ${userData.wallet2.rewardUserInfo.unclaimedA}`);
        console.log(`  Unclaimed B: ${userData.wallet2.rewardUserInfo.unclaimedB}`);
    }

    // STEP 10: Return complete state
    // userData already contains deployer, wallet1, and wallet2 with all their balances and reward info
    // rewardData contains the global reward pool state
    // marketData and supplyData are already correctly updated
    return {
        marketData,
        rewardData,
        supplyData,
        userData
    }
}