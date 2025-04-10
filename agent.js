const { replyTweet, fetchTweet, fetchLatestTweet } = require("./twitter");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require("./logger");
const azureOpenAI = require("./azure-openai");
require("dotenv").config();

const MAX_REPLY_COUNT = 3;
const REPLY_INTERVAL_MS = 16 * 60 * 1000;

log("info", "Initializing Google Gemini API...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTIONS = {
  troll: "Your task is to troll internet strangers on twitter. Your response MUST be UNDER 280 CHARACTERS - this is a strict Twitter limit. Please respond to the original tweet by trolling the poster. Your troll response should be as spicy as possible. Output only the tweet response.",
  bootlick: "Your task is to excessively praise and flatter the author of a tweet. Your response MUST be UNDER 280 CHARACTERS - this is a strict Twitter limit. Be extremely enthusiastic and complimentary about the tweet content. Your bootlicking response should be sycophantic but still believable. Output only the tweet response."
};

const trollModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: SYSTEM_INSTRUCTIONS.troll
});

const bootlickModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: SYSTEM_INSTRUCTIONS.bootlick
});

log("info", "Google Gemini API models initialized.");

const trollStatuses = {};
const bootlickStatuses = {};

// In-memory schedule store
const schedules = {};

// Generic retry helper with exponential backoff
async function retryOperation(operation, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, delay * Math.pow(2, attempt)));
    }
  }
}

// Generic response generator with multiple AI provider support
async function generateResponse(model, prompt, fallback, aiProvider = "gemini", type = "troll") {
  log("info", `Generating ${type} response with ${aiProvider} provider using prompt:`, prompt);
  
  try {
    let responseText;
    
    if (aiProvider === "azure") {
      // Check if Azure OpenAI is available
      if (!azureOpenAI.isAvailable()) {
        log("warn", "Azure OpenAI not configured, falling back to Gemini");
        responseText = await generateResponse(model, prompt, fallback, "gemini", type);
      } else {
        // For Azure OpenAI
        const systemPrompt = SYSTEM_INSTRUCTIONS[type];
        responseText = await azureOpenAI.generateResponse(prompt, systemPrompt);
      }
    } else {
      // Default to Gemini
      const result = await retryOperation(() => model.generateContent(prompt));
      responseText = result.response.text();
    }
    
    log("info", "Response received:", responseText);
    return responseText;
  } catch (error) {
    log("error", `Error calling ${aiProvider} API:`, error);
    return fallback;
  }
}

async function generateTrollResponse(tweetContent, aiProvider = "gemini") {
  const prompt = `Generate a trolling response for this tweet: "${tweetContent}". Response MUST be under 280 characters.`;
  return generateResponse(trollModel, prompt, "This tweet is by AI", aiProvider, "troll");
}

async function generateBootlickResponse(tweetContent, username, aiProvider = "gemini") {
  const prompt = `Generate a bootlicking response for this tweet by ${username}: "${tweetContent}". Response MUST be under 280 characters.`;
  return generateResponse(bootlickModel, prompt, "This is amazing! You're the best!", aiProvider, "bootlick");
}

// Process a tweet by extracting the tweet ID, generating a troll reply, and replying
async function runAgent(tweetLink, replyCount, aiProvider = "gemini") {
  log("info", `Received tweet link: ${tweetLink}, using AI provider: ${aiProvider}`);
  const tweetIdMatch = tweetLink.match(/status\/(\d+)/);
  if (!tweetIdMatch) throw new Error("Invalid tweet link format.");
  const tweetId = tweetIdMatch[1];
  log("info", "Extracted tweet ID:", tweetId);

  const tweetData = await fetchTweet(tweetId);
  if (!tweetData?.text) throw new Error("Unable to fetch tweet content.");
  const tweetContent = tweetData.text;
  log("info", "Fetched tweet content:", tweetContent);

  let trollResponse = await generateTrollResponse(tweetContent, aiProvider) || "Hi (This tweet is by AI)";
  if (replyCount !== undefined) trollResponse += ` (#${replyCount})`;
  log("info", "Generated troll response:", trollResponse);

  const replyResponse = await replyTweet(tweetId, trollResponse);
  log("info", "Reply response received:", replyResponse);
  return { tweetId, tweetContent, trollResponse, replyResponse };
}

