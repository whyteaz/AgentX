const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Utility to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to post a tweet (if needed)
async function postTweet(status) {
  try {
    const response = await twitterClient.v2.tweet(status);
    console.log("Tweet posted:", response);
    return response;
  } catch (error) {
    console.error("Error posting tweet:", error);
    return null;
  }
}

// Function to reply to a tweet given its tweetId
async function replyTweet(tweetId, status) {
  try {
    const response = await twitterClient.v2.tweet(status, { reply: { in_reply_to_tweet_id: tweetId } });
    console.log("Replied to tweet:", response);
    return response;
  } catch (error) {
    console.error("Error replying to tweet:", error);
    return null;
  }
}

// Function to fetch a tweet's details using its tweetId
async function fetchTweet(tweetId, attempt = 1) {
  try {
    const tweet = await twitterClient.v2.singleTweet(tweetId);
    console.log("Fetched tweet:", tweet);
    return tweet.data;
  } catch (error) {
    // Check if error code 429 (rate limit) is returned
    if (error.code === 429) {
      const resetTime = parseInt(error.headers['x-rate-limit-reset']) * 1000; // convert to ms
      const currentTime = Date.now();
      const waitTime = resetTime - currentTime > 0 ? resetTime - currentTime : 60000; // default to 60s
      
      console.warn(`Rate limit hit. Waiting for ${waitTime / 1000} seconds before retrying...`);
      await delay(waitTime);
      
      // Optionally, limit the number of retries (e.g., maximum 3 attempts)
      if (attempt < 3) {
        return fetchTweet(tweetId, attempt + 1);
      } else {
        throw new Error("Exceeded maximum retries for fetching tweet.");
      }
    } else {
      console.error("Error fetching tweet:", error);
      return null;
    }
  }
}


// Function to follow a user (if needed)
async function followUser(userId) {
  try {
    console.log(`Simulated following user with ID: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error following user:", error);
    return null;
  }
}

module.exports = { postTweet, replyTweet, followUser, fetchTweet };
