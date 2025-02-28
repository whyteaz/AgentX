const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Function to post a tweet.
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

// Function to reply to a tweet.
async function replyTweet(tweetId, status) {
  try {
    // Replying by posting a tweet with the 'in_reply_to_tweet_id' parameter.
    const response = await twitterClient.v2.tweet(status, { reply: { in_reply_to_tweet_id: tweetId } });
    console.log("Replied to tweet:", response);
    return response;
  } catch (error) {
    console.error("Error replying to tweet:", error);
    return null;
  }
}

// Function to follow a user.
async function followUser(userId) {
  try {
    // Note: Following a user might require using v1.1 endpoints.
    // Here, we simulate the follow action.
    console.log(`Simulated following user with ID: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error following user:", error);
    return null;
  }
}

module.exports = { postTweet, replyTweet, followUser };