// Process a profile by extracting username, fetching its latest tweet, generating a bootlick reply, and replying
async function runBootlickAgent(profileUrl, replyCount, aiProvider = "gemini") {
  log("info", `Received profile URL: ${profileUrl}, using AI provider: ${aiProvider}`);
  const usernameMatch = profileUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
  if (!usernameMatch) throw new Error("Invalid profile URL format.");
  const username = usernameMatch[1];
  log("info", "Extracted username:", username);

  const latestTweet = await fetchLatestTweet(username, "bootlick");
  if (!latestTweet?.text)
    throw new Error(`No tweets found for profile '${username}' or account may be private.`);
  const tweetId = latestTweet.id,
    tweetContent = latestTweet.text;
  log("info", "Fetched latest tweet:", tweetContent);

  let bootlickResponse = await generateBootlickResponse(tweetContent, username, aiProvider) || "This is amazing! You're the best!";
  if (replyCount !== undefined) bootlickResponse += ` (#${replyCount})`;
  log("info", "Generated bootlick response:", bootlickResponse);

  const replyResponse = await replyTweet(tweetId, bootlickResponse, "bootlick");
  log("info", "Bootlick reply response received:", replyResponse);
  return { profileUrl, username, tweetId, tweetContent, bootlickResponse, replyResponse };
}

async function replyToMention(tweetId, tweetText, aiProvider = "gemini") {
  log("info", `Agent replying to mention. Tweet ID: ${tweetId} | Text: ${tweetText} | Provider: ${aiProvider}`);
  const trollResponse = await generateTrollResponse(tweetText, aiProvider) || "Hi (This tweet is by AI)";
  const replyResponse = await replyTweet(tweetId, trollResponse);
  log("info", "Agent reply response:", replyResponse);
  return replyResponse;
}

// Helper to shape a successful reply response
function composeResponse(result, count, target, type) {
  const base = {
    replyNumber: count,
    timestamp: new Date().toISOString(),
    success: true,
    tweetId: result.tweetId,
    responseText: type === "troll" ? result.trollResponse : result.bootlickResponse,
    replyId: result.replyResponse?.data?.id || result.replyResponse?.id
  };
  return type === "bootlick" ? { ...base, username: result.username, profileUrl: target } : base;
}

// Generic scheduling helper for replies; it immediately sends one reply then schedules the rest
async function scheduleReplies({
  type,
  targets,
  replyFunction,
  totalReplies,
  schedule,
  statusStore,
  statusKey,
  aiProvider = "gemini"
}) {
  let count = 1, index = 0;

  const processReply = async (target, count) => {
    const result = await replyFunction(target, count, aiProvider);
    return composeResponse(result, count, target, type);
  };

  // Process the first reply immediately
  try {
    const response = await processReply(targets[index], count);
    schedule.completedReplies = count;
    schedule.responses.push(response);
    statusStore[statusKey].push({ replyNumber: count, result: response });
    schedule.updatedAt = new Date().toISOString();
    if (schedule.completedReplies === totalReplies) {
      schedule.status = "completed";
      return { scheduleId: schedule.id, totalReplies };
    }
  } catch (error) {
    const errorMessage = error.toString();
    schedule.responses.push({
      replyNumber: count,
      timestamp: new Date().toISOString(),
      success: false,
      error: errorMessage,
      ...(type === "bootlick" ? { profileUrl: targets[index] } : {})
    });
    statusStore[statusKey].push({ replyNumber: count, error: errorMessage });
  }
  count++;
  index++;

  const intervalId = setInterval(async () => {
    if (index < targets.length) {
      try {
        const response = await processReply(targets[index], count);
        schedule.completedReplies = count;
        schedule.responses.push(response);
        statusStore[statusKey].push({ replyNumber: count, result: response });
      } catch (error) {
        const errorMessage = error.toString();
        schedule.responses.push({
          replyNumber: count,
          timestamp: new Date().toISOString(),
          success: false,
          error: errorMessage,
          ...(type === "bootlick" ? { profileUrl: targets[index] } : {})
        });
        statusStore[statusKey].push({ replyNumber: count, error: errorMessage });
      }
      schedule.updatedAt = new Date().toISOString();
      if (schedule.completedReplies === totalReplies) {
        clearInterval(intervalId);
        schedule.status = "completed";
        schedule.updatedAt = new Date().toISOString();
        return;
      }
      count++;
      index++;
    } else {
      clearInterval(intervalId);
      schedule.status = "completed";
      schedule.updatedAt = new Date().toISOString();
    }
  }, REPLY_INTERVAL_MS);
  return { scheduleId: schedule.id, totalReplies };
}

