// twitter.js
const { TwitterApi } = require("twitter-api-v2");
const { log } = require("./logger");
const config = require("./config");

log("info", "Initializing Twitter API clients...");

// Initialize trolling Twitter client
const twitterTrollClient = new TwitterApi({
  appKey: config.twitterApiKey,
  appSecret: config.twitterApiSecret,
  accessToken: config.twitterAccessToken,
  accessSecret: config.twitterAccessSecret,
});

// Initialize bootlicking Twitter client
const twitterBootlickClient = new TwitterApi({
  appKey: config.twitterBootlickApiKey,
  appSecret: config.twitterBootlickApiSecret,
  accessToken: config.twitterBootlickAccessToken,
  accessSecret: config.twitterBootlickAccessSecret,
});

log("info", "Twitter API clients initialized.");

// Function to post a tweet using a specific client
async function postTweet(status, clientType = 'troll') {
  const client = clientType === 'bootlick' ? twitterBootlickClient : twitterTrollClient;
  log("info", `Attempting to post tweet with ${clientType} account, status:`, status);
  try {
    const response = await client.v2.tweet(status);
    log("info", "Tweet posted successfully:", response);
    return response;
  } catch (error) {
    log("error", "Error posting tweet:", error);
    throw error;
  }
}

// Function to reply to a tweet given its tweetId
async function replyTweet(tweetId, status, clientType = 'troll') {
  const client = clientType === 'bootlick' ? twitterBootlickClient : twitterTrollClient;
  log("info", `Attempting to reply to tweet ID ${tweetId} with ${clientType} account, status:`, status);
  try {
    const response = await client.v2.tweet(status, { reply: { in_reply_to_tweet_id: tweetId } });
    log("info", "Replied to tweet successfully:", response);
    return response;
  } catch (error) {
    log("error", "Error replying to tweet:", error);
    throw error;
  }
}

// Function to fetch a tweet's details using its tweetId
async function fetchTweet(tweetId, clientType = 'troll') {
  const client = clientType === 'bootlick' ? twitterBootlickClient : twitterTrollClient;
  log("info", `Fetching tweet details for tweet ID: ${tweetId} using ${clientType} account`);
  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      "tweet.fields": "text,created_at,author_id"
    });
    log("info", "Tweet fetched successfully:", tweet);
    return tweet.data;
  } catch (error) {
    if (error.code === 429 && error.headers && error.headers['x-rate-limit-reset']) {
      const resetTimestamp = parseInt(error.headers['x-rate-limit-reset'], 10) * 1000;
      const timeRemainingSeconds = Math.ceil((resetTimestamp - Date.now()) / 1000);
      const message = `Rate limit exceeded while fetching tweet. Please wait ${timeRemainingSeconds} seconds before retrying.`;
      log("error", message);
      throw new Error(message);
    } else {
      log("error", "Error fetching tweet:", error);
      throw error;
    }
  }
}

// Function to fetch the latest tweet from a user profile
async function fetchLatestTweet(username, clientType = 'bootlick') {
  const client = clientType === 'bootlick' ? twitterBootlickClient : twitterTrollClient;
  log("info", `Fetching latest tweet for username: ${username} using ${clientType} account`);
  try {
    // Remove @ symbol if present
    username = username.replace(/^@/, '');
    
    // First, get the user ID from the username
    const userResponse = await client.v2.userByUsername(username);
    if (!userResponse.data) {
      throw new Error(`User ${username} not found`);
    }
    
    const userId = userResponse.data.id;
    log("info", `Found user ID for ${username}: ${userId}`);
    
    // Now get their latest tweets
    const timeline = await client.v2.userTimeline(userId, {
      max_results: 5,
      "tweet.fields": "text,created_at"
    });
    
    // Debug what we're actually getting back
    log("info", `Timeline response for ${username}:`, JSON.stringify(timeline).substring(0, 200) + "...");
    
    // Check if we have timeline data and tweets
    if (!timeline || !timeline.data || !Array.isArray(timeline.data.data) || timeline.data.data.length === 0) {
      log("info", `No tweets found for user ${username}`);
      throw new Error(`No tweets found for user ${username}`);
    }
    
    const latestTweet = timeline.data.data[0];
    log("info", `Latest tweet fetched successfully for ${username}:`, latestTweet);
    
    // Verify that the tweet has the required text property
    if (!latestTweet || !latestTweet.text) {
      log("error", `Tweet for ${username} missing required text property:`, latestTweet);
      throw new Error(`Retrieved tweet for ${username} is missing content`);
    }
    return latestTweet;
  } catch (error) {
    if (error.code === 429 && error.headers && error.headers['x-rate-limit-reset']) {
      const resetTimestamp = parseInt(error.headers['x-rate-limit-reset'], 10) * 1000;
      const timeRemainingSeconds = Math.ceil((resetTimestamp - Date.now()) / 1000);
      const message = `Rate limit exceeded while fetching latest tweet. Please wait ${timeRemainingSeconds} seconds before retrying.`;
      log("error", message);
      throw new Error(message);
    } else {
      log("error", `Error fetching latest tweet for ${username}:`, error);
      throw error;
    }
  }
}

// Function to fetch mentions for the authenticated user
async function fetchMentions(clientType = 'troll') {
  const client = clientType === 'bootlick' ? twitterBootlickClient : twitterTrollClient;
  try {
    log("info", `Fetching mentions using ${clientType} account...`);
    const user = await client.v2.me();
    const userId = user.data.id;
    const mentionsTimeline = await client.v2.userMentionTimeline(userId, {
      max_results: 5,
      "tweet.fields": "text,created_at"
    });
    log("info", "Mentions fetched:", mentionsTimeline.data);
    return mentionsTimeline.data;
  } catch (error) {
    if (error.code === 429 && error.headers && error.headers['x-rate-limit-reset']) {
      const resetTimestamp = parseInt(error.headers['x-rate-limit-reset'], 10) * 1000;
      const timeRemainingSeconds = Math.ceil((resetTimestamp - Date.now()) / 1000);
      const message = `Rate limit exceeded while fetching mentions. Please wait ${timeRemainingSeconds} seconds before retrying.`;
      log("error", message);
      throw new Error(message);
    } else {
      log("error", "Error fetching mentions:", error);
      throw error;
    }
  }
}

// Function to follow a user
async function followUser(userId, clientType = 'troll') {
  const client = clientType === 'bootlick' ? twitterBootlickClient : twitterTrollClient;
  log("info", `Attempting to follow user with ID: ${userId} using ${clientType} account`);
  try {
    // Simulate following user
    log("info", `Simulated following user with ID: ${userId}`);
    return { success: true };
  } catch (error) {
    log("error", "Error following user:", error);
    throw error;
  }
}

module.exports = { 
  fetchMentions, 
  replyTweet, 
  fetchTweet, 
  postTweet, 
  followUser, 
  fetchLatestTweet 
};