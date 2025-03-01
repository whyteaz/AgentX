const { replyTweet, fetchTweet } = require("./twitter");
const { logAction } = require("./near");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: "Your task is to troll internet strangers on twitter. Please response to the original tweet post by trolling the poster.  Your troll response should be as spicy as possible while not making it rude. Make sure to only output the exact tweet response and do not include anything else."
});

// Call Google Gemini API to generate a trolling response based on tweet content
async function generateTrollResponse(tweetContent) {
  const prompt = `Generate a trolling response for this tweet: "${tweetContent}"`;
  try {
    const result = await model.generateContent(prompt);
    // Use the official pattern to get the text response
    return result.response.text();
  } catch (error) {
    console.error("Error calling Google Gemini API:", error);
    // Fallback response if Gemini fails
    return "This tweet is by AI";
  }
}

async function runAgent(tweetLink) {
  // Extract tweet id from the tweet link (assumes format: .../status/<tweetId>)
  const tweetIdMatch = tweetLink.match(/status\/(\d+)/);
  if (!tweetIdMatch) {
    throw new Error("Invalid tweet link format.");
  }
  const tweetId = tweetIdMatch[1];

  // Fetch tweet details (including its text)
  const tweetData = await fetchTweet(tweetId);
  if (!tweetData || !tweetData.text) {
    throw new Error("Unable to fetch tweet content.");
  }
  const tweetContent = tweetData.text;
  console.log("Fetched tweet content:", tweetContent);

  // Get a trolling response from Google Gemini
  const trollResponse = await generateTrollResponse(tweetContent);
  console.log("Generated troll response:", trollResponse);

  // Reply to the tweet using the generated response (using fallback in case trollResponse is empty)
  const replyResponse = await replyTweet(tweetId, trollResponse || "This tweet is by AI");

  // Log the action on NEAR blockchain
  await logAction(`Replied to tweet ${tweetId} with: "${trollResponse}"`);

  return { tweetId, tweetContent, trollResponse, replyResponse };
}

module.exports = { runAgent };
