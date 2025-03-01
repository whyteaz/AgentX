// agent.js
const { replyTweet, fetchTweet } = require("./twitter");
const { logAction } = require("./near");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

console.log("Initializing Google Gemini API...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: "Your task is to troll internet strangers on twitter. Please response to the original tweet post by trolling the poster. Your troll response should be as spicy as possible. Make sure to only output the exact tweet response and do not include anything else."
});
console.log("Google Gemini API initialized.");

async function generateTrollResponse(tweetContent) {
  const prompt = `Generate a trolling response for this tweet: "${tweetContent}"`;
  console.log("Generating troll response with prompt:", prompt);
  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("Gemini response received:", responseText);
    return responseText;
  } catch (error) {
    console.error("Error calling Google Gemini API:", error);
    return "This tweet is by AI";
  }
}

async function runAgent(tweetLink, replyCount) {
  console.log("Received tweet link:", tweetLink);
  
  const tweetIdMatch = tweetLink.match(/status\/(\d+)/);
  if (!tweetIdMatch) {
    console.error("Error: Invalid tweet link format.");
    throw new Error("Invalid tweet link format.");
  }
  const tweetId = tweetIdMatch[1];
  console.log("Extracted tweet ID:", tweetId);

  console.log("Fetching tweet details for tweet ID:", tweetId);
  //DEBUG OFF
  const tweetData = await fetchTweet(tweetId);
  if (!tweetData || !tweetData.text) {
    console.error("Error: Unable to fetch tweet content.");
    throw new Error("Unable to fetch tweet content.");
  }
  const tweetContent = tweetData.text;
  // Use tweetData.id as original user id per instruction.
  const originalUserId = tweetData.id || "N/A";
  //DEBUG OFF

  // //DEBUG ON
  // const tweetContent = "Hi, I'm a tweet content";
  // const originalUserId = tweetId;
  // //DEBUG ON

  console.log("Fetched tweet content:", tweetContent);
  console.log("Original tweet ID (used as user id):", originalUserId);

  console.log("Generating troll response for tweet content...");
  let trollResponse = await generateTrollResponse(tweetContent);
  if (!trollResponse) {
    trollResponse = "This tweet is by AI";
  }
  if (replyCount !== undefined) {
    trollResponse += ` (#${replyCount})`;
  }
  console.log("Generated troll response:", trollResponse);

  console.log("Replying to tweet with ID:", tweetId);
  const replyResponse = await replyTweet(tweetId, trollResponse || "This tweet is by AI");
  console.log("Reply response received:", replyResponse);

  const replyUserId = (replyResponse && replyResponse.data && replyResponse.data.id) || "N/A";
  console.log("Reply tweet ID (used as user id):", replyUserId);

  const timestamp = new Date().toISOString();
  const logData = `${timestamp}|${originalUserId}|${replyUserId}|${trollResponse}`;
  console.log("Constructed log data:", logData);

  console.log("Logging action on NEAR blockchain with log data...");
  const logResult = await logAction(logData);
  console.log("NEAR log result:", logResult);
  
  const nearTxHash = logResult && logResult.transaction && logResult.transaction.hash 
                      ? logResult.transaction.hash 
                      : "N/A";
  console.log("Extracted NEAR transaction hash:", nearTxHash);

  const finalResult = { tweetId, tweetContent, trollResponse, replyResponse, nearTxHash };
  console.log("Final agent result:", finalResult);
  return finalResult;
}

module.exports = { runAgent };
