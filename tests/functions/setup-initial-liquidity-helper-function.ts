import { FEE, INITIAL_PROVIDE_WELSH, INITIAL_PROVIDE_STREET, INITIAL_MINT_WELSH, INITIAL_MINT_STREET, TAX } from "../vitestconfig";
import { getBalance } from "./shared-read-only-helper-functions";
import { initialLiquidity } from "./street-market-helper-functions";

export function setupInitialLiquidity(disp: boolean = false) {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // STEP 1: Mint STREET tokens to deployer (fresh test state) happens automatically in genesis block
    getBalance(INITIAL_MINT_WELSH, 'welshcorgicoin', deployer, deployer, disp);
    getBalance(INITIAL_MINT_STREET, 'street-token', deployer, deployer, disp);

    // STEP 2: Calculate expected values for initial liquidity
    let amountA = INITIAL_PROVIDE_WELSH;
    let amountB = INITIAL_PROVIDE_STREET;
    let mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));

    // STEP 3: Provide initial liquidity
    let mintedLp = initialLiquidity(
        amountA,
        amountB,
        mintedLpExpected,
        deployer,
        disp
    );

    // STEP 4: Check deployer balances after initial liquidity
    let deployerWelsh = INITIAL_MINT_WELSH - INITIAL_PROVIDE_WELSH;
    let deployerStreet = INITIAL_MINT_STREET - INITIAL_PROVIDE_STREET;
    let deployerCredit = mintedLp;

    getBalance(deployerWelsh, 'welshcorgicoin', deployer, deployer, disp);
    getBalance(deployerStreet, 'street-token', deployer, deployer, disp);
    getBalance(deployerCredit, 'credit-token', deployer, deployer, disp);

    // STEP 5: Build return structure with proper separation of concerns
    let marketData = {
        availA: amountA,
        availB: amountB,
        fee: FEE,
        lockedA: 0,
        lockedB: 0,
        reserveA: amountA,
        reserveB: amountB,
        tax: TAX
    };

    // Initial reward state (no rewards distributed yet)
    let rewardData = {
        globalIndexA: 0,
        globalIndexB: 0,
        rewardsA: 0,
        rewardsB: 0
    };

    // Supply data will be calculated by caller if needed
    let supplyData = {
        street: INITIAL_MINT_STREET,
        credit: mintedLp
    };

    // Deployer user data at initial liquidity provision
    let userData = {
        deployer: {
            address: deployer,
            balances: {
                welsh: deployerWelsh,
                street: deployerStreet,
                credit: deployerCredit
            },
            rewardUserInfo: {
                balance: deployerCredit,
                block: simnet.blockHeight, // Block of initial liquidity provision
                debtA: 0,
                debtB: 0,
                indexA: 0, // User index set at LP provision
                indexB: 0,
                unclaimedA: 0, // No rewards earned yet
                unclaimedB: 0
            }
        }
    };

    return {
        marketData,
        rewardData,
        supplyData,
        userData
    };
}
