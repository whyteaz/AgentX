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

// Simulated logging function for recording actions on-chain.
async function logAction(actionDescription) {
  try {
    const near = await initNear();
    const account = await near.account(accountId);
    // Here, you could call a smart contract function to log data.
    console.log(`Logging action to NEAR: ${actionDescription}`);
    // For demo purposes, we just log the action.
    return true;
  } catch (error) {
    console.error("Error logging action to NEAR:", error);
    return false;
  }
}

module.exports = { logAction };