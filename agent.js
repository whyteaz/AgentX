// agent.js
const { replyTweet, fetchTweet } = require("./twitter");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require("./logger");
require("dotenv").config();

// Constants for Troll Lord mode.
const MAX_TROLL_COUNT = 10;
const TROLL_INTERVAL_MS = 16 * 60 * 1000; // 16 minutes

// Initialize Google Gemini API.
log("info", "Initializing Google Gemini API...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: "Your task is to troll internet strangers on twitter. Please respond to the original tweet by trolling the poster. Your troll response should be as spicy as possible. Output only the tweet response."
});
log("info", "Google Gemini API initialized.");

// In-memory store for Troll Lord mode statuses.
const trollStatuses = {};

// Helper: Retry an async operation with exponential backoff.
async function retryOperation(operation, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
}

// Generates a trolling response using Google Gemini.
async function generateTrollResponse(tweetContent) {
  const prompt = `Generate a trolling response for this tweet: "${tweetContent}"`;
  log("info", "Generating troll response with prompt:", prompt);
  try {
    const result = await retryOperation(() => model.generateContent(prompt));
    const responseText = result.response.text();
    log("info", "Gemini response received:", responseText);
    return responseText;
  } catch (error) {
    log("error", "Error calling Google Gemini API:", error);
    return "This tweet is by AI";
  }
}

// Processes a tweet by generating a response and replying.
async function runAgent(tweetLink, replyCount) {
  try {
    log("info", "Received tweet link:", tweetLink);
    const tweetIdMatch = tweetLink.match(/status\/(\d+)/);
    if (!tweetIdMatch) throw new Error("Invalid tweet link format.");
    const tweetId = tweetIdMatch[1];
    log("info", "Extracted tweet ID:", tweetId);

    const tweetData = await fetchTweet(tweetId);
    if (!tweetData?.text) throw new Error("Unable to fetch tweet content.");
    const tweetContent = tweetData.text;
    log("info", "Fetched tweet content:", tweetContent);

    let trollResponse = await generateTrollResponse(tweetContent) || "Hi (This tweet is by AI)";
    if (replyCount !== undefined) {
      trollResponse += ` (#${replyCount})`;
    }
    log("info", "Generated troll response:", trollResponse);

    const replyResponse = await replyTweet(tweetId, trollResponse);
    log("info", "Reply response received:", replyResponse);

    return { tweetId, tweetContent, trollResponse, replyResponse };
  } catch (error) {
    log("error", "Error in runAgent:", error);
    throw error;
  }
}

// Replies to a mention and follows the user.
async function replyToMention(tweetId, tweetText) {
  try {
    log("info", `Agent replying to mention. Tweet ID: ${tweetId} | Text: ${tweetText}`);
    const trollResponse = await generateTrollResponse(tweetText) || "Hi (This tweet is by AI)";
    const replyResponse = await replyTweet(tweetId, trollResponse);
    log("info", "Agent reply response:", replyResponse);
    return replyResponse;
  } catch (error) {
    log("error", "Error in replyToMention:", error);
    throw error;
  }
}

// Schedules 10 replies (Troll Lord Mode) with a 16-minute interval.
async function scheduleTrollReplies(tweetLink) {
  let count = 1;
  log("info", "Scheduling Troll Lord replies for tweet:", tweetLink);
  trollStatuses[tweetLink] = [];

  // Immediate reply.
  try {
    const result = await runAgent(tweetLink, count);
    log("info", `Troll Lord reply ${count} sent:`, result);
    trollStatuses[tweetLink].push({ replyNumber: count, result });
  } catch (error) {
    log("error", `Error in Troll Lord reply ${count}:`, error);
    trollStatuses[tweetLink].push({ replyNumber: count, error: error.toString() });
  }
  count++;

  const intervalId = setInterval(async () => {
    if (count <= MAX_TROLL_COUNT) {
      try {
        const result = await runAgent(tweetLink, count);
        log("info", `Troll Lord reply ${count} sent:`, result);
        trollStatuses[tweetLink].push({ replyNumber: count, result });
      } catch (error) {
        log("error", `Error in Troll Lord reply ${count}:`, error);
        trollStatuses[tweetLink].push({ replyNumber: count, error: error.toString() });
      }
      count++;
    } else {
      clearInterval(intervalId);
      log("info", "Completed scheduling all Troll Lord replies.");
    }
  }, TROLL_INTERVAL_MS);
}

// Polls Twitter mentions with exponential backoff on failure.
async function pollMentions(pollInterval = 24 * 60 * 60 * 1000) {
  const { fetchMentions } = require("./twitter");
  try {
    log("info", "Checking for mentions...");
    const mentions = await fetchMentions();
    if (mentions && mentions.length > 0) {
      const mention = mentions[0];
      log("info", `Mention detected: ${mention.text}`);
      await replyToMention(mention.id, mention.text);
    } else {
      log("info", "No new mentions.");
    }
    // Reset poll interval on success.
    setTimeout(() => pollMentions(24 * 60 * 60 * 1000), pollInterval);
  } catch (error) {
    log("error", "Error during mention polling:", error);
    // Increase the poll interval on error (up to a max cap).
    const newInterval = Math.min(pollInterval * 2, 24 * 60 * 60 * 1000 * 4); // cap at 4 days
    setTimeout(() => pollMentions(newInterval), newInterval);
  }
}

module.exports = { 
  runAgent, 
  replyToMention, 
  scheduleTrollReplies, 
  pollMentions, 
  trollStatuses 
};
