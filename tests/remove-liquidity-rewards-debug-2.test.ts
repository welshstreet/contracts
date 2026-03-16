import { describe, it } from "vitest";

// Import test helper functions
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { donateRewards } from "./functions/street-rewards-helper-functions";
import { removeLiquidity } from "./functions/street-market-helper-functions";
import { updateUserRewards } from "./functions/utility-helper-functions";

// Import test constants
import { 
    DONATE_WELSH, 
    DONATE_STREET,
    disp 
} from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== REMOVE LIQUIDITY REWARDS DEBUG 2 TEST ===", () => {
    it("=== REMOVE LIQUIDITY REWARDS DEBUG 2 TEST ===", () => {
        // ================================================================================
        // REMOVE-LIQUIDITY TIMING EXPLANATION:
        // In street-market.clar remove-liquidity function, the contract calls:
        // 1. decrease-rewards (updates rewards) - USES CURRENT LP BALANCE
        // 2. credit-burn (burns LP tokens) - CHANGES USER'S LP BALANCE
        // 
        // This timing follows burn-liquidity pattern for redistribution behavior.
        // When users remove liquidity, their unclaimed rewards are redistributed
        // to remaining LP holders before position reduction.
        // 
        // DIFFERENT FROM PROVIDE-LIQUIDITY:
        // - provide-liquidity: Updates rewards AFTER token changes (for preservation)
        // - remove-liquidity: Updates rewards BEFORE token changes (for redistribution)
        // ================================================================================
        
        // STEP 1: Setup environment with multi-user liquidity state
        let { marketData, rewardData, supplyData, userData } = setupLiquidityUsers(disp);
        
        // Initialize let variables from setup for tracking state through test
        let globalIndexA = rewardData.globalIndexA;
        let globalIndexB = rewardData.globalIndexB;
        let rewardsA = rewardData.rewardsA;
        let rewardsB = rewardData.rewardsB;
        
        // User balances (LP tokens)
        let deployerLpBalance = userData.deployer.balances.credit;
        let wallet1LpBalance = userData.wallet1.balances.credit;
        let wallet2LpBalance = userData.wallet2.balances.credit;
        let totalLpSupply = supplyData.credit;

        // Tracking variables for claims and distributions
        let totalClaimedA = 0;
        let totalClaimedB = 0;
        let totalDistributedA = rewardsA;  // WELSH from setup (3 mints x DONATE_WELSH_TO_MINT)
        let totalDistributedB = rewardsB;  // STREET from setup (initially 0)
        
        // Calculate outstanding and actual
        let outstandingA = totalDistributedA - totalClaimedA;
        let outstandingB = totalDistributedB - totalClaimedB;

        if (disp) {
            console.log(" === STEP 1 COMPLETE: INITIAL STATE ===");
            console.log(`Global Index A: ${globalIndexA}`);
            console.log(`Global Index B: ${globalIndexB}`);
            console.log(`Rewards A: ${rewardsA}`);
            console.log(`Rewards B: ${rewardsB}`);
            console.log(`Deployer LP: ${deployerLpBalance}`);
            console.log(`Wallet1 LP: ${wallet1LpBalance}`);
            console.log(`Wallet2 LP: ${wallet2LpBalance}`);
            console.log(`Total LP Supply: ${totalLpSupply}`);
        }

        // STEP 2: Donate rewards to create scenario for redistribution testing
        if (disp) {
            console.log(" === STEP 2: DONATE REWARDS ===");
            console.log("Donating:", DONATE_WELSH.toLocaleString(), "WELSH,", DONATE_STREET.toLocaleString(), "STREET");
        }
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);

        // Update state after donation - read pool info from chain
        let rewardPoolInfo = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        let poolValue = (rewardPoolInfo.result as any).value.value;
        globalIndexA = Number(poolValue["global-index-a"].value);
        globalIndexB = Number(poolValue["global-index-b"].value);
        rewardsA = Number(poolValue["rewards-a"].value);
        rewardsB = Number(poolValue["rewards-b"].value);

        // Update tracking variables after donation
        totalDistributedA = rewardsA;
        totalDistributedB = rewardsB;
        outstandingA = totalDistributedA - totalClaimedA;
        outstandingB = totalDistributedB - totalClaimedB;

        // Sync user rewards from chain
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // Update local references to match userData
        deployerLpBalance = userData.deployer.balances.credit;
        wallet1LpBalance = userData.wallet1.balances.credit;
        wallet2LpBalance = userData.wallet2.balances.credit;

        if (disp) {
            console.log(" === STEP 2 COMPLETE: STATE AFTER DONATION ===");
            console.log(`Global Index A: ${globalIndexA.toLocaleString()}`);
            console.log(`Global Index B: ${globalIndexB.toLocaleString()}`);
            console.log(`Rewards A: ${rewardsA.toLocaleString()}`);
            console.log(`Rewards B: ${rewardsB.toLocaleString()}`);
            console.log(`Total Distributed A: ${totalDistributedA.toLocaleString()}`);
            console.log(`Total Distributed B: ${totalDistributedB.toLocaleString()}`);
            console.log(`Outstanding A: ${outstandingA.toLocaleString()}`);
            console.log(`Outstanding B: ${outstandingB.toLocaleString()}`);
            console.log(" User LP Balances:");
            console.log(`  Deployer: ${deployerLpBalance.toLocaleString()}`);
            console.log(`  Wallet1: ${wallet1LpBalance.toLocaleString()}`);
            console.log(`  Wallet2: ${wallet2LpBalance.toLocaleString()}`);
            console.log(" User Unclaimed Rewards:");
            console.log(`  Deployer A: ${userData.deployer.rewardUserInfo.unclaimedA.toLocaleString()}`);
            console.log(`  Deployer B: ${userData.deployer.rewardUserInfo.unclaimedB.toLocaleString()}`);
            console.log(`  Wallet1 A: ${userData.wallet1.rewardUserInfo.unclaimedA.toLocaleString()}`);
            console.log(`  Wallet1 B: ${userData.wallet1.rewardUserInfo.unclaimedB.toLocaleString()}`);
            console.log(`  Wallet2 A: ${userData.wallet2.rewardUserInfo.unclaimedA.toLocaleString()}`);
            console.log(`  Wallet2 B: ${userData.wallet2.rewardUserInfo.unclaimedB.toLocaleString()}`);
        }

        // STEP 3: Verify reward state before wallet1 removes liquidity
        if (disp) {
            console.log(" === STEP 3: VERIFY REWARD STATE BEFORE REMOVAL ===");
            console.log("All users have equal LP but different unclaimed amounts due to different entry times");
        }

        // Extract user reward data for clarity
        let deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        let deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;
        let wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        let wallet1UnclaimedB = userData.wallet1.rewardUserInfo.unclaimedB;
        let wallet2UnclaimedA = userData.wallet2.rewardUserInfo.unclaimedA;
        let wallet2UnclaimedB = userData.wallet2.rewardUserInfo.unclaimedB;

        // Calculate total unclaimed across all users
        let totalUnclaimedA = deployerUnclaimedA + wallet1UnclaimedA + wallet2UnclaimedA;
        let totalUnclaimedB = deployerUnclaimedB + wallet1UnclaimedB + wallet2UnclaimedB;

        if (disp) {
            console.log(" Per-User Unclaimed:");
            console.log(`  Deployer: ${deployerUnclaimedA.toLocaleString()} A, ${deployerUnclaimedB.toLocaleString()} B`);
            console.log(`  Wallet1:  ${wallet1UnclaimedA.toLocaleString()} A, ${wallet1UnclaimedB.toLocaleString()} B`);
            console.log(`  Wallet2:  ${wallet2UnclaimedA.toLocaleString()} A, ${wallet2UnclaimedB.toLocaleString()} B`);
            console.log(` Total Unclaimed: ${totalUnclaimedA.toLocaleString()} A, ${totalUnclaimedB.toLocaleString()} B`);
            console.log(`Total Available: ${rewardsA.toLocaleString()} A, ${rewardsB.toLocaleString()} B`);
            console.log(` State ready for wallet1 to remove 50% liquidity`);
        }

        // STEP 4: wallet1 removes 50% of liquidity - triggers reward redistribution
        let removalAmount = Math.floor(wallet1LpBalance / 2); // Remove 50% LP tokens
        
        if (disp) {
            console.log(" === STEP 4: WALLET1 REMOVES 50% LIQUIDITY ===");
            console.log(`Removing: ${removalAmount.toLocaleString()} LP tokens (50% of ${wallet1LpBalance.toLocaleString()})`);
            console.log(`Timing: Update rewards BEFORE burning tokens (redistribution pattern)`);
        }

        // Calculate expected values for remove liquidity using current market data
        let reserveA = marketData.reserveA;
        let reserveB = marketData.reserveB;
        let lockedA = marketData.lockedA;
        let lockedB = marketData.lockedB;
        let availA = reserveA >= lockedA ? reserveA - lockedA : 0;
        let availB = reserveB >= lockedB ? reserveB - lockedB : 0;

        // Calculate withdrawn amounts (before tax) using BigInt for precision
        let grossAmountA = Number((BigInt(removalAmount) * BigInt(availA)) / BigInt(totalLpSupply));
        let grossAmountB = Number((BigInt(removalAmount) * BigInt(availB)) / BigInt(totalLpSupply));
        
        // Calculate tax (1% = 100 basis points) using BigInt for precision
        let taxA = Number((BigInt(grossAmountA) * 100n) / 10000n);
        let taxB = Number((BigInt(grossAmountB) * 100n) / 10000n);
        let userAmountA = grossAmountA - taxA;
        let userAmountB = grossAmountB - taxB;

        // Execute remove liquidity
        removeLiquidity(
            removalAmount,
            taxA,
            taxB,
            userAmountA,
            userAmountB,
            wallet1,
            disp
        );

        // Update LP balances and supply after removal
        wallet1LpBalance -= removalAmount;
        totalLpSupply -= removalAmount;
        supplyData.credit = totalLpSupply;

        // Update wallet1 token balances based on withdrawn amounts
        userData.wallet1.balances.welsh += userAmountA;
        userData.wallet1.balances.street += userAmountB;
        userData.wallet1.balances.credit = wallet1LpBalance;

        // Update market reserves and locked amounts
        reserveA = reserveA >= userAmountA ? reserveA - userAmountA : 0;
        reserveB = reserveB >= userAmountB ? reserveB - userAmountB : 0;
        lockedA = lockedA + taxA;
        lockedB = lockedB + taxB;
        availA = reserveA >= lockedA ? reserveA - lockedA : 0;
        availB = reserveB >= lockedB ? reserveB - lockedB : 0;

        // Update marketData in place
        marketData.reserveA = reserveA;
        marketData.reserveB = reserveB;
        marketData.lockedA = lockedA;
        marketData.lockedB = lockedB;
        marketData.availA = availA;
        marketData.availB = availB;

        // Sync user rewards from chain after removal
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);

        // Update local references after chain sync
        deployerLpBalance = userData.deployer.balances.credit;
        wallet1LpBalance = userData.wallet1.balances.credit;
        wallet2LpBalance = userData.wallet2.balances.credit;
        deployerUnclaimedA = userData.deployer.rewardUserInfo.unclaimedA;
        deployerUnclaimedB = userData.deployer.rewardUserInfo.unclaimedB;
        wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        wallet1UnclaimedB = userData.wallet1.rewardUserInfo.unclaimedB;
        wallet2UnclaimedA = userData.wallet2.rewardUserInfo.unclaimedA;
        wallet2UnclaimedB = userData.wallet2.rewardUserInfo.unclaimedB;

        // Reread pool info
        rewardPoolInfo = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-pool-info",
            [],
            deployer
        );
        poolValue = (rewardPoolInfo.result as any).value.value;
        globalIndexA = Number(poolValue["global-index-a"].value);
        globalIndexB = Number(poolValue["global-index-b"].value);
        rewardsA = Number(poolValue["rewards-a"].value);
        rewardsB = Number(poolValue["rewards-b"].value);

        if (disp) {
            console.log(" === STEP 4 COMPLETE: STATE AFTER WALLET1 REMOVAL ===");
            console.log(`Removed LP: ${removalAmount.toLocaleString()}`);
            console.log(`User A received: ${userAmountA.toLocaleString()} (tax: ${taxA.toLocaleString()})`);
            console.log(`User B received: ${userAmountB.toLocaleString()} (tax: ${taxB.toLocaleString()})`);
            console.log(` LP Balances After Removal:`);
            console.log(`  Deployer: ${deployerLpBalance.toLocaleString()}`);
            console.log(`  Wallet1: ${wallet1LpBalance.toLocaleString()} (was ${wallet1LpBalance + removalAmount})`);
            console.log(`  Wallet2: ${wallet2LpBalance.toLocaleString()}`);
            console.log(`  Total Supply: ${totalLpSupply.toLocaleString()}`);
            console.log(` Market State:`);
            console.log(`  Reserve A/B: ${reserveA.toLocaleString()} / ${reserveB.toLocaleString()}`);
            console.log(`  Locked A/B: ${lockedA.toLocaleString()} / ${lockedB.toLocaleString()}`);
            console.log(`  Avail A/B: ${availA.toLocaleString()} / ${availB.toLocaleString()}`);
            console.log(` Global Reward State:`);
            console.log(`  Global Index A: ${globalIndexA.toLocaleString()}`);
            console.log(`  Global Index B: ${globalIndexB.toLocaleString()}`);
            console.log(`  Rewards A: ${rewardsA.toLocaleString()}`);
            console.log(`  Rewards B: ${rewardsB.toLocaleString()}`);
            console.log(` User Unclaimed After Removal:`);
            console.log(`  Deployer A: ${deployerUnclaimedA.toLocaleString()}, B: ${deployerUnclaimedB.toLocaleString()}`);
            console.log(`  Wallet1 A: ${wallet1UnclaimedA.toLocaleString()}, B: ${wallet1UnclaimedB.toLocaleString()}`);
            console.log(`  Wallet2 A: ${wallet2UnclaimedA.toLocaleString()}, B: ${wallet2UnclaimedB.toLocaleString()}`);
            console.log(` wallet1 removed half their LP position`);
            console.log(`wallet1's forfeited rewards redistributed to deployer & wallet2`);
            console.log(`All state updated and synced from chain`);
        }
    });
});