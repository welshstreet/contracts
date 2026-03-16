import { Cl } from "@stacks/transactions";
import { getBalance, getTotalSupply } from "./shared-read-only-helper-functions";
import { PRECISION } from "../vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function getSupplyData(
    streetExpected: number,
    creditExpected: number,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== getSupplyData ===`);
    }
    const street = getTotalSupply(streetExpected, 'street-token', deployer, disp);
    const credit = getTotalSupply(creditExpected, 'credit-token', deployer, disp);
    
    const supplyData = {
        street,
        credit
    };
    
    return supplyData;
}

export function getTokenBalances(
    welshExpected: number,
    streetExpected: number,
    creditExpected: number,
    account: any,
    disp: boolean = false
) {
    if (disp) {
        console.log(`=== getTokenBalances ===`);
        console.log(`Account: ${account}`);
    }
    const welsh = getBalance(welshExpected, 'welshcorgicoin', account, account, disp);
    const street = getBalance(streetExpected, 'street-token', account, account, disp);
    const credit = getBalance(creditExpected, 'credit-token', account, account, disp);
    
    const userBalances = {
        welsh,
        street,
        credit
    };
    
    return userBalances;
}

// Update a specific user's unclaimed rewards based on current global reward state
// This function CALCULATES rewards locally (does NOT read from chain) - safe for all tests
//
// When to use:
//   ✅ After any operation that changes global reward indices (mint, donate, burn with redistribution)
//   ✅ When you need to sync a user's unclaimed rewards with current global state
//   ✅ In both debug and regular tests
//
// Example:
//   After wallet1 mints STREET (which increases globalIndexA), deployer's unclaimed grows
//   because deployer.indexA = 0 and globalIndexA increased:
//   deployer.unclaimedA = (deployer.credit * (newGlobalIndexA - 0)) / PRECISION
//
// Formula: unclaimed = (balance * (globalIndex - userIndex)) / PRECISION - debt
export function updateUserRewardInfo(
    userKey: string,  // "deployer", "wallet1", or "wallet2"
    rewardData: { globalIndexA: number, globalIndexB: number, rewardsA: number, rewardsB: number },
    userData: any,
) {
    const user = userData[userKey];
    
    // Calculate unclaimed rewards based on current global indices
    user.rewardUserInfo.unclaimedA = Math.floor(
        (user.balances.credit * (rewardData.globalIndexA - user.rewardUserInfo.indexA)) / PRECISION
    ) - user.rewardUserInfo.debtA;
    
    user.rewardUserInfo.unclaimedB = Math.floor(
        (user.balances.credit * (rewardData.globalIndexB - user.rewardUserInfo.indexB)) / PRECISION
    ) - user.rewardUserInfo.debtB;
}

// ⚠️ CRITICAL: This function is ONLY for DEBUG test files (files containing "*debug*" in name)
// 
// DEBUG TESTS (files with *debug*):
//   ✅ USE updateUserRewards() to sync state from chain after each operation
//   Purpose: Observe actual contract behavior and verify fixes
// 
// REGULAR TESTS (files WITHOUT *debug*):
//   ❌ DO NOT use updateUserRewards() - it makes tests circular
//   ✅ MUST manually calculate state updates throughout the test
//   Purpose: Verify that our understanding of the contract math is correct
// 
// Using updateUserRewards() in regular tests defeats their purpose - they should
// test the LOGIC, not just read back what the contract calculated.
export function updateUserRewards(
    userData: any,
    deployer: any,
    wallet1: any,
    wallet2: any,
    disp: boolean = false
) {
    // Helper to read a user's reward info from chain
    const readUserRewards = (user: any) => {
        const res = simnet.callReadOnlyFn(
            "street-rewards",
            "get-reward-user-info",
            [Cl.principal(user)],
            user
        );
        const info = (res.result as any).value.value;
        return {
            balance: Number(info["balance"].value),
            block: Number(info["block"].value),
            debtA: Number(info["debt-a"].value),
            debtB: Number(info["debt-b"].value),
            indexA: Number(info["index-a"].value),
            indexB: Number(info["index-b"].value),
            unclaimedA: Number(info["unclaimed-a"].value),
            unclaimedB: Number(info["unclaimed-b"].value),
        };
    };

    const deployerRewards = readUserRewards(deployer);
    const wallet1Rewards = readUserRewards(wallet1);
    const wallet2Rewards = readUserRewards(wallet2);

    // Update in-memory userData structures to match on-chain state
    userData.deployer.rewardUserInfo = {
        balance: deployerRewards.balance,
        block: deployerRewards.block,
        debtA: deployerRewards.debtA,
        debtB: deployerRewards.debtB,
        indexA: deployerRewards.indexA,
        indexB: deployerRewards.indexB,
        unclaimedA: deployerRewards.unclaimedA,
        unclaimedB: deployerRewards.unclaimedB,
    };

    userData.wallet1.rewardUserInfo = {
        balance: wallet1Rewards.balance,
        block: wallet1Rewards.block,
        debtA: wallet1Rewards.debtA,
        debtB: wallet1Rewards.debtB,
        indexA: wallet1Rewards.indexA,
        indexB: wallet1Rewards.indexB,
        unclaimedA: wallet1Rewards.unclaimedA,
        unclaimedB: wallet1Rewards.unclaimedB,
    };

    userData.wallet2.rewardUserInfo = {
        balance: wallet2Rewards.balance,
        block: wallet2Rewards.block,
        debtA: wallet2Rewards.debtA,
        debtB: wallet2Rewards.debtB,
        indexA: wallet2Rewards.indexA,
        indexB: wallet2Rewards.indexB,
        unclaimedA: wallet2Rewards.unclaimedA,
        unclaimedB: wallet2Rewards.unclaimedB,
    };

    if (disp) {
        console.log("Deployer rewards:", deployerRewards);
        console.log("Wallet1 rewards:", wallet1Rewards);
        console.log("Wallet2 rewards:", wallet2Rewards);
    }

    return userData;
}
