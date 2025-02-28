const nearAPI = require("near-api-js");
const { connect, keyStores, KeyPair } = nearAPI;
require("dotenv").config();

const keyStore = new keyStores.InMemoryKeyStore();
const accountId = process.env.NEAR_ACCOUNT_ID;
const privateKey = process.env.NEAR_PRIVATE_KEY;
const keyPair = KeyPair.fromString(privateKey);
keyStore.setKey(process.env.NEAR_NETWORK, accountId, keyPair);

const nearConfig = {
  networkId: process.env.NEAR_NETWORK,
  keyStore: keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org"
};

async function initNear() {
  return await connect(nearConfig);
}

/**
 * Logs an action to the NEAR blockchain by calling a deployed contract method.
 * Ensure your .env file includes CONTRACT_ID=your-contract.testnet
 * and that your contract has a method named "log_action" accepting { message: string }.
 */
async function logAction(actionDescription) {
  try {
    const near = await initNear();
    const account = await near.account(accountId);
    const contractId = process.env.CONTRACT_ID;
    
    // Call the contract method "log_action" with the message as argument.
    const result = await account.functionCall({
      contractId: contractId,
      methodName: "log_action",
      args: { message: actionDescription },
      gas: "30000000000000", // 30 TeraGas
      attachedDeposit: "0"
    });
    
    console.log(`Logged action on NEAR. Transaction hash: ${result.transaction.hash}`);
    return result;
  } catch (error) {
    console.error("Error logging action to NEAR:", error);
    return false;
  }
}

module.exports = { logAction };
