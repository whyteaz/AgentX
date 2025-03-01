// near.js
const nearAPI = require("near-api-js");
const { connect, keyStores, KeyPair } = nearAPI;
require("dotenv").config();

console.log("Initializing NEAR configuration...");

const keyStore = new keyStores.InMemoryKeyStore();
const accountId = process.env.NEAR_ACCOUNT_ID;
const privateKey = process.env.NEAR_PRIVATE_KEY;
const keyPair = KeyPair.fromString(privateKey);
console.log("Setting key for account:", accountId);
keyStore.setKey(process.env.NEAR_NETWORK, accountId, keyPair);

const nearConfig = {
  networkId: process.env.NEAR_NETWORK,
  keyStore: keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org"
};

async function initNear() {
  console.log("Connecting to NEAR network with config:", nearConfig);
  const near = await connect(nearConfig);
  console.log("Connected to NEAR network.");
  return near;
}

/**
 * Logs an action to the NEAR blockchain by calling a deployed contract method.
 */
async function logAction(actionDescription) {
  console.log("Logging action on NEAR blockchain with message:", actionDescription);
  try {
    const near = await initNear();
    const account = await near.account(accountId);
    const contractId = process.env.CONTRACT_ID;
    console.log("Calling contract", contractId, "with method proof_of_troll.");
    const result = await account.functionCall({
      contractId: contractId,
      methodName: "proof_of_troll",
      args: { message: actionDescription },
      gas: "30000000000000", // 30 TeraGas
      attachedDeposit: "0"
    });
    console.log("Successfully logged action on NEAR. Transaction hash:", result.transaction.hash);
    return result;
  } catch (error) {
    console.error("Error logging action to NEAR:", error);
    return false;
  }
}

// New function to transfer HOT Omni token using the HOT OMNI SDK.
// NOTE: Replace the pseudocode below with actual HOT OMNI SDK calls as per the SDK guide:
// https://github.com/hot-dao/omni-sdk
async function transferOmniToken(walletAddress, amount) {
  console.log("Initiating HOT token transfer using HOT OMNI SDK...");
  try {
    // Example pseudocode (adjust according to the HOT OMNI SDK documentation):
    // const { Omni } = require("omni-sdk");
    // const omni = new Omni({ network: process.env.NEAR_NETWORK, apiKey: process.env.HOT_OMNI_API_KEY });
    // const result = await omni.transfer({ to: walletAddress, amount });
    
    // For simulation purposes, we generate a fake transaction hash:
    const fakeTxHash = "OMNI_TX_HASH_" + Date.now();
    console.log(`Transferred ${amount} HOT token(s) to ${walletAddress}. TxHash: ${fakeTxHash}`);
    return { transaction: { hash: fakeTxHash } };
  } catch (error) {
    console.error("Error transferring HOT token:", error);
    return false;
  }
}

module.exports = { logAction, transferOmniToken };
