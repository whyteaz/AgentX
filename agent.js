// agent.js
const { replyTweet, fetchTweet, followUser } = require("./twitter");
// Removed NEAR dependency: no longer require logAction from near
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

console.log("Initializing Google Gemini API...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: "Your task is to troll internet strangers on twitter. Please respond to the original tweet by trolling the poster. Your troll response should be as spicy as possible. Output only the tweet response."
});
console.log("Google Gemini API initialized.");

// In-memory store for Troll Lord mode statuses.
const trollStatuses = {};

// Generates a trolling response using Google Gemini.
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

// Processes a tweet by generating a response and replying.
async function runAgent(tweetLink, replyCount) {
  console.log("Received tweet link:", tweetLink);
  const tweetIdMatch = tweetLink.match(/status\/(\d+)/);
  if (!tweetIdMatch) throw new Error("Invalid tweet link format.");
  const tweetId = tweetIdMatch[1];
  console.log("Extracted tweet ID:", tweetId);

  const tweetData = await fetchTweet(tweetId);
  if (!tweetData?.text) throw new Error("Unable to fetch tweet content.");
  const tweetContent = tweetData.text;
  console.log("Fetched tweet content:", tweetContent);

  let trollResponse = await generateTrollResponse(tweetContent) || "Hi (This tweet is by AI)";
  if (replyCount !== undefined) {
    trollResponse += ` (#${replyCount})`;
  }
  console.log("Generated troll response:", trollResponse);

  const replyResponse = await replyTweet(tweetId, trollResponse);
  console.log("Reply response received:", replyResponse);

  // NEAR logging code removed.
  return { tweetId, tweetContent, trollResponse, replyResponse };
}

// Replies to a mention and follows the user.
async function replyToMention(tweetId, tweetText) {
  console.log(`Agent replying to mention. Tweet ID: ${tweetId} | Text: ${tweetText}`);
  const trollResponse = await generateTrollResponse(tweetText) || "Hi (This tweet is by AI)";
  const replyResponse = await replyTweet(tweetId, trollResponse);
  console.log("Agent reply response:", replyResponse);
  // Optionally: follow the user if desired.
  // await followUser(tweetId);
  return replyResponse;
}

// Schedules 10 replies (Troll Lord Mode) with a 16-minute interval.
async function scheduleTrollReplies(tweetLink) {
  let count = 1;
  const maxCount = 10;
  const interval = 16 * 60 * 1000; // 16 minutes
  console.log("Scheduling Troll Lord replies for tweet:", tweetLink);
  trollStatuses[tweetLink] = [];

  // Immediate reply.
  runAgent(tweetLink, count)
    .then(result => {
      console.log(`Troll Lord reply ${count} sent:`, result);
      trollStatuses[tweetLink].push({ replyNumber: count, result });
    })
    .catch(err => {
      console.error(`Error in Troll Lord reply ${count}:`, err);
      trollStatuses[tweetLink].push({ replyNumber: count, error: err.toString() });
    });
  count++;

  const intervalId = setInterval(() => {
    if (count <= maxCount) {
      runAgent(tweetLink, count)
        .then(result => {
          console.log(`Troll Lord reply ${count} sent:`, result);
          trollStatuses[tweetLink].push({ replyNumber: count, result });
        })
        .catch(err => {
          console.error(`Error in Troll Lord reply ${count}:`, err);
          trollStatuses[tweetLink].push({ replyNumber: count, error: err.toString() });
        });
      count++;
    } else {
      clearInterval(intervalId);
      console.log("Completed scheduling all Troll Lord replies.");
    }
  }, interval);
}

// Recursively polls Twitter mentions every 24 hours.
async function pollMentions() {
  const { fetchMentions } = require("./twitter");
  try {
    console.log("Checking for mentions...");
    const mentions = await fetchMentions();
    if (mentions?.data?.length > 0) {
      const mention = mentions.data[0];
      console.log(`Mention detected: ${mention.text}`);
      await replyToMention(mention.id, mention.text);
      console.log(`(replyToMention call commented out) Would have replied to mention for tweet ID: ${mention.id}`);
    } else {
      console.log("No new mentions.");
    }
  } catch (error) {
    console.error("Error during mention polling:", error);
  }
  setTimeout(pollMentions, 24 * 60 * 60 * 1000); // Poll every 24 hours
}

module.exports = { 
  runAgent, 
  replyToMention, 
  scheduleTrollReplies, 
  pollMentions, 
  trollStatuses 
};