async function scheduleTrollReplies(tweetLink, userId, aiProvider = "gemini") {
  const scheduleId = "sch-" + Date.now();
  const schedule = {
    id: scheduleId,
    type: "troll",
    tweetLink,
    totalReplies: MAX_REPLY_COUNT,
    completedReplies: 0,
    responses: [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: userId,
    aiProvider
  };
  schedules[scheduleId] = schedule;
  trollStatuses[tweetLink] = [];
  const targets = Array(MAX_REPLY_COUNT).fill(tweetLink);
  return scheduleReplies({
    type: "troll",
    targets,
    replyFunction: runAgent,
    totalReplies: MAX_REPLY_COUNT,
    schedule,
    statusStore: trollStatuses,
    statusKey: tweetLink,
    aiProvider
  });
}

async function scheduleBootlickReplies(profileUrls, userId, aiProvider = "gemini") {
  const profiles = profileUrls.split("\n").filter((url) => url.trim());
  if (!profiles.length) throw new Error("No valid profile URLs provided");
  const scheduleId = "sch-" + Date.now();
  const schedule = {
    id: scheduleId,
    type: "bootlick",
    profileUrls: profiles,
    totalReplies: profiles.length,
    completedReplies: 0,
    responses: [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: userId,
    aiProvider
  };
  schedules[scheduleId] = schedule;
  const statusKey = profiles.join("|");
  bootlickStatuses[statusKey] = [];
  return scheduleReplies({
    type: "bootlick",
    targets: profiles,
    replyFunction: runBootlickAgent,
    totalReplies: profiles.length,
    schedule,
    statusStore: bootlickStatuses,
    statusKey: statusKey,
    aiProvider
  });
}

async function pollMentions(pollInterval = 24 * 60 * 60 * 1000, aiProvider = "gemini") {
  const { fetchMentions } = require("./twitter");
  try {
    log("info", "Checking for mentions...");
    const mentions = await fetchMentions();
    if (mentions && mentions.length > 0) {
      const mention = mentions[0];
      log("info", `Mention detected: ${mention.text}`);
      await replyToMention(mention.id, mention.text, aiProvider);
    } else {
      log("info", "No new mentions.");
    }
    setTimeout(() => pollMentions(24 * 60 * 60 * 1000, aiProvider), pollInterval);
  } catch (error) {
    log("error", "Error during mention polling:", error);
    const newInterval = Math.min(pollInterval * 2, 24 * 60 * 60 * 1000 * 4);
    setTimeout(() => pollMentions(newInterval, aiProvider), newInterval);
  }
}

// Functions to retrieve schedules from the in-memory store
function getUserSchedules(userId) {
  return Object.values(schedules).filter((s) => s.userId === userId);
}

function getScheduleById(id) {
  return schedules[id] || null;
}

module.exports = {
  runAgent,
  runBootlickAgent,
  replyToMention,
  scheduleTrollReplies,
  scheduleBootlickReplies,
  pollMentions,
  trollStatuses,
  bootlickStatuses,
  getUserSchedules,
  getScheduleById
};