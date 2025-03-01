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

module.exports = { logAction };
