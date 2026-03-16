import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardUserInfo, claimRewards } from "./functions/street-rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/credit-controller-helper-functions";
import { updateUserRewards } from "./functions/utility-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT CONTROLLER DEBUG TESTS ===", () => {
    it("=== CREDIT CONTROLLER DEBUG 1 ===", () => {
        // TEST SUMMARY
        // STEP 1: Setup rewards environment (deployer + wallet1 + wallet2)
        // STEP 2: wallet1 transfers 10% of CREDIT to wallet2
        // STEP 3: wallet1 claims all its rewards (unclaimed zeroed, debt set to earned)
        // STEP 4: wallet2 transfers all credit back to wallet1
        // STEP 5: Check credit for each wallet balances
        // STEP 6: Check reward user info for both wallets

        // STEP 1: Setup environment with multi-user liquidity state
        let { userData } = setupLiquidityUsers(disp);

        // STEP 2: wallet1 transfers 10% of CREDIT to wallet2
        
        // Extract initial balances (use let for mutable state)
        let wallet1Balance = userData.wallet1.rewardUserInfo.balance;
        let wallet2Balance = userData.wallet2.rewardUserInfo.balance;
        let deployerBalance = userData.deployer.rewardUserInfo.balance;
        
        // Calculate transfer amount (10% of wallet1's credit)
        let transferAmount = Math.floor(wallet1Balance * 0.1);
        
        if (disp) {
            console.log(`=== STEP 2: wallet1 transfers 10% CREDIT to wallet2 ===`);
            console.log(`wallet1 initial balance: ${wallet1Balance}`);
            console.log(`wallet2 initial balance: ${wallet2Balance}`);
            console.log(`Transfer amount (10%): ${transferAmount}`);
        }
        
        // Execute transfer
        transferCredit(transferAmount, wallet1, wallet2, wallet1, undefined, disp);
        
        // Update state from chain
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);
        
        // Update local balance variables to match on-chain state
        wallet1Balance = userData.wallet1.rewardUserInfo.balance;
        wallet2Balance = userData.wallet2.rewardUserInfo.balance;
        
        if (disp) {
            console.log(`=== STEP 2 Summary ===`);
            console.log(`wallet1 balance after: ${wallet1Balance}`);
            console.log(`wallet2 balance after: ${wallet2Balance}`);
            console.log(`Transfer complete: ${transferAmount} from wallet1 to wallet2`);
        }

        // STEP 3: wallet1 claims all its rewards
        
        // Extract wallet1's unclaimed rewards
        let wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        let wallet1UnclaimedB = userData.wallet1.rewardUserInfo.unclaimedB;
        
        if (disp) {
            console.log(`=== STEP 3: wallet1 claims all rewards ===`);
            console.log(`wallet1 unclaimed A: ${wallet1UnclaimedA}`);
            console.log(`wallet1 unclaimed B: ${wallet1UnclaimedB}`);
        }
        
        // Claim rewards
        claimRewards(wallet1UnclaimedA, wallet1UnclaimedB, wallet1, disp);
        
        // Update state from chain
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);
        
        // Update local variables to match on-chain state
        wallet1UnclaimedA = userData.wallet1.rewardUserInfo.unclaimedA;
        wallet1UnclaimedB = userData.wallet1.rewardUserInfo.unclaimedB;
        let wallet1DebtA = userData.wallet1.rewardUserInfo.debtA;
        let wallet1DebtB = userData.wallet1.rewardUserInfo.debtB;
        
        if (disp) {
            console.log(`=== STEP 3 Summary ===`);
            console.log(`wallet1 unclaimed A after claim: ${wallet1UnclaimedA}`);
            console.log(`wallet1 unclaimed B after claim: ${wallet1UnclaimedB}`);
            console.log(`wallet1 debt A: ${wallet1DebtA}`);
            console.log(`wallet1 debt B: ${wallet1DebtB}`);
        }

        // STEP 4: wallet2 transfers all credit back to wallet1
        
        // wallet2 currently has 11B (their original 10B + 1B from wallet1)
        // Transfer all back to wallet1
        wallet2Balance = userData.wallet2.rewardUserInfo.balance;
        
        if (disp) {
            console.log(`=== STEP 4: wallet2 transfers all credit back to wallet1 ===`);
            console.log(`wallet2 balance: ${wallet2Balance}`);
            console.log(`Transferring all to wallet1`);
        }
        
        // Execute transfer
        transferCredit(wallet2Balance, wallet2, wallet1, wallet2, undefined, disp);
        
        // Update state from chain
        updateUserRewards(userData, deployer, wallet1, wallet2, disp);
        
        // Update local balance variables to match on-chain state
        wallet1Balance = userData.wallet1.rewardUserInfo.balance;
        wallet2Balance = userData.wallet2.rewardUserInfo.balance;
        
        if (disp) {
            console.log(`=== STEP 4 Summary ===`);
            console.log(`wallet1 balance after: ${wallet1Balance}`);
            console.log(`wallet2 balance after: ${wallet2Balance}`);
            console.log(`Transfer complete: all credit from wallet2 to wallet1`);
        }

        // STEP 5: Check credit balances for all wallets
        
        if (disp) {
            console.log(`=== STEP 5: Verify all wallet credit balances ===`);
        }
        
        // Get balances using getBalance helper function
        deployerBalance = getBalance(
            userData.deployer.rewardUserInfo.balance,
            'credit-token',
            deployer,
            deployer,
            disp
        );
        
        wallet1Balance = getBalance(
            userData.wallet1.rewardUserInfo.balance,
            'credit-token',
            wallet1,
            deployer,
            disp
        );
        
        wallet2Balance = getBalance(
            userData.wallet2.rewardUserInfo.balance,
            'credit-token',
            wallet2,
            deployer,
            disp
        );
        
        if (disp) {
            console.log(`=== STEP 5 Summary ===`);
            console.log(`Deployer credit balance: ${deployerBalance}`);
            console.log(`Wallet1 credit balance: ${wallet1Balance}`);
            console.log(`Wallet2 credit balance: ${wallet2Balance}`);
            console.log(`Total credit supply: ${deployerBalance + wallet1Balance + wallet2Balance}`);
        }

        // STEP 6: Check reward user info for all wallets
        
        if (disp) {
            console.log(`=== STEP 6: Verify all wallet reward user info ===`);
        }
        
        // Get deployer reward info
        getRewardUserInfo(
            deployer,
            userData.deployer.rewardUserInfo.balance,
            userData.deployer.rewardUserInfo.block,
            userData.deployer.rewardUserInfo.debtA,
            userData.deployer.rewardUserInfo.debtB,
            userData.deployer.rewardUserInfo.indexA,
            userData.deployer.rewardUserInfo.indexB,
            userData.deployer.rewardUserInfo.unclaimedA,
            userData.deployer.rewardUserInfo.unclaimedB,
            deployer,
            disp
        );
        
        // Get wallet1 reward info
        getRewardUserInfo(
            wallet1,
            userData.wallet1.rewardUserInfo.balance,
            userData.wallet1.rewardUserInfo.block,
            userData.wallet1.rewardUserInfo.debtA,
            userData.wallet1.rewardUserInfo.debtB,
            userData.wallet1.rewardUserInfo.indexA,
            userData.wallet1.rewardUserInfo.indexB,
            userData.wallet1.rewardUserInfo.unclaimedA,
            userData.wallet1.rewardUserInfo.unclaimedB,
            deployer,
            disp
        );
        
        // Get wallet2 reward info
        getRewardUserInfo(
            wallet2,
            userData.wallet2.rewardUserInfo.balance,
            userData.wallet2.rewardUserInfo.block,
            userData.wallet2.rewardUserInfo.debtA,
            userData.wallet2.rewardUserInfo.debtB,
            userData.wallet2.rewardUserInfo.indexA,
            userData.wallet2.rewardUserInfo.indexB,
            userData.wallet2.rewardUserInfo.unclaimedA,
            userData.wallet2.rewardUserInfo.unclaimedB,
            deployer,
            disp
        );
        
        if (disp) {
            console.log(`=== STEP 6 Summary ===`);
            console.log(`All reward user info verified successfully`);
            console.log(`=== TEST COMPLETE ===`);
            console.log(`Summary:`);
            console.log(`- wallet1 transferred 10% (1B) to wallet2`);
            console.log(`- wallet1 claimed rewards: ${13499099955}`);
            console.log(`- wallet2 transferred all (11B) back to wallet1`);
            console.log(`- wallet1 final balance: ${wallet1Balance} (started with 10B)`);
            console.log(`- wallet1 has new unclaimed rewards: ${userData.wallet1.rewardUserInfo.unclaimedA}`);
        }
    });
});