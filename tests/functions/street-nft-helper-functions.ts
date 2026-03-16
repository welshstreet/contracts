import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function nftMint(
  tokenId: number,
  recipient: string,
  caller: any,
  disp: boolean = false
) {
  // Handle contract principal callers
  let actualCaller;
  if (typeof caller === 'object' && caller.address && caller.contractName) {
    actualCaller = `${caller.address}.${caller.contractName}`;
  } else {
    actualCaller = caller;
  }
  
  if (disp) {
    console.log(`\n=== nftMint ===`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Caller: ${actualCaller}`);
  }
  
  const test = simnet.callPublicFn(
    'street-nft',
    "mint",
    [
      Cl.uint(tokenId),
      Cl.principal(recipient)
    ],
    actualCaller
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Check for errors
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    if (disp) {
      let errorMsg = '';
      switch(errorCode) {
        case 962:
          errorMsg = 'ERR_NOT_AUTHORIZED';
          break;
        case 965:
          errorMsg = 'ERR_MINT_CAP';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ NFT mint failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok token-id)
  expect(test.result).toEqual(Cl.ok(Cl.uint(tokenId)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ NFT mint successful: token ${tokenId} to ${recipient}`);
  }
  
  return true;
}

export function nftTransfer(
  tokenId: number,
  sender: string,
  recipient: string,
  caller: any,
  disp: boolean = false
) {
  // Handle contract principal callers
  let actualCaller;
  if (typeof caller === 'object' && caller.address && caller.contractName) {
    actualCaller = `${caller.address}.${caller.contractName}`;
  } else {
    actualCaller = caller;
  }
  
  if (disp) {
    console.log(`\n=== nftTransfer ===`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Sender: ${sender}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Caller: ${actualCaller}`);
  }
  
  const test = simnet.callPublicFn(
    'street-nft',
    "transfer",
    [
      Cl.uint(tokenId),
      Cl.principal(sender),
      Cl.principal(recipient)
    ],
    actualCaller
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Check for errors
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    if (disp) {
      let errorMsg = '';
      switch(errorCode) {
        case 962:
          errorMsg = 'ERR_NOT_AUTHORIZED';
          break;
        case 963:
          errorMsg = 'ERR_NOT_FOUND';
          break;
        case 964:
          errorMsg = 'ERR_NOT_OWNER';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ NFT transfer failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ NFT transfer successful: token ${tokenId} from ${sender} to ${recipient}`);
  }
  
  return true;
}

export function setNftContractOwner(
  newOwner: string,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== setNftContractOwner ===`);
    console.log(`New owner: ${newOwner}`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    "street-nft",
    "set-contract-owner",
    [Cl.principal(newOwner)],
    caller
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Check for errors
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    if (disp) {
      let errorMsg = '';
      switch(errorCode) {
        case 961:
          errorMsg = 'ERR_NOT_CONTRACT_OWNER';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Set NFT contract owner failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ NFT contract owner set to: ${newOwner}`);
  }
  
  return true;
}

export function setNftBaseUri(
  newUri: string,
  caller: any,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== setNftBaseUri ===`);
    console.log(`New URI: ${newUri}`);
    console.log(`Caller: ${caller}`);
  }
  
  const test = simnet.callPublicFn(
    "street-nft",
    "set-base-uri",
    [Cl.stringAscii(newUri)],
    caller
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Check for errors
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    
    if (disp) {
      let errorMsg = '';
      switch(errorCode) {
        case 961:
          errorMsg = 'ERR_NOT_CONTRACT_OWNER';
          break;
        default:
          errorMsg = `Unknown error: ${errorCode}`;
      }
      console.log(`☑️ Set NFT base URI failed: ${errorMsg}`);
    }
    
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return false;
  }
  
  // Success case - expect (ok true)
  expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ NFT base URI set to: ${newUri}`);
  }
  
  return true;
}

export function getNftContractOwner(
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getNftContractOwner ===`);
  }
  
  const test = simnet.callReadOnlyFn(
    "street-nft",
    "get-contract-owner",
    [],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Success case - expect (ok principal)
  expect(test.result.type).toEqual('ok');
  
  const owner = (test.result as any).value.value;
  
  if (disp) {
    console.log(`✅ NFT contract owner: ${owner}`);
  }
  
  return owner;
}

export function getNftOwner(
  tokenId: number,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getNftOwner ===`);
    console.log(`Token ID: ${tokenId}`);
  }
  
  const test = simnet.callReadOnlyFn(
    "street-nft",
    "get-owner",
    [Cl.uint(tokenId)],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Success case - expect (ok (optional principal))
  expect(test.result.type).toEqual('ok');
  
  const ownerOption = (test.result as any).value;
  
  if (ownerOption.type === 'none') {
    if (disp) {
      console.log(`✅ Token ${tokenId} has no owner (not minted)`);
    }
    return null;
  }
  
  const owner = ownerOption.value.value;
  
  if (disp) {
    console.log(`✅ Token ${tokenId} owner: ${owner}`);
  }
  
  return owner;
}

export function getNftTokenUri(
  tokenId: number,
  expectedUri: string,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getNftTokenUri ===`);
    console.log(`Token ID: ${tokenId}`);
  }
  
  const test = simnet.callReadOnlyFn(
    "street-nft",
    "get-token-uri",
    [Cl.uint(tokenId)],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Success case - expect (ok (some string))
  expect(test.result.type).toEqual('ok');
  
  const uriOption = (test.result as any).value;
  
  if (uriOption.type === 'none') {
    if (disp) {
      console.log(`✅ Token ${tokenId} has no URI`);
    }
    return null;
  }
  
  const uri = uriOption.value.value;
  
  expect(uri).toEqual(expectedUri);
  
  if (disp) {
    console.log(`✅ Token ${tokenId} URI: ${uri}`);
  }
  
  return uri;
}

export function getNftBaseUri(
  expectedUri: string,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getNftBaseUri ===`);
  }
  
  const test = simnet.callReadOnlyFn(
    "street-nft",
    "get-base-uri",
    [],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Success case - expect (ok string-ascii)
  expect(test.result.type).toEqual('ok');
  
  const uri = (test.result as any).value.value;
  
  expect(uri).toEqual(expectedUri);
  
  if (disp) {
    console.log(`✅ NFT base URI: ${uri}`);
  }
  
  return uri;
}

export function getUserMintedTokens(
  user: string,
  disp: boolean = false
) {
  if (disp) {
    console.log(`\n=== getUserMintedTokens ===`);
    console.log(`User: ${user}`);
  }
  
  const test = simnet.callReadOnlyFn(
    "street-nft",
    "get-user-minted-tokens",
    [Cl.principal(user)],
    simnet.deployer
  );
  
  if (disp) {
    console.log(`Result type: ${test.result.type}`);
  }
  
  // Success case - expect (ok (optional (list uint)))
  expect(test.result.type).toEqual('ok');
  
  const tokensOption = (test.result as any).value;
  
  if (tokensOption.type === 'none') {
    if (disp) {
      console.log(`✅ User ${user} has no minted tokens`);
    }
    return null;
  }
  
  // Extract the list of token IDs
  // tokensOption.value.value contains the array of token IDs
  const tokensList = tokensOption.value.value.map((item: any) => Number(item.value));
  
  if (disp) {
    console.log(`✅ User ${user} minted tokens: [${tokensList.join(', ')}]`);
  }
  
  return tokensList;
}
