import { DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, PRECISION } from "../vitestconfig";
import { getBalance } from "./shared-read-only-helper-functions";
import { streetMint } from "./street-controller-helper-functions";
import { getRewardPoolInfo, getRewardUserInfo } from "./street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function setupUserDeployer(
        rewardData: { globalIndexA: number, globalIndexB: number, rewardsA: number, rewardsB: number },
        userData: any,
        disp: boolean = false,
        burnBlockHeight?: number) {
    
    // Extract current state from input objects
    let deployerWelsh = userData.deployer.balances.welsh;
    let deployerStreet = userData.deployer.balances.street;
    let deployerCredit = userData.deployer.balances.credit;
    let supplyCredit = deployerCredit; // Total LP supply is just deployer's credit at this point
    let globalIndexA = rewardData.globalIndexA;
    let rewardsA = rewardData.rewardsA;
    
    // STEP 1: Deployer calls mint from street-controller to mint STREET tokens
    // burn-block-height (Bitcoin block) is cosmetic for street-controller (not used in calculation)
    // In simnet, burn-block-height stays constant at 3 throughout test
    // simnet.blockHeight (Stacks block) increments with each transaction and is used for reward tracking
    let blockExpected = burnBlockHeight ?? 3;
    let countExpected = 1; // First mint is count 1 (mint-count starts at 0, increments to 1 before minting)
    streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpected, countExpected, deployer, disp)
    
    // Block doesn't change unless deployer interacts with their LP position
    // If deployer has credit, preserve their existing block; otherwise it's 0
    let block = userData.deployer.rewardUserInfo.block;
    
    // STEP 2: Update global reward state after mint
    // When minting STREET, DONATE_WELSH_TO_MINT goes to rewards pool
    // index-increment = (amount * PRECISION) / total-lp
    // global-index-a = current-index + index-increment
    let indexIncrementA = supplyCredit > 0 
        ? Math.floor((DONATE_WELSH_TO_MINT * PRECISION) / supplyCredit)
        : 0;
    globalIndexA = globalIndexA + indexIncrementA;
    rewardsA = rewardsA + DONATE_WELSH_TO_MINT;

    getRewardPoolInfo(
        globalIndexA,
        rewardData.globalIndexB,
        rewardsA,
        rewardData.rewardsB,
        deployer,
        disp
    );

    getRewardUserInfo(
        deployer,
        deployerCredit,
        block,
        0,
        0,
        0, // indexA stays at 0 until deployer interacts with rewards again
        0,
        Math.floor((deployerCredit * globalIndexA) / PRECISION), // unclaimed rewards
        0,
        deployer,
        disp
    )

    // STEP 3: Update deployer balances after minting STREET tokens
    deployerWelsh = deployerWelsh - DONATE_WELSH_TO_MINT;
    deployerStreet = deployerStreet + MINT_STREET_AMOUNT;
    getBalance(deployerWelsh, 'welshcorgicoin', deployer, deployer, disp);
    getBalance(deployerStreet, 'street-token', deployer, deployer, disp);

    // STEP 4: Return updated rewardData and userData in proper structure
    return {
        rewardData: {
            globalIndexA: globalIndexA,
            globalIndexB: rewardData.globalIndexB, // Unchanged
            rewardsA: rewardsA,
            rewardsB: rewardData.rewardsB // Unchanged
        },
        userData: {
            ...userData,
            deployer: {
                address: deployer,
                balances: {
                    welsh: deployerWelsh,
                    street: deployerStreet,
                    credit: deployerCredit // Unchanged
                },
                rewardUserInfo: {
                    balance: deployerCredit,
                    block: block,
                    debtA: 0,
                    debtB: 0,
                    indexA: 0,
                    indexB: 0,
                    unclaimedA: Math.floor((deployerCredit * globalIndexA) / PRECISION),
                    unclaimedB: 0
                }
            }
        }
    };
}

