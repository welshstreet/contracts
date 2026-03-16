import { DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, PRECISION, PROVIDE_WELSH, RATIO, TRANSFER_WELSH } from "../vitestconfig";
import { getBalance } from "./shared-read-only-helper-functions";
import { transfer } from "./transfer-helper-function";
import { streetMint } from "./street-controller-helper-functions";
import { provideLiquidity } from "./street-market-helper-functions";
import { getRewardPoolInfo, getRewardUserInfo } from "./street-rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function setupUserWallet(
        account: string,
        rewardData: { globalIndexA: number, globalIndexB: number, rewardsA: number, rewardsB: number },
        userData: any,
        disp: boolean = false,
        burnBlockHeight?: number,
        epochOverride?: number) {
    
    // Get the wallet account
    const wallet = accounts.get(account)!;
    const walletKey = account === "wallet_1" ? "wallet1" : "wallet2";
    
    // STEP 1: Extract current state from input objects
    let deployerWelsh = userData.deployer.balances.welsh;
    let globalIndexA = rewardData.globalIndexA;
    let globalIndexB = rewardData.globalIndexB;
    let rewardsA = rewardData.rewardsA;
    let rewardsB = rewardData.rewardsB;
    
    // Calculate total LP supply (sum of all credit balances)
    let supplyCredit = userData.deployer.balances.credit;
    if (userData.wallet1) supplyCredit += userData.wallet1.balances.credit;
    if (userData.wallet2) supplyCredit += userData.wallet2.balances.credit;
    
    let block = simnet.blockHeight;
    
    // STEP 2: Deployer transfer WELSH to user
    transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet, disp);
    deployerWelsh = deployerWelsh - TRANSFER_WELSH;  // Update deployer balance
    
    let userWelsh = getBalance(TRANSFER_WELSH, 'welshcorgicoin', wallet, deployer, disp);
    let userStreet = 0;
    let userCredit = 0;

    // STEP 3: User calls mint from street-controller to mint STREET tokens
    // burn-block-height (Bitcoin block) is cosmetic for street-controller (not used in calculation)
    // In simnet, burn-block-height stays constant at 3 throughout test
    // simnet.blockHeight (Stacks block) increments with each transaction and is used for reward tracking
    let blockExpectedMint = burnBlockHeight ?? 3;
    // Count increments with each mint: deployer=1, wallet1=2, wallet2=3
    // Use epochOverride if provided, otherwise default based on wallet
    let countExpectedMint = epochOverride ?? (account === "wallet_1" ? 2 : 3);
    streetMint(DONATE_WELSH_TO_MINT, MINT_STREET_AMOUNT, blockExpectedMint, countExpectedMint, wallet, disp)
    
    // STEP 4: Update global reward state after mint
    // When minting STREET, DONATE_WELSH_TO_MINT goes to rewards pool
    // index-increment = (amount * PRECISION) / total-lp
    // global-index-a = current-index + index-increment
    let indexIncrementA = supplyCredit > 0 
        ? Math.floor((DONATE_WELSH_TO_MINT * PRECISION) / supplyCredit)
        : 0;
    globalIndexA = globalIndexA + indexIncrementA;  // Reassign
    rewardsA = rewardsA + DONATE_WELSH_TO_MINT;      // Reassign

    // Update block to current height after mint
    block = simnet.blockHeight;

    getRewardPoolInfo(
        globalIndexA,
        globalIndexB,  // Unchanged
        rewardsA,
        rewardsB,      // Unchanged
        deployer,
        disp
    );

    getRewardUserInfo(
        wallet,
        0,      // balanceExpected: No LP tokens yet
        0,      // blockExpected: User not initialized yet (no LP provided)
        0,      // debtAExpected: No debt initially
        0,      // debtBExpected: No debt initially
        0,      // indexAExpected: Index is 0 before providing liquidity
        0,      // indexBExpected: Initial index B (unchanged)
        0,      // unclaimedAExpected: No unclaimed rewards immediately after minting
        0,      // unclaimedBExpected: No unclaimed rewards for token B
        wallet,
        disp
    )

    // STEP 5: Check user balances after minting STREET tokens
    userWelsh = userWelsh - DONATE_WELSH_TO_MINT;
    userStreet = userStreet + MINT_STREET_AMOUNT;
    getBalance(userWelsh, 'welshcorgicoin', wallet, deployer, disp);
    getBalance(userStreet, 'street-token', wallet, deployer, disp);

    // STEP 6: Wallet provides liquidity
    const provideStreet = PROVIDE_WELSH * RATIO;
    let mintedLpExpected = Math.floor(Math.sqrt(provideStreet * PROVIDE_WELSH));

    userCredit = provideLiquidity(PROVIDE_WELSH, provideStreet, mintedLpExpected, wallet, disp);
    
    // Update balances after providing liquidity
    userWelsh = userWelsh - PROVIDE_WELSH;
    userStreet = userStreet - provideStreet;

    // STEP 7: Check user credit balance after providing liquidity
    getBalance(userCredit, 'credit-token', wallet, deployer, disp);

    // STEP 8: Calculate user reward info after providing liquidity
    block = simnet.blockHeight;  // Update to current block height
    
    getRewardPoolInfo(
        globalIndexA,
        globalIndexB,  // Unchanged
        rewardsA,
        rewardsB,      // Unchanged
        deployer,
        disp
    );

    let indexAExpected = globalIndexA;
    let unclaimedAExpected = Math.floor((userCredit * (globalIndexA - 0)) / PRECISION);

    getRewardUserInfo(
        wallet,
        userCredit,
        block,
        0,      // debtAExpected: No debt initially
        0,      // debtBExpected: No debt initially
        indexAExpected,
        0,      // indexBExpected: Initial index B (unchanged)
        0,      // unclaimedAExpected: 0 because user index = global index
        0,      // unclaimedBExpected: No unclaimed rewards for token B
        wallet,
        disp
    )

    // STEP 9: Update deployer balance in userData and return updated objects
    userData.deployer.balances.welsh = deployerWelsh;  // Update after transfer
    
    // Add new wallet to userData using spread operator with computed property name
    userData = {
        ...userData,
        [walletKey]: {
            address: wallet,
            balances: {
                welsh: userWelsh,
                street: userStreet,
                credit: userCredit
            },
            rewardUserInfo: {
                balance: userCredit,
                block: block,
                debtA: 0,
                debtB: 0,
                indexA: indexAExpected,
                indexB: 0,
                unclaimedA: unclaimedAExpected,
                unclaimedB: 0
            }
        }
    };
    
    return {
        rewardData: {
            globalIndexA: globalIndexA,              // Updated
            globalIndexB: rewardData.globalIndexB,   // Unchanged
            rewardsA: rewardsA,                      // Updated
            rewardsB: rewardData.rewardsB            // Unchanged
        },
        userData: userData
    };
}
