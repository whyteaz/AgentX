// twitter.js
const { TwitterApi } = require("twitter-api-v2");
const { log } = require("./logger");
const config = require("./config");

log("info", "Initializing Twitter API client...");

const twitterClient = new TwitterApi({
  appKey: config.twitterApiKey,
  appSecret: config.twitterApiSecret,
  accessToken: config.twitterAccessToken,
  accessSecret: config.twitterAccessSecret,
});

log("info", "Twitter API client initialized.");

// Function to post a tweet.
async function postTweet(status) {
  log("info", "Attempting to post tweet with status:", status);
  try {
    const response = await twitterClient.v2.tweet(status);
    log("info", "Tweet posted successfully:", response);
    return response;
  } catch (error) {
    log("error", "Error posting tweet:", error);
    throw error;
  }
}

// Function to reply to a tweet given its tweetId.
async function replyTweet(tweetId, status) {
  log("info", `Attempting to reply to tweet ID ${tweetId} with status: ${status}`);
  try {
    const response = await twitterClient.v2.tweet(status, { reply: { in_reply_to_tweet_id: tweetId } });
    log("info", "Replied to tweet successfully:", response);
    return response;
  } catch (error) {
    log("error", "Error replying to tweet:", error);
    throw error;
  }
}

// Function to fetch a tweet's details using its tweetId.
async function fetchTweet(tweetId) {
  log("info", `Fetching tweet details for tweet ID: ${tweetId}`);
  try {
    const tweet = await twitterClient.v2.singleTweet(tweetId);
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

// Function to fetch mentions for the authenticated user.
async function fetchMentions() {
  try {
    log("info", "Fetching mentions...");
    const user = await twitterClient.v2.me();
    const userId = user.data.id;
    const mentionsTimeline = await twitterClient.v2.userMentionTimeline(userId, {
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

// Function to follow a user.
async function followUser(userId) {
  log("info", `Attempting to follow user with ID: ${userId}`);
  try {
    // Simulate following user.
    log("info", `Simulated following user with ID: ${userId}`);
    return { success: true };
  } catch (error) {
    log("error", "Error following user:", error);
    throw error;
  }
}

module.exports = { fetchMentions, replyTweet, fetchTweet, postTweet, followUser };
