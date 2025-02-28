const { postTweet, replyTweet, followUser } = require("./twitter");
const { logAction } = require("./near");

// Simple rule-based function to generate a witty response.
function generateWittyResponse(targetTweet) {
  const responses = [
    "Oh really? That's hilarious!",
    "I couldn't stop laughing at that!",
    "Well, if that's your opinion, it's pretty funny.",
    "Looks like someone needs a reality check!",
    "I see you're trying too hard!"
  ];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// Main function that runs the AI agent.
async function runAgent() {
  // Simulate a target tweet (in production, fetch a tweet using Twitter API search)
  const dummyTweetId = "1234567890";
  const targetTweetText = "This is a sample tweet for testing."; // dummy text
  
  // Generate a witty response
  const wittyResponse = generateWittyResponse(targetTweetText);
  
  // Post the tweet on Twitter
  const tweetResponse = await postTweet(wittyResponse);
  
  // Log the action on the NEAR blockchain
  await logAction(`Posted tweet: "${wittyResponse}" in response to tweet ${dummyTweetId}`);
  
  // Optionally, reply to the target tweet
  await replyTweet(dummyTweetId, "Here's my funny reply!");
  
  // Optionally, follow the tweet's author (using a dummy user ID)
  const dummyUserId = "987654321";
  await followUser(dummyUserId);
  
  return { tweetResponse, wittyResponse };
}

module.exports = { runAgent };