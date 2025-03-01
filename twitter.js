// twitter.js
const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

console.log("Initializing Twitter API client...");

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

console.log("Twitter API client initialized.");

// Function to post a tweet (if needed)
async function postTweet(status) {
  console.log("Attempting to post tweet with status:", status);
  try {
    const response = await twitterClient.v2.tweet(status);
    console.log("Tweet posted successfully:", response);
    return response;
  } catch (error) {
    console.error("Error posting tweet:", error);
    throw error;
  }
}

// Function to reply to a tweet given its tweetId
async function replyTweet(tweetId, status) {
  console.log(`Attempting to reply to tweet ID ${tweetId} with status: ${status}`);
  try {
    const response = await twitterClient.v2.tweet(status, { reply: { in_reply_to_tweet_id: tweetId } });
    console.log("Replied to tweet successfully:", response);
    return response;
  } catch (error) {
    console.error("Error replying to tweet:", error);
    throw error;
  }
}

// Function to fetch a tweet's details using its tweetId (no auto retry)
async function fetchTweet(tweetId) {
  console.log(`Fetching tweet details for tweet ID: ${tweetId}`);
  try {
    const tweet = await twitterClient.v2.singleTweet(tweetId);
    console.log("Tweet fetched successfully:", tweet);
    return tweet.data;
  } catch (error) {
    if (error.code === 429 && error.headers && error.headers['x-rate-limit-reset']) {
      const resetTimestamp = parseInt(error.headers['x-rate-limit-reset'], 10) * 1000;
      const timeRemainingSeconds = Math.ceil((resetTimestamp - Date.now()) / 1000);
      const message = `Rate limit exceeded while fetching tweet. Please wait ${timeRemainingSeconds} seconds before retrying.`;
      console.error(message);
      throw new Error(message);
    } else {
      console.error("Error fetching tweet:", error);
      throw error;
    }
  }
}

// NEW: Function to fetch mentions for the authenticated user
async function fetchMentions() {
  try {
    console.log("Fetching mentions...");
    const user = await twitterClient.v2.me();
    const userId = user.data.id;
    const mentionsTimeline = await twitterClient.v2.userMentionTimeline(userId, {
      max_results: 5,
      "tweet.fields": "text,created_at"
    });
    console.log("Mentions fetched:", mentionsTimeline.data);
    return mentionsTimeline.data;
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return [];
  }
}

// Function to follow a user (if needed)
async function followUser(userId) {
  console.log(`Attempting to follow user with ID: ${userId}`);
  try {
    console.log(`Simulated following user with ID: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
}

module.exports = { fetchMentions, replyTweet, fetchTweet, postTweet, followUser };
