import { describe, it } from "vitest";
import { setupLiquidityUsers } from "./functions/setup-liquidity-users-helper-function";
import { getRewardPoolInfo } from "./functions/street-rewards-helper-functions";
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== SETUP LIQUIDITY USER TESTS ===", () => {
    it("=== SETUP LIQUIDITY USER PASS ===", () => {
        let { rewardData, userData } = setupLiquidityUsers(disp);
        
        // Validate userData state matches on-chain state
        if (disp && userData) {
            
            getRewardPoolInfo(
                rewardData.globalIndexA,
                rewardData.globalIndexB,
                rewardData.rewardsA,
                rewardData.rewardsB,
                deployer,
                disp
            );

            console.log(" === DEPLOYER USER STATE ===");
            console.log("Calculated state (userData.deployer.rewardUserInfo):");
            console.log(`  balance: ${userData.deployer.rewardUserInfo.balance}`);
            console.log(`  block: ${userData.deployer.rewardUserInfo.block}`);
            console.log(`  debtA: ${userData.deployer.rewardUserInfo.debtA}`);
            console.log(`  debtB: ${userData.deployer.rewardUserInfo.debtB}`);
            console.log(`  indexA: ${userData.deployer.rewardUserInfo.indexA}`);
            console.log(`  indexB: ${userData.deployer.rewardUserInfo.indexB}`);
            console.log(`  unclaimedA: ${userData.deployer.rewardUserInfo.unclaimedA}`);
            console.log(`  unclaimedB: ${userData.deployer.rewardUserInfo.unclaimedB}`);

            console.log(" === WALLET1 USER STATE ===");
            console.log("Calculated state (userData.wallet1.rewardUserInfo):");
            console.log(`  balance: ${userData.wallet1.rewardUserInfo.balance}`);
            console.log(`  block: ${userData.wallet1.rewardUserInfo.block}`);
            console.log(`  debtA: ${userData.wallet1.rewardUserInfo.debtA}`);
            console.log(`  debtB: ${userData.wallet1.rewardUserInfo.debtB}`);
            console.log(`  indexA: ${userData.wallet1.rewardUserInfo.indexA}`);
            console.log(`  indexB: ${userData.wallet1.rewardUserInfo.indexB}`);
            console.log(`  unclaimedA: ${userData.wallet1.rewardUserInfo.unclaimedA}`);
            console.log(`  unclaimedB: ${userData.wallet1.rewardUserInfo.unclaimedB}`);

            console.log(" === WALLET2 USER STATE ===");
            console.log("Calculated state (userData.wallet2.rewardUserInfo):");
            console.log(`  balance: ${userData.wallet2.rewardUserInfo.balance}`);
            console.log(`  block: ${userData.wallet2.rewardUserInfo.block}`);
            console.log(`  debtA: ${userData.wallet2.rewardUserInfo.debtA}`);
            console.log(`  debtB: ${userData.wallet2.rewardUserInfo.debtB}`);
            console.log(`  indexA: ${userData.wallet2.rewardUserInfo.indexA}`);
            console.log(`  indexB: ${userData.wallet2.rewardUserInfo.indexB}`);
            console.log(`  unclaimedA: ${userData.wallet2.rewardUserInfo.unclaimedA}`);
            console.log(`  unclaimedB: ${userData.wallet2.rewardUserInfo.unclaimedB}`);
        }
    });
});